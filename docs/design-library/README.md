# Design Library — recovered source material

> These M00–M19 files preserve useful thinking from the pre-2026-07-11 planning corpus. They are not
> active plans, current contracts, or implementation authorization. Their architectural assumptions
> predate the current Craft v0.11 code-grounded document set.

Read [`DESIGN-REVIEW-2026-07-11.md`](DESIGN-REVIEW-2026-07-11.md) before using any recovered file.
Current code, the numbered documents, and the current owner request always outrank this library.

## Rules for using recovered material

1. Do **not** copy a recovered design wholesale into a feature directory.
2. Inspect the current Craft code and `08-CRAFT-CAPABILITY-MAP.md` first.
3. Write only a short current design **delta** when the slice is high-risk, cross-package, persisted,
   or externally observable.
4. The delta records:
   - adopted recovered assumptions;
   - rejected or changed assumptions;
   - exact current code paths and state authority;
   - interfaces, policy, failure/recovery, and real verification;
   - shared-contract migration, if a real caller requires one.
5. Do not revive `L0–L3`, Wave/Gate/packet language, deleted contracts, or deferred modules as current
   dependencies.
6. Do not create `modules/<feature>/` merely to mirror this library. Bound the slice by the existing
   monorepo paths it actually needs.

## Cross-cutting corrections

Every recovered design must be interpreted through these corrections:

- Craft's `safe / ask / allow-all`, session-tool `safeMode`, and PreToolUse remain the Agent permission
  mechanisms. Historical `L0–L3` describes intent only.
- `SESSION_TOOL_DEFS` is a session-scoped Agent tool registry, not a complete human/Agent/workflow
  Action Registry.
- Human and Agent callers share a caller-aware invocation/policy/executor/evidence model; UI does not
  simulate PreToolUse.
- M00/M03 extend existing Craft authorities; they do not build a parallel platform spine.
- M12/M16/M17 and deleted `docs/contracts/*` are future design references, not near-term inputs.
- Canonical session tool names use snake_case; Agent routing uses `mcp__session__<tool_name>`. A future
  stable action identifier, if needed, must define an explicit mapping rather than drift per module.
- Risk, approval, recovery, cancellation, and evidence are separate properties.
- ArtifactRef is not frozen in Milestone 1. A minimal envelope is derived from a real producer and
  consumer and versioned before Milestone 3 cross-surface use.

## Near-term triage

| Recovered design | Current use |
|---|---|
| M00 platform spine | Reframe as adoption/extension of Craft SessionManager, policy, and SessionEvent authorities. |
| M03 internal action registry | Use only for invocation/evidence ideas; current M1 is `set_session_labels`, not `files_rename`. |
| M02 terminal/CLI | M2 starts with existing non-interactive Bash/background shell; interactive PTY is conditional. |
| M05 files/Library/ArtifactRef/leases | M3 separates files + coordination + minimal handoff from later Library management. |
| M04 TeamRun | Delayed until a single-Agent whole-chain loop has proven a real delegation target. |
| M10 memory/context/review | Milestone 6 source material only; experience requires repeated completed chains. |
| M06–M09, M11–M19 | Direction and dependency notes only. Do not elaborate internal state/API now. |
| M07 canvas (infinite/spatial) | Vision + architecture + technical route are owner-expanded in [`07-canvas-spatial-orchestration-VISION.md`](07-canvas-spatial-orchestration-VISION.md). Internal node/port mechanics stay deferred. |

## Canvas: expanded vision (owner-directed)

The infinite canvas was too thin for the owner's product vision, so its **vision, module/card types,
artifact cross-use, agent-orchestration visualization, typed relationship semantics, technical route,
media/concurrency budgets, and hard boundaries** are expanded in
**[`07-canvas-spatial-orchestration-VISION.md`](07-canvas-spatial-orchestration-VISION.md)**. That file
stays at vision/boundary depth (not internal mechanics) to respect the "don't deepen deferred internals
before it's the milestone" rule. The durable early decision is **renderer independence**, not a package:
the product model is an artifact relationship graph projected into canvas layout; Agents mutate it only
through the shared governed action path. React Flow is the leading first adapter to benchmark because
TapNow, TRAEWork, and the owner-provided MiniMax Hub analysis use it for rich media/workflow nodes. Lovart's
tldraw use, Higgsfield's dedicated canvas service, Figma/Penpot/OpenPencil GPU renderers, and the local
tldraw/Penpot/OpenPencil/OpenCut clones establish comparison and escalation paths. No dependency is
promoted until a representative Electron media/concurrency spike proves it.

## File index

The numbered files retain their historical M00–M19 mapping. Their filenames are intentionally stable
for traceability. They may contain dead links or obsolete vocabulary; the review identifies the known
classes of conflict, and references to deleted planning docs are annotated inline with their current
replacement or a pre-reset Git-history recovery command. Do not "repair" deferred internal details
until that capability becomes the next real milestone.

[`OWNER-VOICE.md`](OWNER-VOICE.md) preserves the owner's recovered verbatim product signals (OV-001…
OV-006) with their current dispositions — read it before interpreting any recovered design's product
intent, and never paraphrase those quotes into your own gloss (Decision P5 sets the precedent).

[`PROJECT-REVIEW-2026-07-11.md`](PROJECT-REVIEW-2026-07-11.md) is the archived pre-reset audit (in
Chinese) that motivated the 2026-07-11 reset — kept because it is the only record of *why* the
previous corpus was retired and which of its recommendations the current document set adopted.

[`20-workspace-project-session-remote-connections.md`](20-workspace-project-session-remote-connections.md)
is **current code-grounded design source material**, not recovered M20 material and not current UI.
Its binding core is the owner decision that user-facing Project should equal the backend Workspace.
Its exact navigation, migration, and remote-connection screens are proposals that must be extracted
into small verified slices; do not apply the document wholesale.
