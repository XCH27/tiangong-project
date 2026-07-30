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
| **Any rendered value** — type, spacing, color/opacity, icon slot, radius, shadow, motion, states | `docs/UI-SPEC.md` (**mandatory before writing UI code**; run its §12 self-check on the diff) |
| Unfamiliar project vocabulary | `docs/10-GLOSSARY.md` |
| Starting a big feature | `docs/FEATURE-REGISTRY.md` (register your boundary) |
| Upstream Craft behavior/docs | `源码参考/craft-docs/`, Craft pins `源码参考/software/craft-agents-oss-v0.10.5/` and `源码参考/software/craft-agents-oss/` (best-of candidates, not “do-not-sync” lists) |

## Working method (one paragraph)

Define one coherent user-visible or system behavior block from the explicit Goal or active spec; classify it
REUSE/EXTEND/NEW against Craft; **compare candidate Craft pins and take the better mechanism** that fits
one authority; implement every affected layer (UI, logic, state, error, recovery); verify with the cheapest
sufficient ladder; update only canonical facts that changed; report with the fixed status vocabulary and
hand rendered look-and-feel to the owner. Do not micro-test every edit, do not parallelize linear work,
and do not grow documentation faster than implementation.
