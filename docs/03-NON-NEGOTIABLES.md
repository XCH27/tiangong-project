# 03 — Non-Negotiables

> Durable architectural and safety boundaries. These are not a process gate and not busywork — each
> one is a specific way this product can be ruined, learned the hard way. Before any architectural or
> safety-relevant change, confirm you are not crossing one. If you believe an existing authority is
> genuinely insufficient, say so explicitly and get owner sign-off *before* building a parallel one.

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

**Extend the existing authority, or demonstrate why it is insufficient, before replacing it.** This
is the number-one rule because violating it is how the product fragments into disconnected utilities.

## 2. UI and product

- Do not restore rejected Fleet skins or build a greenfield shell when Craft can be simplified/extended.
- Do not add empty docks, panels, settings, routes, dashboards, or placeholder modules for
  hypothetical future work.
- Do not make a canvas/panel the authoritative job or native-document store.
- Do not add a second Markdown editor beside the existing Craft TipTap path.
- Do not flatten browser, design, video, deck, and code into one universal editable document model.
- Do not treat external web pages as editable native documents via silent DOM mutation.
- Do not present display-only, mocked, or stub behavior as `usable`.
- Do not ship a UI-only and an agent-only implementation of the same action. Converge on one executor,
  one permission path, one state authority, one evidence trail.
- Do not expose backend plumbing as a setting just because a flag exists.
- Do not treat a component library or another product's screenshot as license to replace Craft's
  navigation, settings architecture, or product identity wholesale.

## 3. Architecture

- No workflow runner with its own independent permission/runtime/job systems beside the existing ones.
- No long-lived daemon as an early prerequisite when the Electron main process can own the behavior.
- No independent `jobs.json` / `memory.json` / `clips.json` state authority without a demonstrated gap
  and a deliberate migration.
- No silent last-write-wins for concurrent document mutation.
- No external plugin distribution path before built-in capability loading and permissions are real.
- No wholesale copy from the preserved upstream source checkout over the working app; compare and
  integrate intentional upstream changes instead.
- No fixed node-type union treated as the entire canvas/product model.
- No visual canvas connector treated as an executable workflow edge without an explicit workflow
  definition and executor.
- No visual connector, card position, or renderer edge may overwrite recorded artifact provenance or
  imply that an Agent actually consumed an input. Spatial, reference, execution-input, provenance, and
  workflow relations remain distinct.
- No Agent, plugin, or workflow mutates React/tldraw/Pixi renderer state directly. It invokes the shared
  caller-aware action path; the canvas receives a projection update from the owning authority.
- No spatial renderer is promoted to a production dependency from screenshots, marketing claims, or a
  synthetic empty-node demo. The canvas milestone must prove representative rich cards, media proxies,
  concurrent Agent updates, resource-memory recovery, license, and GPU/driver fallback in the real
  Electron app.
- No timeline ordering used as a document conflict-resolution algorithm.
- No universal patch format pretending to natively edit DOM, code, design, video, and deck with one
  internal model.
- No assumption that a design editor is the universal spatial host without adapter, license,
  interaction, and performance evidence.
- No arbitrary cyclic/general-programming workflow model in the first finite workflow version.
- No promise of full-fidelity animated PowerPoint compatibility the export path cannot prove.

## 4. Persistence discipline (the SQLite trigger)

Near-term persistence retains Craft v0.11 filesystem stores under one logical authority (Decision D2).
Do **not** introduce SQLite or a control-plane database opportunistically. Introduce it only when a
**concrete, observable engineering signal** appears — for example: the first real bug where file-based
lease-restart reconciliation or job idempotency cannot be made atomic on the filesystem. When that
signal appears, write a short decision entry recording the trigger, the migration path, and the state
authority that owns it — then migrate. "It would be cleaner" is not a trigger.

### Current state authorities

This compact map replaces the deleted planning-era authority matrix. Confirm each row against current
code before changing it; extend the authority rather than creating a neighbor.

| State | Current authority | Fleet rule |
|---|---|---|
| sessions, projects, tasks | Craft session/project/task stores | reuse |
| permission modes and Agent gating | Craft mode-manager, PreToolUse, SessionManager approval flow | extend caller-aware policy; no second engine |
| session evidence | Craft SessionEvent stream | extend attribution only when a real caller requires it |
| session-scoped Agent tools | `SESSION_TOOL_DEFS` and handlers | tool registry, not the complete cross-caller invocation layer |
| workspace bytes | Craft workspace/filesystem paths | preserve; later add conflict coordination without duplicating bytes |
| settings, credentials, sources, skills | existing Craft stores and managers | reuse |
| future jobs, artifacts, workflows, memory | no Fleet authority exists yet | define only in the milestone that proves a real loop |

## 5. Safety and compliance (hard)

- No quota bypass, stealth/anti-detection automation, credential/cookie extraction, unauthorized
  account automation, or terms-of-service evasion.
- Preserve user data; require explicit authority for destructive changes and external side effects.
- Keep credentials in established credential pathways.
- Do not copy restricted/unapproved source merely because a related repository is open source.

## 6. Engineering and documentation

- Do not force unrelated Git histories or overwrite dirty work without explicit owner authorization.
- Do not edit dependencies/configuration randomly to make validation pass.
- Do not use tests/typechecks as a substitute for real observable behavior.
- Do not dump full repository/transcript context into every supporting agent when a bounded brief
  suffices; do not start a supporting-agent task without a bounded objective, pointers, expected
  output, and a conflict boundary.
- Do not use a PR graph or a second review shell as the product's task/session authority.
- Do not coordinate concurrent local writes through Git alone when paths overlap; reserve files or
  isolate worktrees and reconcile through the main agent.
- **Do not resurrect the retired planning machinery** — Waves, readiness gates, ownership forms,
  packets, boards, mandatory status blocks. It was deleted deliberately. If an **active** document
  references it, treat that as stale and flag it. (`docs/design-library/` is quarantined historical
  material and still contains that vocabulary by design — read it through its README corrections
  instead of flagging it.)
- Do not grow documentation faster than implementation. When plan and code diverge, the fix is code,
  not more plan.
