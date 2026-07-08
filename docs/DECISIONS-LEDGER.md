# Decisions Ledger

This file is the promoted decision ledger for active development. It replaces scattered legacy decision tables as the first place to check whether a topic has been decided, reversed, or left pending.

The ledger is deliberately plain. Add new decisions here only after the source is verified. Do not infer approval from a previous agent summary.

## Final Decisions

| ID | Decision | Current Status | Development Effect |
|---|---|---|---|
| D1 | Manual editing exists only as an escape hatch. Agent-native structured actions remain the primary path. | Final | Manual UI edits must write through the same action/timeline path agents use. |
| D2 | Memory is local, partitioned, inspectable, and deletable. | Final | Memory work must preserve the seven partitions and four time layers. Delete is L3. |
| D3 | The first serious product loop is local terminal / CLI Runtime Host. | Final | Build runtime catalog, launcher, terminal surface, evidence, permission, and reports before downstream creative surfaces. |
| D4 | Multiple accounts are legal profiles only. No quota bypass, stealth rotation, or anti-detection behavior. | Final | Profile switching is allowed; evasion product work is not. |
| D5 | Auto routing, cache, and Fusion apply only to API/OAuth lanes. Fusion is default off. | Final | Any `cliRuntimeId` lane bypasses model routing/fusion/cache. |
| D6 | The design workflow starts from BrowserPane selection/annotation and artifact handoff. | Final | Do not create an isolated Figma clone page before BrowserPane evidence and artifact workflow are real. |
| D7 | Fleet itself must be agent-native and co-editable. | Final | Human UI and agent tools must share structured actions, permissions, timeline, and rollback. |
| D8 | Fonts, colors, animation, templates, and media editing belong to the artifact/canvas/video workflow. | Final | Asset provenance, licensing, timeline, and export records are mandatory. |
| D9 | Context efficiency and external AI review are one center, not scattered buttons. | Final | ProjectPack, conversion, compression, review, reports, and usage must share one pipeline and ledger. |
| D10 | Browser automation extends Craft BrowserPane/CDP/browser_tool. It does not replace the browser stack. | Final | Browser-harness/OpenClaw are behavior references only unless promoted. Stealth browser work is prohibited. |
| D11 | Two-layer agent model: Manager Agent and project Agents are separate identities. | Final | Manager Agent coordinates software/memory/settings; project Agents execute project work. No privileged backdoor. |
| D12 | Automatic decisions are L0-L3 graded and replayable. | Final | L0/L1 may be automated by rules; L2 needs rule or pre-authorization; L3 always needs explicit confirmation. |
| D13 | Fleet is an AI work creation platform, not a chat tool. Humans own the top 10% of creative judgment and the bottom 10% of common-sense guardrails; agents execute the middle 80%. | Final | Default workbench plus professional surfaces share project, files, Library, agents, permission, timeline, and ledger. |
| D14 | Use native engines per surface with one shared spine. | Final | `DesignAction/Patch` is an envelope, not a universal internal document model. |
| D15 | Files and Library are separate layers. | Final | Raw workspace files are not Library assets until selected, authorized, indexed, and provenance-tracked. |
| D16 | A session can be an Agent; team chat reuses Craft sessions. | Final | `@` addresses people/agents/sessions/roles; `/` addresses skills/commands/templates. |
| D17 | The persistent Manager Agent is global and low-context. | Final | It belongs to the all-sessions layer, not ordinary project chat, and never bypasses permission. |
| D18 | Default workbench plus four professional surfaces. | Final | Infinite canvas, AIGC, web/document, and video are surfaces, not separate apps. |
| D19 | Fleet owns the team; CLI owns one run. | Final | `AgentSeat`, `RuntimeLane`, `TeamRun`, Fleet Bridge, and file leases are the cross-runtime spine. |
| D20 | Capability and source-code reuse must pass both license and product-spine gates. | Final | Permissive licenses are not enough. Copy only green-light sources; use adapters or black-box reference for everything else. |
| D21 | Terminal surface, CLI Runtime lane, and Fleet Bridge/TeamRun are three separate concepts. | Final | Do not collapse human terminal UI, runtime selection, and cross-agent orchestration into one picker or store. |
| D22 | Physical daemon, sandbox, and portal work is M3-conditional, not an early prerequisite. | Final | Build logical local spine, permissions, leases, and replay first; add background/sandbox infrastructure only when a real need appears. |
| D23 | Compliance redlines are product requirements, not optional policy notes. | Final | No quota bypass, anti-detection, stealth automation, token/cookie extraction, unauthorized account automation, or terms-of-service evasion. |
| D24 | Prefer compatibility/adapters for fast-moving external ecosystems; directly integrate only stable green-light foundations. | Final | Build sidecars/adapters for volatile tools; integrate approved stable engines. |
| D25 | Capability management is install/loadout/runtime separation. | Final | Agent attention is protected by scoped loadouts, not a global always-on tool pile. |
| D26 | Fleet is open/free local software. No Fleet account, login, or subscription business in the active route. | Final | Remove or avoid account/member/upgrade/product-subscription flows for Fleet itself. |
| D27-R | Keep and simplify the Craft shell. Add canvas as a professional surface; do not build a new default shell. | Final | UI work starts from Craft's original shell, tokens, and settings framework. |
| D28 | Messaging is retained and governed, not deleted. | Final | Messaging packages/settings need permission and ownership boundaries, not silent removal. |
| D29 | Terminal unification should move toward node-pty. | Final | Python PTY is a fallback. Human terminal and agent terminal evidence should converge. |
| D30 | Built-in browser design should follow Codex's control model: explicit browser enablement, open-target behavior, data clearing, screenshot policy, approval policy, site overrides, and a separate high-risk full-CDP developer toggle. | Final | Browser settings must expose these controls without creating a stealth browser, second profile truth, or hidden automation path. |
| D31 | Decouple review skills from core agent rules. Core Agent behaviors (identity, honesty, channel detection) live in the base-layer system prompts; heavy checklist quality gating (Gate 0/1/1.5/2) is a decoupled, optional, loadable Skill (apex-omni-review). | Final | Keep base prompt lightweight for performance, load review orchestration on-demand. |
| D32 | Batch API must be implemented as native async/offline Batch endpoints, not platform-level concurrent loops, to save ~50% API cost. | Final | Integrate native OpenAI/Anthropic Batch queues for long-running, large-scale agent tasks with error-isolation, idempotency, and id-mapping. |
| D33 | Schema field hardness must match confidence: identity fields are hard-required; semantic judgment fields are optional with an explicit `'uncertain'` enum value; security boundary fields default to most restrictive when absent. Over-constraining a schema forces models to hallucinate compliant values. | Final | Apply §8.1–8.5 of Module 03 to all Zod schemas across Fleet. |
| D34 | JSON Schema / Zod validates structure only. A separate semantic post-validation layer must run after structural validation to catch structurally-valid but semantically-wrong outputs (e.g. wrong security scope, empty evidence refs without low-confidence flag). | Final | Every structured model output pipeline runs two validation stages in sequence: structural then semantic. |

## Still Pending Or Conditional

| Topic | Status | Rule |
|---|---|---|
| Physical daemon / sandbox / portal | M3 conditional | Do not build before the main local spine is stable and a real background/offline need appears. |
| Ghost/shadow workspace | Conditional enhancement | File leases and permission come first. Shadow worktrees are later conflict-management tooling. |
| Additional source-code green lights | Requires explicit user approval | MIT/Apache alone is not enough. Update this ledger, `REFERENCE-PROJECT-POLICY.md`, and attribution docs when approved. |

## Maintenance

- Add a date and source note when a decision changes.
- If a legacy document conflicts with this ledger, use this ledger and update the conflicting active doc.
- `AGENTS.md` is an execution summary sourced from this ledger and the module specs, not an independent rule universe.
