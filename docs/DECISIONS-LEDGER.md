# Decisions Ledger

> **Write Authority:** Only the **Lead** may append entries to this ledger.
> Workers may propose a decision by including a `[DECISION NEEDED]` block in their handoff
> report; the Lead promotes it here after resolution.
>
> **Update Frequency:** A new entry must be added any time a direction changes, a prior
> decision is reversed, or a new architectural constraint is established.
> No decision should be implemented before it appears here.
>
> **Relationship to HUMAN-FEEDBACK-LOG.md:** Human feedback is captured first in
> `HUMAN-FEEDBACK-LOG.md`. If feedback results in a direction change, the Lead promotes it
> to a DECISIONS-LEDGER entry and references the feedback entry ID.
>
> **Data Flow:**
> `Human observation` → `HUMAN-FEEDBACK-LOG.md` (raw, timestamped)
>                     → Lead review
>                     → `DECISIONS-LEDGER.md` (promoted, binding)
>                     → Module specs updated if needed

This file is the promoted decision ledger for active development. It replaces scattered legacy decision tables as the first place to check whether a topic has been decided, reversed, or left pending.

The ledger is deliberately plain. Add new decisions here only after the source is verified. Do not infer approval from a previous agent summary.

> **Date column:** `Added` records when the decision was first promoted to this ledger.
> When a decision is reversed or amended, add an `Amended` note in the Development Effect
> column with the new date. Decisions without a date were promoted during the initial
> ledger bootstrap on 2026-07-08.

## Final Decisions

| ID | Decision | Current Status | Development Effect | Added | Affected Modules | Implementation Files | Wave Effective |
|---|---|---|---|---|---|---|---|
| D1 | Manual editing exists only as an escape hatch. Agent-native structured actions remain the primary path. | Final | Manual UI edits must write through the same action/timeline path agents use. | 2026-07-08 | M03 | `docs/modules/03-internal-action-registry.md` | W1 |
| D2 | Memory is local, partitioned, inspectable, and deletable. | Final | Memory work must preserve the seven partitions and four time layers. Delete is L3. | 2026-07-08 | M10 | `docs/modules/10-memory-context-review.md` | W4 |
| D3 | The first serious product loop is local terminal / CLI Runtime Host. | Final | Build runtime catalog, launcher, terminal surface, evidence, permission, and reports before downstream creative surfaces. | 2026-07-08 | M02 | `docs/modules/02-terminal-cli-runtime/SPEC.md` | W1/W2 |
| D4 | Multiple accounts are legal profiles only. No quota bypass, stealth rotation, or anti-detection behavior. | Final | Profile switching is allowed; evasion product work is not. | 2026-07-08 | M11 | `docs/modules/11-model-routing-cost-ledger.md` | W4 |
| D5 | Auto routing, cache, and Fusion apply only to API/OAuth lanes. Fusion is default off. | Final | Any `cliRuntimeId` lane bypasses model routing/fusion/cache. | 2026-07-08 | M11 | `docs/modules/11-model-routing-cost-ledger.md` | W4 |
| D6 | BrowserPane selection/annotation is a governed evidence input to the creative workflow, not the only starting point. | Final | Briefs, files, generated assets, and browser evidence may all enter the composable workspace. External pages remain evidence-only; no isolated DOM/Figma clone route. Amended 2026-07-09. | 2026-07-08 | M06, M07, M17 | `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md` | W3 |
| D7 | Fleet itself must be agent-native and co-editable. | Final | Human UI and agent tools must share structured actions, permissions, timeline, and rollback. | 2026-07-08 | M03 | `docs/modules/03-internal-action-registry.md` | W1 |
| D8 | Fonts, colors, animation, templates, and media editing belong to the artifact/canvas/video workflow. | Final | Asset provenance, licensing, timeline, and export records are mandatory. | 2026-07-08 | M07 | `docs/modules/07-canvas-design-surface/SPEC.md` | W3 |
| D9 | Context efficiency and external AI review are one center, not scattered buttons. | Final | ProjectPack, conversion, compression, review, reports, and usage must share one pipeline and ledger. | 2026-07-08 | M10 | `docs/modules/10-memory-context-review.md` | W4 |
| D10 | Browser automation extends Craft BrowserPane/CDP/browser_tool. It does not replace the browser stack. | Final | Browser-harness/OpenClaw are behavior references only unless promoted. Stealth browser work is prohibited. | 2026-07-08 | M06 | `docs/modules/06-browser-artifact-surface/SPEC.md` | W3 |
| D11 | Two-layer agent model: Manager Agent and project Agents are separate identities. | Final | Manager Agent coordinates software/memory/settings; project Agents execute project work. No privileged backdoor. | 2026-07-08 | M00 | `docs/modules/00-platform-spine.md` | W1 |
| D12 | Automatic decisions are L0-L3 graded and replayable. | Final | L0/L1 may be automated by rules; L2 needs rule or pre-authorization; L3 always needs explicit confirmation. | 2026-07-08 | M03 | `docs/modules/03-internal-action-registry.md` | W1 |
| D13 | Fleet is an AI work creation platform, not a chat tool. Humans own the top 10% of creative judgment and the bottom 10% of common-sense guardrails; agents execute the middle 80%. | Final | Default workbench plus professional surfaces share project, files, Library, agents, permission, timeline, and ledger. | 2026-07-08 | M00 | `docs/modules/00-platform-spine.md` | W1 |
| D14 | Use native engines per surface with one shared spine. | Final | `DesignAction/Patch` is an envelope, not a universal internal document model. | 2026-07-08 | M07 | `docs/modules/07-canvas-design-surface/SPEC.md` | W3 |
| D15 | Files and Library are separate layers. | Final | Raw workspace files are not Library assets until selected, authorized, indexed, and provenance-tracked. | 2026-07-08 | M05 | `docs/modules/05-files-library-leases.md` | W2 |
| D16 | A session can be an Agent; team chat reuses Craft sessions. | Final | `@` addresses people/agents/sessions/roles; `/` addresses skills/commands/templates. | 2026-07-08 | M00 | `docs/modules/00-platform-spine.md` | W1 |
| D17 | The persistent Manager Agent is global and low-context. | Final | It belongs to the all-sessions layer, not ordinary project chat, and never bypasses permission. | 2026-07-08 | M00 | `docs/modules/00-platform-spine.md` | W1 |
| D18 | Retain the default Craft workbench and add one modular spatial workspace plus native professional editors. | Final | M16 hosts views inside the existing shell. AIGC/jobs are capabilities and projections, not a separate product; browser, design, media, web, and deck documents keep native owners. Amended 2026-07-09. | 2026-07-08 | M07, M08, M16-M19 | `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md` | W2/W3 |
| D19 | Fleet owns the team; CLI owns one run. | Final | `AgentSeat`, `RuntimeLane`, `TeamRun`, Fleet Bridge, and file leases are the cross-runtime spine. | 2026-07-08 | M04 | `docs/modules/04-runtime-lanes-teamrun.md` | W2 |
| D20 | Capability and source-code reuse must pass both license and product-spine gates. | Final | Permissive licenses are not enough. Copy only green-light sources; use adapters or black-box reference for everything else. | 2026-07-08 | All | `docs/REFERENCE-PROJECT-POLICY.md` | W0 |
| D21 | Terminal surface, CLI Runtime lane, and Fleet Bridge/TeamRun are three separate concepts. | Final | Do not collapse human terminal UI, runtime selection, and cross-agent orchestration into one picker or store. | 2026-07-08 | M02, M04 | `docs/modules/02-terminal-cli-runtime/SPEC.md` | W1/W2 |
| D22 | Physical daemon, sandbox, and portal work is M3-conditional, not an early prerequisite. | Final | Build the logical local spine, permissions, leases, and replay first. W1/W2 use the in-product Platform Spine; an independently installed or long-lived daemon requires a later ADR. Amended 2026-07-09 by D38. | 2026-07-08 | M00, M02, M04 | `docs/PROJECT-DIRECTION.md` §18 | W1/W2 |
| D23 | Compliance redlines are product requirements, not optional policy notes. | Final | No quota bypass, anti-detection, stealth automation, token/cookie extraction, unauthorized account automation, or terms-of-service evasion. | 2026-07-08 | All | `AGENTS.md` | W0 |
| D24 | Prefer compatibility/adapters for fast-moving external ecosystems; directly integrate only stable green-light foundations. | Final | Build sidecars/adapters for volatile tools; integrate approved stable engines. | 2026-07-08 | All | `docs/REFERENCE-PROJECT-POLICY.md` | W0 |
| D25 | Capability management is install/loadout/runtime separation. | Final | Agent attention is protected by scoped loadouts, not a global always-on tool pile. | 2026-07-08 | M12 | `docs/modules/12-capability-skill-plugin-system.md` | W4 |
| D26 | Fleet is open/free local software. No Fleet account, login, or subscription business in the active route. | Final | Remove or avoid account/member/upgrade/product-subscription flows for Fleet itself. | 2026-07-08 | M13 | `docs/modules/13-settings-shell-ux.md` | W5 |
| D27-R | Keep and simplify the Craft shell. The spatial canvas is a first-class project surface, not a replacement shell. | Final | UI work starts from the v0.11 Craft shell. M16 is a registration/layout layer inside it; no second workbench. Amended 2026-07-09. | 2026-07-08 | M01, M07, M16 | `docs/modules/16-workbench-panel-platform.md` | W2/W3 |
| D28 | Messaging is retained and governed, not deleted. | Final | Messaging packages/settings need permission and ownership boundaries, not silent removal. Amended 2026-07-09: Messaging is M15, not M14. | 2026-07-08 | M15 | `docs/modules/15-messaging.md` | W5 |
| D29 | Terminal unification should move toward node-pty. | Final | Python PTY is a fallback. Human terminal and agent terminal evidence should converge. | 2026-07-08 | M02 | `docs/modules/02-terminal-cli-runtime/SPEC.md` | W1/W2 |
| D30 | Built-in browser design should follow Codex's control model: explicit browser enablement, open-target behavior, data clearing, screenshot policy, approval policy, site overrides, and a separate high-risk full-CDP developer toggle. | Final | Browser settings must expose these controls without creating a stealth browser, second profile truth, or hidden automation path. | 2026-07-08 | M06 | `docs/modules/06-browser-artifact-surface/SPEC.md` | W3 |
| D31 | Decouple review skills from core agent rules. Core Agent behaviors (identity, honesty, channel detection) live in the base-layer system prompts; heavy checklist quality gating (Gate 0/1/1.5/2) is a decoupled, optional, loadable Skill (apex-omni-review). | Final | Keep base prompt lightweight for performance, load review orchestration on-demand. | 2026-07-08 | M10, M12 | `docs/modules/10-memory-context-review.md` | W4 |
| D32 | Batch API must be implemented as native async/offline Batch endpoints, not platform-level concurrent loops, to save ~50% API cost. | Final | Integrate native OpenAI/Anthropic Batch queues for long-running, large-scale agent tasks with error-isolation, idempotency, and id-mapping. | 2026-07-08 | M11 | `docs/modules/11-model-routing-cost-ledger.md` | W4 |
| D33 | Schema field hardness must match confidence: identity fields are hard-required; semantic judgment fields are optional with an explicit `'uncertain'` enum value; security boundary fields default to most restrictive when absent. Over-constraining a schema forces models to hallucinate compliant values. | Final | Apply M03 §7 structural/semantic validation rules to all structured schemas. Amended cross-reference 2026-07-09. | 2026-07-08 | M03 | `docs/modules/03-internal-action-registry.md` | W1 |
| D34 | JSON Schema / Zod validates structure only. A separate semantic post-validation layer must run after structural validation to catch structurally-valid but semantically-wrong outputs (e.g. wrong security scope, empty evidence refs without low-confidence flag). | Final | Every structured model output pipeline runs two validation stages in sequence: structural then semantic. | 2026-07-08 | M03 | `docs/modules/03-internal-action-registry.md` | W1 |
| D35 | The product must remain continuously extensible. New capabilities and views must register without restructuring the spine. | Final | M12 defines one capability manifest; M03 owns canonical actions; M16 owns view contributions; M07 renders contributed entity cards. Namespace format remains a W0.1 freeze item and is not inferred from dot count. Amended 2026-07-09. | 2026-07-08 | M03, M07, M12, M16 | `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md` | W1-W4 |
| D36 | Local resource limits are product behaviour, not exceptional failure. Queue, suspend, degrade, or hand off visibly when saturated. | Final | M08 owns job back-pressure; M07 suspends live previews; M09 render concurrency begins at one pending benchmark. Exact node/FPS thresholds require evidence and are not frozen from earlier drafts. Amended 2026-07-09. | 2026-07-08 | M07-M09, M16-M19 | `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md` §12 | W2/W3 |
| D37 | Owner feedback is conceptual and non-linear. Technical route selection is Agent responsibility. Agents must not ask the owner for engineering opinions. | Final | OWNER-VOICE.md is the translation layer. Agents extract design intent, select implementation route, and document assumptions. Conflicts with DECISIONS-LEDGER entries are escalated, not silently resolved. See OV-003. | 2026-07-08 | All | `docs/DEVELOPMENT-PROCESS.md` | W0 |
| D38 | W1/W2 run on one logical in-product Platform Spine; a physical daemon is not part of their delivery contract. | Final | The Electron main process owns the terminal host. Runtime lanes use the bounded Fleet Bridge. A future daemon requires a separate ADR before implementation. | 2026-07-09 | M00, M02, M04 | `docs/PROJECT-DIRECTION.md` §18 | W0.1/W1/W2 |
| D39 | Fleet is a modular spatial work operating system inside the retained Craft shell. | Final | The infinite canvas composes and projects project entities; it does not own every native document or replace the shell. | 2026-07-09 | M07, M16 | `docs/adr/0033-composable-workspace-boundary.md` | W0.1/W2/W3 |
| D40 | Human UI, Agent tools, and workflow steps share one capability/action definition and executor. | Final | M12 manifests generate caller projections; all invocations pass M03/M00. No manual Agent-Hook action map or workflow-only permission path. | 2026-07-09 | M00, M03, M12, M17 | `docs/contracts/composable-workspace-contracts.md` | W0.1/W1 |
| D41 | Agent-created workflows are explicit versioned project documents and v1 workflows are finite DAGs. | Final | M17 owns definitions/run correlation; every step invokes M03, long work delegates to M08, and running definitions are immutable. | 2026-07-09 | M04, M08, M17 | `docs/modules/17-composable-workflows.md` | W3A |
| D42 | Workbench panels, surfaces, and inspectors have one registration/layout host. | Final | M16 reuses the Craft shell/preferences, owns view/layout state only, and never owns domain jobs/documents. Agents may reveal views but do not persistently rearrange layouts by default. | 2026-07-09 | M02, M06-M09, M13, M16-M19 | `docs/modules/16-workbench-panel-platform.md` | W2/W3 |
| D43 | OpenPencil is a professional design-module candidate, not the assumed universal canvas host. | Final | M07 requires a spatial renderer spike for custom React cards/typed ports/license/performance. No direct OpenPencil implementation starts from the retired assumption. | 2026-07-09 | M07 | `docs/modules/07-canvas-design-surface/SPEC.md` §13 | W3A |
| D44 | Cross-module handoff uses versioned ArtifactRef envelopes; native owners retain content authority. | Final | M05 resolves exact versions/provenance/sensitivity without a third content store. Fan-out reuses the same version rather than copying bytes silently. | 2026-07-09 | M05, M07-M09, M17-M19 | `docs/modules/05-files-library-leases.md` | W2/W3 |
| D45 | The first modular creative loop is text -> real image job -> ArtifactRef -> canvas result, not all creative editors at once. | Final | This loop must prove human/Agent/workflow parity, approval, durable job reconciliation, file/provenance commit, and restart before web/deck/media fan-out. | 2026-07-09 | M05, M07, M08, M12, M16, M17 | `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md` §11 | W3A |
| D46 | Dynamic presentation uses a native MotionDeck document; PPTX/HTML/video are explicit exports with honest fidelity. | Final | Do not promise complete PowerPoint animation compatibility. Unsupported constructs and viewer verification must be visible. | 2026-07-09 | M19 | `docs/modules/19-presentation-motion-surface.md` | W3B |

## Still Pending Or Conditional

| Topic | Status | Rule |
|---|---|---|
| Physical daemon / sandbox / portal | M3 conditional | Do not build before the main local spine is stable and a real background/offline need appears. |
| Ghost/shadow workspace | Conditional enhancement | File leases and permission come first. Shadow worktrees are later conflict-management tooling. |
| Additional source-code green lights | Requires explicit user approval | MIT/Apache alone is not enough. Update this ledger, `REFERENCE-PROJECT-POLICY.md`, and attribution docs when approved. |
| Spatial renderer dependency | Adapter spike + explicit promotion | `@xyflow/react` is the preferred candidate; tldraw production licensing is not accepted by default. No dependency is frozen yet. |
| Product/internal namespace | W0.1 decision | Do not freeze plugin API keys, storage prefixes, or action namespace rules until the final namespace is recorded. |

## Maintenance

- Add a date and source note when a decision changes.
- If a legacy document conflicts with this ledger, use this ledger and update the conflicting active doc.
- `AGENTS.md` is an execution summary sourced from this ledger and the module specs, not an independent rule universe.
