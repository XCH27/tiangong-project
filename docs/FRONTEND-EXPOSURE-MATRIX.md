# Frontend Exposure Matrix

> **Purpose:** For every backend capability, state whether humans need **visible controls**,  
> **what** those controls are (not pixel layout), and **which surface class** they belong to  
> (settings vs workbench vs approval vs none).  
> **Authority:** Lead; aligned with D7/D40, **D51**, **D52**.  
> **Updated:** 2026-07-10  
> **Not a gate:** WAVE-MAP still owns Ready/Locked.

## 0. Binding owner wording — quote only

Agents **must not** replace these quotes with their own slogans (“sparse”, “clean”, “zen”, “redesign from zero”, etc.).
If other prose conflicts with these quotes, **the quotes win**.

> **Owner (D51, verbatim):**  
> 「对于界面安排应该做到如无必要，勿增实体。现在大部分Agent的软件的前端界面都非常的简约。也不会有过多的没必要的设置，这样才能适配大多数的用户。」

> **Owner (D52, verbatim):**  
> 「我在UI上的很多设计都会选择在原版Craft Agents的基础上做简化或者做优化，而不是凭空增加。」

### 0.1 Operational rules for D51 (derived only from that wording)

| Rule ID | Rule (operational — not a new philosophy) |
|---|---|
| D51-R1 | **如无必要，勿增实体:** Do not add a new UI entity (settings page, panel, dock, tab, menu group, toolbar cluster) unless a listed necessity in D51-R3 holds. |
| D51-R2 | **简约:** Prefer completing work in the existing Craft main work surface (session/chat + the one surface the loop needs). Do not add parallel “homes” for the same job. |
| D51-R3 | **A control may be `required` only if** at least one is true: (a) safety/consent (L2/L3 or legal), (b) credentials/secrets the user must provide, (c) the user cannot complete the loop or understand failure without it, (d) retention/delete of user data. Otherwise use `none`, `optional`, or `later`. |
| D51-R4 | **没必要的设置:** Do not add a Settings entry for pure backend plumbing, developer convenience, or “might need later.” Settings are for credentials, safety policy, retention, and rare preferences only. |
| D51-R5 | **适配大多数用户:** Design the default path for ordinary users. Advanced/dev controls, if any, go under one “Advanced” group—not top-level. |
| D51-R6 | **Quote discipline:** Docs and PRs that restate D51 must include the owner quote or link to D51; paraphrases are not authority. |

### 0.3 Operational rules for D52 (Craft base, not greenfield UI)

| Rule ID | Rule |
|---|---|
| D52-R1 | **Baseline UI** = clean Craft Agents **v0.11** shell (session/chat, settings host, browser host, panel primitives). Start design work there. |
| D52-R2 | **Default change type** = **simplify** (remove/merge chrome) or **optimize** (clearer copy, fewer steps, better defaults) on that baseline. |
| D52-R3 | **凭空增加 is forbidden as default:** Do not invent a second shell, second nav, second settings home, or parallel “Fleet home” page. |
| D52-R4 | **When something new is truly needed** (D51-R3): add the **smallest** control hosted **inside** Craft via M16 (panel/surface/inspector), not a new product frame. |
| D52-R5 | **Old Fleet / fleet-old UI** is not a design baseline (D50). Craft v0.11 is. |
| D52-R6 | **Quote discipline:** Restate D52 with the owner quote or link; do not replace with “redesign / modernize / rebrand.” |

### 0.4 Forbidden misreadings (control vague language)

| Misreading | Not allowed |
|---|---|
| “Minimal” = remove Craft shell / remove timeline / remove approvals | No — keep Craft spine UX; remove **unnecessary** chrome and settings |
| “简约” = no UI for a complete loop | No — if the loop needs one terminal/jobs surface, add that one, not five |
| “在原版基础上” = freeze every Craft pixel forever | No — simplify/optimize is allowed and expected |
| “优化” = rebuild a different product shell | No — 不是凭空增加；stay on Craft host |
| “Agent-like” = copy some other product’s layout | No — only owner quotes + R rules |
| “Progressive disclosure” as license for many hidden panels | No — do not create the panels at all if not necessary |
| Adding empty docks “for modularity” | No — 勿增实体 |
| Porting fleet-old screens as “optimization” | No — D50/D52-R5 |

## 1. How UI designers / Agents should use this

1. Read **§0** (D51 + D52 owner quotes and R rules).  
2. Start from **Craft v0.11** surface that already hosts the job; simplify/optimize first (D52).  
3. Open the **module row** for the slice.  
4. Implement only **`required`** for that wave; `later` waits.  
5. **`none`** = no dedicated control; do not invent a settings page.  
6. Placement class only — **M16** chooses dock/route inside Craft; no pixel specs here.  
7. Every **`required`** human control shares the same `actionId` as the Agent tool (D7/D40).  
8. Settings vs workbench: use **workbench / in-loop** unless D51-R3 (b) or (d) or rare preference applies.

## 2. Surface classes (not pixel positions)

| Class | Meaning | When allowed under D51 |
|---|---|---|
| `none` | No dedicated human control | Default for plumbing |
| `approval` | Blocking L2/L3 decision | R3(a) |
| `timeline` | Evidence stream (existing Craft) | Prefer reusing existing timeline over new panels |
| `workbench` | Day-to-day work surface | Only if the loop needs that one surface |
| `inspector` | Selection context | Prefer over new pages |
| `panel` | Persistent dock tool | Only if R3 requires ongoing visibility |
| `settings` | Infrequent preference / policy / credentials | R3(b)(d) or rare preference only |
| `onboarding` | First-run / empty state | Short; dismissible |
| `canvas` | Spatial projection / open-native | When M07 loop needs it |
| `status` | Non-blocking progress chip | Prefer chip over new page |

## 3. Exposure columns

| Column | Values |
|---|---|
| **UI needed?** | `required` · `optional` · `later` · `none` |
| **Surfaces** | classes from §2 |
| **Expose what** | controls/info (verbs + objects) |
| **Not expose** | must not become UI |
| **Necessity (if required)** | one line: which of R3(a–d) applies |
| **Parity** | same `actionId` as Agent? `yes` / `n/a` |

## 4. Matrix by module

When a row says `required`, Agents must be able to point to **R3(a–d)**. Rows without necessity are candidates to demote to `none`/`later` in a Lead pass.

### M00 — Platform spine

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Session create/list/open | required | workbench | Open/switch sessions (use Craft session UI) | raw store paths | R3(c) |
| Permission / L2–L3 | required | approval, timeline | Confirm/deny with summary | silent L3 | R3(a) |
| Timeline events | required | timeline | Readable stream (existing) | JSON-only UX | R3(c) |
| Persistence recovery | optional | status | Recovering chip | DB picker | — |
| Fleet Bridge wire | none | none | — | Bridge as settings | — |

### M01 — Clean baseline

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Craft v0.11 shell | required | workbench, settings | Upstream shell as baseline | fleet-old skins | R3(c) host |
| Migration ledger | none | none | — | user migration debug UI | — |

### M02 — Terminal / CLI

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Run terminal/CLI + stop + output | required | workbench **or** one panel | One run surface; stop | multi-dock IDE chrome | R3(c) |
| Runtime pick | required | workbench | Simple runtime/lane choice | protocol internals | R3(c) |
| Risky host commands | required | approval | L2/L3 confirm | bypass | R3(a) |
| Git / PR **actions** (Agent-first) | later when multi-repo delivery ships | timeline + approval | Result/summary; L2 for push/merge | Human PR-review SPA / second Git client | R3(a)(c) when used |

**Git/PR behaviour:** Agent-operated delivery protocol only — `docs/contracts/git-pr-delivery.md`.

### M03 — Action registry

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Executor | none | none | — | raw action console for end users | — |
| Undo when supported | required | workbench, timeline | Undo | fake undo | R3(c) |
| Blocked/error | required | timeline, status | Readable reason | stack-only | R3(c) |
| Dev registry inspector | later | settings (Advanced only) | optional | edit frozen action ids | — |

### M04 — TeamRun / lanes

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Request bounded member run | required | workbench | One “run with teammate/lane” entry | remote-control console | R3(c) |
| Codex-style task preview | required when TeamRun ships | existing task entry / Popover | title, status, short summary, up to three refs + overflow | permanent duplicate chat card; invented % progress | R3(c) |
| Parent/child TaskRun board | required when concurrent members exist | contextual panel | assignee, assignment, truthful state, blocker/approval, finite child count | global ops center; second task database | R3(c) |
| Child activity and conversation | required on selected permitted task | inspector → existing session | TaskBrief, redacted event trail, route to original child session, artifacts | copied raw transcript or cross-seat data leak | R3(c), R3(a) |
| Member RunReport / status | required when runs ship | timeline, inspector | Compact report card | full child transcript dump by default | R3(c) |
| Roster / status | optional | inspector | Compact status | full ops center | — |
| Bridge internals | none | none | — | method debugger UI | — |
| TaskBrief authoring for humans | optional/later | workbench | Only if human must edit brief | Form factory for every field | — |

**Subagent context:** spawn injects TaskBrief automatically; bare spawn forbidden —
`docs/contracts/subagent-context-handoff.md`.

### M05 — Files / Library / ArtifactRef / leases

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Open/use project files | required | workbench | Browse/open needed files | second Finder product | R3(c) |
| **Document / 文稿 edit surface** (Craft TipTap/ProseMirror on Craft shell) | required when editing docs | workbench | Edit Markdown-oriented docs in Craft | Second doc app; third-party editor package | R3(c) |
| **Markdown 模块式拖拽** (block reorder) | required when 文稿 ships as product loop | workbench | Drag **blocks/modules** to reorder (handles, drop targets) | Free-drag canvas for prose | R3(c) |
| Library promote | later/optional | workbench | Promote when Library ships | auto-library everything | — |
| Artifact preview | required | inspector | Preview/version when selected | editable storageRef | R3(c) |
| Lease conflict | required | status, modal | Conflict when it happens; keep draft | always-on lease dashboard | R3(c) |
| Destructive file ops | required | approval | Confirm delete | L0 delete | R3(a) |

**Markdown 文稿 behaviour (absorbed):** modular block reorder, slash/block unity, Agent mutation gate,
dirty/leave/conflict draft, scroll stability — all frozen in
[`docs/contracts/markdown-document-surface.md`](contracts/markdown-document-surface.md).
External 文稿 product trees are **not** required for implementation (retired after absorb).

### M06 — Browser evidence

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Browse + capture evidence | required | workbench | Navigate; select; capture | stealth toggles | R3(c) |
| Browser policy / data | required | settings | Enable, clear data, approval, site overrides; full-CDP under Advanced | anti-detect, profile farm | R3(a)(b) |

### M07 — Spatial canvas

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Arrange/open projections | required | canvas **when loop needs it** | Place cards; open native | always-on multi-tool studio | R3(c) |
| Workflow layout only | required with M17 | canvas | Layout of steps | Space line as executable | R3(c) |

### M08 — ExternalJob

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Submit + see progress/cancel | required | workbench + compact status/panel | Start; progress; cancel | job ops console | R3(c) |
| Cost confidence (M11A) | required | inspector or inline | estimated/confirmed/unknown | invent tokens | R3(c) |
| Provider credentials | required when used | settings | Keys only | quota bypass | R3(b) |

### M09 / M18 / M19 — native creative surfaces

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Edit native project | required when module ships | workbench | One editor surface | all editors always mounted | R3(c) |
| Export | required | workbench or approval if risky | Export + fidelity honesty | silent lossy export | R3(c)(a) |

### M10 — Memory / review

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Inspect/delete memory | required | settings or one panel | Browse; **delete = approval** | hidden always-on memory | R3(a)(d) |
| Review run | required when shipped | workbench | Run review; show report | many scattered review buttons | R3(c) |

### M11A — Usage / cost

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Budget preflight | required | approval or inline confirm | Approve estimated/unknown | hide unknown as free | R3(a) |
| Cost on a run | required | inspector or inline | Amount + confidence | raw ledger browser | R3(c) |

### M11B — Routing

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Model/provider choice | required when routing ships | settings **or** simple in-loop pick | One clear choice | multi-account stealth | R3(c) |

### M12 — Capabilities / skills

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| See/enable built-in loadout | required | settings (short list) | What is on for this seat | marketplace early; global pile | R3(c) |
| Plugin marketplace | later | settings | W4 only | early external plugins | — |

### M13 — Settings host

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Settings IA | required | settings | **Short** list only | dumping ground for module flags | R3 — host for R3(b)(d) only |
| Fleet account/subscription | none | none | — | login/upgrade walls (D26) | — |

### M14 — Onboarding

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| First-run | required | onboarding | Short path into Craft workbench | long product tour app | R3(c) |

### M15 — Messaging

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Connect channel | required when shipped | settings | Connect + terms/retention | always-on silent gateway | R3(b)(d) |
| Pairing allow | required | approval, settings | Approve senders | open relay | R3(a) |

### M16 — View host

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Open the surfaces loops need | required | workbench | Open/close only what exists | empty docks; per-module shells | R3(c) |
| Layout thrash by Agent | none (default off) | — | — | Agent permanently rearranging layout | — |

### M17 — Workflows

| Backend capability | UI needed? | Surfaces | Expose what | Not expose | Necessity if required |
|---|---|---|---|---|---|
| Edit/run workflow when shipped | required | workbench/canvas as needed | Edit steps; run; pause on L2/L3 | workflow-only permission path | R3(a)(c) |

## 5. Per-loop minimum UI (do not pre-build more)

| Loop | Minimum to complete the loop | Do not add “just in case” |
|---|---|---|
| L01 | Craft sessions + approval + timeline | Spine dashboards, flag editors |
| L02 | One run surface (terminal/CLI) + output + stop; file open as needed; job progress only if async | Multi-dock IDE; Library product; layout toys |
| L03A | Submit one generation; see result; approval if needed; canvas only if needed for the loop | Full studio chrome; large palettes |
| L03B | One native editor when that module ships; export | All editors always visible |
| L04 | Delete/consent paths; simple model/loadout if shipped | Memory “OS”; early marketplace |
| L05 | Short settings; short onboarding; messaging connect if retained | Settings sprawl; account walls |

## 6. Module SPEC requirement

Every module SPEC needs `## Frontend Exposure` with the table columns in §3, plus:

- link to this file;  
- **Necessity** column for each `required` row (R3 letter);  
- no pixel layout.

## 7. Maintenance

- Same PR as new backend capability: update this matrix.  
- UI control without a matrix row: incomplete (D7).  
- Paraphrase of D51 without owner quote: not authority (D51-R6).
