# 03 — Non-Negotiables

> Durable architectural and safety boundaries. Each one is a specific way this product can be
> ruined, learned the hard way. Before any architectural or safety-relevant change, confirm you are
> not crossing one. If an existing authority is genuinely insufficient, say so explicitly and get
> owner sign-off *before* building a parallel one.

## 1. Never create a second authority

Do not create a second:

- session/chat store beside Craft sessions;
- permission or approval path for UI, agents, or workflows;
- memory database or silent shadow memory;
- job, cost, or usage ledger for the same work;
- artifact/file byte store duplicating native owners;
- project/task/workspace authority;
- audit timeline for the same events;
- application shell, workbench, browser stack, or settings home.
- agent harness, prompt/loadout authority, or provider-specific capability policy beside the
  existing Craft/Fleet provider and permission paths.

**Extend the existing authority, or demonstrate why it is insufficient, before replacing it.**
Violating this is how the product fragments into disconnected utilities.

## 2. UI and product

- Do not build a greenfield shell or restore rejected skins when Craft can be simplified/extended.
- Do not add empty docks, panels, settings, routes, dashboards, or placeholder modules to the
  **default surface**. Ahead-of-behavior pages exist only inside the preview-gated frontend track
  (Decision G6): spec'd, mock-behind-adapter, reported `display-only`. Nothing unwired ships
  default-visible.
- Do not make a canvas/panel the authoritative job or native-document store.
- Do not add a second Markdown editor beside the existing Craft TipTap path.
- Do not flatten browser, design, video, deck, and code into one universal editable document model.
- Do not treat external web pages as editable native documents via silent DOM mutation.
- Do not present display-only, mocked, or stub behavior as `usable`.
- Do not ship a UI-only and an agent-only implementation of the same action — converge per
  Decision S1.
- Do not expose backend plumbing as a setting just because a flag exists.
- Do not require, silently call, or visually imply a required Craft-operated account, server, relay,
  viewer, updater, docs site, or MCP endpoint (Decision P8).
- Do not model "cloud" as a Fleet-owned control plane (Decision P9).
- Do not treat a component library or another product's screenshot as license to replace Craft's
  navigation, settings architecture, or product identity wholesale.

## 3. Architecture

- No workflow runner with its own permission/runtime/job systems beside the existing ones.
- No Pi-light, OpenHands, Hermes, OpenClaw or other profile/reference promoted into a second kernel;
  extend one model-facing effective projection and keep every real call on the canonical
  permission/evidence path (E13).
- No Tool Search before static scoped profiles and catalog/recovery measurements prove it necessary;
  discovery never grants or executes.
- No long-lived daemon as an early prerequisite when the Electron main process can own the behavior.
- No independent `jobs.json` / `memory.json` / `clips.json` authority without a demonstrated gap and
  a deliberate migration.
- No silent last-write-wins for concurrent document mutation.
- No external plugin distribution path before built-in capability loading and permissions are real.
- No wholesale copy from the preserved upstream checkout over the working app.
- No visual canvas connector treated as an executable workflow edge, and no connector/card
  position/renderer edge overwriting recorded provenance (Decision E5).
- No Agent, plugin, or workflow mutating renderer state directly — everything goes through the
  shared caller-aware action path; the canvas receives projection updates.
- No spatial renderer promoted from screenshots, marketing claims, or a synthetic empty-node demo
  (Decision E5a).
- No timeline ordering used as a document conflict-resolution algorithm.
- No universal patch format pretending to natively edit DOM, code, design, video, and deck.
- No arbitrary cyclic/general-programming workflow model in the first finite workflow version.
- No promise of full-fidelity animated PowerPoint export the export path cannot prove.
- No executing agent silently rewriting its task, acceptance criteria, evaluator, tests, or harness
  (Decision C7); no verifier editing the implementation it judges (C9); no optional-evidence failure
  promoted into product/infrastructure work (C8); no incidental finding replacing the active
  objective (C10).

## 4. Persistence discipline (the SQLite trigger)

Near-term persistence retains the current Craft-derived filesystem stores under one logical authority (Decision
D2). Introduce SQLite or a control-plane database only when a **concrete, observable engineering
signal** appears — e.g. the first real bug where file-based lease-restart reconciliation or job
idempotency cannot be made atomic on the filesystem. Record the trigger, migration path, and owning
authority in `02-DECISIONS.md`, then migrate. "It would be cleaner" is not a trigger.

### Artifact history (Decisions H1–H4)

- **A snapshot writes git objects and never moves HEAD, the index, a ref, a branch, a tag, or a
  stash.** Loose objects are invisible to `git status`, `git log`, and every UI the user has open,
  and `gc` collects them if abandoned. Anything touching a ref is visible history, and an agent
  silently committing or stashing under a user is the most destructive thing this capability can do
  — which is exactly what "just stash it" produces. The allow-list is explicit and each refusal
  carries its reason in code (`packages/shared/src/git/snapshot-plan.ts`).
- **Do not put media in a git tree, and do not put a canvas there either.** History is routed by
  artifact kind (H1). Reaching for git because it is already there is how a repository becomes
  unusable one video at a time.
- **Do not build the snapshot tree through the repository's own index.** Borrowing it drops the
  user's staged work the moment a snapshot runs; use `GIT_INDEX_FILE` pointed at a scratch path.
- **Do not merge concurrent agent writes to the same file.** Admit one writer, make the second wait,
  and route that decision through the existing permission path (H3). There is no commit to merge and
  no human watching conflict markers.
- **Do not give a parallel agent a worktree and call it isolated.** Ports, databases, caches,
  scratch space and environment are shared until declared otherwise (H4).
- **Do not ask a human to maintain a status the system can observe.** Derived activity and the
  manual `sessionStatus` label are separate fields with separate owners (H5); only one of them is
  the machine's job to keep true.

### Current state authorities

Confirm each row against current code before changing it; extend the authority rather than creating
a neighbor.

| State | Current authority | Fleet rule |
|---|---|---|
| sessions and tasks | Craft SessionManager and task stores | reuse |
| user-facing projects | **Current:** Craft Workspace + nested Project. **Target:** Workspace config/root/session scope (Decision P6) | migrate only through explicit slices; no second project authority |
| permission modes and Agent gating | Craft mode-manager, PreToolUse, SessionManager approval flow | extend caller-aware policy; no second engine |
| session evidence | Craft SessionEvent stream | extend attribution only when a real caller requires it |
| session-scoped Agent tools | `SESSION_TOOL_DEFS` and handlers | tool registry, not the complete cross-caller invocation layer |
| project/workspace bytes and permissions | Craft Workspace filesystem paths and `permissions.json` | preserve; no second permission tree |
| settings, credentials, sources, skills | existing Craft stores and managers | reuse |
| R5/R8/R11 artifacts, workflows and jobs | no Fleet authority exists yet | define the smallest authority at its ordered row when an implemented real loop needs it |
| R9 memory | **contract landed, no store yet** — `packages/shared/src/memory/` fixes scope, promotion, foreign import and tool facts (H16–H18, H27); no memory file, index or consolidation pass exists | build the store behind the landed contract; do not design a second one |
| Expert kits and delegation | **contract landed, unwired** — `packages/shared/src/labels/`, `agent/delegation-routing.ts` (H10–H21) | `LabelConfig.expertKit` is the store; no second kit registry |

## 5. Safety and compliance (hard)

- No quota bypass, stealth/anti-detection automation, credential/cookie extraction, unauthorized
  account automation, or terms-of-service evasion.
- Preserve user data; require explicit authority for destructive changes and external side effects.
- Keep credentials in established credential pathways.
- Do not copy restricted/unapproved source merely because a related repository is open source.

## 6. Engineering and documentation

- No forced/destructive Git operations, and no overwriting dirty work, without explicit owner
  authorization.
- Do not delete a folder, report, reference checkout, or artifact from its name, age, size, or
  apparent duplication alone. Inspect contents and history, migrate unique active facts, then remove
  only when it has no continuing authority or function.
- Do not edit dependencies/configuration to make validation pass.
- Do not use tests/typechecks as a substitute for real observable behavior.
- Do not dump full repository/transcript context into a supporting agent when a bounded brief
  suffices (Decision C3).
- Do not use a PR graph or a second review shell as the product's task/session authority.
- Do not coordinate concurrent local writes through Git alone when paths overlap.
- **Do not resurrect retired planning machinery** — Waves, readiness gates, ownership forms,
  process packets, boards, mandatory status blocks. Migrate any unique active fact, then delete the
  superseded document; do not create an in-tree archive or memorial folder. **Precise boundary:**
  the *design dossiers* under `modules/` ("module/suite packets") are content, not process — they
  carry breadth/depth design and compatibility records. They are permitted only while (a) their
  depth labels remain documentation states, never work permissions or schedule gates
  (`14-MODULE-ARCHITECTURE.md` §2), (b) they own no capability status, progress %, assignment, or
  approval, and (c) no document requires reading them before ordinary bounded work. The moment one
  becomes a work-permission gate or a second status system, it is the banned machinery again.
- Do not let documentation claim more than implementation. When plan and code diverge, correct the
  status immediately.
