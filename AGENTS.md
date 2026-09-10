# AGENTS.md — start card

Mandatory entry for every executing agent. Do not preload the whole `docs/` corpus; follow the
routing table below and read only what the task touches.

## The 10 rules that matter most

1. **This is a product fork of Craft Agents (Apache-2.0). Check Craft first — then admit the best.**
   The current `app/` tree is implementation reality. Pinned Craft trees (v0.10.5, v0.11.2, and any
   later pin) plus hosted Craft docs are **candidate sources**: compare them and **admit the better
   interaction, fix, or backend mechanism** that still lands on one Fleet authority
   (择优录取 / best-of admission). Do not invent a standing “we do not sync X” policy; do not
   wholesale-merge a checkout over the working tree; do not restore a second Projects/Board home.
   Before writing code, find the capability row in
   [`docs/08-CRAFT-CAPABILITY-MAP.md`](docs/08-CRAFT-CAPABILITY-MAP.md) and classify:
   **REUSE / EXTEND / NEW**.
2. **Never create a second authority.** One session store, one permission path, one timeline, one
   task store, one settings home. Extend the existing one or get owner sign-off first
   ([`docs/03-NON-NEGOTIABLES.md`](docs/03-NON-NEGOTIABLES.md)).
3. **Work from one execution contract and one development order.** An explicit owner Goal/task is the contract for its
   bounded scope; otherwise use the ACTIVE release and linked spec in
   [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md). Create or amend a spec only when the work changes a
   release contract, persisted/shared interface, authority, or externally observable behavior — an
   ordinary fix or refactor does not earn a new document. For whole-system work, route through
   [`docs/16-SYSTEM-SUITES.md`](docs/16-SYSTEM-SUITES.md); breadth and surfaces remain indexed in
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

## The agent platform, in one page (Decisions H1–H28)

Read this before designing anything that touches kits, delegation, memory, git or
cost. It is the shape the 2026-07-30 design pass settled on, and the reasoning for
each line is in `02-DECISIONS.md` under the cited ID. **The domain layer is landed
and typechecked; almost none of it is wired.** `06-CODE-MAP.md` names every module
and what is still unbuilt.

**One sentence:** an expert kit declares a specialist, routing decides what enters
the window, delegation reaches other specialists by capability and cost, and
consolidation turns what happened into what is known.

| Concept | What it is | The trap it exists to avoid |
|---|---|---|
| **Expert kit** (H13, H15) | A label with a real payload: skills, sources, tools, a requested permission mode. Grew out of identity labels — `kind: 'identity'` is deprecated but readable forever (H23) | Giving every session every tool. Accuracy degrades past ~10–15 tools; selection accuracy collapses toward 13% on large sets. It is a tax paid every turn, not untidiness |
| **Catalog vs active** (H19, H21) | A kit's catalog is **unbounded**. The budget measures only what routing put in the window | Trimming capability to pass a check. A kit cut to fit is a worse kit; routing makes size free |
| **Skill routing** (H20) | Triggers select, exclusions are decisive, successors are offered not loaded | Asking the model to pick from 28 long descriptions — that *is* the attention cost being avoided |
| **Delegation** (H10, H11, H28) | Requirement first, then cheapest that satisfies, escalate only on mechanical failure. Shown inline in the conversation | "Cheap for simple" is unimplementable: complexity is not observable up front. And there is **no captain role and no manager agent** — delegating is something any conversation does |
| **Memory** (H16–H18) | Delegates return findings and write nothing; only consolidation writes curated layers; tool memory records the *fact*, not the call | Five delegates writing five accounts of one event — an echo chamber with source pointers attached |
| **Foreign import** (H27) | History imports as a searchable archive. Curated memory never imports as memory | Another product's claims describe *its* tool surface and carry no evidence this system can follow |
| **Artifact history** (H1–H4) | Routed by kind: text→git tree, media→content store, canvas/timeline→operation log. Attribution is orthogonal and required by all three | Reaching for git because it is already there. One video at a time makes a repository unusable |
| **Git snapshots** (03 §4) | Write objects; never move HEAD, index, a ref, a branch, a tag or a stash | An agent silently committing or stashing under a user — the worst thing this capability can do |
| **Cost** (H12) | Published rates, cache read/write priced separately, context tiers, subscription flagged not free | Collapsing cache into "input" ranks a cache-heavy agent as expensive — backwards, since agent work is iterative |
| **CLI agents** (H6–H8) | ACP over stdio; resolved binary paths recorded; detection separate from configuration | Regexing `--help` and reading another program's private cache. Bare command names fail for every version-manager install |
| **Session activity** (H5) | Derived, live, never clicked. `sessionStatus` stays the manual label | An icon answering "what did someone file this as" while the session is actively running |

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
instruction in rule 1, `07-PLAYBOOK.md` step 2 and `CRAFT-UI-BASELINE.md` is **unexecutable**.
Check before any intake, UI or reference work:

```bash
ls 源码参考/software/craft-agents-oss-v0.10.5 >/dev/null 2>&1 && echo "mirror OK" || echo "mirror MISSING"
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
| Anything (always) | This file, then the capability row in `docs/08-CRAFT-CAPABILITY-MAP.md`, confirmed with `rg` |
| What integrates next / release scope | `docs/05-ROADMAP.md` and the linked spec in `docs/specs/` |
| Any domain's breadth, gaps, reference projects | `docs/modules/REGISTRY.md`, `docs/11-PRODUCT-MATRIX.md`, `docs/references/` |
| Module compatibility or a large future capability | `docs/14-MODULE-ARCHITECTURE.md` and `docs/modules/<module>/README.md` |
| Reference project source/license audit | `docs/references/` and the relevant module packet |
| Whether a document claim is evidenced | `docs/15-DOC-AUDIT.md` |
| Frontend pages, states, mock/adapter rules | `docs/12-PAGE-ARCHITECTURE.md` |
| Finding the code entry point | `docs/06-CODE-MAP.md` |
| Starting implementation from the approved suite queue | `docs/WORK-ORDER.md` |
| Broad product context, doc index | `docs/00-START-HERE.md`, `docs/01-WHITEPAPER.md` |
| Orchestration, delegation, canvas, workflows | `docs/13-ORCHESTRATION.md` |
| Context size, prompt assembly, caching, token cost | `docs/17-TOKEN-ECONOMY.md` |
| A design question ("is this already decided?") | `docs/02-DECISIONS.md` |
| Architecture, invariants, failure modes | `docs/04-ARCHITECTURE.md` |
| Multi-agent, Git/delivery, templates, reporting | `docs/07-PLAYBOOK.md` |
| Tests, verification, acceptance split | `docs/09-QUALITY.md` |
| UI structure, which component to start from, review method | `docs/CRAFT-UI-BASELINE.md` |
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

Two files are not optional, and skipping them is the most expensive mistake available in this repo —
it produces code that typechecks, renders, passes review, and is wrong in every theme but the one it
was written in.

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
