# Capability crosswalk

The registry answers “what is in product scope”; this crosswalk answers “where is it implemented or
specified”. An implementation slice must link its bounded context, authority/seam, user surface
(or an explicit non-visual reason), activation spec, and acceptance evidence. Missing links are
audit failures.

This page is a **group-level navigation summary only**. The per-ID join is canonical in
[`PACKET-INDEX.md`](PACKET-INDEX.md), which has exactly one row for each registry ID. Do not add a
second per-ID table here: update the packet index and link back to it. Registry breadth, matrix
behavior, page state, packet readiness and capability status remain separate fields under the
ownership rules in [`../15-DOC-AUDIT.md`](../15-DOC-AUDIT.md).

| Registry group | Bounded context | Authority/seam | Surface home | Current evidence |
|---|---|---|---|---|
| CORE-* | Work Core | Craft session/task/settings/workbench owners | workspace, board, settings | `docs/08-CRAFT-CAPABILITY-MAP.md` |
| INFO-* | Information/Evidence | files, ArtifactRef, evidence projection | library, sources, editor, browser | packet/spec or `not implemented` |
| EXEC-* | Governed Execution | action/policy/executor/job seams | chat, task board, approvals, terminal | packet/spec or `not implemented` |
| INTEL-* | Intelligence | UsageTracker, context projection, provider adapters | chat, run report, memory, diagnostics | packet/spec or `not implemented` |
| CREATE-* | Creative Media | artifact/sequence/job/renderer adapters | canvas, media, deck, web preview | packet/spec or `not implemented` |
| ORCH-* | Composition / Integrations | typed DAG, TaskRunner projection, gateway | canvas, workflows, inbox, diagnostics | packet/spec or `not implemented` |

The TaskBrief for every slice must name registry IDs, exact code paths, authority owner, reference
files and fixed commit, acceptance IDs, verification command, and failure/recovery states.
