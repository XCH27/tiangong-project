# 04 — Milestones

> The work queue. Each milestone is a real, observable loop. There is one detailed milestone spec at
> a time. Today that is Milestone 1 in [`05-MILESTONE-1-ACTION-SPINE.md`](05-MILESTONE-1-ACTION-SPINE.md).

## Ordering principle

Build only enough shared structure to prove the next user-visible loop. Shared contracts become
versioned when a real producer and consumer need them; they are not frozen because a distant design
might eventually use them.

Before feature work begins, the current v0.11.1 alignment, speculative protocol removal, and document
reset must be separated into an auditable baseline and verified. That is baseline stabilization, not a
Fleet capability milestone.

## Baseline stabilization — verified 2026-07-11, re-verified 2026-07-12

Done, in auditable slices on branch `work/fresh-base-spine`:

1. **Typecheck failure fixed** — the v0.11.1 alignment had mapped Craft's `max` thinking level 1:1
   into the Pi SDK, but `@earendil-works/pi-agent-core@0.80.6` has no `'max'` level (and no newer
   release exists on npm). Restored `max → 'xhigh'` saturation per owner decision **E9** (per-model
   thinking-level adaptation); `typecheck:shared` re-verified green.
2. **Separated commits:** `616eff59e` (v0.11.1 upstream alignment), `7aff1c7da` (speculative
   protocol-staging removal), and the commit introducing this document set (the reset).
3. **Residue cleaned:** legacy corpus deleted from the tree (it remains recoverable from Git history
   at the pre-reset commits); `_trash/`, agent-tool state, and stale git lock files removed;
   `.gitignore` hardened against re-committing any of it.
4. **Upstream config omission fixed:** Craft v0.11.1 package configs extend `tsconfig.base.json`, but
   the upstream tag omits that file. Commit `c7fd6dea0` restores the last known-good base config and
   updates the preserved source checkout to upstream tag `v0.11.1` (`4289b160`).
5. **Development gate passed:** from `app/`, `bun run validate:dev` completed successfully, including
   all package typechecks, the shared configuration/model tests, and 19 document-tool smoke tests.
6. **Real Electron path passed:** `bun run electron:dev` opened the app, Settings showed `0.11.1`, a
   real DeepSeek-backed turn completed, and after a clean stop/restart the same session title, messages,
   workspace, and Explore permission mode were restored.
7. **Post-baseline delta audited:** current HEAD `cdc387e1d` differs from the pinned upstream app in
   13 common files, one removed list/board toggle, and eight intentional additions. The functional
   differences are limited to the Pi `max → xhigh` compatibility fix and five narrow Board/menu UI
   commits. Their five targeted tests and `bun run validate:dev` passed on 2026-07-12. The broader UI
   delta is `wired but not visually checked` across every theme and window width, so future UI work
   must still perform slice-specific Electron review.

The application baseline is verified. Start only one owner-selected coherent slice at a time. The
planned Milestone 1 remains the next architecture milestone, but a bounded UI correction may proceed
first when the owner selects it; do not combine that correction with Project=Workspace, remote access,
labels, settings, or other information-architecture rewrites.

## Development model

- Use small vertical slices that cross the existing renderer, RPC, server, and shared packages when
  the real behavior requires it.
- Bound work by explicit existing monorepo paths. Do not create a parallel `modules/<feature>/`
  architecture merely to satisfy process documentation.
- Keep shared changes small, inspect callers, and version a contract before the second independent
  consumer depends on it.
- Use short-lived branches for large or risky work. Integrate one coherent slice at a time; the main
  agent owns overlap and final verification.
- `FEATURE-REGISTRY.md` records boundaries of big in-flight work only. It is not a task system.

## Completion contract

A milestone is complete only when the applicable parts are real:

1. UI or caller entry point, core behavior, state/persistence, policy, evidence, errors, and recovery
   form one closed loop.
2. Craft capabilities are classified REUSE / EXTEND / NEW after reading the actual code.
3. Targeted checks cover the changed behavior, and the real Electron/runtime path is observed.
4. No second session, permission, timeline, task, settings, file-byte, or job authority is introduced.
5. Capability status is reported as `usable`, `wired but not visually checked`, `display-only`, or
   `not implemented`.

Run targeted checks during development. Run `validate:dev` at the integration gate when shared packages
or contracts changed; do not use a broad suite as a substitute for the real behavior check.

## Milestone 1 — Caller-aware action invocation `← BUILD THIS NEXT`

**Goal:** use the existing `set_session_labels` operation to prove that human UI and Agent calls share
one canonical invocation record, caller-aware policy evaluation, one executor/state authority, and one
attributed evidence outcome.

This milestone does **not** add a new action registry. `SESSION_TOOL_DEFS` remains the Agent tool
registry; `SessionManager` remains the session state authority; `PreToolUse` remains the Agent-side
permission adapter. The new work is the smallest bridge that lets both caller types invoke the same
operation without pretending that a UI click is an Agent tool hook.

**Done when:** a human and an Agent both update labels through the canonical invocation path; evidence
identifies the caller and policy result; a denied Agent case is visible; restoring the previous label
snapshot is conditional and does not overwrite a newer change; verified in Electron.

## Milestone 2 — First local execution loop (non-interactive first)

**Goal:** reuse Craft's existing Bash/background-shell path to prove:

```text
user intent → policy → local process → streamed/collected output → session evidence → visible result
→ stop/error report
```

Start with a bounded non-interactive command. Do not add `node-pty` until this real loop demonstrates
that an interactive PTY is necessary. Command approval reuses Craft's Bash validators and permission
flow; output handling must define secret redaction, retention, truncation, and cancellation truth.

**Done when:** a real command produces visible output and evidence, a denied command does not run, and
stop/error behavior is honest. Interactive PTY remains a separate later slice if justified.

## Milestone 3 — Files, conflict coordination, and first minimal artifact envelope

**Goal:** make real workspace files safely usable by Agents. Add only the missing parts: bounded file
operations, precondition checks, conditional recovery, and write coordination for concurrent edits.

The first real Milestone-2 output may suggest a candidate artifact envelope. Before Milestone 3 creates
the first cross-surface handoff, version the **smallest** envelope proven by a real producer and
consumer. Do not freeze the former full ArtifactRef draft. Files and Library remain separate; Library
asset management is a later slice.

For a mutation requiring approval, use:

```text
intent → policy decision → short execution lease → revalidate resource/version → mutate → evidence
```

Never hold a lease while waiting for human approval. Approval does not bypass execution-time
revalidation.

**Done when:** an Agent changes a real file through the governed path, a concurrent/stale write is
refused rather than silently overwritten, and one real output is handed to a second consumer through
the minimal versioned envelope.

## Milestone 4 — First complete single-Agent work chain

**Goal:** prove Fleet's product thesis before adding team orchestration. Reuse existing Craft surfaces
for one bounded chain such as:

```text
brief → source/browser evidence → Agent-produced Markdown deliverable
→ human revision/acceptance → traceable final result
```

This is not a new Browser or document platform. It uses Craft Sources, BrowserPane/evidence where
available, TipTap/Markdown, sessions, permissions, and the minimal artifact handoff from Milestone 3.

**Done when:** intent, evidence, production, human revision, acceptance, and final artifact remain
connected and inspectable in one project without manual context copying between products.

## Milestone 5 — Cross-Agent teamwork

**Goal:** only after one single-Agent chain has proven value, let a leader request one bounded member
task. The child receives a TaskBrief and returns a RunReport with artifact/evidence references. Fleet
owns team coordination; a CLI/runtime owns one run. No second session or task store is created.

**Done when:** a real step from the Milestone-4 chain is delegated, returns a compressed report, and
remains attributable and inspectable without copying a second transcript into the parent.

## Milestone 6 — Governable experience

**Goal:** derive reviewable experience from repeated, traceable completed chains:

```text
evidence-backed proposal → scope/sensitivity check → human or configured rule review → retain/reject
```

Raw timeline events never become long-term memory automatically. Experience records carry source,
scope, confidence, artifact version, and outcome feedback and remain inspectable and deletable.

**Done when:** an experience proposed from a real completed chain can be reviewed, retained in the
correct scope, retrieved with provenance, and deleted from the authoritative store and derived index.

## Deferred — do not specify internally yet

Keep only product direction, known Craft authority, and real prerequisites for these areas until the
earlier milestones produce evidence:

- interactive PTY/runtime lanes beyond the bounded shell loop;
- Browser evidence enhancements beyond the first whole-chain need;
- spatial canvas and finite composable workflows;
- image, video, web, design, and motion-deck modules;
- model routing/cost optimization;
- external plugin distribution, messaging expansion, and onboarding polish.

When one becomes next, write one grounded milestone spec from current code and observed needs. Do not
continue elaborating recovered internal state machines in advance.

## Maintenance rule

When a milestone is complete, replace its body with one verified outcome line and promote the next
milestone to the single detailed spec. Do not turn this file into a diary.
