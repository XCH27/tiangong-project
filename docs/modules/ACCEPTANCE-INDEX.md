# Capability acceptance index

This index prevents page and registry rows from carrying empty acceptance anchors. The `-A` IDs
below are breadth gates: they become executable only when copied into an active module/release spec
with a concrete code path, evidence command and status. They are intentionally not marked done.

| ID | Observable criterion (minimum) | Evidence required |
|---|---|---|
| CORE-01-A | Shell launches and routes to every usable baseline surface without a duplicate host | dev launch + route smoke |
| CORE-02-A | A Project boundary resolves one workspace root and rejects an out-of-bound path | boundary test + trace |
| CORE-03-A | Session stream, cancellation and event history use one Session authority | RPC/data-path trace |
| CORE-04-A | Structured task mutations round-trip through the existing task store; any task-center view remains a projection and ordinary R1 Sessions need no duplicate Task record | task-store test + projection/data-path audit |
| CORE-05-A | Settings changes persist and are read from one settings home | settings test |
| CORE-06-A | Search/filter/view state is a projection and survives reload without copying domain data | view test |
| CORE-07-A | First-run creates or selects a workspace and reports missing provider setup honestly | onboarding smoke |
| CORE-08-A | Help links identify local, user-configured and unavailable sources | state walkthrough |
| CORE-09-A | Update check/install failure is visible and never points to a Craft-owned channel | packaging smoke |
| CORE-10-A | zh-Hans/en labels and stable identity IDs remain consistent across shell and settings | i18n check |
| CORE-11-A | Opening two native surfaces preserves layout while domain state remains in its owner | layout smoke |
| INFO-01-A | File actions enforce workspace containment and report conflict/denial explicitly | path + permission test |
| INFO-02-A | A produced artifact has an exact version and a single provenance owner | artifact data-path trace |
| INFO-03-A | A permitted browser capture links session, URL/time and artifact provenance | browser capture trace |
| INFO-04-A | Ingestion produces a readable source plus conversion provenance or an explicit failure | ingestion fixture |
| INFO-05-A | Editing and preview read/write one document authority with no second editor store | editor data-path trace |
| INFO-06-A | Search results can be refreshed/rebuilt without becoming a source-of-truth copy | index rebuild test |
| INFO-07-A | Citation points to immutable evidence and shows unavailable/deleted source truth | provenance fixture |
| INFO-08-A | Import/export preserves source separately and declares unsupported fidelity | migration fixture |
| EXEC-01-A | A denied or approval-required action is blocked by the shared policy path | PreToolUse test |
| EXEC-02-A | Human and Agent callers invoke the same action contract with attributed evidence | dual-caller trace |
| EXEC-03-A | Terminal output, cancel, restart and failure states are observable and scoped to a session | terminal smoke |
| EXEC-04-A | Delegation creates a child in the existing Session/Task tree and returns a validated report | delegation trace |
| EXEC-05-A | A runtime adapter reports supported/unsupported capabilities without guessing | adapter contract test |
| EXEC-07-A | Worktree occupancy and cleanup are idempotent and never confused with a location path | lifecycle test |
| EXEC-08-A | Sandbox create/exec/cancel/reclaim reports limits and denial through core policy | executor test |
| EXEC-09-A | Remote disconnect and grant revocation prevent further execution with honest status | transport test |
| EXEC-10-A | An automation invokes governed actions and records schedule/run outcome in existing history | scheduler smoke |
| EXEC-11-A | Channel failure/reconnect is isolated from local core and scoped to a workspace | adapter test |
| EXEC-13-A | Git/branch/PR actions are attributed, permissioned, reviewable and cannot replace the Task/Session authority | Git fixture + permission trace |
| EXEC-14-A | One Craft-owned effective prompt/tool projection is versioned, scoped and attributable; profile changes cannot silently weaken policy or create a second harness | prompt/profile fixture + policy regression |
| EXEC-15-A | An approved external-environment action proves the narrowest reliable route was tried first, binds environment/display identity and a live expiring grant, and refuses on a stale observation; a route that is not needed closes `NO_GAP` with evidence | route-exhaustion trace + stale-frame refusal fixture |
| INTEL-01-A | Context projection lists included/excluded evidence and can be compared before sending | projection fixture |
| INTEL-02-A | Token/cache optimization lowers cost per accepted outcome on a sealed model×harness×task comparison, preserves quality and a switch-off path | usage + acceptance benchmark |
| INTEL-03-A | Model capability negotiation rejects unsupported parameters before execution | adapter test |
| INTEL-04-A | Cost ledger distinguishes real, estimated and unknown usage and never treats unknown as zero | ledger fixture |
| INTEL-05-A | Memory proposal displays source evidence and deletion removes retained memory without rewriting raw history | review fixture |
| INTEL-06-A | Install, loadout and runtime states are distinct and permissioned | loadout test |
| INTEL-07-A | Evaluation result names the tested input, verifier and artifact evidence independently of executor | regression fixture |
| CREATE-01-A | Canvas projects native records, invokes one governed action and persists no domain duplicate | Electron canvas smoke |
| CREATE-02-A | Video imports media, applies a shared edit command and produces a cancellable real render | media fixture + render job |
| CREATE-03-A | Image generation/editing returns a provenance-bearing artifact through the shared Job path | job fixture |
| CREATE-04-A | Audio/voice/music tracks retain source, timing and generation provenance | media fixture |
| CREATE-05-A | Transcript ranges map deterministically to captions/clips and expose translation failure | mapping fixture |
| CREATE-06-A | Design mutations are schema-valid ordered batches with attribution and inverse/recovery scope | mutation test |
| CREATE-07-A | Web preview is isolated, versioned and cannot silently mutate the source artifact | preview smoke |
| CREATE-08-A | A deck has a native source model and export output with declared fidelity limits | export fixture |
| CREATE-09-A | Motion composition renders through a replaceable adapter and reports missing assets | renderer test |
| CREATE-10-A | Storyboard shots link to media/artifacts and survive reordering without losing identity | storyboard fixture |
| CREATE-11-A | Template/brand assets have provenance, scope and safe reuse boundaries | library fixture |
| CREATE-12-A | Export profile creates one Job output receipt and preserves source/output separately | delivery smoke |
| CREATE-16-A | Long-form generation applies governed document actions, preserves human edits and records prompt/model/source provenance | document generation fixture |
| ORCH-01-A | Workflow definition validates a typed finite DAG and rejects cycles/stale versions | schema test |
| ORCH-02-A | Workflow run projects TaskRunner status and never creates a second run authority | run trace |
| ORCH-03-A | Plugin/skill manifest, loadout and runtime permissions are independently visible | manifest fixture |
| ORCH-04-A | Tool/MCP registration uses the shared action/policy path and records capability scope | registry test |
| ORCH-05-A | Job queue supports progress, cancel, retry and resource limits through one authority | queue test |
| ORCH-06-A | Activity history correlates events to the owning Session/Task/Artifact without duplication | event trace |
| ORCH-07-A | Inbox approval/notification resolves to a real permission or session event | inbox smoke |
| ORCH-08-A | Diagnostics classifies failure and offers only a recovery action that actually exists | failure fixture |
| ORCH-10-A | Skill marketplace discovers signed manifests, shows compatibility/permissions, installs into a scoped loadout, and supports disable/update/rollback | marketplace fixture |
| ORCH-11-A | Plugin marketplace verifies provenance and license, previews requested capabilities, requires permission approval, isolates runtime, and recovers from failed update/uninstall | plugin lifecycle test |
| ORCH-12-A | MCP marketplace registers server capabilities and health, scopes credentials per grant, exposes tool risk before install, and removes/revokes a server without stale tools | MCP registry test |

## Promotion rule

When a row enters an active spec, replace the minimum criterion with the release-specific Given /
When / Then, add exact files/symbols and run commands, and set the status in both the packet index
and registry. A page is not `usable` merely because this index has an ID.

## Packet subcriteria namespace

Starter packets use short subcriteria names (`VID-001`, `CAN-001`, `BRW-001`, `MEM-001`, `JOB-001`,
`DSN-001`, `DECK-001`, `WF-001`, and `WB-001`) for readability. They are not a second acceptance
authority: each resolves to one canonical registry criterion below, and an active spec must carry
the exact Given/When/Then and evidence path.

| Packet prefix | Canonical registry criterion |
|---|---|
| VID | CREATE-02-A |
| CAN | CREATE-01-A |
| BRW | INFO-03-A |
| MEM | INTEL-05-A |
| JOB | ORCH-05-A |
| DSN | CREATE-06-A |
| DECK | CREATE-08-A |
| WF | ORCH-01-A |
| WB | CORE-11-A |
