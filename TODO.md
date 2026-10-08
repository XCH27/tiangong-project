# TODO — development plan and current progress

This file owns the active order and remaining workflow boundaries. Product meaning is in
[Product](docs/product.md); capability status and acceptance IDs are in
[Capabilities](docs/capabilities.md). Historical progress belongs in Git and CHANGELOG.

## Current work — ZCode baseline and model boundary (OV-027)

The active candidate is `.fleet/zcode`. Preserve `app/` and existing data as the retained Craft
branch. Its earlier Craft-only R0/R1 sequence is superseded by OV-027 and later owner instructions.
It must not block authorized candidate work or cause edits to the wrong implementation.

[OV-067](docs/decisions.md#ov-067--implement-and-verify-the-kernel-before-feature-pages-2026-09-29)
puts kernel engineering first. OV-084 selects Pi Agent Core as the default loop executor beneath the
ZCode Host; selecting it does not mean its kernel is complete or accepted. First implement and test
input/run ownership, commit/recovery, permissions, executor boundaries, usage attribution and the
actual model-facing projection. Correct demonstrated context defects before adding plugin breadth. The
first page assistant consumes that verified boundary afterward. Audit remains part of every unit;
critical regressions interrupt it, while unrelated expansion waits.

Reconciliation of the named Claude and Codex histories keeps the kernel as the current repair priority. First close
admission/permission/effect/recovery failures in the Pi and native execution paths; then prove
subscription identity, login and model requests through those paths, including routing the
permitted native executors' effects through Host tools and ordinary-account ChatGPT login. Measure the actual model-facing
projection before claiming lightness. Existing page/default/filter changes are integration work in
progress, not an exit from this gate. Do not expand feature pages, media UI or plugins while these
kernel proofs are incomplete. Preserve the later Terminal access and two-market decisions (OV-103)
while repairing their existing paths; earlier Craft-only or whole-runtime replacement proposals
are historical evidence, not instructions to restart the product. The next complete product proof
remains a contextual page operation and then a native document suite, not a coding-only fork.

### Source-comparison repair order

The [whole-project defect index](docs/references.md#repository-wide-audit-coverage-and-defect-index)
and [design-chain comparison](docs/references.md#active-design-chain-comparison) set these priorities.
The 63 capability dispositions cover breadth; remaining per-path partial/unread, platform and live
proof are explicit in the external evidence. Source coverage is not implementation completion.

The [bounded kernel corrections](docs/references.md#source-backed-kernel-corrections) now preserve
failed file publications and same-revision writes, request child cancellation before receipt I/O,
refuse unknown opaque workflow replay, preserve API bodies/pool-stop/cost metadata, and isolate
catalogue observations from renamed or recreated identities. These repair nine original findings;
they do not close the kernel or promote delivery status. Independent cross-review also corrected
partial-read hashes, per-profile lock partitioning, masked staging errors and complete-Read freshness.

1. Preserve late-tool receipts, resident withdrawal, durable background Stop/acknowledgement
   reconciliation and resume/Stop race fences. Extend proof to generic cold task reconstruction,
   remote termination and platform-specific executor descendants. ACP local process/group teardown
   does not prove Windows process-tree or escaped-group termination; Stop never implies rollback.
2. Keep discovery and inference auth aligned (API-02). Preserve returned-ID observations separately
   from personal model renames; connection deletion clears both exact layers, while recommendation
   restore retains observations. Verify through live permitted provider paths after the local
   fixtures. Per-vendor native network routes (PRI-08) and the cancelled post-login inspection fence
   (PRI-01) are corrected in candidate 0149; the Codex/Claude PAC split still lacks a live proof.
3. Complete compact-summary declaration budgeting and calibrated system/Skill-prefix deltas.
   Preserve the normal-turn final-tool/output-reserve correction, including discovery and cold
   composition, while testing real provider limits. Sparse capacity and estimates remain distinct
   from vendor evidence; non-positive estimated input space still uses the existing recovery path.
4. Complete native request admission/Guide and per-binding parked continuation under the existing
   Session journal. Keep unsupported strategies refused and prove cancellation/version/account scope.
   Prepare account/profile/organization and credential/SSH trust corrections under their existing
   explicit security-boundary checkpoints; do not copy foreign tokens or rebind automatically.
5. Retain every observed physical-call receipt before fallible publication, including memory,
   main/title/workspace/verifier calls and reported API costs (K-03/04, API-06). Reconcile scheduler
   partial settlement (K-06); unknown/failed explicit Goal verification is not accepted completion
   (K-05). Preserve existing compact/result/error recovery that already records before publication.
6. Bind page helpers to actual resource identity and current owner facts; isolate composer keyboard
   ownership. Preserve the corrected same-owner drag/resize containment, shared on-demand Guide
   topic read and existing controls. Reconcile the original specialized configuration diagnostics
   and human topic reader without duplicating the Guide or granting arbitrary file access. Help must
   retain unsubmitted Settings drafts and reuse its identity; old save acknowledgements must not
   replace a newly selected Subagent scope or clear a newer provider-name draft.
7. After kernel closure, expose media query/recovery to human and Agent callers, then prove one
   native DOCX plugin view/operation/save/undo/reopen slice. Add browser evidence promotion through
   existing artifact owners. Complete other domains against these shared seams.

This refines the current order; source inspection and local fixtures are not full delivery or
permission to replace authorities, add dependencies or migrate user data.

### Delivery order

| Order | Complete deliverable | Exit before moving on |
|---|---|---|
| **1 — Active: execution and application kernel** | Map and rectify the production Host → Session command/admission → executor → tool/permission → durable result/usage path. Preserve immutable account/model/effort/Fast bindings; extract the complete-executor boundary and integrate the first native adapter against it. Domain operations and plugin/Job lifecycle contracts must use these same owners. | Save failure cannot publish or execute a new route; queued/retried inputs keep identity; denial/revocation, stop, late events, restart and unknown paid effects have defined outcomes. Native adapter start/tool approval/cancel/resume/usage pass their actual protocol. Existing data remains readable. Kernel decisions are judged against these cases before any cutover. |
| **2 — Feature-page operations and complete generation** | Verify and accept the Model Settings compact assistant's version-checked availability and capacity operations; then extend the same proven path per page. Complete subscription-specific routes and the existing image/video request → artifact → usage path. | Human controls and Agent operations share the writer; drafts and target scope survive concurrent edits. Returned outputs survive stop; no blind paid replay or catalogue-only execution claim. |
| **3 — Trustworthy project and cost views** | Retain the implemented TaskIndex-based membership and model/project/Other cost breakdown. Complete the standalone Project view, standalone-probe accounting, simple membership-value comparison and outcome-aware Agent diagnostics/customization. | Every retained request has one attribution or explicit unknown. Public plan prices are labelled and correctable, never called actual invoices; no allocation/billing-period form returns. Hover/focus views agree with totals and source coverage. |
| **4 — Minimal app-plugin host with one real document suite** | Extend the existing installer/lifecycle with Fleet page/right-tool contributions and shared domain operations. Use a GenOffice open-source DOCX component as the first native human/Agent editing package; then extend the same pattern to XLSX/PPTX and separately declared PDF operations. | Install → Project activation → human edit → Agent edit → undo/save/reopen → disable/update preserves the same document. Import compatible Skills/MCP from real packages; disclose unsupported executable hooks instead of claiming universal compatibility. |
| **5 — Canvas, production media and workflow composition** | Use the existing React Flow dependency for live document/media cards. Connect real domain objects, video/audio jobs and journaled workflows through the already proven operations. | The same artifacts are editable outside and inside the canvas; stopping, hiding or deleting a card does not lose admitted work or source data. Verify rich-card/resource limits and real exported files. |
| **6 — Distribution and broader adapters** | Finish cross-platform packaging, notices, update feed and the scoped remote/IM/plugin-distribution paths. Add providers and executor adapters against the established fixtures. | Each advertised platform/channel/provider works through its real end-to-end path. No capability is promoted from a manifest, screenshot or source test alone. |

Documentation and source reviews accompany these deliveries; they are not an unbounded preliminary
phase. Build independence, credential scope and platform portability are checked from delivery 1,
not postponed until packaging. Retained Craft has both a full-suite execution gap and a clean-clone mismatch between its
committed delta ledger and uncommitted source; its independent CI remains strict. These are
retained-branch findings, not candidate runtime evidence or blockers for unrelated ZCode work. Existing data/migration and production-dependency
checkpoints still apply when an actual operation reaches them.
The candidate's restored full CLI lint currently reports 87 inherited large-file violations.
Refactor those through module boundaries; preserve the strict rule and distinguish this failure
from the passing root gate and behavioral checks.

### Open baseline workflows

This is the coverage checklist for the delivery order above, not a parallel queue.

| Unit | Remaining outcome and closure | Contract |
|---|---|---|
| Connections and subscriptions | Correct single/multi-account login, saved identity, discovery, protocol, default/disabled state, CC Switch deduplication and exact-account requests through restart. Configured is not tested. Keep subscription/API/CLI access distinct; prove each advertised route. Primary personally handles OV-043. Native multi-account needs a real second Claude/Codex sign-in and owner look; `text-foreground-subtle` contrast (3.93:1 Zai Light) awaits a design-system decision. Model catalog: reconcile the default policy and acceptance of the already wired models.dev refresh (external service), per-model ACP reasoning levels, and media transports beyond OpenAI/xAI. From the [community comparison](docs/references.md#account-model-and-invocation-comparison-against-fleet-2026-10-06), Terminal access tab with installed-state detection is wired (candidate 0183, OV-103). Then, in order: live native allowance (`rate_limit_event`, `account/rateLimits/updated`); escalating and model-scoped cooldowns with subscription→API-key backup; user-triggered live connection test; Claude Code/Codex harnesses on Fleet's Anthropic/Responses-compatible connections; keyless local servers; Kimi/OpenCode/CodeBuddy/Copilot/Grok CLI allowance; OS-keychain credential key (PRI-02, security checkpoint); OV-098 route restore (stashed, awaiting the owner's tool permission); Antigravity through Google's official `antigravity-acp` server instead of Fleet's own wire. | [Model connection](docs/modules/models.md#model-connection-correction) |
| Composer and execution | Accept scoped ordinary/Project new-chat defaults and the direct searchable model list; complete automatic evidenced effort, supported Fast, stable model/account intent, queue/guide/stop, retry and restart. Selection changes apply to later input; current work and accepted queued inputs retain their binding. The optional configured Decide path has local Host/receipt proof; complete live/owner acceptance and automatic/staged consumers under the [typed-decision contract](docs/modules/model-decisions.md). | [Models](docs/modules/models.md#new-conversation-model-defaults), [Agent core](docs/modules/agent-core.md#kernel-target-under-ov-036), [Context](docs/modules/context.md) |
| Context and allowance | Original Token ring structure; current model's last served account; independently scoped windows, stale/unknown readings, membership term and account-bound reset. Finish actual source attribution and live failover/restart acceptance. No fabricated weighted quota pool. | [Context meter](docs/modules/context.md#candidate-context-ring-preservation), [quota](docs/modules/context.md#subscription-allowance-acquisition-and-display) |
| Usage and cost | One ledger with request/attempt/account/model/engine/project attribution; cache classes, API price coverage, Other, historical timezone and retention truth. Complete Project view, outcome-aware Agent customization and a simple subscription-value/API-price comparison with correctable sourced plan price. Retired billing-period allocation and the old account price row do not return implicitly. | [Economics register](docs/capabilities.md#intelligence-economics-and-memory), [Context](docs/modules/context.md) |
| Page-local Agent operations | In Model Settings, invoke the compact assistant with the exact target, use a version-checked existing service operation, preserve human drafts and secrets, and refresh the original page from the committed result. Then extend the same proven path per feature. This does not wait for a full runtime rewrite. | [Existing P0 contract](docs/modules/components.md#context-menu-assistance-source-backed-landing-boundary) |
| Media request and reuse | Verify the bounded API image/edit/video receipt path in the built desktop and its live-provider boundary; finish subscription-specific image/video/audio routes, general Job queue/resource/platform proof and vision-bridge tool-result/history/remote cases. Retain the existing stop/reopen, unknown-submission, same-credential, binary output and ledger recovery fixtures. Catalog rows and shared logins do not establish executors or entitlements. | [Media](docs/modules/media.md#candidate-generation-and-recovery-contract) |
| Original interaction parity | Preserve original useful menus, conversation interactions, Board/Pages and model/settings flow. New controls use the selected host's existing primitives. Finish light/dark, zh-Hans/en, keyboard/narrow-window and owner review; complete sticky-group rename, project overflow/context parity and grouped-task common actions through their existing owners. | [Shell](docs/modules/shell.md), [Design](DESIGN.md) |
| Built-in browser | Preserve the current Chromium guest/profile/Agent owner; verify page find, loading stop and native guest actions. Complete extension install/permissions/lifecycle and genuine compatibility proof before advertising Chrome Store support; history/download presentation and governed captures remain separate unfinished paths. | [Browser](docs/modules/browser.md#active-candidate-browser-and-extension-boundary) |
| Plugin and suite foundation | Rectify per [OV-100](docs/decisions.md#ov-100--one-plugin-market-typed-views-two-trust-tiers-2026-10-07), in order: phases (1) one Settings → Plugins page with five views and Market content filters, (2) MCP Registry and Skill-repository catalog sources, (3) per-plugin approval of third-party MCP servers and hooks, (4) plugin views as MCP Apps in the side pane and (5) Agent Plugins 1.0.0 import/export are wired (candidates 0175–0180), owner visual acceptance pending. OV-103 (candidates 0184–0185): a Skill market beside the Plugin market, wired. Open: further app-plugin slots (pages, settings, executors, providers), network/model permissions for app plugins, and the Coding Workbench as a built-in plugin. Then prove one installed package's real UI/tool entry, Project scope, shared human/Agent data, update/disable/restart and data-preserving removal. | [Components](docs/modules/components.md), [Marketplace](docs/modules/marketplace.md) |
| Independence and release | Finish candidate guide/content correctness, branding/profile compatibility, endpoint disposition, third-party notices, update feed and signed platform builds. Keep each retained Craft service finding scoped to its own branch. | [Services](docs/modules/services.md), [Packaging](docs/engineering.md#building-and-packaging) |

### Host and selectable-executor proof

The selected default is Pi Agent Core under the existing Fleet/ZCode Host (OV-084); OV-069 describes the superseded Coding Agent wrapper. The kernel
is more than the model transport: it owns admission, immutable execution identity, the tool and
permission boundary, durable state, cancellation/recovery and usage/artifact attribution. Plugin
and page/domain capabilities consume this boundary. A chosen source base does not close its gaps.

The integrated SDK runs in the existing supervised CLI process with explicit Host tool wrappers
and no automatic external resource loading. Per-input Pi state is private and in-memory; the Host
remains the sole durable conversation writer. Model switches enter Pi only after Host commit.
Permission, streaming, media input, failure, Guide, stop and SQLite reopen now have local integration
coverage. The staged binary additionally checks the actual desktop protocol and process restart.
Live subscriptions, remote execution, platform packaging and native vendor adapters need their own proof.

First verify the actual existing writers and command path. The initial correction covers model
and effort commit-before-publish through runtime admission and the app facade, including write
failure, retry and SQLite reopen. Native executor integration belongs to this stage rather than
being postponed behind new pages. Preserve native continuation state and expose unsupported
features; never put a vendor Agent inside an outer model/tool loop.

Keep the evaluated alternatives as bounded mechanism references. A reproduced unmet contract may
require changing the implementation choice; preserve the same criteria and compare that exact gap.
Do not begin another unrestricted survey or declare a new universal winner from a fixture test.
A replacement owner/dependency or live-data migration reaches its explicit checkpoint only after
reviewable isolated preparation; user data is not changed to make a prototype work.

### Regression coverage and remaining closure

Compare candidate changes with ZCode `29628c9`; keep inherited failures separate from new failures.
The [reconstruction and check instructions](docs/engineering.md#zcode-candidate) own commands,
patches and profile isolation. The register owns statuses; test counts are evidence only.

| Boundary | Required verification |
|---|---|
| Settings → runtime | Save/reopen, stale write, exact provider/account/model, failed discovery retaining the last good catalog, imported route conversion and language-adapted failure |
| Input → execution | Accepted input identity, frozen options/attachments, queue edits and Stop, removed account, late events, restart and remote reconnect |
| Request → statistics | Inclusive cache/reasoning semantics, known/unknown price coverage, request de-duplication, project identity, date boundaries and retained-history limits. Standalone connectivity probes currently bypass usage recording; the Session FK requires a reviewed operation/ledger solution, not a fabricated conversation. |
| Page → domain operation | Correct target/selection, concurrent human edit, credential redaction, shared permission path, durable receipt, view refresh and close/reopen |
| Suite → native artifact | Project exclusion, actual UI and Agent mutation, save/export/reopen fidelity, failed activation, disable during work and data preservation |
| Release | Real installed/built binary, dependencies/notices, updater boundary, isolated user data and supported-platform verification |

## Release ladder

R0–R18 and TE1 remain stable acceptance/dependency identifiers. They describe the product's
integration order, not eighteen simultaneous implementation tasks. The current owner-authorized
baseline work above takes precedence over older Craft-only sequencing. A future dependency is
checked against the selected candidate's real behavior; an inherited Craft path is comparison
material, not a requirement to rebuild the product on Craft.

States: **ACTIVE** = current integration focus; **DEP** = unmet functional dependency;
**GATED** = named evidence/approval prerequisite; **CLOSED** = accepted or explicitly retired.
Capability delivery continues to use the four statuses in the register.

| ID | Outcome | State / prerequisite |
|---|---|---|
| R0 | Rectify and accept the selected product baseline, including current documentation | ACTIVE; current workflow units above |
| R1 | Coherent conversation/Project/Settings interactions, preserving valuable originals | Within R0 where already authorized; broader layout through its own real consumers |
| R2 | Local-first product independence and distributable identity | Required release boundary; use branch-specific endpoint evidence |
| R3 | First accepted research/evidence → deliverable → review/delivery chain | DEP on relevant baseline and independence paths |
| R4 | Shared human/Agent action contract extracted from real mutations | DEP on two real callers; page-local operations are the existing baseline proof, not deferred merely by this label |
| R5 | Versioned artifact handoff, provenance and stale-writer rejection | DEP on a real producer and consumer |
| R6 | Bounded delegation, budgets and task-contract enforcement | DEP on R4/R5 and existing Session/child-run owners |
| R7 | Shared production canvas for native artifacts | DEP on required action/artifact path and minimum registered host; no dependency on advanced docking |
| R8 | Promote a completed chain into a versioned finite workflow | DEP on a real chain and R4/R5; reuse original journaled workflows where applicable |
| R9 | Scoped memory distillation, consolidation and optional curation | GATED by repeated completed work and measured retrieval need |
| R10 | Direct native document/design/web editing and save/reopen | DEP on relevant action/artifact/native-host paths; a preview does not satisfy editing |
| R11 | Cancellable image/media Job and provider receipt/artifact integration | DEP on a real authorized producer; extract the Job seam from that path |
| R12 | Video/audio sequence, captions, preview and render | DEP on the media Job and native sequence operations |
| R13 | Deck/motion editing and honest native/rendered exports | DEP on native document, canvas and render paths; R12 only for consumed video operations |
| R14 | User-owned remote work, Git/PR delivery, messaging and later phone connector | DEP on scoped runtime, permission and recovery; each advertised channel must work end to end |
| R15 | Project-scoped suite foundation, then external distribution/update/revoke | Minimum local registry precedes domain expansion; external distribution needs supply-chain and release evidence |
| R16 | Optional control of specified local apps | DEP on scoped host/target/permission and plugin foundation; no universal Core controller |
| R17 | Explainable model/organization optimization | GATED by accepted-outcome traces; add only a measured improvement |
| R18 | In-window layout foundation, then advanced/native multi-window behavior | Basic host serves first real surfaces; native popout has separate platform/security proof |
| TE1 | Accurate usage/cache/context measurements | Observation may run during baseline work; behavior-changing optimization needs a bounded accepted comparison |

The retained Craft [baseline](docs/modules/baseline.md), [shell](docs/modules/shell.md) and
[service](docs/modules/services.md) records preserve original behavior and unresolved risks.
Their old ACTIVE/DEP wording does not create a second current queue. Feature breadth remains in
[Capabilities](docs/capabilities.md#product-matrix), including formats or platforms still unsupported.

## Slice procedure

1. Resolve the current owner request and module contract; identify the implementation root and
   exact original/reference flow. Apply the [official/vendor ecosystem source intake](docs/engineering.md#source-intake-before-module-implementation) and read existing callers before choosing a new abstraction.
2. Lock the complete outcome, acceptance and non-goals. State which observations are source-only,
   which are executable fixtures and which require actual UI/provider/platform verification.
3. Complete reversible preparation and implementation already authorized. A production dependency,
   new/replaced data/security authority, paid or public effect retains its explicit checkpoint.
4. Verify the complete path and its material failures; update the canonical contract and status.
   Show the running change for owner visual acceptance. Preserve unrelated work and user data.
5. Retire replaced code/docs only after the retained function/data path and incoming links are
   accounted for. Stop when acceptance is met; do not keep optimizing or collecting references.

A user correction changes the relevant criterion; it does not silently cancel all other work.
No worker is dispatched for the current account regression. The primary owns design, integration
and acceptance evidence. Current scope is not permission to reset either implementation tree,
replace a reference pin, expose credentials or publish a release.
