# AGENTS.md — start card

Mandatory entry for every executing agent. Do not preload the whole `docs/` corpus; follow the
routing table below and read only what the task touches.

## Read this first

[`docs/PRODUCT.md`](docs/PRODUCT.md) is the single authority on what Fleet is and is not — the four
sources and what each decides, the rule that settles built-in versus driven-from-outside, and the
list of things Fleet does not do. Where any other document disagrees with it, it wins.

The short version: **Craft Agents decides the look, Cindy decides how features are implemented and
how the surfaces talk to the backend, OpenChamber decides Git and GitHub, and the production
surfaces — canvas, documents, video — are Fleet's own.** QoderWork and TRAE are interface reference
only; their product concepts are not importable.

## The 10 rules that matter most

1. **This is a product fork of Craft Agents (Apache-2.0). Check Craft first — then admit the best.**
   The current `app/` tree is implementation reality and tracks Craft OSS **v0.13.3**. Pinned Craft
   trees (v0.10.5 look pin, rolling `software/craft-agents-oss` on the latest tag) plus hosted Craft
   docs are **candidate sources**: compare them and **admit the better
   interaction, fix, or backend mechanism** that still lands on one Fleet authority
   (择优录取 / best-of admission). Do not invent a standing “we do not sync X” policy; do not
   wholesale-merge a checkout over the working tree; do not create a second Project, Session or task
   authority. The current Board may remain a separate navigator only as a projection of the existing
   Session/Task stores; it is not a duplicate Conversations list or a new authority.
   Before writing code, find the capability row in
   [`docs/08-CRAFT-CAPABILITY-MAP.md`](docs/08-CRAFT-CAPABILITY-MAP.md) and classify:
   **REUSE / EXTEND / NEW**. For anything rendered, "check Craft first" has a literal procedure —
   see *Before you write UI* → **Step 0**, and do not skip it.
2. **Never create a second authority.** One session store, one permission path, one timeline, one
   task store, one settings home. Extend the existing one or get owner sign-off first
   ([`docs/03-NON-NEGOTIABLES.md`](docs/03-NON-NEGOTIABLES.md)).
3. **Work from one execution contract and one development order.** An explicit owner Goal/task is the contract for its
   bounded scope; otherwise use the ACTIVE release and linked spec in
   [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md). Create or amend a spec only when the work changes a
   release contract, persisted/shared interface, authority, or externally observable behavior — an
   ordinary fix or refactor does not earn a new document. For whole-system work, route through
   `docs/modules/REGISTRY.md`; breadth and surfaces remain indexed in
   `docs/modules/REGISTRY.md`, `docs/11-PRODUCT-MATRIX.md`, and `docs/12-PAGE-ARCHITECTURE.md`.
   Never use near/mid/far-term buckets: every registered capability has a release-order anchor or a
   named conditional-closure row, so an Agent cannot silently defer it forever.
4. **Keep the task fixed while executing it.** Do not silently change the request, acceptance
   criteria, tests, or harness. A necessary change is an explicit contract revision. Queue
   incidental findings; do not let them replace the objective.
5. **Halt after two non-progressing attempts.** Two state-changing attempts that do not move an
   acceptance criterion forward = stop, preserve evidence, report the smallest next decision.
   Switching tools or hypotheses does not reset the counter.
6. **Check reality before diagnosing product code.** Existence, installation, running process,
   permission, input path, connectivity — cheapest checks first. A missing screenshot/preview/tool
   is a classified limitation, never permission to rebuild infrastructure.
7. **Report status with the fixed vocabulary only:** `usable` · `wired but not visually checked` ·
   `display-only` · `not implemented`. "Tests pass" is never a capability status.
8. **Stop at owner checkpoints.** Money, irreversible/public effects, production dependencies, new
   or replaced authorities, product forks → present options in plain language and wait
   ([`docs/OWNER-GUIDE.md`](docs/OWNER-GUIDE.md)).
9. **Verify at the cheapest sufficient level.** Static check → targeted test → real non-visual data
   path → non-interactive smoke ([`docs/09-QUALITY.md`](docs/09-QUALITY.md)). Owner owns final
   look-and-feel acceptance; agents own everything below it.
10. **Documentation serves implementation.** Update only the canonical spec, capability row, or
    user-facing doc whose contract/status actually changed. Never create dated progress reports,
    duplicate plans, or Goal journals; execution evidence belongs in tests, diffs, commits, and the
    Goal/thread state. Project documentation is English-first. Preserve Chinese only for exact
    owner quotations, `zh-Hans` UI literals/fixtures, and proper names that lose identity in
    translation; give an English gloss where meaning matters. Use the canonical terms in
    `docs/10-GLOSSARY.md` instead of bilingual synonyms.

## Persistent Goal contract

- The explicit Goal owns **objective** and **done when**. Roadmap state supplies default sequencing;
  it does not override a direct owner Goal. Safety boundaries and owner checkpoints still apply.
- Before editing, reduce the Goal to one current slice: `objective · context paths · constraints ·
  acceptance evidence · next safe action`. Keep this in Goal/thread state, not a new Markdown file.
- On continuation or context compaction, re-read the Goal, `git status`/relevant diff, and only the
  routed spec/acceptance rows. Do not reload the whole document corpus or repeat completed research.
- Continue through reversible in-scope work. At a checkpoint, finish safe preparation and request
  the smallest owner decision; never widen the Goal or mark partial work complete.

## The agent platform, in one page

Read this before designing anything that touches assistants, delegation, memory, Git or cost.
[`PRODUCT.md`](docs/PRODUCT.md) and the current tree outrank the 2026-07-30 H-decision implementation
paths: the rebase discarded the old ExpertKit-as-label, delegation, memory, artifact-history and CLI
adapter modules. Preserve their still-valid principles, but do not report those modules as landed or
recreate their old stores.

**One sentence:** an Assistant declares a wearable identity and requested loadout; routing eventually
selects only what enters the window, any conversation may delegate through the one Session/Task
authority, and a future single-writer consolidation pass turns evidence into curated memory.

| Concept | Current authority / status | Rule that survives |
|---|---|---|
| **Assistant** (H15 revised) | `packages/shared/src/assistants/` is the independent identity store; backend/RPC exists, but its selector is not mounted, so the user-facing path is `not implemented` | Never store identity/loadout in `labels/config.json`; permission in a loadout is a request, never a grant |
| **Catalog vs active** (H19–H21 principle) | Marketplace/routing runtime `not implemented` | A catalog is unbounded; only the selected active context spends attention; do not trim capability to pass a budget |
| **Delegation** (H10/H11/H28 principle) | Craft child Sessions/Tasks are the starting authority; Fleet TaskBrief/RunReport gates and inline projection are `not implemented` | Any conversation may delegate; no captain/manager role or second task store |
| **Memory** (H16–H18/H27 principle) | Store/index/consolidation `not implemented` | Delegates return evidence; only one consolidation writer promotes curated memory; foreign history stays searchable evidence, never imported truth |
| **Artifact history** (H1–H4 principle) | Unified history router `not implemented` | Text, media and operation logs may use different native storage; attribution is orthogonal and required |
| **Git snapshots** (03 §4) | Snapshot helper `not implemented` | An agent never moves HEAD, index, a ref, branch, tag or stash under the user |
| **Cost** (H12) | Pricing/session-cost/usage-rollup helpers exist; complete product projection is not implemented | Price cache reads/writes and context tiers separately; unknown is never reported as zero |
| **CLI agents** (H6–H8 principle) | General ACP catalog/connection adapter `not implemented` | Detection is separate from configuration and records resolved binary paths; never scrape private caches |
| **Session activity** (H5) | Derived activity helper exists | Activity is live and derived; `sessionStatus` remains the manual label |

Three things a newcomer gets wrong, stated plainly:

1. **Do not add a capability limit to save tokens.** Capability is the product;
   cost is for the architecture to absorb (H21).
2. **Do not create a role for something every session can already do.** No
   captain mode, no manager agent, no "delegation session" type (H28).
3. **Do not report a boundary by failing silently.** Every refusal in this layer
   names its reason so a surface can explain itself — that pattern is deliberate
   and repeated (workbench toggle, connect form, revert, install, promotion).

## Preflight: the reference roots may not be mounted

`源码参考/` and `UI参考/` are symlinks into `/Volumes/AIGC/天工参考/`, and neither is tracked by this
repository (both are gitignored; the last tracked mirror content is reachable at
`backup/pre-r0-audit-2026-09-09`). When that volume is not mounted, every "compare Craft first"
instruction in rule 1, `AGENTS.md` step 2 and `docs/UI-SPEC.md` is **unexecutable**.
Check before any intake, UI or reference work:

```bash
ls 源码参考/software/craft-agents-oss-v0.10.5 >/dev/null 2>&1 && echo "mirror OK" || echo "mirror MISSING"
# The baseline pin must be ON its pin. These checkouts carry their own .git, so a checkout run
# inside one silently moves the baseline; on 2026-08-17 this one sat at v0.12.0 for three weeks.
git -C 源码参考/software/craft-agents-oss-v0.10.5 describe --tags   # expect exactly v0.10.5 (look pin)
git -C 源码参考/software/craft-agents-oss describe --tags           # rolling pin; must match app/ (currently v0.13.3)
```

`mirror MISSING` is a **classified limitation** (rule 6), not permission to proceed from memory or
from a screenshot. Report it, and either mount the volume or stop the packet — do not substitute a
guess for the v0.10.5 baseline.

> **Corrected 2026-09-09.** Until `c487815ec` these roots were also a permanent source of 73
> phantom deletions, and this file, `05-ROADMAP.md`, `specs/R0-baseline-audit.md` and `README.md`
> all blamed an unmounted volume. That was wrong and cost a month: `源码参考/` became a symlink on
> 2026-08-08 while 73 regular-file entries stayed in the git index, and **git does not traverse a
> symlink**, so the entries reported as deleted whether or not the volume was mounted. Mounting
> could never have fixed it. The index entries are gone; the disk is untouched. If you ever see
> a whole tracked directory reported as deleted while its files plainly exist, check whether the
> path became a symlink before you check the mount.

## Routing table

| Your task involves… | Read |
|---|---|
| **What Fleet is / is not, what to build in vs drive from outside** | [`docs/PRODUCT.md`](docs/PRODUCT.md) — the authority |
| Anything (always) | This file, then the capability row in `docs/08-CRAFT-CAPABILITY-MAP.md`, confirmed with `rg` |
| What integrates next / release scope | `docs/05-ROADMAP.md` and the linked spec in `docs/specs/` |
| Any domain's breadth, gaps, reference projects | `docs/modules/REGISTRY.md`, `docs/11-PRODUCT-MATRIX.md`, `docs/references/` |
| Module compatibility or a large future capability | `docs/14-MODULE-ARCHITECTURE.md` and `docs/modules/<module>/README.md` |
| Reference project source/license audit | `docs/references/` and the relevant module packet |
| Frontend pages, states, mock/adapter rules | `docs/12-PAGE-ARCHITECTURE.md` |
| Finding the code entry point | `docs/06-CODE-MAP.md` |
| Starting implementation from the approved suite queue | `docs/WORK-ORDER.md` |
| Orchestration, delegation, canvas, workflows | `docs/13-ORCHESTRATION.md` |
| Context size, prompt assembly, caching, token cost | `docs/modules/suites/SYS-03-context-economy.md` |
| A design question ("is this already decided?") | `docs/02-DECISIONS.md` |
| Architecture, invariants, failure modes | `docs/04-ARCHITECTURE.md` |
| **The owner asked to simplify, merge, move or remove something** | [`docs/design-library/OWNER-VOICE.md`](docs/design-library/OWNER-VOICE.md) — their verbatim words and which decision now carries each one. OV-008 already settles workspace/folder/project and task-first creation |
| **Changing a surface that already exists in Craft** | Diff the upstream component first (see *Before you write UI* → Step 0), then `docs/UI-SPEC.md` |
| **Why a surface is shaped the way it is** (shell, settings, panels, new-task, remote, canvas…) | [`docs/design-library/`](docs/design-library/README.md) — owner-intent notes per area. For Project/Workspace/Session/remote and the **new-task interaction contract**, that is [`20-workspace-project-session-remote-connections.md`](docs/design-library/20-workspace-project-session-remote-connections.md) §11–§14 |
| Two surfaces seem to overlap / duplicate each other | [`docs/design-library/21-entry-overlap-framework-audit.md`](docs/design-library/21-entry-overlap-framework-audit.md) |
| Tests, verification, acceptance split | `docs/09-QUALITY.md` |
| UI structure, which component to start from, review method | `docs/UI-SPEC.md` |
| **Any rendered value** — type, spacing, color/opacity, icon slot, radius, shadow, states | `docs/UI-SPEC.md` (**mandatory before writing UI code**; run its §12 self-check on the diff) |
| **Anything that moves** — whether to animate at all, easing, duration, press feedback | `docs/design-library/22-motion.md` |
| Unfamiliar project vocabulary | `docs/10-GLOSSARY.md` |
| Starting a big feature | `docs/FEATURE-REGISTRY.md` (register your boundary) |
| Upstream Craft behavior/docs | External reference root `/Volumes/AIGC/天工参考/源码参考/` (workspace symlink `源码参考/`), including `craft-docs/`, Craft pins `software/craft-agents-oss-v0.10.5/` and `software/craft-agents-oss/` (best-of candidates, not “do-not-sync” lists) |

## Working method (one paragraph)

Define one coherent user-visible or system behavior block from the explicit Goal or active spec; classify it
REUSE/EXTEND/NEW against Craft; **compare candidate Craft pins and take the better mechanism** that fits
one authority; implement every affected layer (UI, logic, state, error, recovery); verify with the cheapest
sufficient ladder; update only canonical facts that changed; report with the fixed status vocabulary and
hand rendered look-and-feel to the owner. Do not micro-test every edit, do not parallelize linear work,
and do not grow documentation faster than implementation.

## Before you write UI

### Step 0 — open the upstream component and diff against it

**This is the step every agent has skipped, and skipping it is how both of this repo's UI
regressions happened.** Fleet is a fork. Almost every surface you are asked to change already
exists in `源码参考/software/craft-agents-oss/` at the same path. Before you write a line:

```bash
U=源码参考/software/craft-agents-oss
diff app/apps/electron/src/renderer/<path> $U/apps/electron/src/renderer/<path>
```

Read what upstream does, then justify **each** delta you intend to add. If you cannot name why a
difference exists, it is not a difference — it is an invention, and it will read as a second UI
language beside the first.

What this catches, from real cases in this repo:

- A button given `className="h-7"` because `size="sm"` "looked too big" — while upstream uses
  `size="sm"` everywhere and `h-6 text-[11px] px-2` for inline row actions. Both the override and
  the later "correction" back to the default were wrong; only the diff says which.
- A dropdown hand-rolled from `<button>` rows, sitting beside a sibling control that uses
  `Popover` + `cmdk` with shared `MENU_*` constants.
- A picker rebuilt from scratch next to two steps of the same flow that already use
  `AddWorkspace_RadioOption`.

**Never produce a concept mockup, a redesign image, or a "structure draft" as input to an
implementation.** The owner has rejected this explicitly. The reference is the upstream component
plus the cloned products in `源码参考/software/`, read as source — not a picture you drew.

**Never dispatch a subagent to decide design, layout or architecture.** They arrive without this
file, without the design library, and without the owner's history, and they reliably invent. Read
the sources yourself.

### Then the two value files

1. [`docs/UI-SPEC.md`](docs/UI-SPEC.md) — the values. Six colours and no seventh; the opacity ladder;
   type, radius, elevation and icon slots; the shared primitives you must not re-create; the states
   every surface ships.
2. [`docs/design-library/22-motion.md`](docs/design-library/22-motion.md) — whether to animate at all
   (an action taken a hundred times a day gets nothing), then easing, duration and press feedback.

Then run the guard on your diff:

```bash
cd app && bun run lint:ui-contract
```

It checks tokens, radius, type, elevation, stroke width and — since 2026-07-31 — raw Tailwind palette
colours and `bg-primary`. It does **not** check motion, shared-primitive reuse, or whether you shipped
the required states; those are yours to verify.

Three external skills encode craft this repo does not: `npx skills add emilkowalski/skills`,
`npx skills add Jakubantalik/transitions.dev`, `npx impeccable install`. They are advisory. Where any
of them disagrees with `UI-SPEC.md`, UI-SPEC wins — they are written for product apps in general, and
this is a workbench.
