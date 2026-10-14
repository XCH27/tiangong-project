# Feature implementation comparison — 2026-10-13

## Authority and evidence boundary

Product baseline is **`.fleet/zcode` plus ordered `patches/zcode/`**, under D56–59.
Craft Agents, `app/`, Craft Exit 1–7 and the historical v0.11 pin remain interaction
reference/audit only. This comparison opens no Locked wave, creates no second
Session/permission/asset/job authority, and promotes no capability to `usable`.

The investigation decomposes **15 MiniMax features, 12 Trae features and 10 current
ZCode owner chains**. Findings distinguish directly inspected callables/schema,
static relationship inference, and unknown native/cloud behavior. The reference
chains are `wired but not visually checked`; that label establishes static wiring,
not runtime acceptance. Tests named by the readers are coverage pointers or proposed
fixtures, not executed results. REA's analysis guides informed the method; no runnable
REA CLI/dist/MCP was available, so these records are not authenticated REA Evidence.

No target modules, native libraries, GUI, cloud calls or private profiles/databases
were executed/read. Proprietary implementation/assets were not copied into product.
Only this audit is tracked; bounded fragments, snapshots and machine indexes remain
external.

| Target | Exact capture | Identity and coverage |
|---|---|---|
| MiniMax Design 3.0.21 | Build 3.0.21.85; original extracted ASAR, matched to preserved `/Volumes/AIGC/MiniMax Design.app` | ASAR SHA-256 `2a2e1046d19df76ed203e534601ccfdfd4a82f14256cfbc8b14f041b8232de49`; matched Gateway SHA-256 `25ebe3a929077c5b97ce2c8febcfc34227f52e0426c856f6a090044a7f633fb6` |
| MiniMax Design 4.0.0 | Build 4.0.0.95; independent Info.plist/ASAR/sidecar snapshot after installation changed | ASAR SHA-256 `c3db02278bf8aab408c1131cca40bccff994bc344681ceeb2db0cb32350ce2f9`; 740 captured package/sidecar entries. Never pair the old renderer with this Gateway as one chain. |
| Trae IDE 3.6.2 | Installed package type `TRAE_I18N` | Chat SHA-256 `2913a4cf1b71d2685c10ab130aac3e35423df8c3f8c63f7967beb731805aab35`; native library SHA-256 `ae6ad2248a1eb595e095bc84753f9d7e51092f78d3f6f97a978c51c1ef636de3`. JS-to-native handoff is traced; native transactions are not reconstructed. |
| ZCode candidate | HEAD `2cda91840263afe99b87095f71e64a44b702283f`; tree `6d6fe24d0bf8d5881b7449fef977984b486a4923` | Read-only feature capture. Later delegated repairs are separate work in progress until Root integration and final acceptance. |

Full provenance and branch records:

- [MiniMax feature table](/Volumes/AIGC/.fleet-tmp/fleet-horizontal-comparison-2026-10-13/feature-decomposition/minimax/feature-table.md) and [trace/index](/Volumes/AIGC/.fleet-tmp/fleet-horizontal-comparison-2026-10-13/feature-decomposition/minimax/trace.json): 135 digest/line/byte locations, 72 same-version producer/consumer relationships and 10 storage owners. [Delivery index](/Volumes/AIGC/.fleet-tmp/fleet-horizontal-comparison-2026-10-13/feature-decomposition/minimax/delivery-index.json) binds output digests.
- [Trae features](/Volumes/AIGC/.fleet-tmp/fleet-horizontal-comparison-2026-10-13/feature-decomposition/trae/FEATURES.md) and [trace](/Volumes/AIGC/.fleet-tmp/fleet-horizontal-comparison-2026-10-13/feature-decomposition/trae/trace.json): exact compiled callable fragments, artifact hashes and zero-based byte intervals.
- [ZCode features](/Volumes/AIGC/.fleet-tmp/fleet-horizontal-comparison-2026-10-13/feature-decomposition/zcode/FEATURES.md) and [trace](/Volumes/AIGC/.fleet-tmp/fleet-horizontal-comparison-2026-10-13/feature-decomposition/zcode/trace.json): original owners, source digests, conservative limits and consequential counterexamples.
- [Browser supplement](/Volumes/AIGC/.fleet-tmp/fleet-horizontal-comparison-2026-10-13/feature-decomposition/browser/trace.json): MiniMax 3.0.21 fixed Main chunk SHA-256 `dd2db26ed9d6b72847a90c9b19cb4b06b41c751d723ffb92ce60da56bcf51ecb`, B01–B03 with exact line excerpts.

## MiniMax: feature mechanisms and version differences

| ID | Inspected implementation | Durable/recovery boundary and ZCode comparison |
|---|---|---|
| MM01 | 3.0 selection/drag/delete → graph commit → persist queue → HTTP Canvas writer | Selection is view state; Gateway owns `canvas.json`. Superseded/failed writes retain the latest draft. Compare F10 CAS/draft/close. |
| MM02 | 3.0 checkpoint undo and text version restore | Undo emits persistence; exact checkpoint refuses newer-mutation rollback. Text snapshots use stable asset IDs and compressed CAS; restore lacks an established concurrent-write CAS. Compare F05/F10. |
| MM03 | Local import → project asset index → stable chat anchor → fixed-byte reference snapshot | Project index, workspace anchor ledger and hash-keyed snapshots have declared scopes. Cross-session use is structurally supported; account/project ACL is untested. Compare F03. |
| MM04 | Debounced file/asset search → selected identity → chat context assembly | Safe paths precede lineage/entity/plugin context. 4.0 adds independent source availability status where 3.0 projected failed sources as empty. Compare F01/F02. |
| MM05 | 3.0 image submit → tracked cloud identity → asset recording → Canvas fill | `active-generations.json` and Canvas receipts retain uncertain paid work; recovery differs from resubmission. Compare F04. |
| MM06 | 3.0 video references/round/replacement → original generation owner | Video shares the retained-ledger owner; missing replacement-task identity can suppress automatic paid retry. Provider transactions remain unknown. Compare F04. |
| MM07 | 4.0 Canvas V3 command → journal → document/receipt transaction → undo inverse | Stable command identity, revision CAS and recovery saga; discard is not server rollback. Compare F05/F10 original checkpoint owners. |
| MM08 | 4.0 text editing → resource revision write → receipt → selected-version Canvas command | Resource bytes/version authority precedes view binding; candidate results cannot steal later selection. Compare F10/F03 without claiming a general editor. |
| MM09 | 4.0 media intent WAL → Task admission → worker → completion gate → outbox/WS | UI WAL is an intent projection; Task/resource/composition stores own accepted facts. Completion requires materialization, commit and readback. Compare F04/F03. |
| MM10 | 4.0 Task action → retained control identity → revision CAS/reopen | Stop abandons unsubmitted subtasks; submitted work may still deliver. Retry preserves completed results; human cost confirmation is distinct. Compare F07/F04. |
| MM11 | ComfyUI parameter review → source-hash compiler → managed prompt submission | Snapshot before enqueue; partially accepted batches retain prompt IDs and prohibit automatic requeue. Compare F04/F06. |
| MM12 | ComfyUI queue/history → per-node receipts → output materialization; exact-job Stop | Poll/materialize recovery does not repeat `/prompt`. Downloaded backend cancellation/parity is not proved by packaged client methods. Compare F04. |
| MM13 | Skill market staging/locks/swap → overrides → fanout → runtime skill grant | Package save, permission configuration and runtime publication are separate. Both examined UI versions swallow restart failure then show success. Compare F06. |
| MM14 | Own iframe RPC → injected plugin identity → config/node state/Python owner | Legacy node KV is workspace SQLite; V3 node state is an owned sidecar; global config has a process queue. These guards do not establish universal per-call approval. Compare F07/F06. |
| MM15 | Attached plugin/connector identity → canonical lookup → scoped prompt knowledge | Mention is context/preference, not a grant. Missing nodes/skills and catalog timeout retain explicit limits. Compare F01/F06. |

The captured 3.0 `out/` inventory has no `renderer/v3` files or CanvasV3Editor
definition. The selected complete 4.0 `out/` inventory adds 325 `renderer/v3` files,
CanvasAreaV3 and that editor; its Gateway adds CanvasV3Store, TaskStore/TaskService
and Task migrations. Legacy Canvas remains packaged and explicitly gated. This is
a shipped-artifact difference, not proof every project migrated or either path ran.

Representative producer → consumer: CanvasAreaV3 drag-stop creates a canonical
patch; CanvasV3Editor attaches `commandId`/`expectedRevision`; createCanvasV3Client
POSTs it; CanvasV3Service recovers the business journal before admission; CanvasV3Store
updates its single document row and inserts the command receipt in one immediate
SQLite transaction. Only the matching receipt's inverse enters undo history. A
transport error retains the exact pending request; definite rejection reloads facts.

The business journal lives in the original resource database, separately from the
Canvas database. `ready` recovery replays the original Canvas commit; `running`
rollback requires each current row to equal its captured after-image; copied-file
cleanup validates workspace path/device/inode/fingerprint. This is an explicit saga,
not an atomic transaction across two databases and files. Static ordering does not
prove power-loss durability. Evidence: MM07 `g4journal`, `g4canvasstore`, `r4history`.

Task admission validates frozen input versions and reserves outputs inside the
canonical insert transaction. State CAS uses an actual `WHERE id AND revision`
predicate. Terminal Task state and outbox event commit together; migration 0019
removes Task-ID uniqueness from outbox while preserving event-ID identity, allowing
several terminal facts after in-place retry. Worker restart recovers unfinished
facts before dispatch. Publisher and consumer correlate subject/subscription and
Task revision. Cloud billing/idempotency and downloaded ComfyUI execution remain
outside this local proof. Evidence: MM09–10 `g4taskcas`, `g4replay`, `v4events`.

The 4.0 native carrier was inspected without execution. Mach-O `__BUN/__bun` and
NUL-bounded embedded JS establish an actual sequential **before hook → MCP permission
ask → execution → after hook**, using merged Agent/Session rules. Hook refusal precedes
the body; an abort after the body does not prove rollback. This improves on strings-only
inspection but does not reconstruct the complete native permission/session database.
Evidence: MiniMax `bun4hook` and its carrier digest/absolute byte bounds.

## Trae: concrete JS mechanisms, opaque native owners

| ID | Inspected implementation | Reusable mechanism or limit |
|---|---|---|
| T01 | Typed @file/selection/media/context request → original streamed RPC | Preserve typed scope/selection; search cancellation returning collected Success does not establish exhaustive results. |
| T02 | Compact action → ordinary submitted turn → projected tool result | Submission is implemented; native summary creation, transcript preservation and commit are unknown. |
| T03 | Guarded send → accepted native message identity → pending/SSE consumption | SSE-before-ACK identity dedupe is useful; cancellation detected after API acceptance is an uncertain effect. |
| T04 | Stream owner → bounded event batching → reply identity → Stop/Resume | Stop ACK differs from completion. Local closure cancellation and follow-up token fences do not prove native rollback. |
| T05 | Confirmation card → user decision; permission profile and Plan request fields | Profile/flags are not complete enforcement proof. A named background auto-confirm branch is not a reusable policy exemption. |
| T06 | Existing ToolHost command identity → check/stop/background request → validated response | A stop hint remains running until positive exit/kill evidence; native process-tree coverage is unknown. |
| T07 | Snapshot check → current file reconciliation → deferred diff commit → revert | Cache version/exact-promise cleanup is useful. Legacy UI cuts history before non-awaited native revert; native CAS/crash atomicity unknown. |
| T08 | Fork native Session → captured model selection → target reload/switch | Retain accepted target identity when later UI work fails; native transcript/checkpoint copy is not reconstructed. |
| T09 | Verified Git base/branch → worktree creation → scoped chat → cleanup | Branch retained by default. Legacy removal ignores a native false result before projecting Deleted; cleanup is not universal transaction proof. |
| T10 | Persisted indexing options → native CKG request → version/sequence-fenced polling | Configuration and runtime index state differ; actual index schema/ranking/permission-filtered retrieval remain unknown. |
| T11 | Per-resource MCP config queue/watch → current server/tool → SDK call | Preserve original SDK result; rename is two writes and can partially succeed. Presentation lifecycle is not tool approval. |
| T12 | Conditional native/VM startup → health/readiness → exact old-handle shutdown | Installed `TRAE_I18N` does not select the SOLO package predicate. VM mode/interface presence is not evidence of installed TraeWork/SOLO or active isolation. |

Representative transport: the chat facade obtains the original default client;
requestForStream builds a packet with a distinct channel ID; AhaRpcClient routes
matching stream data and re-registers handlers after reconnect. The newer Rust
adapter maps calls to `lite.*` through that same client. Reconnection is transport
recovery, not authorization to replay a writable request. JS exposes DB/VM handoffs;
the 261 MB native library's transaction semantics remain unknown. Evidence: T03/T04
`C18–C21`, `W01`, `M01`.

The snapshot cache and CKG polling check versions on both sides of waits; cache
cleanup compares the exact inflight Promise. These support original-owner acceptance
cases for late A→B→A/service replacement. Possible late stream/server callbacks are
bounded static risks requiring fault tests, not reproduced runtime failures. Direct
ordering defects, such as ignored removeWorktree results and pre-ACK history removal,
should not be copied into Fleet.

## ZCode: current owners and exposed limits

Source positions below refer to the recorded candidate. Links are local navigation;
the external ZCode trace preserves source hashes. These owners receive mechanisms
and acceptance cases, not transplanted reference databases.

| ID | Current original owner | Actual scope and boundary |
|---|---|---|
| F01 | [ReadSessionContext](/Users/lullwen/Documents/天工/.fleet/zcode/apps/zcode-cli/packages/core/src/tool/handlers/read-session-context.ts:136) | Canonical composer/Session context; `#` identifies history. Cross-session typed ArtifactRef library/search is not implemented in inspected categories. |
| F02 | [FileService search](/Users/lullwen/Documents/天工/.fleet/zcode/packages/services/src/file/fileService.ts:590) | Bounded filename index and relative-path mentions; not semantic codegraph retrieval. |
| F03 | [Artifact data reader](/Users/lullwen/Documents/天工/.fleet/zcode/packages/ui/src/hooks/useWorkflowRunArtifactData.ts:55) | Original workflow journal/versioned bytes; preview/error/unavailable projections, no native Office/media editor authority. |
| F04 | [Saved workflow launch](/Users/lullwen/Documents/天工/.fleet/zcode/packages/ui/src/settings/saved-workflows/useSavedWorkflowLauncher.ts:122) | Original Session/start envelope/CommandInbox reconciliation; lost ACK does not replay or delete a possibly accepted run. General ExternalJob/ComfyUI host not implemented here. |
| F05 | [Conversation fork](/Users/lullwen/Documents/天工/.fleet/zcode/apps/zcode-cli/packages/core/src/runtime/methods/session-fork-conversation.ts:185), [workspace checkpoints](/Users/lullwen/Documents/天工/.fleet/zcode/apps/zcode-cli/packages/core/src/runtime/methods/workspace-checkpoints.ts:133) | Session transaction/ArtifactStore preimages/CAS. Conversation fork is not a dedicated Git-worktree task lifecycle. |
| F06 | [Canonical enable writer](/Users/lullwen/Documents/天工/.fleet/zcode/apps/zcode-cli/packages/bootstrap/src/plugins-configure.ts:43), [UI request owner](/Users/lullwen/Documents/天工/.fleet/zcode/packages/ui/src/store/pluginManagementStoreRequests.ts:24) | Config/package/grant authority; generations are projections. Definition refresh and partial-commit repair are pending acceptance, below. |
| F07 | [Dispatch permission recheck](/Users/lullwen/Documents/天工/.fleet/zcode/apps/zcode-cli/packages/core/src/tool/executor/permission-input-recheck.ts:42), [native plugin control](/Users/lullwen/Documents/天工/.fleet/zcode/packages/ui/src/lib/nativePluginViewControl.ts:47) | Original broker/ToolExecutor/foreground/Session receipt. Auto permission mode explicitly not implemented; no complete Pi execution host or L0–L3 waiver. |
| F08 | [Pane persistence](/Users/lullwen/Documents/天工/.fleet/zcode/packages/ui/src/v4/paneLayoutPersistence.ts:217) | Renderer reload restores validated split layout; app cold startup intentionally starts primary draft. Sidepane RAM is not a spatial document store. |
| F09 | [Decision-source update](/Users/lullwen/Documents/天工/.fleet/zcode/packages/provider/src/decision-source-save.ts:69), [original config repository](/Users/lullwen/Documents/天工/.fleet/zcode/packages/provider-node/src/personal-provider-config-repository.ts:89) | Commit and ProviderRegistry publication are distinct; same-request recovery/no-change handling. Automatic routing quality has no live inference proof here. |
| F10 | [Whiteboard CAS writer](/Users/lullwen/Documents/天工/.fleet/zcode/apps/zcode-cli/packages/core/src/tool/handlers/whiteboard-files.ts:123), [native control](/Users/lullwen/Documents/天工/.fleet/zcode/packages/ui/src/lib/nativeWhiteboardControl.ts:54) | Original workspace bounded version-1 JSON, permission/checkpoint receipts and readonly projection; fixed 1280×800 strokes, not infinite canvas/general native editor. |

Representative native loop: [withNativeSessionPresentation](/Users/lullwen/Documents/天工/.fleet/zcode/packages/ui/src/lib/nativeSessionPresentation.ts:115)
holds original connection/detail leases until the matching Session is subscribed and
hydrated, then dispatches original native control. ToolExecutor/broker and the FS
revision/hash writer remain the mutation owner. Read-only whiteboard refresh observes
files without fabricating user messages or inference. Stop before dispatch and Stop
after foreground admission have different evidence; lost receipt remains uncertain.
Prior Root native Save/quit/reopen results belong to their own acceptance record, not
to this static reader and not to every capability above.

## Browser lifetime and artifact identity

MiniMax B01–B03 directly expose per-window browser hosts and navigation/crash/blur/close
cleanup, but one shared persistent partition: per-workspace browsing isolation cannot
be inferred. Script timeout races the page Promise without stopping its JS. Capture
suspends plugins with a fixed delay rather than an ACK barrier. Video completion
checks request identity, sender and Main frame; that correlation is not general tool
admission. Evidence: browser supplement B01–B03, exact excerpt lines 52470–54175.

Fleet's comparison belongs to existing [browser guest owner](/Users/lullwen/Documents/天工/.fleet/zcode/packages/desktop/src/main/browserView/browserGuestManager.ts:969),
[current-guest checks](/Users/lullwen/Documents/天工/.fleet/zcode/packages/desktop/src/main/browserView/browserGuestManager.ts:1460)
and [screenshot surface coordinator](/Users/lullwen/Documents/天工/.fleet/zcode/packages/desktop/src/main/browserView/browserScreenshotSurfaceCoordinator.ts:210).
Request, browser generation, window/Session, guest handle and invalidation lease must
remain attached across wait/capture/release; closing one participant must not destroy
a replacement. Timeout/local abort is not evidence that page execution or an OS
effect stopped. Native browser/Computer Use supplements remain separate scoped work
until Root's complete acceptance; no runtime success is inferred from these links.

Artifact identity is similarly scoped. MiniMax's content-hash reference snapshot
prevents source replacement from changing old generated inputs; its Canvas receipt
distinguishes layout from resource bytes. ZCode's F03 journal/version identity and
F10 native file hash/checkpoint already supply the corresponding owners. Preserve
version/service/workspace/operation identity and explicit unavailable-vs-empty state;
do not introduce an editable artifact store behind a preview or a global asset owner
behind a currently active Session.

## Pending corrections and acceptance priorities

The new corrections are authorized in the existing
[completion packet](/Users/lullwen/Documents/天工/docs/agent-packets/zcode-product-completion.md:665).
They are **underway, not final accepted source**, and this audit claims no new test,
typecheck, packaged-build, rendered-use or `usable` result.

- **Plugin definitions/publication:** ZC-F01 established a real enabled-config write
  followed by lost ACK/abort, then old UI rollback and skipped definitions refresh.
  The delegated repair observes canonical facts without replay and distinguishes
  operation success from observed change. Independent review additionally found
  success-ACK plus read-failure rollback, normal-read generation revocation and
  overlapping mutation/busy-owner gaps. Current authorization retains known ACK and
  known absence separately from failed observation, refuses overlapping mutations,
  and preserves service/epoch/ABA fences. Existing [Backend boundary](/Users/lullwen/Documents/天工/.fleet/zcode/apps/zcode-cli/packages/bootstrap/src/zcode-protocol/plugins-query-handlers.ts:66)
  remains nonrollbackable after IO; [original enabled projection](/Users/lullwen/Documents/天工/.fleet/zcode/packages/ui/src/store/pluginManagementStoreEnabled.ts:32)
  and Browser/Plugins/Computer Use consumers remain the bounded owners. Root final
  acceptance must include their original draft/Skill publication, not merely a switch.
- **Skill read ownership:** the original SkillStore has late read publication and
  path/provider-only dedupe gaps. The delegated generation/service/ABA correction
  retains that store; reported small fixture progress is not whole-product acceptance.
- **Workflow Cancel/Resume:** ZC-F02 exposes uncaught transport rejection and lost
  action correlation at the original [WorkflowRunSidePane](/Users/lullwen/Documents/天工/.fleet/zcode/packages/ui/src/app-shell/WorkflowRunSidePane.tsx:212).
  The delegated repair retains original command/client/Session/run/scope identity in
  existing pending-command machinery and uses query-only reconciliation. Accepted ACK
  proves receipt, not Stop completion or resumed-run visibility. Unknown Resume must
  not be replayed; original run projection/journal sequence closes the loop. Root
  records an actual cold Host fixture: after one Resume and shutdown/reopen, the
  original command key queries `unknown` although the original journal preserves
  the resumed run. Independent review also found that an already retained accepted
  receipt could never clear after Host epoch/revision reset under the interim
  projection predicate. The selected repair persists **only Cancel/Resume's actual
  final merged accepted ACK before reply**, preserving `revisionAtDecision`, through
  the existing Core Host `recordPersistentCommandFact`, SessionStore timeline/index
  and original bridge. No new receipt store, wire or Session schema is selected.
  Failure publishing that receipt after an engine effect remains uncertain and
  cannot authorize another launch. A private current accepted-observation
  epoch/revision is permitted only after a positive same-key query in the current
  scope; cross-epoch effect confirmation uses that observation plus the original
  monotonic journal sequence/action state, never old-versus-new process revision
  arithmetic. A same-state Resume additionally requires a positive original
  `run-started` fact after the issued journal sequence; ACK alone cannot explain
  that ABA. Unknown, missing-run and unexplained ABA remain locked against replay.
  This direction and its cold-query/duplicate/storage-failure acceptance are
  still in progress; no final acceptance is claimed here.

Reusable acceptance mechanisms are: transactional receipt plus canonical readback;
exact inflight identity at cleanup; version checks before and after waits; explicit
safe rejection versus uncertain accepted effect; and committed configuration versus
runtime definition publication. MiniMax's swallowed restart errors, Trae's ignored
native false result, optimistic pre-revert history removal and fixed-delay browser
suspension are reference defects/boundaries, not patterns to adopt.

Approved OSS mechanism checks in the ZCode evidence provide narrower support:
AionUi `6744099b279b991c17e31c243f0920477bd31cb6` uses realpath containment for Skill
file reads; open-design `424f5c68cc8967d6732a09aead15b0514986095c` separates restart
interruption, terminal reconciliation and pre-effect retry eligibility. These are
mechanism comparisons, not dependency/source-copy promotions.

Future cross-session ArtifactRef library, semantic index, general external job host,
dedicated task-worktree UX, infinite spatial canvas and native media/Office editors
remain outside these exposed ZCode owners. Rich reference UI, symbols or transport
methods do not implement those promises. Historical gates remain Locked; subsequent
implementation requires a concrete current-owner counterexample and bounded Lead
delegation, followed by actual acceptance evidence.


## Root integration and final verification

The pending corrections above were integrated into `cf093a502306c32e30d2a44d8df5756c7733c04c`
(tree `b25de0eb074b10cb5e0e21b5887b9c9552e42aeb`) with patch 0221. This closes the selected
plugin definition-publication, Skill ownership and workflow control-receipt failures in their
original owners. It does not implement the future exposed limits listed above.

Root's complete canonical delivery exits 0: 1914 Node executions, 134 actual desktop-styled cases,
15 renderer invocations, original builds/type gates/lint/architecture and 221-patch clean replay.
The real Host cold query retains the exact accepted control ACK; duplicate submission does not
add an engine incarnation. Write/index failure branches preserve uncertain effects. The original
message identities and data owners remain. Earlier failures are retained and all affected tests
now assert busy refusal, permitted later retry and real context replacement; no checks were waived.

[Acceptance and measured memory limits](../DOCUMENT-READINESS.md) record the exact evidence and
boundaries. This supplements the static analysis, not its closed-software runtime proof. Native
manual UI acceptance of these new paths was not performed, so their capability status remains
`wired but not visually checked`; no blanket Ready or proprietary durability guarantee follows.
