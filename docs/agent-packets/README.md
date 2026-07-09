# Agent Packets

Agent packets are execution documents for parallel workers. They are created after module specs and contract ownership are known.

## Packet Requirements

Each packet must include:

1. Wave name.
2. Module sections covered.
3. Goal in one sentence.
4. Allowed files.
5. Forbidden files.
6. Frozen contracts consumed (with contract version).
7. Interfaces produced.
8. UI placement if any (Lead-defined — not worker-decided).
9. Permission/timeline requirements.
10. Validation ladder.
11. Completion report template (pre-filled where possible).
12. Board Cards tracking section using `docs/BOARD-SYNC.md`.

## Minimum Packet Skeleton

Every packet file must at minimum contain the following structure. A packet missing any section is incomplete and must be completed by the Lead before a Worker may claim it.

```markdown
# <Packet Name>

## Wave
<wave name>

## Module Sections Covered
- <exact section names from the module spec>

## Goal
<one sentence>

## Allowed Files
- <list of paths or glob patterns>

## Forbidden Files
- <list of paths or glob patterns>

## Frozen Contracts Consumed
- <contract file name> @ <version or SHA>

## Interfaces Produced
- <what this packet delivers for downstream modules>

## UI Placement
<Lead-defined placement, or "none — backend only">

## Permission / Timeline Requirements
<what permission level and timeline events are expected>

## Validation Ladder
1. <cheapest check>
2. <targeted test>
3. <real behavior smoke check>

## Completion Report Template
\`\`\`text
[pre-fill as much as possible]
\`\`\`

## Board Cards
[Workers append cards here using the format in docs/BOARD-SYNC.md]
```

## Worker Fallback: Incomplete or Missing Packet

If a Worker is assigned a packet that is missing one or more required sections, or if the packet file itself does not exist:

1. **Do not begin implementation.** Do not attempt to fill in missing fields by inference.
2. List the exact missing fields or missing file in a message to the Lead.
3. Wait for the Lead to complete the packet before starting any code or documentation changes.
4. If the Lead is unavailable, mark your assignment as `blocked` with blocker: `packet incomplete — missing: <list>`.

Do not hand a worker a legacy doc. Hand it an agent packet.

## Planned Packets

| File | Purpose |
|---|---|
| `wave-0-contract-freeze.md` | Lead-owned shared contract freeze and dirty-tree cleanup. |
| `wave-1-runtime-files-quota.md` | Terminal/CLI, files/leases, quota/usage loops. |
| `wave-2-teamrun-routing.md` | Fleet Bridge smoke, TeamRun report loop, route/cost decision closure. |
| `wave-3-browser-capability-review.md` | Browser/artifact, context/review, capability/loadout, messaging. |
| `f-track-canvas-foundation.md` | Canvas root, store, SessionEvent bridge, first native nodes. |

Workers claim slices by updating the packet's `## Board Cards` section with the exact card format
from `docs/BOARD-SYNC.md`.
