# SPEC — R3 First production chain

> Spec status: `draft`
> Owner acceptance date: —
>
> **Fixture slice 2026-08-12:** the acceptance convention helper
> (`packages/shared/src/workspaces/deliverable-acceptance.ts`) and the
> `accept_deliverable` session tool are `wired but not visually checked`.
> The helper copies an accepted file into `deliverables/` with a parseable
> provenance header and refuses escape / overwrite / unattributed copies.
> The tool calls that helper, may set `needs-review`, and never sets
> `done`. C1–C8 still require a real owner-run chain — this slice is not
> a mocked stand-in for those criteria.

## Outcome

One real, inspectable work chain completes inside one Project using **capabilities Craft already
ships plus minimal glue**: intent → research/evidence → Markdown production → review/revision →
accepted output → delivery. This is the first demonstration of Fleet's product story ("from intent
to delivery with evidence") and deliberately creates the second real dual-caller action that
R4 needs. **It builds no new authority** — no ArtifactRef store, no action registry, no workflow
engine.

## User story / walkthrough

1. **Intent.** The owner starts work in a Project through the shared New Task flow (P10; one
   authoritative Session in R1): “Research X, write a concise brief, and save it under deliverables.”
2. **Research.** The agent gathers sources (BrowserPane/web + local files). Captured pages and
   quotes land as session evidence (existing timeline events); the deliverable will reference them.
3. **Production.** The agent writes `brief.md` in the Workspace via existing file tools; the owner
   reads it in the existing Markdown preview.
4. **Review loop.** The owner comments in the session; the agent revises the same file; each
   revision is visible in the timeline (existing tool events). **Recovery honesty (verified
   2026-07-17): Craft has no generic file version-history/restore authority.** Timeline tool events
   show *what* changed but are not restorable versions; TipTap undo is not durable history. Per
   Decision S5 the chain therefore states recovery truthfully: `none`, unless the Project folder is
   a Git repository (then agent-run `git` under permission is the recovery path). The friction this
   causes is a recorded R5 input — not something to paper over here.
5. **Acceptance.** The owner says “Accept this version.” The agent does **not** set a closed
   status (`done` / `cancelled`) — `set_session_status` refuses those as the owner's decision.
   It (a) sets the open status `needs-review` through the existing status tool, (b) adds a
   workspace label named `accepted` only if that label already exists in the catalog, and
   (c) copies the exact accepted file into the Project's `deliverables/` folder with a
   provenance header (session, date, source path, SHA-256, evidence refs, recovery). The
   copy is the `acceptDeliverable` helper; both status/label writes stay on the existing
   Session tools. The owner then closes the Session on the list if they want `done`.
6. **Inspection.** Later, anyone can trace: which session produced the deliverable, which evidence
   it cites, which revisions happened, where acceptance was declared — using only existing surfaces
   (timeline, files, labels).

## Scope

- **In (REUSE + glue):** existing Sources/BrowserPane, session timeline, file tools + permission
  path, Markdown/TipTap preview, session status/labels. Glue (EXTEND, small): a documented
  acceptance convention (status/label + `deliverables/` copy with provenance header) implemented as
  an agent-followable procedure and, if needed, one session tool refinement.
- **Out (non-goals):** ArtifactRef schema (R5), action seam types (R4), delegation (R6), any new
  panel/store/setting, automatic acceptance UI. If step 5 proves to need a real UI affordance,
  record it as an R4/R5 input instead of inventing one here.
- **Reserved paths:** this spec; permission configuration; session store schema.

## Reality anchors and execution order

The chain must use the existing paths: browser/source tools under
`app/packages/shared/src/agent/` and `app/packages/shared/src/sources/`, session timeline and
permission paths under `app/packages/server-core/src/sessions/` and
`app/packages/shared/src/agent/core/pre-tool-use.ts`, file handlers under
`app/packages/session-tools-core/src/handlers/`, and Markdown editor
`app/packages/ui/src/components/markdown/TiptapMarkdownEditor.tsx`. Execute the six walkthrough
steps in order with a fixture Project folder and a known Markdown input; capture session ID,
timeline events, accepted-file SHA-256 and provenance header. From `app/`, run the scoped tests and
the non-interactive smoke only after the real chain has completed once; a mocked adapter cannot
satisfy C1–C6.

## Pages touched

R3 adds no page or store. Existing surfaces are exercised as follows:

| Surface ID | Create/extend/wire | Adapter/data contract | Permission | States exercised | Owner visual checkpoint |
|---|---|---|---|---|---|
| P-02 | use existing chat/timeline | Session events + tool results | PreToolUse | loading/empty/error/denied/offline | timeline readability |
| P-11 | use existing Project/file actions | workspace-root file contract | file permission | loading/empty/error/denied/recovery | file/deliverables view |
| P-13 | use existing Sources/BrowserPane | source/browser evidence events | browser/source policy | loading/error/denied/offline | source progress |
| P-14 | use existing Markdown preview/editor | TipTap/document file contract | file permission | loading/empty/error/recovery/i18n | rendered Markdown |
| P-16 | inspect existing timeline evidence | SessionEvent projection | session scope | empty/error/unavailable | provenance readability |
| P-50 | inspect existing activity timeline | SessionEvent authority | session scope | loading/empty/error/recovery | event ordering |

## Acceptance criteria

| ID | Criterion | Verified by |
|---|---|---|
| R3-C1 | The full chain (steps 1–6) completes in one Project without manual copying between products | owner runs it once with an agent |
| R3-C2 | Every consequential step left timeline evidence (research, writes, acceptance) attributable to its session | timeline inspection |
| R3-C3 | The delivered file is byte-identical to the accepted revision and carries a provenance header naming session + evidence | file diff + header check |
| R3-C4 | Denied/failed steps (e.g. permission denial mid-chain) are visible and recoverable without corrupting the chain | induced-failure test |
| R3-C5 | The acceptance convention is documented as a repeatable procedure (prompt + expected behavior) | doc review |
| R3-C6 | A second run of the chain by a fresh agent session succeeds following only the documented procedure | repeat run |
| R3-C7 | Owner accepts the end-to-end experience | owner acceptance |
| R3-C8 | The two repeat runs emit one comparable harness trace with request-component inventory, usage confidence, latency, rework/halt and accepted outcome; no optimizer is tuned during the run | SYS-03 harness output + acceptance record |

## Dependencies and unresolved edges

Consumes R0 baseline (R1/R2 improve the experience but only R0 is hard-required). Produces the
inputs R4 and R5 need: a second real dual-caller mutation (status/label acceptance used by both
human UI and agent) and a real produced-then-consumed artifact (the accepted file) whose handling
pain will define `ArtifactRef`'s minimal fields honestly.
The same chain is SYS-03's first cross-domain benchmark trace. That measurement obligation adds no
prompt optimizer, profile switch, UI, store or acceptance shortcut to R3.

## References consumed

Document-editing UX comparisons follow the matrix row (LobeHub product flow = PRODUCT_REFERENCE
candidate; editor stays Craft TipTap — LOCAL_IMPROVEMENT path only, per
[`../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md)).
No reference project is copied in this release.

## Risks and rollback

- **Risk:** scope creep into building acceptance UI/stores → non-goals + reserved paths; any
  needed affordance is recorded as an R4/R5 input.
- **Risk:** "chain worked once" theater → C6 requires a repeatable second run from documentation.
- **Rollback:** the convention is procedure + docs; removing it deletes no state.

## Repeatable acceptance procedure (R3-C5)

Use only existing Session tools plus `acceptDeliverable`. Do not add a second store.

1. Write or revise the Markdown deliverable in the Project folder with the ordinary file tools.
2. Capture evidence as existing timeline / source / browser events. Record their ids or paths.
3. When the owner accepts: call `acceptDeliverable` with the workspace root, the current
   Session id, the source path, and those evidence refs. The helper writes
   `<workspace>/deliverables/<basename>` as header + original bytes. The body after the
   header must match the accepted file; the header names session, source, SHA-256, evidence
   and recovery (`none`, or `git` if `.git` exists).
4. Set Session status to `needs-review`. Do not set `done` or `cancelled`.
5. If the workspace label catalog already contains `accepted`, add it with
   `set_session_labels`. Do not create a new label type or system label for this convention.
6. If the copy is denied (path escape, missing source, overwrite of a different file), leave
   the existing deliverable untouched and report the helper's reason. Recovery of earlier
   file versions is `none` unless the Project is a Git repository.

## Verification plan

Ladder 2–3 for any glue code; the chain itself is verified by C1–C6 and C8 (real data path, induced
failure, repeat run). Owner CHECK THIS: the full walkthrough once, plus the timeline readability
of the finished chain.

## Doc updates on completion

New user-facing doc: "How a production chain works" (bundled docs); capability rows touched;
roadmap; this spec — plus recorded R4/R5 inputs (the friction list discovered while running the
chain).
