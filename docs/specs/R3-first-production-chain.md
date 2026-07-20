# SPEC — R3 First production chain

> Spec status: `draft`
> Owner acceptance date: —

## Outcome

One real, inspectable work chain completes inside one Project using **capabilities Craft already
ships plus minimal glue**: intent → research/evidence → Markdown production → review/revision →
accepted output → delivery. This is the first demonstration of Fleet's product story ("from intent
to delivery with evidence") and deliberately creates the second real dual-caller action that
R4 needs. **It builds no new authority** — no ArtifactRef store, no action registry, no workflow
engine.

## User story / walkthrough

1. **Intent.** The owner creates a task in a Project (New Task, P10; a Task with its Session): “Research X, write a concise brief, and save it under deliverables.”
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
5. **Acceptance.** The owner says “Accept this version.” The agent (a) marks the Session with the existing
   status/label mechanism (e.g. status → `done`, label `accepted`), and (b) copies the exact
   accepted file into the Project's `deliverables/` folder with a provenance header (source
   session, date, evidence links). Both writes go through existing permissioned paths.
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

## Verification plan

Ladder 2–3 for any glue code; the chain itself is verified by C1–C6 and C8 (real data path, induced
failure, repeat run). Owner CHECK THIS: the full walkthrough once, plus the timeline readability
of the finished chain.

## Doc updates on completion

New user-facing doc: "How a production chain works" (bundled docs); capability rows touched;
roadmap; this spec — plus recorded R4/R5 inputs (the friction list discovered while running the
chain).
