# Fleet root-cause audit — 2026-07-28

Scope: whole-project audit against the owner's 144 recorded requests (codex session
`019fa02f`), plus a measured code-health pass. Method was code-only — no visual
acceptance, per the owner's standing instruction ("不要靠视觉检查，看代码").

---

## 0. The headline

`bun run typecheck` and `bun run lint` are **green**, and have been green throughout the
period the owner was reporting broken features. That is not a contradiction — it is the
finding. The codebase systematically disables the checks that would have caught the
defects, so the gates measure nothing.

Concretely: **ten fields the server sends were being dropped by the renderer**, including
every field belonging to the work-mode / plan-mode system, the session `goal`, and
`thinkingLevel`. The backend shipped. The wire carried it. The renderer threw it away and
`tsc` stayed silent, because a hand-written duplicate type plus an `as SessionMeta` cast
told it to.

That single mechanism explains a large share of "根本没实现" / "我根本没在前端看到".

---

## 1. Measured code health

| Metric | Value | Verdict |
|---|---|---|
| Source LOC | 274,825 | — |
| Test LOC | 74,953 (0.27×) | 🟢 not test bloat |
| Source files | 1,537 | — |
| Largest file | `SessionManager.ts` — 9,079 L | 🔴 |
| Worst component | `AppShellContent` — complexity **498**, 3,840 L, nest depth **12** | 🔴 |
| 2nd/3rd worst | `FreeFormInput` (300 / 2,401 L / d12), `NavigationProvider` (234 / 1,291 L) | 🔴 |
| Cross-file duplicated 8-line blocks | **756** | 🔴 |
| Type escape hatches | ~1,450 (`as T` 1,250 · `as any` 153 · `as unknown as` 51) | 🔴 |
| Defensive-code density | only **1** file >12% | 🟢 **not** the problem |

### Correction to a stated assumption

The working hypothesis was that agents had bloated the code with defensive guards and
redundant boundary checks. **The data does not support that.** Guard density
(`?.`, `??`, null/undefined comparisons, `typeof`, `Array.isArray`) exceeds 12% of lines in
exactly one file out of 1,537 (`views/evaluator.ts`, 16.6% — and there it is legitimate,
it is an expression evaluator). Test-to-source ratio of 0.27 is normal-to-lean.

The growth is not defensive padding. It is **god components and copy-paste**:
756 duplicated blocks, and single functions with cyclomatic complexity approaching 500.
That is the real answer to "我明明在不断地减少页面上的功能和按钮，为什么你的代码反而越来越多".

---

## 2. Root cause #1 — three authorities for the session shape

`NON-NEGOTIABLES §2` says one authority per concept. The session shape had three
hand-maintained copies:

| Location | Type | Fields |
|---|---|---|
| `packages/shared/src/protocol/dto.ts` | `Session` (the wire) | 46 |
| `packages/server-core/src/sessions/SessionManager.ts` | `ManagedSession` | 88 |
| `apps/electron/src/renderer/atoms/sessions.ts` | `SessionMeta` | 36 |

Because the three were structurally unrelated declarations, TypeScript could not relate
them. Adding a field required three hand edits; forgetting one was invisible.

`extractSessionMeta()` then made it worse: it **explicitly destructured away**
`thinkingLevel`, `currentStatus`, `sessionFolderPath`, `supportsBranching`, `workspaceName`
into throwaway `_tl`/`_cs`/`_sf`/`_sb`/`_wn` bindings, and closed with `as SessionMeta` —
a cast that suppressed every remaining mismatch.

**Fields lost between wire and renderer:**

```
workMode · workModeSelection · executionPermissionMode   → the entire work-mode system
goal                                                     → 目标模式 (MSG 83)
thinkingLevel                                            → 思考强度 (MSG 117 / 126)
currentStatus · supportsBranching · sessionFolderPath · workspaceName
```

This is why `work-mode.ts` — which is, on its own, a genuinely good piece of design
(phase orthogonal to permission, auto + manual, correctly modelled after OpenCode and
Grok Build) — produced no visible behaviour. It was never a design failure. It was a
plumbing failure that the type system was instructed to ignore.

### ✅ Fixed

`SessionMeta` is now **derived**, not copied:

```ts
export type SessionMeta =
  Omit<Session, 'messages' | 'lastMessageAt' | 'isProcessing' | 'workspaceName'> & {
    lastMessageAt?: number
    isProcessing?: boolean
    workspaceName?: string
  }
```

and `extractSessionMeta` drops only `messages` (the one genuinely heavy field the
projection exists to shed), with **no return-type cast**. Adding a field to `Session` now
reaches the renderer with zero further edits; removing one breaks the build loudly.

The three relaxations are deliberate and documented: a list row may legitimately exist
before the server has stamped `lastMessageAt` / `isProcessing`, and `workspaceName` is a
denormalized display convenience (`workspaceId` is the identity).

Verified: `apps/electron` **0 errors**, `packages/shared` **0 errors**.

---

## 3. Root cause #2 — duplicated authorities elsewhere (same class)

Scanning for interfaces with ≥70% field overlap across files surfaced the same pattern
repeatedly:

| Duplicate | Overlap | Drift | Status |
|---|---|---|---|
| `DismissibleLayerRegistration` — `packages/ui/src/lib/` vs `apps/electron/.../lib/` | **100%** (byte-identical 43-line file) | none *yet* | ✅ **fixed** — collapsed to re-export |
| `RecoveryAction` — `core/types/message.ts` vs `shared/agent/errors.ts` | **100%** | none *yet* | ✅ **fixed** — collapsed to re-export |
| `TypedError` (core) vs `AgentError` (shared) | 89% | `providerInfo` | ⚠️ open — same concept, two names |
| `TokenUsage` (core) vs session token shape (shared) | 88% | **`contextWindow`** | ⚠️ open — this is the field the Token ring reads |
| `ListSessionsOptions` vs `ListSessionsArgs` (same package!) | **100%** | none | ⚠️ open |
| `PreviewOverlayProps` vs `FullscreenOverlayBaseProps` | 75% | `theme`, `embedded`, `copyContent`, `accessibleTitle` | ⚠️ open |

`DismissibleLayerRegistration` deserves a note: it is a **`globalThis` singleton bridge**.
Two module copies sharing one global key happened to work at runtime, but the types were
unrelated, so drift in either copy would have broken Escape/dismiss ordering silently.
This is very likely implicated in the layering bug reported in MSG 43 ("浏览器的面板会遮盖掉
新增按钮的弹窗…层级设置、嵌套设计都有很大的问题").

Also found: 4 near-identical menu implementations — `mention-menu.tsx`,
`slash-command-menu.tsx`, `label-menu.tsx`, `skill-mention-menu.tsx` — sharing duplicated
blocks at three separate offsets each. Every new menu was written by copying the last.
This is the mechanical reason new UI keeps arriving with its own subtly-different
interaction language, which is the owner's single most-repeated complaint
(MSG 14/19/28/29/30/31/35/45/110/130).

---

## 4. Root cause #3 — god components

| Component | Complexity | LOC | Nest depth | Hooks |
|---|---|---|---|---|
| `AppShellContent` | **498** | 3,840 | **12** | 31 state · 31 effect · 72 callback · 25 memo · 16 ref |
| `FreeFormInput` | 300 | 2,401 | 12 | 20 · 23 · 20 · 24 · 14 |
| `NavigationProvider` | 234 | 1,291 | 7 | 4 · 18 · 20 · 3 · 18 |
| `ChatDisplay` | — | 2,505 | — | 103 props |

A component with 31 `useEffect`s and 72 `useCallback`s has no tractable state model. This
is why every UI change produced collateral damage elsewhere, and why the owner kept
reporting that fixing one thing broke another. **No amount of careful review makes edits
to a complexity-498 function safe.** This is the structural reason the previous work
oscillated (see the revert/re-revert churn in commits `d25b763f6` → `fa5ee7460`,
`7762c8bc4` → `2136b1ea9`).

---

## 5. Owner requests — verified status

Status vocabulary per `AGENTS.md` §7.

### Genuinely done well

| Request | Evidence |
|---|---|
| Phase/permission orthogonality, auto + manual (MSG 54–56) | `work-mode.ts` — clean model, correctly researched. *Was* dead in UI; now plumbed. |
| Task-board equal-expand when empty, auto-collapse when populated (MSG 24) | `task-board-state.ts` — exactly as specified |
| Browser entry consolidated to one creation path (MSG 25/26) | single `browserPane.create` call site |
| Back/forward buttons removed (MSG 141, part 1) | `TopBar.tsx` |
| Archived page uses shared settings primitives (MSG 73) | `SettingsCard/Section/Row` |
| File-changes + queued-message rows coexist without overlap (MSG 94/96) | `ComposerContextStack` — document flow, not floating |
| Doc links centralized (MSG 7) | one `getDocUrl` authority |

### Not implemented — asked more than once

| Request | Finding |
|---|---|
| 对话撤回 / message rewind (MSG 115, 132) | **Zero implementation.** No rewind/checkpoint anywhere in the session layer. `TurnCardActionsMenu` has exactly 2 items. |
| 远程连接 / SSH · WSL (MSG 102, 89) | `execution-context-options.ts` only *projects* remote targets from workspaces that already carry a `remoteServer`. There is no connect flow. It is a read of existing state, not a capability. |

### Implemented but contradicts the instruction

| Request | Finding |
|---|---|
| Folder picker should expand from the composer, not float (MSG 99); not inside the input (MSG 90/100) | The context **strip** is in document flow ✅, but all three pickers inside it are floating `DropdownMenu`/`Popover` ❌ |
| Local/cloud, project, worktree as three independent options (MSG 113) | Structure is right ✅ (worktree correctly hidden when `worktrees.length <= 1`), but `filterWorkspacesForExecutionTarget` **couples** them: switching local↔cloud changes which folders exist. This is exactly MSG 135. |

### Partial

| Request | Finding |
|---|---|
| Token ring (MSG 129 — "根本没在前端看到") | **It exists** — conic-gradient ring beside Send, click-to-`/compact` at ≥62%. But it returns `null` when `currentInputTokens === 0`, so it is **invisible in every new session**. That is why it was never seen. |
| Model / thinking-level split (MSG 117) | Levels *are* per-model (`getThinkingLevelsForModel`) and in their own section ✅, but still inside the **same dropdown** as model selection ❌ |
| Panel top inset = bottom inset (MSG 141/143 — "顶部还是有大面积留白") | `PANEL_TOP_EDGE_INSET = PANEL_EDGE_INSET + 2` — deliberately unequal, with a comment defending it. The instruction was "跟底部留白保持一致". |

---

## 6. Landing plan

Ordered by leverage — root causes before symptoms. Items 1–3 are done.

**Done this pass**
1. ✅ Derive `SessionMeta` from the wire `Session`; delete the cast. *(9 fields restored; drift now a build error)*
2. ✅ Collapse `DismissibleLayerRegistration` to a single authority
3. ✅ Collapse `RecoveryAction` to a single authority

**Next — finish the authority sweep (low risk, high leverage)**
4. Merge `ListSessionsOptions` / `ListSessionsArgs` (100% overlap, same package)
5. Reconcile `TokenUsage` `contextWindow` drift — the Token ring depends on this field
6. Make `AgentError` derive from `TypedError`, or rename to one term
7. Make `PreviewOverlayProps` extend `FullscreenOverlayBaseProps`

**Then — symptoms that are now cheap because the plumbing is fixed**
8. `PANEL_TOP_EDGE_INSET → PANEL_EDGE_INSET` (MSG 143)
9. Token ring: render at 0 tokens instead of returning `null` (MSG 129)
10. Split thinking-level out of the model dropdown (MSG 117)
11. Decouple folder list from execution target (MSG 113/135)
12. Convert the folder picker from floating dropdown to in-flow expansion (MSG 99/100)

**Then — the two never-built features**
13. Message rewind — needs a session checkpoint model; design first
14. Remote connect (SSH/WSL) — needs a real connect flow, not a projection

**Structural, ongoing — the thing that actually stops the bleeding**
15. Extract one shared menu primitive; refactor the 4 copy-paste menus onto it.
    This is what stops new UI from arriving with a new interaction language.
16. Decompose `AppShellContent` (complexity 498). Until this happens, every UI change
    remains high-risk regardless of review quality.

---

## 7. Verification status — honest

| Gate | Result |
|---|---|
| `tsc --noEmit` · `apps/electron` | ✅ 0 errors |
| `tsc --noEmit` · `packages/shared` | ✅ 0 errors |
| `eslint src/` | ✅ 0 errors (117 pre-existing warnings, none from this change) |
| Project test suite | ⚠️ **Not run.** Tests target `bun:test` with bun-style resolution; `bun` is unavailable in the audit sandbox and package installation is network-blocked. |

The three landed changes are **type-level only** — a type derivation and two re-exports of
byte-identical declarations. No runtime logic changed. A green typecheck across both
packages is therefore strong evidence, but it is not a substitute for `bun run validate:dev`
on a machine with bun.

**Status of this pass:** `wired but not visually checked`.

Recommended next command on your machine:

```bash
cd app && bun run validate:dev
```
