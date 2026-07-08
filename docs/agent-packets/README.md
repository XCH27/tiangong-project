# Agent Packets

Agent packets are execution documents for parallel workers. They are created after module specs and contract ownership are known.

## Packet Requirements

Each packet must include:

1. Wave name.
2. Module sections covered.
3. Goal in one sentence.
4. Allowed files.
5. Forbidden files.
6. Frozen contracts consumed.
7. Interfaces produced.
8. UI placement if any.
9. Permission/timeline requirements.
10. Validation ladder.
11. Completion report template.
12. Board Cards tracking section using `docs/BOARD-SYNC.md`.

## Planned Packets

| File | Purpose |
|---|---|
| `wave-0-contract-freeze.md` | Lead-owned shared contract freeze and dirty-tree cleanup. |
| `wave-1-runtime-files-quota.md` | Terminal/CLI, files/leases, quota/usage loops. |
| `wave-2-teamrun-routing.md` | Fleet Bridge smoke, TeamRun report loop, route/cost decision closure. |
| `wave-3-browser-capability-review.md` | Browser/artifact, context/review, capability/loadout, messaging. |
| `f-track-canvas-foundation.md` | Canvas root, store, SessionEvent bridge, first native nodes. |

Do not hand a worker a legacy doc. Hand it an agent packet.

Workers claim slices by updating the packet's `## Board Cards` section with the exact card format
from `docs/BOARD-SYNC.md`.
