# Documentation Readiness

> **SUPERSEDED 2026-10-10 (D56) for product gating:** an incomplete Craft v0.11 migration does not block the ZCode product path. This file stays a spec-maturity register. It does not mark Ready or `usable`.

> **Authority:** documentation-maturity register for this spine
> **Updated:** 2026-07-09; product-baseline note 2026-10-10 (D56)
> **Scope:** documentation only; no capability status is promoted by this file

## 1. Three Independent Axes

Do not collapse product status, execution permission, and specification quality.

| Axis | Allowed values | Meaning |
|---|---|---|
| capability status | `not implemented`, `display-only`, `wired but not visually checked`, `usable` | what the real product currently does |
| execution gate | `Locked`, `Ready`, `In Progress`, `Blocked` | whether a Worker may start/continue the assigned slice |
| spec maturity | `concept`, `contract draft`, `execution-ready` | whether the document can support implementation without invention |

`Blocked` is not a capability status. `Locked` is not proof that a spec is complete. A module may
be `not implemented`, `Locked`, and `contract draft` simultaneously.

## 2. Spec Maturity Rules

### `concept`

Purpose/direction exists, but one or more of the following is missing: state authority, field-level
contracts, actions, error/recovery, dependency contracts, exact acceptance procedure, or evidence
for the selected adapter.

### `contract draft`

The module has a coherent boundary, data/action/state proposal, failure paths, and verification
procedure. Shared contracts, implementation baseline, dependency behaviour, or exact file/adapter
mapping still requires Lead freeze/evidence. Workers must not implement it.

### `execution-ready`

All of the following are true:

1. binding decisions and canonical contract versions are frozen;
2. state authority and persistence/recovery are unambiguous;
3. field-level inputs, outputs, actions, errors, permissions, undo/cancel, and events are defined;
4. dependency contracts and gate versions are satisfied;
5. the current v0.11 implementation paths/extension points have been inspected and recorded;
6. selected external engine/library version and license are verified;
7. a finite packet names exact allowed files and one complete user-visible loop;
8. acceptance can be performed on real behaviour without guessing.

No active module on this Craft spine is `execution-ready`. That is a spec-maturity note. It does
not make W0.1 Craft migration the product gate. The product path is the ZCode candidate (D56).
This register does not mark Ready or `usable`.

## 3. Current Module Register

| Module | Spec maturity | Primary blocking evidence/decision |
|---|---|---|
| M00 Platform Spine | contract draft | logical persistence stance recorded (D54); physical-store gate still open (`docs/audits/2026-10-10-w01-exit5-persistence-authority.md`); AgentSeat/event/caller recorded as partial in `docs/audits/2026-10-10-w01-exit3-canonical-parity.md` and not re-frozen; transaction/recovery parity |
| M01 Clean Baseline | contract draft | behaviour ledger started (`docs/audits/2026-10-10-w01-v011-baseline-blk001.md`); Mac source tree recorded (`docs/audits/2026-10-10-w01-exit1-mac-checkout.md`); `typecheck:all` failed (exit 2); Electron launch and relaunch recorded (`docs/audits/2026-10-10-w01-exit1-electron-launch.md`); RPC project create, session turn, and `browser-pane:create` recorded (`docs/audits/2026-10-10-w01-exit1-rpc-loop.md`); `route=board` and `route=settings` restores recorded, not an AX or menu click (`docs/audits/2026-10-10-w01-exit1-routes-migration.md`); branch `fleet/migration-from-v0.11.0` open, adapt ports not started, `app/` still 0.10.5; `typecheck:all` still the #52 failure; Exit item 1 stays open; fleet-old rows still missing |
| M02 Terminal/CLI | contract draft | runtime discovery, host/process/PTY paths and real commands unverified on v0.11 |
| M03 Action Registry | contract draft | action-id policy columns frozen at 1.3.0 (D47–D49); caller, idempotency, revision, and typed-event envelopes not frozen (`docs/audits/2026-10-10-w01-exit3-canonical-parity.md`) |
| M04 Runtime Lanes/TeamRun | contract draft | TaskRun/TeamRun authority and W2-only dependency boundary need reconciliation |
| M05 Files/Library/ArtifactRef | contract draft | canonical workspace store and lease limits not frozen; ArtifactRef stays proposed and version-gated (D53); W2 M05 may not consume it until a later freeze |
| M06 Browser Evidence | contract draft | WebContentsView selection-overlay/lifecycle spike and setting/action contracts missing |
| M07 Spatial Canvas | contract draft | spatial renderer/license spike open (BLK-003); SpatialDocument stays proposed and version-gated (D53); W3A M07 may not consume it; historical CanvasDocument is not the spatial contract |
| M08 External Jobs | contract draft | ExternalJob draft is version-gated (D53), not frozen; W2 M08 may not consume it; real provider still missing |
| M09 Media Composition | contract draft | native media/render adapter, codec/license/platform decision and benchmark missing |
| M10 Memory/Context | contract draft | physical store/index adapter, delete/isolation proof, and canonical schemas missing |
| M11 Routing/Cost | contract draft | W2 usage core versus W4 routing split, provider facts, and persistence boundary unresolved |
| M12 Capability System | contract draft | capability manifest stays proposed and version-gated (D53); W1 M12 may not consume it; D50 namespace strings are not this schema; external distribution remains concept |
| M13 Settings/Preferences | concept | full IA, canonical preference keys/migrations, and risk classes missing; M16 boundary is now defined |
| M14 Onboarding | contract draft | canonical v0.11 startup routes/preference keys and real diagnostics missing |
| M15 Messaging | contract draft | canonical secrets/session route, one bridge adapter, provider retention/terms evidence missing |
| M16 Panel Platform | contract draft | v0.11 shell primitive inspection still open; ViewContribution, ViewInstance, and LayoutSnapshot stay proposed and version-gated (D53); W2 M16 host may not consume them |
| M17 Composable Workflows | contract draft | WorkflowDefinition and WorkflowRun stay proposed and version-gated (D53); W3A M17 may not consume them; TaskRun relationship and workflow action ids stay unfrozen |
| M18 Web Artifact | contract draft | real local project/build/preview adapter and action schemas missing |
| M19 Presentation/Motion | contract draft | native deck/PPTX/HTML/render adapter and fidelity evidence missing |

## 4. Immediate P0 Documentation Work

These items are the historical Craft-spine documentation list. D56 supersedes them as product gates. They do not authorize Craft migration as the delivery path. They do not mark `usable` or Ready.

1. The clean Craft Agents v0.11 migration ledger stays a historical audit. Retained extension points are not a product-host selection.
2. Re-freeze one canonical W0.1 contract covering caller provenance, idempotency, document
   revisions, and typed event payloads. Those fields stay partial (Exit 3). ArtifactRef, the
   capability manifest, workflow, ExternalJob, spatial, and view contribution are version-gated
   by D53 and stay proposed. They are not part of this re-freeze and are not in
   `CONTRACT_VERSION` 1.3.0. Orthogonal action-id policy columns are already frozen at 1.3.0.
   The Exit 3 note records the open fields and does not bump `CONTRACT_VERSION`. Exit item 4
   stays open.
3. Physical persistence: D54 records the logical authority map as the Lead stance and retains
   the Craft file layouts. SQLite is not decided. The physical-store gate stays open until
   Mac-verified recovery. Exit item 5 stays open. Detail:
   `docs/audits/2026-10-10-w01-exit5-persistence-authority.md`. Active docs must not assume a
   SQLite authority.
4. Craft-spine wave notes and the historical upstream pin stay audit (D56). They do not block the ZCode product path. Ownership precedence for the paths D55 lists is recorded in `docs/audits/2026-10-10-w01-exit7-ownership-domains.md`. Exit item 7 stays open as audit because no-path holds and unlisted host packages are not packets. Spine W1 stays Locked.
5. Rewrite M10, M13, M14, and M15 before their waves; do not treat file presence as readiness.
6. Complete required engine/adapter spikes before promoting M06/M07/M09/M16/M18/M19.

## 5. First Documentation-to-Product Promotion Order

```text
Historical Craft-spine order only (D56). Not the ZCode product path.
W0.1 contracts and v0.11 migration
-> M00 + M03 + M12 capability core
-> M16 host + M02 + M05
-> M08 job core + M17 workflow core + M07 spatial slice
-> real text-to-image loop
-> M18/M19/M09 fan-out and multi-asset editing
-> intelligence/polish modules after their own spec gates
```

This order does not authorize implementation. The live execution gate remains
`WAVE-MODULE-MAP.md`.

## 6. Fable-5 Evidence Boundary

Fable-5's recommendations were used as review input, not copied as authority. This round confirmed
from documentation that its strongest criticism is valid: many files are interface summaries,
not executable specs. Claims in its reports that depend on source-code inspection were not
independently re-verified in this documentation-only round and are not promoted as facts here.

The following Fable proposals were deliberately not adopted unchanged:

- fixed nine-type canvas node union;
- OpenPencil as the universal React canvas host;
- timeline sequence as a document conflict algorithm;
- `export_selection` as L0 while writing a file;
- one PanelDefinition type for both panels and main surfaces;
- unverified performance numbers and engine command names.


## Existing ZCode corrective slice (D57)

`docs/modules/zcode-kernel-lifecycle.md` is `execution-ready` for ZK-FIX/B,R,S,C,U only:
observed counterexamples, existing owners, immutable input identities, preservation, bounded
termination and proof limits are fixed. The historical Craft specifications stay historical.
This authorizes no new authority, dependency, creative surface or capability promotion.

### D57 local integration evidence — 2026-10-12

Candidate `85efd4aacbb187acc9b41da8a3e77e425879cc65`, source tree
`10f55ae9c07d183a134a54cd561d937c5eba3c2a`, replayed by all 211 ordered patches.
Current-source CLI and desktop builds, root and all 15 CLI package type checks, architecture,
and configured pre-push suites passed (1,429 test executions; overlapping suites are not unique cases).
The staged CLI persisted separate A/B receipts through EOF and two new processes on development
Node 26.3 and existing packaged Node 22.16; no provider input was executed. Current styled Electron
renderer suites passed 32 cases. Heavy process suites run serially after other Kernel cases;
product acknowledgement/termination deadlines and failure assertions were not raised.
Full strict CLI lint remains failing with the same 87 inherited oversized-file errors; the four
new errors and desktop fixture error were corrected without policy waivers. Source/build/fixture
results do not imply signed distribution, live SSH/WSL/Windows/provider proof, whole-product
`usable`, or historical wave readiness. Original user data/profile roots were not migrated.

### D57 direct GUI restart evidence

Isolated review app PID 49971 quit normally; original local Host exited 0 and CLI cleanup
completed. Rebuilt committed desktop reopened as PID 54957. Existing sessions/projects restored;
Memory remained off. Seven saved configuration and canonical Session/message/input/entry facts
had identical before/after hashes. Evidence:
`/Volumes/AIGC/.fleet-tmp/current-agent-review/gui-restart-evidence.json`. No provider turn.

## Existing ZCode plugin-market corrective slice (D58)

`modules/zcode-plugin-market-rectification.md` and the ZP-FIX packet are execution-ready only for
U/T. Four real service/handler/NDJSON counterexamples prove stale post-save projection, stale
detail cache, concealed catalog failure and queued cancellation. Evidence remains external at
`/Volumes/AIGC/.fleet-tmp/plugin-market-audit-sol`; it is not a second product authority.

### D58 local integration evidence — 2026-10-12

Candidate `8c347cb02f4dc9e52c77f71084a9a82f21ef1a97`, source tree
`e76f0601a4944aa5e2e9c693eb3ef2b4761087c1`, reconstructed by 212 ordered patches. Current
root types, architecture (0 violations), root lint (0 errors, 69 inherited warnings), CLI and
desktop builds passed. Fleet-local integration passed 99 test executions: 38 backend/existing,
4 actual child-process cancellation, 57 UI/helper including 34 focused corrective cases.
Actual PluginStorePage/Dialog with shipped CSS passed 8 zh/en cases: source failure, detail
refresh, exact human cancellation identity and Host replacement while the prior add hangs.
The renderer waits for the shipped exit animation before asserting removal; product behavior
was not changed to satisfy a fixture. Independent Sol review verified stale error/optimistic
projection, forced detail, context and cold-loading race corrections.

Heavy new child-process cancellation tests run serially after ordinary backend cases: the first
concurrent invocation had a pre-admission startup timeout; no product deadline/assertion was
raised. The rebuilt staged CLI still persisted separate Session receipts through EOF/new processes
on both development Node 26.3 and packaged Node 22.16. Exact logs remain under
`plugin-market-audit-sol`. Inherited strict CLI oversized-file debt remains a failing release gate.
No live plugin/provider inference, saved-profile migration or whole-product `usable` promotion is
asserted; historical waves stay Locked.

## ZCode product completion (D59)

`modules/zcode-product-completion.md` is execution-ready for Q,C,P,D corrections, with
verified strict CLI debt, workflow response race and actual resident App plugin/decision factory
counterexamples. W is execution-ready for the concrete native JSON/registered tool/original Session
and FS CAS loop selected by Lead in the spec; no spatial framework is promoted. Current
ZCode inventory replaces historical Craft capability labels as evidence, not an automatic promotion.

Q/Desktop is also execution-ready: direct checks exposed that the canonical command omitted
Main/preload/renderer/scheduler. Existing type exports and a declaration derived from the actual
preload API now close those gaps. The canonical command includes all five desktop runtime projects
and tooling; Lead independently executed it successfully. All original strict CLI max-lines
failures are corrected; the actual recursive package-level gate passes without suppressions.
W backend tests cover actual Core/file/broker/SQLite, actual Host RPC and close/cold recovery,
including synchronous reverse-request timer settlement and retry checkpoint anchors. The current
styled pane/close worker uses authored port fixtures. Actual native first Save exposed Workbench
update-depth and terminal-usage correlation defects; both are corrected with real consumer tests.
Effective admitted input now survives hook/permission changes and lost checkpoint publication.
Readonly projection avoids synthetic human turns and permits inspecting intact files despite an
unsafe older checkpoint. Full original Workbench fixtures cover both locales; first-Save successful
ACK and its own Session reveal receive additional regression coverage. Lead's new-build native
save/quit/relaunch, final delivery chain and exact source reconstruction still remain required.
No whole-project `usable` claim.

P-View is execution-ready for the bounded existing plugin-tool bypass correction selected in the
spec/packet. An actual Host and SDK counterexample writes owned data without any Session or
per-call permission/timeline. Original native control/executor/MCP capture owners are reused;
required Session/operation DTOs and parent UI remain Lead-owned, with real permission/withdrawal/
scope/Stop/cold acceptance required. This is not a new generic action endpoint.

C-Handoff is execution-ready for R's read/test continuation of existing workflow/file/artifact/
Session production and restart. It may add bounded actual-consumer fixtures; a reproduced source
defect still requires Lead path acknowledgement. It does not open a new Library database, native
editor, proposed Craft contract or historical wave. The current product inventory remains evidence.

The 2026-10-13 development-memory correction remains within Q. On the owner's 16GB Mac,
the initial app-family RSS sum was 6.37GiB across 12 renderer processes; it includes shared pages
and is not a unique footprint or a leak diagnosis. Current pressure was normal. Recent retained
diagnostics were disk-write notices, not OOM terminations; the earlier delivery interruption still
has no established cause. Current/previous project transcripts are approximately 104/359MiB,
which warrants bounded tool output without deleting history or claiming all records were loaded.

Candidate `8dbfda9851ba06d8c0651ff6ac136bfa2b2b76e8` removes the upstream global 8GiB heap
override, retains explicit caller options, and serializes heavy Node files/recursive package work.
The private renderer harness records code/signal and cleans only its own process tree on failure,
interruption or deadline. Its original internal 20-second deadline and every prior check remain.
Fifteen lightweight real-child/build-entry regressions pass naturally; the previously interrupted
styled decision-source group passes all 12 cases, peaks at 1129MiB aggregate RSS and leaves no
owned processes. Actual adapters compilation into an isolated output directory passes under a
4GiB heap ceiling, with 1285MiB peak RSS. Evidence is under
`/Volumes/AIGC/.fleet-tmp/fleet-horizontal-comparison-2026-10-13/memory-diagnosis/`.
Patch 0215 replays to tree `e19d34f928fde067dd85d70df4f044c3eb8fda7b`. This is measured development
verification; Windows cleanup, a full current delivery rerun and deferred visible product checks
remain separate. No profile, transcript, cache, session or other existing data was cleared/migrated.

The subsequent bounded full run on that exact source is **interrupted, not passing**: its
`test:product-completion` phase peaks at 6.11GiB aggregate owned RSS and 25 processes; the observer
stops only its owned groups at pressure 28%. A stricter single-case trace confirms that official
Node REPL launch repeats `native-plugin-view-host.test.ts __zcode-plugin-host .../server.js`,
which creates another App/MCP instance and recursively repeats. Successive children each approach
700MiB; the guarded single case stops after 6.5 seconds. The launcher incorrectly assumes any
`process.argv[1]` implements the private CLI plugin-host command. Current upstream has the same
assumption. Positive CLI capability admission is the selected original-owner correction, with
legitimate source/generated CLI and SEA acceptance required. This supersedes a diagnosis based
only on outer concurrency; no Codex application leak is asserted. Captures remain in
`memory-diagnosis/confirmed-recursive-launch.json` and `plugin-single-process-trace.json`.

Candidate `a499ba1c16d670ad125dd7b1d7e4e60681915d07` corrects that launcher on its existing
owner. The same actual Host/SDK/SQLite counterexample completes in 0.74 seconds, with 0.92GiB
aggregate process-tree peak and no test-file plugin-host children. Three admission regressions
pass; fresh source/generated/staged CLI declarations are checked, and the actual staged private
dispatcher serves an authored read-only MCP runtime on Node24 and packaged Node22, with normal
EOF exit, isolated HOME and zero model calls. Actual SEA execution is not newly measured.

Current automatic delivery evidence is **composed on one frozen source**: canonical steps 0–4
(fresh CLI, all type gates and complete pre-push checks) pass in `fixed-delivery.log`. A conservative
3.5GiB aggregate-RSS observer interrupts desktop build at normal pressure 69%; that run is not
recorded as a zero-exit full wrapper. Exact canonical steps 5–10 then pass naturally in
`remaining-delivery.log`: desktop build, staged separate-session/EOF/cold recovery, all styled UI
groups and actual strict recursive CLI lint. Combined evidence records 1819 Node test executions
(overlap is possible), 80 styled cases and zero failed assertions. Every process retains a 4GiB
old-space ceiling; remaining-step aggregate RSS peaks at 3779MiB with pressure 65–72%, and all
13 renderer invocations report code 0 / no signal. Patch 0216 reconstructs an untouched base into
tree `1e6e6cf3562f8e9bb88c327cf2a5b27ce386bc39` without changing the main candidate index.
Deferred visible product checks and whole-project `usable` promotion remain open; no baseline,
permission, store, dependency, real profile or existing-data migration is introduced.

### Shipped-artifact comparison and canonical recovery continuation — 2026-10-13

Candidate `c7ec42243485c61375391ecafed478ee12ab78e2`, tree
`b7941b6570a72385fd2710c493435ec5de455753`, is reconstructible from 217 ordered patches in
an untouched base checkout; the original candidate index is unchanged. This continuation fixes
pending decision publication without another physical provider write, uncertain native-login
delivery, and partial plugin install/update projection and consumer refresh. Existing provider,
flow, inventory, Session, permission and artifact owners remain. Focused real provider recovery
tests pass 15/15; native login/service tests pass 27/27; original market Node tests pass 19/19.
The actual Host/SessionDataLayer/ToolExecutor/permission approval proof preserves later drawing
while saving its submitted snapshot and still requires the original close confirmation. Original
rows across all 23 retained review database tables are unchanged before the next visible review.

An actual server CLI build succeeded but its compiled ESM entry crashed on bundled CJS
`require("fs")`. The original shared banner now uses module-relative `createRequire`; both
compiled read-only status probes exit 0 on development Node24 and packaged Node22, from an
isolated root with no service registration or data creation. Canonical delivery now rebuilds and
executes that actual server entry. Source checks alone had missed this defect.

The full `ea3bf89` invocation fails honestly at the native login owner's 400-line lint limit,
with no memory cutoff. A same-owner stateless-helper extraction closes that error without a
waiver. The later `c7ec422` invocation is **operator-interrupted, not passing** (exit -15):
cross-review finds deterministic pre-writer/locked-CAS rejection classified as an unknown account
write, preventing Cancel. Root stops only its owned process groups and delegates a typed no-effect
correction under the packet. Its peak aggregate owned RSS is 2963MiB, pressure 41–58%; no
recursive launcher or OOM is observed. Logs and the interruption reason remain under
`/Volumes/AIGC/.fleet-tmp/fleet-horizontal-comparison-2026-10-13/recovery-final/`.
Final corrected-source delivery and actual first empty-Session Save/close/restart are still open.

Comparison now reads shipped implementation, not just UI or announcements. Installed MiniMax
Design is 3.0.21/build 3.0.21.85; its 51MB ASAR is statically extracted and main/preload/renderer
producer-consumer paths traced. Installed Trae is IDE 3.6.2, with proprietary chat bundles,
native IPC/library metadata and a bounded 120-byte ARM64 `_BP_GetInterface` disassembly. It is
not proof of an independently installed SOLO/TraeWork. Artifact digests, byte offsets, static
branches and unknowns remain in `reverse-artifacts`, `reverse-minimax` and `reverse-trae` beside
the run evidence. REA's latest cloned workflow/source is consulted; absent CLI/dist/connected
tools are reported, and ordinary static results are never called REA Evidence records.

MiniMax's persisted-versus-runtime publication and guarded checkpoint mechanisms, and Trae's
staged context publication/current MCP membership and old-process replacement checks, guide
existing-owner counterexamples. Reference code also swallows some failures; no blanket correctness
is assumed. Gateway authorization, proprietary database transactions and cold crash durability
remain unknown. Installer hashes/metadata are retained; read-only mounting is denied by the OS,
so equality of installer members to installed apps is not claimed. No closed source/assets are
copied into the product, and no user credential/profile/database or target program is executed
for this static analysis. Capabilities remain `wired but not visually checked` where visible
acceptance is pending; no whole-project `usable` promotion or historical wave opening.

The subsequent candidate `c0a5c421` (patch 0218, tree
`68ebb1af4d61fb75c4cb6a9a841b908c26a4b163`) corrects deterministic native-login rejection.
Only Facade preparation before target invocation, or the original locked synchronous transform,
can carry the typed zero-account-write proof. IO/atomic publication/refresh stay outside those
catch boundaries. Real preflight and second-repository CAS cases turn red to green, with an
actual repository-IO refusal still retaining its unknown home; all 24 login cases pass. An
independent Sol reader verifies the capture boundaries before integration.

Two complete-wrapper attempts on that source remain interrupted. The percentage-only observer
stops at free 37% without recording the contemporaneous kernel level; that cannot establish OOM
or a normal state at that instant. A corrected observer captures an actual Warning mask at
root typecheck, so that invocation is also stopped and never counted as passing. Apple's
[sysctl handler](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/kern/kern_memorystatus_notify.c)
converts the internal enum to dispatch masks; the public Normal/Warning/Critical values are
1/2/4, as defined in
[event_private.h](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/sys/event_private.h).
The separate encodings and original captures remain in `memory-diagnosis`.

Candidate `7e743abac1f00c847547d00816fc5026749bb9af` (patch 0219, tree
`ebca395799e10e22ec8b35193a31197bea6ddf0a`) bounds compiler graph lifetime by running the exact
original 16 root projects in separate sequential processes. Real-child regressions verify
independent PIDs, argument/environment preservation and fail-fast behavior; no project or TS
setting is dropped. Fresh reconstruction of all 219 patches matches that tree and leaves the
main index unchanged. The current complete wrapper uses an explicit **2GiB per-process heap
ceiling**, lower than previous attempts. It records advisory Warning honestly; Critical/unknown
mask or 512MiB swap growth within 30 seconds under Warning aborts its owned tree and fails.
This changes external observation, not any assertion, deadline or required stage. Other user
jobs and apps are untouched. All 16 root checks and subsequent strict CLI type checks pass;
final whole-wrapper and visible product results remain pending until their actual completion.

The 2GiB full invocation on `7e743ab` reaches the final native-CLI styled group and exits 1
on a stale assertion requiring the former "built-in executor" wording. This is **not a passing
wrapper**; its real exit and all logs remain in `recovery-bounded-2g`. Root keeps the corrected
app-provided CLI copy and verifies the missing-CLI recovery in both languages, with raw ENOENT
and unintended model-editor checks retained. That entire native group then exits 0, and the
remaining actual strict CLI lint exits 0; this bounded evidence remains distinct from a full
zero-exit wrapper. Peak aggregate owned RSS is 2727MiB, no Critical mask or rapid-swap cutoff.

An actual fresh empty review shows an additional discoverability defect: the empty side pane
has Review/Terminal/Browser but no Whiteboard, even though the later add-tab menu already offers
it. Candidate `2cda91840263afe99b87095f71e64a44b702283f` (patch 0220, tree
`6d6fe24d0bf8d5881b7449fef977984b486a4923`) adds the same existing action to that chooser.
The full-shell fixture now enters through the empty whiteboard card before drawing/Save, checks
both locales and forbids premature Session/model/native commands. Root's read-only review exits
normally with Host cleanup code 0; all original rows across 23 tables remain unchanged, with
15 sessions and 36 model-usage rows. Fresh reconstruction of 220 patches matches the exact tree
and leaves the original index unchanged. A complete current-source rerun and actual new-build
first-Save/close/cold recovery are in progress; no earlier interruption or failure is relabeled.
