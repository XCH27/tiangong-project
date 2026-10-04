# AGENTS.md — collaboration and code-development rules

Mandatory entry for every executing agent. Read this file, then the documents your task routes
to. A requested repository-wide documentation audit may traverse the whole set; ordinary tasks
should not preload unrelated modules.

## Current boundary

- Fleet is a local-first workbench where people and Agents operate the same native artifacts.
  Read [product](docs/product.md) before proposing scope or architecture. Coding benchmarks cover
  only part of this product. Contextual Agent operation of feature pages is required baseline
  behavior under OV-024/026/062, not an optional future assistant.
- **Active candidate:** `.fleet/zcode`, reconstructed from ZCode `29628c9` and the ordered patches.
  It uses ZCode `AgentRuntime` as Host with Pi Agent Core as the default loop (OV-084). Host owns requests,
  tools, permissions and durable state; Pi defaults and extension autoload are not enabled. See
  [candidate setup and verification](docs/engineering.md#zcode-candidate).
- **Retained implementation:** `app/`, Craft v0.13.4 plus declared changes. Preserve its dirty work
  and data. Its old R0/R1 restrictions and code maps describe that branch; they do not cancel later
  owner-authorized ZCode work. Changes *to app/* still require `docs/UPSTREAM-DELTA.tsv` and its gates.
- **Current order (OV-067):** implement and verify the execution/application kernel first, then
  connect page-local Agent operations, generation, statistics, document plugins and canvas.
  [TODO](TODO.md#delivery-order) owns the order. Source audit accompanies this engineering work.
- OV-084 replaces the interim Coding Agent wrapper with Pi Agent Core beneath the ZCode Host; it does not declare the
  kernel complete. Native executor boundaries, admission, permissions, durable state and
  recovery must be proved before feature-page expansion. Alternative sources remain bounded
  references; a live authority/data cutover retains its explicit checkpoint.
- The owner has authorized comprehensive source-backed audit and bounded rectification. Preserve
  original useful interactions, current records and unrelated changes. Do not expand a bounded fix
  into a new visual system, new service or data migration without its applicable checkpoint.

## Read this first

Authority order: current owner instructions → `docs/product.md` for product meaning → applicable
current decisions → module contracts. `TODO.md` owns execution order; the capability register owns
status. References and research supply evidence only. If they disagree, reconcile the lower source
instead of silently selecting whichever passage permits an action.

ZCode is the selected reconstruction direction. Craft supplies contextual Agent interaction and
useful Board/Pages behavior; Cindy supplies application-plugin comparisons; OpenChamber supplies
Git/GitHub comparisons. These roles do not import several independent products' authorities.

## Rules

1. **Reuse before redesign.** Inspect the current component and its pinned original, then the
   named reference. Before implementing each module, inspect the relevant vendors' official
   clients/SDKs or published contracts and their plugin ecosystem. Record the actual request,
   credential, persistence and recovery mechanisms in the existing reference record; screenshots
   or matching field names are insufficient. Follow the [source intake gate](docs/engineering.md#source-intake-before-module-implementation).
   Check current upstream releases/tips before that comparison; review newer source in a separate
   immutable copy while preserving required pins, and record the exact version and proof level.
   Preserve the working interaction and host primitives. A new domain capability
   may need new code; justify that gap and its consumers instead of inventing unrelated controls.
   For interaction changes, trace the reference's trigger, pointer anchoring, drag/resize,
   focus/keyboard/close behavior, context/rule delivery and conversation lifetime before coding.
   Record the mechanism being reused or adapted; screenshots, similarly named features and
   per-page substitute controls do not establish an equivalent interaction.
2. **Keep scope and acceptance fixed.** Later messages steer the active work; they do not erase
   earlier unfinished requirements. A discovered adjacent issue does not silently replace the task.
3. **One owner per logical entity.** Human UI, Agent tools and automations invoke the same domain
   operation. Native editor data/undo and an executor's opaque continuation state are legitimate
   separate entities. Do not force all data into one database or duplicate Fleet Session/settings.
4. **Retire without losing capability or data.** Name each removed control's new home or the owner's
   explicit retirement. In `app/`, declare L2 in `UPSTREAM-DELTA.tsv`; in the candidate, preserve the
   reviewable patch chain. Obsolete docs may be removed after unique content and links are absorbed.
5. **Evidence must match the claim.** Distinguish source inspection, fake transport, real local
   execution, live provider behavior and owner visual acceptance. None implies the next level.
6. **Check reality first.** Verify the checkout, process, dependencies, permission and input path
   before debugging. Missing optional evidence is not permission to rebuild unrelated infrastructure.
7. **Stop a non-progressing approach after two attempts.** Preserve the observed failure and choose
   the smallest evidence-backed alternative; ask only for a decision genuinely requiring the owner.
8. **Use capability statuses precisely:** `usable`, `wired but not visually checked`, `display-only`,
   `not implemented`. These describe capability delivery, not research quality or document completeness.
9. **Keep documentation singular.** Product meaning, execution order, capability status, module
   contracts, engineering, evidence and history have separate homes. English-first; Chinese remains
   for exact owner quotations and UI literals. No dated progress reports or in-tree archives.
10. **Primary owns integration.** Follow the owner's no-casual-delegation direction. OV-043 account
    correction and the current NewMax frontend/backend/model-configuration study are primary-only.
    The owner has stopped delegation for that study; its earlier worker authorization does not
    permit further dispatch for that study. OV-080 authorizes parallel rectification in bounded,
    disjoint code areas with explicit acceptance and cross-review; primary retains account work,
    product/layout decisions, integration and final running verification.

## Routing — read before you touch

Every document has one job. Modules are self-contained: each opens with a generated card (its
register rows, status, release, surfaces), then owns its contract, code entry points, references
and execution rows. Read the module first, and the shared documents only for what it points to.

| Before you touch… | Read |
|---|---|
| **Anything rendered** — a value, layout, motion | [`DESIGN.md`](DESIGN.md), then the module — mandatory before UI code |
| Sidebar, navigation, Project, new conversation, composer and right panel | [`docs/modules/shell.md`](docs/modules/shell.md) |
| Updater, hosted Pages, telemetry, help, OAuth relays, branding (R2) | [`docs/modules/services.md`](docs/modules/services.md), then [packaging](docs/packaging.md) |
| Retained Craft walkthrough, baseline evidence or original-Craft behavior | [`docs/modules/baseline.md`](docs/modules/baseline.md) |
| Sessions, permissions, actions, tasks, orchestration | [`docs/modules/agent-core.md`](docs/modules/agent-core.md) |
| Provider setup, catalogs, subscriptions, model options, connection diagnostics | [`docs/modules/models.md`](docs/modules/models.md) |
| Prompt, tools, tokens, Skills loadout | [`docs/modules/context.md`](docs/modules/context.md) |
| Memory retrieval, curation, foreign-history imports | [`docs/modules/memory.md`](docs/modules/memory.md) |
| Delegation, coordination and intervention | [`docs/modules/orchestration.md`](docs/modules/orchestration.md) |
| Browser pane, capture, evidence | [`docs/modules/browser.md`](docs/modules/browser.md) |
| Canvas, design, documents | [`docs/modules/canvas.md`](docs/modules/canvas.md) |
| Image, audio, video, decks | [`docs/modules/media.md`](docs/modules/media.md) |
| Workflows, schedules, delivery | [`docs/modules/workflow.md`](docs/modules/workflow.md) |
| Remote targets, worktrees, messaging, computer use | [`docs/modules/remote.md`](docs/modules/remote.md) |
| Plugins, Skills, MCP catalogs, component distribution | [`docs/modules/marketplace.md`](docs/modules/marketplace.md) |
| Panel host, components, workspace compositions | [`docs/modules/components.md`](docs/modules/components.md) |
| Scope — "should Fleet do this at all?" | [`docs/product.md`](docs/product.md) |
| A capability's status, acceptance ID, page or surface ID | [`docs/capabilities.md`](docs/capabilities.md) — the register; edit rows there |
| "Is this already decided?", the owner's exact words | [`docs/decisions.md`](docs/decisions.md) |
| A cross-module invariant, authority or code entry point | [`docs/architecture.md`](docs/architecture.md) |
| Cross-platform packaging and release constraints | [`docs/packaging.md`](docs/packaging.md) |
| A component, a gate, a test, a commit, a build | [`docs/engineering.md`](docs/engineering.md) |
| Which open-source project to reference, and where | [`docs/references.md`](docs/references.md) |
| What to do now | [`TODO.md`](TODO.md) |

Where to write: a fact belongs to exactly one of these. Module-specific detail goes in its module,
never in a shared document; a status goes in the register row, never in prose; history goes in
[`CHANGELOG.md`](CHANGELOG.md). Documents other than the ledgers (`capabilities`, `decisions`,
`references`, `CHANGELOG`) stay under 700 lines — the gate enforces it; split by module, not by
raising the limit.

## Preflight

```bash
bash scripts/init.sh
```

It wires the commit gates (`core.hooksPath` is not carried by a clone), checks the toolchain, and
checks that both Craft pins are on their pins. `源码参考/` and `UI参考/` are symlinks into
`/Volumes/AIGC/天工参考/` and are not tracked. When the volume is not mounted, every "compare the
reference first" step is unexecutable — report it and stop rather than work from memory.

```bash
git -C 源码参考/software/craft-agents-oss-v0.10.5 describe --tags   # look pin: exactly v0.10.5
git -C 源码参考/software/craft-agents-oss describe --tags           # rolling pin: must equal app/ (v0.13.4)
```

These checkouts carry their own `.git`. A `checkout` run inside one silently moves the baseline.

## Before you write UI

Read [DESIGN](DESIGN.md), then the routed module. Diff the affected implementation against its
own original: `.fleet/zcode` against `源码参考/software/ZCode`; `app/` against the pinned Craft
checkout. Read the named reference's actual component/controller, not just a screenshot.
Use that host's existing controls and values; Craft look-pin measurements are scoped in DESIGN
and must not be applied blindly to unrelated ZCode components. UI redesign needs a concrete reason.

A disappearing interaction needs a retained path or an explicit retirement. Verify light/dark,
English/Chinese, keyboard and narrow-window states appropriate to the change. A style linter is
not visual acceptance. Do not create mockup images as substitutes for source-backed implementation.

## Owner protocol

- **Checkpoints — stop and get explicit approval before:** spending money or any irreversible or
  public effect (paid APIs, deletion, deployment, publication, external messages, merge to remote
  `main`); adding a production dependency or external service; creating or replacing an authority
  or security boundary (Session storage, permissions, credentials, migrations); choosing between
  materially different product outcomes or changing established behaviour; removing or re-pinning a
  reference project. Present **what · why · cost and risk · two or three options ·
  recommendation**, in words a non-programmer understands.
- **Proceed without approval:** reversible in-scope work, code organization and technical patterns,
  read-only inspection, tests, builds, fixing your own regression, documenting changed facts.
- **Acceptance:** every delivery states the outcome in plain language, the status, a short
  **CHECK THIS** list, and what was deliberately left unchanged. The owner judges look and feel —
  light and dark, `zh-Hans` and English, narrow windows — and accepts, which promotes the capability
  to `usable`, or names the mismatch for the next bounded fix. Agents own logic, data integrity and
  code quality. Show the running change; do not describe it.
  Before asking the owner to review, personally test and inspect the built running change. Fix
  known failures first; never delegate basic QA to the owner. Open and focus the exact page, explain
  what changed and limit owner acceptance to the already-checked scope and its user experience.
- **Status meanings:** `usable` = real path verified and visible behaviour owner-accepted;
  `wired but not visually checked` = real path verified, visual acceptance pending; `display-only` =
  UI without real behaviour; `not implemented` = absent. "Mostly done" and "should work" are not
  statuses.
- **Duty to dissent:** if an instruction conflicts with a recorded decision or will lose data or a
  function, say so once with evidence, then follow the owner's call and record it in
  [`docs/decisions.md`](docs/decisions.md).
- **Test content is not product intent.** Session content, Project names and fixtures (for example
  the stock-trading test chats) are data, never requirements or defaults.
- **Reference projects are retained unless the owner decides otherwise.** Present target, evidence
  and recovery plan before removing or re-pinning one.

## Learned owner preferences

- Reviews must be deep and evidence-backed: paths, diffs, file:line. Survey-style reviews are
  rejected.
- Bound improvement work with measurable goals and stop conditions; no open-ended optimizing loops.
- Rectify the project, do not pile up documents (「我是要你整改项目而不是堆砌文档」).
- Fleet is not another pure coding-agent IDE; coding-agent forks are harness and interaction
  references, not the product shape.
- Keep essential control names visible. Do not repeat selected values, provider paths, implementation
  details or multi-paragraph rules in routine controls/tooltips. Put occasional detail in the original
  Help pattern; show diagnosis when an actual failure or unavailable state needs recovery.
