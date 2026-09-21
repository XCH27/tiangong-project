# 10 — Glossary

> Project vocabulary with exact meanings. If a term here is used loosely in another document, this
> definition wins.

## Terminology rules

- Use one English term for one concept. Do not add a Chinese alias in headings, table labels or
  prose merely for emphasis.
- Preserve established code/product terms (`Session`, `TaskRunner`, `BrowserPane`, `Workspace`,
  `ArtifactRef`, `TaskBrief`, `RunReport`) exactly; do not translate identifiers.
- Use **module** for a coherent interface plus implementation, **interface** for everything callers
  must know, **seam** for the extension location, and **adapter** for an implementation at a seam.
  Use **bounded context** only for domain ownership, not as a synonym for seam.
- Use **authority** only for the single owner of durable truth, and **projection** only for a derived
  non-authoritative view.
- Use **provider backend** for Craft's Claude/Pi model integration, **agent lane** for a selected
  provider/runtime route, and **harness** for the model-facing prompt/tool/context/call loop. These
  are not interchangeable.
- Preserve third-party names and license identifiers exactly. On first mention, an untranslated
  proper name may carry one English gloss in parentheses.

| Term | Meaning here |
|---|---|
| **Authority** | The single component/store that owns a state class (sessions, permissions, tasks…). "Never create a second authority" = never a competing owner for the same state. |
| **Seam** | An existing code boundary where behavior can be extended without duplicating the authority behind it (e.g. `PreToolUse` is the Agent permission seam). |
| **Interface** | Everything a caller must know to use a module correctly: operations, invariants, ordering, errors, configuration and relevant performance behavior. It is broader than a type signature. |
| **Adapter** | A concrete implementation at a seam, especially for an external runtime, transport or renderer. An adapter never becomes the authority behind the interface. |
| **Spine** | The shared set of authorities every surface routes through: session + permission + identity + caller-aware action interface + timeline + files/artifacts + cost. |
| **Action seam / governed action** | The target contract where human UI and Agent tool calls converge on one validator, policy evaluation, executor, state authority, and evidence trail ([`specs/R4-action-seam.md`](specs/R4-action-seam.md)). |
| **Caller-aware** | Policy and evidence know *who* invoked (human UI / agent / workflow) and may decide differently per caller — while sharing one executor. |
| **Closed loop** | A capability whose entry → behavior → state → evidence → error/recovery → caller-visible result all exist and were verified together. The completion contract is [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) §5. |
| **System suite** | A large independently deliverable closed loop that combines multiple registry rows and bounded contexts behind shared contracts; it groups delivery ownership but never creates a new state authority (`modules/REGISTRY.md`). |
| **Slice** | The smallest coherent implementation block delivering one observable outcome across all affected layers (UI + logic + state + recovery + docs). |
| **Release (R0…R18)** | A bounded, spec'd, acceptance-tested unit of the complete development order in [`05-ROADMAP.md`](05-ROADMAP.md). Exactly one is ACTIVE (a WIP limit, not a time phase); others are READY, DEP (dependency-blocked), or GATED (named non-time gate). R16–R18 require implementation or evidence-backed `NO_GAP` closure. |
| **Product Matrix** | The breadth authority: every product domain's capabilities, status, gaps, reference projects, backend authority, and acceptance anchor — never trimmed by sequencing ([`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md), Decision G5). |
| **Component** | An installable bounded capability bundle: UI/panels, domain commands, Skills, MCP declarations, defaults, and optional knowledge resources. It consumes Fleet authorities and owns only its native domain. |
| **Workspace Composition** | The workspace-scoped enabled-component set plus explicit configuration overrides, extra MCPs/knowledge sources, personal habits, and layout preferences. It is not a second capability or permission store. |
| **Component default** | A vendor-provided value shipped by a Component. It is immutable package input; user and workspace changes are stored as overrides. |
| **Frontend track** | The standing rule set letting pages be spec'd, mocked behind typed adapters, and built preview-gated ahead of backend behavior, reported `display-only` until wired ([`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) §5, Decision G6). |
| **Preview gate** | The developer/preview toggle behind which unwired pages live; the default user surface never shows controls without real behavior. |
| **Admission grade** | The verdict a reference earns in the single admission ledger [`references/REFERENCE-REGISTRY.md`](references/REFERENCE-REGISTRY.md): `FORMAL_REFERENCE` · `MODULE_REFERENCE` · `LOCAL_IMPROVEMENT` · `EVIDENCE_ONLY` · `REJECT` (`candidate` until audited). Checkout mechanics stay in `源码参考/meta/`. |
| **Reference intake** | The bounded step before designing EXTEND/NEW work: read the matrix row's named reference files/symbols, extract a mechanism list, map each mechanism to its Craft seam (`../AGENTS.md` method step 2). |
| **Orchestration planes** | Execution (who runs work), composition (how capabilities/artifacts chain), command (how the human directs) — one kernel under all three ([`13-ORCHESTRATION.md`](13-ORCHESTRATION.md)). |
| **Staging** | Placing an artifact/evidence reference into an agent's pending brief/composer via canvas gesture — visible, removable, and inert until explicitly sent (never run-by-arrangement). |
| **Workflow promotion** | Explicitly converting a completed chain of reference/input edges into a versioned finite DAG definition — history is never rewritten to pretend it was a workflow ([`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) §4.3). |
| **Duty to dissent** | G1's second half: an agent must state the better technical route, its reasons, and both costs before executing an owner suggestion it believes suboptimal. |
| **Token ROI** | The token-economy metric: cost per *accepted* outcome — never raw tokens per request (`modules/suites/SYS-03-context-economy.md` §5, Decision E12). |
| **Context rot** | The measured non-uniform accuracy drop (often 30–50%) as input context grows, with mid-context information under-attended ("lost in the middle"). The scientific reason leaner context raises capability. |
| **Prefix stability** | Engineering the prompt so system + tool definitions stay byte-identical across turns (three-zone layout), maximizing provider prompt-cache hits — pure cost/latency win (`modules/suites/SYS-03-context-economy.md` L1). |
| **Harness / execution profile** | Harness is the model-facing prompt, tools, context assembly and call loop around a runtime. An execution profile is one measured configuration of that harness (for example Pi-light); it never owns Session, permission, task or cost state (E13). |
| **Effective projection** | The smallest prompt/tool/Skill/Source/environment view for one model call, computed from task need ∩ installed capability ∩ runtime availability ∩ caller policy ∩ live grant. It is a derived view, not an authority (E13). |
| **Spec** | The executable specification for a release: outcome, scope, acceptance criteria with stable IDs, non-goals, verification plan (`specs/`). |
| **Packet state** | Documentation readiness only: `BREADTH_ONLY` · `PACKET_DRAFT` · `READY_FOR_SPEC`. Spec lifecycle and roadmap ACTIVE/READY/DEP/GATED are separate facts ([`modules/PACKET-INDEX.md`](modules/PACKET-INDEX.md)). |
| **REUSE / EXTEND / NEW / CONDITIONAL** | The mandatory classification against Craft's existing capability before building ([`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md)). |
| **Status vocabulary** | `usable` · `wired but not visually checked` · `display-only` · `not implemented` — the only permitted capability statuses (`../AGENTS.md`). |
| **Evidence** | Attributable records of what actually happened: SessionEvents, command output, test results, file versions. Distinct from claims. |
| **Projection** | A derived, non-authoritative view of authoritative state (a Board column, a canvas card, a ProjectDigest). Editing a projection must route through the owning authority. |
| **Artifact / ArtifactRef** | A produced output with identity; ArtifactRef is the smallest versioned reference + provenance envelope over native bytes (Decision D6; roadmap R5). |
| **Provenance** | The recorded chain of what produced/consumed an artifact version, for which purpose. Never inferred from visual arrangement (Decision E5). |
| **WorkTrace** | A disposable projection joining SessionEvents, governed Actions, Jobs and ArtifactRef lineage. It can show `current`, `shadowed`, `log-only`, `partial` and `interrupted` records; it is never a second timeline authority. |
| **Operation / attempt** | An attributed semantic mutation or invocation (`operationId`) and one execution try (`attemptId`). An operation may have multiple attempts; each attempt has exact input versions, output versions or an explicit failure. |
| **Lineage branch** | A new immutable output path created from an earlier operation or ArtifactRef version. Revising a step creates a branch and may mark dependent descendants stale; it never overwrites the old branch. |
| **TaskContract** | The locked, versioned projection of a task for one execution attempt: criteria IDs, allowed/reserved paths, non-goals, budgets (Decision C7). |
| **ContractChangeRequest** | The explicit act of revising a locked contract — ends/pauses the attempt, creates a new version (Decision C7). |
| **TaskBrief / RunReport** | The bounded delegation envelope in and result envelope out for supporting agents (Decision C3; templates in `../AGENTS.md`). |
| **Owner checkpoint** | A decision class the agent must never take alone: money, irreversible/public effects, production dependencies, new/replaced authorities, product forks ([`OWNER-GUIDE.md`](OWNER-GUIDE.md)). |
| **Owner** | The human product owner. States intent in plain language; owns final acceptance and checkpoints. Agents choose technical routes (Decision G1). |
| **Workspace / Project** | Workspace: Craft's backend storage/config/session/permission boundary. Project: Fleet's single user-facing work boundary — one chosen folder — presented over Workspace; never shown beside "workspace" or "local folder" as a parallel concept (Decision P6). New Task globally or on a Project row enters the same Session-backed create flow (P10). |
| **BrowserPane** | Craft's in-app governed browser surface; in Fleet, an evidence-capture input, never a stealth browser (Decision E6). |
| **Native surface / module** | A production surface owning its own document/job model (Markdown editor, video editor…), registering capabilities on the spine instead of becoming a separate app (Decision E4). |
| **Loadout** | The scoped set of capabilities/tools enabled for a given agent/task, narrower than what is installed (Decision E2). It contributes to effective projection but does not replace permission or the governed Action seam. |
| **Agent lane** | A provider/runtime route used by Fleet (local CLI, API, subscription-backed or remote); lanes consume context projections but do not own shared memory or project context. |
| **Upstream intake** | Reviewing official Craft tags/release notes/source to selectively port changes — never merging the upstream tree wholesale (Decision P8). |
| **Design library** | Owner-intent source notes under `docs/design-library/` — input material for slices, never implementation authorization. |
| **Design asset** | A source note in `design-library/` with durable product-design value. It may guide a module but cannot set current scope, order, implementation status or acceptance; reconcile it against code and canonical documents before use. |
| **Vibe Coding** | The owner-directed, agent-executed development mode this project runs on. Its known failure modes and countermeasures are [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) §4. |
