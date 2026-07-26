# 00 — Start Here

> Product orientation and the index of the whole document set. Root [`AGENTS.md`](../AGENTS.md) is
> the mandatory short execution entry; read this file when you need broad context, not for every
> bounded edit.

**Language convention:** project documentation is English-first, including owner guides, research,
specifications and source-governance metadata. Chinese is retained only for exact owner quotations,
`zh-Hans` UI literals/test fixtures, and proper names that would lose identity in translation; add
one English gloss when the retained text carries meaning. Conversation and handoff messages may
match the owner's language. Do not maintain bilingual copies of the same rule or concept.

## What Fleet is

Fleet is a **local-first desktop workbench** where a human and AI agents work on the same project
through the same sessions, files, permissions, and timeline. It is built from Craft Agents with
**v0.10.5 as the product/interaction baseline**, the current `app/` tree as implementation reality,
and v0.11.1 as a selective source of fixes and backend mechanisms — not by building a new app or
accepting every later upstream product change.

The product bet, stated once:

> The human owns intent and final judgment. Agents do the middle execution. Every action an agent
> takes is **inspectable, permissioned, and recoverable**, and connected to real project artifacts.

Fleet is **not** a chat client, an IDE clone, a terminal skin, a Figma clone, or a pile of
disconnected AI utilities. The full vision is in [`01-WHITEPAPER.md`](01-WHITEPAPER.md).

## The two rules that govern everything

1. **Reuse Craft. Never build a second one.** Upstream Craft already ships the session store,
   permission manager, timeline event stream, tool registry, two agent backends, built-in tools,
   background shell execution, MCP integration, sources/skills/credentials, projects/tasks,
   automations, scheduler, settings store, and the BrowserPane. Fleet routes new capability
   *through* those. Before writing code, find your row in
   [`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md) and classify REUSE / EXTEND / NEW.
2. **Value ships in small verified releases; coverage is never cut.** The roadmap
   ([`05-ROADMAP.md`](05-ROADMAP.md)) keeps exactly one release **ACTIVE** (a WIP limit, not a time
   phase), with a concrete spec in `specs/`. Meanwhile every product domain stays registered and
   described at breadth level in [`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md) and
   [`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) (Decision G5), and frontend pages may run
   ahead of behavior under the honest frontend track (Decision G6). Infrastructure is extracted
   from working features, not built ahead of them.

The roadmap is a complete R0–R18 development order, not a near/mid/far-term forecast. Every
registry capability has an order anchor in `modules/PACKET-INDEX.md`; conditional rows end with an
implementation or an evidence-backed `NO_GAP` decision, never an unowned “someday”.

## The authoritative document set

| File | Role | Read when |
|---|---|---|
| [`00-START-HERE.md`](00-START-HERE.md) | Orientation + index | Broad orientation |
| [`01-WHITEPAPER.md`](01-WHITEPAPER.md) | **The whitepaper**: the bet, the finished-product walkthrough, boundaries, moat, honest line | Understanding what Fleet ultimately is |
| [`02-DECISIONS.md`](02-DECISIONS.md) | Decision ledger | Checking whether a design question is already decided |
| [`03-NON-NEGOTIABLES.md`](03-NON-NEGOTIABLES.md) | Hard boundaries | Before any architectural or safety-relevant change |
| [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) | Target architecture, invariants, failure models | Designing anything that spans layers |
| [`05-ROADMAP.md`](05-ROADMAP.md) | **The route: releases, order, acceptance** | Deciding what to build next |
| [`06-CODE-MAP.md`](06-CODE-MAP.md) | Where the real code is | Locating the entry point |
| [`07-PLAYBOOK.md`](07-PLAYBOOK.md) | Execution method, multi-agent rules, templates | Executing, delegating, reporting |
| [`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md) | What Craft already provides | **Before building anything** |
| [`09-QUALITY.md`](09-QUALITY.md) | Testing and acceptance strategy | Verifying and accepting work |
| [`10-GLOSSARY.md`](10-GLOSSARY.md) | Project vocabulary | Any term reads as jargon |
| [`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md) | Product behavior/authority mapping for registered capabilities | Checking a capability's gap, authority, reference or acceptance |
| [`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) | Full page inventory, state standard, frontend track | Any frontend work; building pages ahead of behavior |
| [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) | **The orchestration core**: execution kernel, capability composition, canvas command surface | Any orchestration, delegation, canvas, or workflow design |
| [`17-TOKEN-ECONOMY.md`](17-TOKEN-ECONOMY.md) | **Token economy**: layered savings pipeline, fuse/connect/reject policy, ROI measurement (E12) | Anything touching context size, prompt assembly, caching, compression, or cost |
| [`14-MODULE-ARCHITECTURE.md`](14-MODULE-ARCHITECTURE.md) | Core/module/spec/reference separation and compatibility gates | Adding or designing any large module |
| [`15-DOC-AUDIT.md`](15-DOC-AUDIT.md) | Evergreen Goal-readiness, claim and canonical-ownership checks | Checking whether a plan claim is evidenced or a Goal is startable |
| [`16-SYSTEM-SUITES.md`](16-SYSTEM-SUITES.md) | Large independent closed-loop systems, shared contracts, references and parallel build rules | Assigning a whole product system to an Agent or checking suite conflicts |
| [`WORK-ORDER.md`](WORK-ORDER.md) | Current executable task queue, code seams, first acceptance and handoff format | Starting implementation without inventing scope |
| [`OWNER-GUIDE.md`](OWNER-GUIDE.md) | Plain-language owner checkpoints, acceptance and request format | Owner-facing; agents read the checkpoint list |
| [`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md) | UI authority order, visual anchor contract, review method | Before changing UI structure |
| [`UI-SPEC.md`](UI-SPEC.md) | **Measured, decidable design values**: type, opacity ladder, icon slots, radius, elevation, spacing, component specs, forbidden drift | **Before writing any UI code** |
| [`FEATURE-REGISTRY.md`](FEATURE-REGISTRY.md) | Live claims of big in-flight features | Before starting a big feature |
| `specs/` | One executable spec per release + template | Implementing the active release |
| [`modules/`](modules/README.md) | Durable large-module design packets, including later-in-sequence gated capabilities | Designing a large capability before its release row activates |
| [`modules/REGISTRY.md`](modules/REGISTRY.md) | Complete capability breadth registry | Checking whether a capability has been forgotten |
| [`core/README.md`](core/README.md) | Core framework index without a second authority | Navigating stable framework documents |
| [`references/`](references/README.md) | Fixed-commit source/product/license audits | Selecting or absorbing any external project |
| [`design-library/`](design-library/README.md) | Owner-intent source notes and legacy design material | Only the note for the active slice; migrate durable module design into `modules/` |
| [`源码参考/`](../源码参考/README.md) | Read-only code evidence + official Craft docs mirror | Comparing upstream/reference behavior |
| local `UI参考/` | Optional untracked visual material | Human visual study only |

There are no other *document classes* that may silently become Fleet authority. The folders below
are deliberately different kinds of authority, and their scopes must not be mixed:

| Scope | Canonical authority | What it may decide |
|---|---|---|
| Owner intent and product direction | current owner request; [`01-WHITEPAPER.md`](01-WHITEPAPER.md) | desired outcomes and final product judgment |
| Safety and invariants | [`03-NON-NEGOTIABLES.md`](03-NON-NEGOTIABLES.md); [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) | boundaries, authorities, failure and recovery rules |
| Binding design decisions | [`02-DECISIONS.md`](02-DECISIONS.md) | recorded choices and explicit gates |
| Active implementation contract | the ACTIVE row in [`05-ROADMAP.md`](05-ROADMAP.md) and its `specs/` file | the slice being implemented and accepted now |
| Code reality | current code, checked through [`06-CODE-MAP.md`](06-CODE-MAP.md) | what exists, where it lives, and its actual status; code does not silently revise a decision/spec |
| Product breadth and surfaces | [`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md), [`modules/REGISTRY.md`](modules/REGISTRY.md), [`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) | coverage, gaps, pages and projections; never new state authority |
| Suite composition and parallel ownership | [`16-SYSTEM-SUITES.md`](16-SYSTEM-SUITES.md) | closed-loop grouping, shared-contract ownership and conflict gates; never new state authority |
| External evidence | [`references/`](references/README.md) and `源码参考/` | what an outside project actually demonstrates; never Fleet requirements |
| Historical/owner notes | [`design-library/`](design-library/README.md) | intent and migration input only; not a competing specification |

When two documents disagree, resolve by scope first, then by the order above. A code mismatch is
reported as an implementation gap; it is not permission to rewrite a decision or acceptance
criterion silently. The full evidence and claim check lives in [`15-DOC-AUDIT.md`](15-DOC-AUDIT.md).

## Current honest state

- **Code:** the committed implementation tree is Craft v0.11.1-derived, but its product/interaction
  target is now pinned Craft v0.10.5; R1 compares and removes later Projects/Board interaction while
  selectively retaining proven fixes and backend mechanisms (see
  [`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md)). The former dirty working tree (247 entries) was
  inventoried and landed on `work/fresh-base-spine` as grouped commits on 2026-07-20 (G-docs,
  G-refs, and six app groups: agent-core/TE1 accounting, labels-i18n, workspace-project presentation,
  board, settings-chat, mcp, plus tooling scripts); full pre-audit snapshot preserved at
  `backup/pre-r0-audit`. **Release state has one edit point: the R0 row in
  [`05-ROADMAP.md`](05-ROADMAP.md)** — landing complete 2026-07-26 (test/typecheck/i18n/doc gates
  green); remaining, owner-owned: the `fleet-baseline-r0` tag and the owner walkthrough (R0-C7).
  Landed since on the same branch (2026-07-26): the R1 Project-is-the-boundary shell
  (`2d08364f7`, plus fix/revert churn from the owner walkthrough — the sidebar trailing-meta
  question is still open), R2 independence slices C2–C5 (`wired but not visually checked`,
  recorded in [`specs/R2-independence.md`](specs/R2-independence.md)), and the R7 canvas preview
  page (`display-only`, G6 frontend track). App groups are `wired but not visually checked`;
  nothing is `usable` before owner acceptance
  ([`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md)).
- **Fleet capability:** every differentiating Fleet loop — governed cross-caller actions, versioned
  artifact handoff, bounded delegation, adaptive organization, canvas/workflows, layered agent
  memory — is `not implemented`. Craft's inherited capabilities are real and listed in
  [`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md).
- **Harness direction:** Decisions E12/E13 retain Craft as the sole product kernel and treat Pi-light
  as a measured execution profile. TE1 observes current calls; prompt/tool reduction waits for the
  post-R0 baseline and a bounded profile slice; R3 remains the first real product chain. The research
  record is [`references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md`](references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md).
- **History, once:** an earlier planning corpus outran code and was replaced by this release-driven
  form. Unique active facts were migrated; superseded process documents were deleted rather than
  archived. Durable design assets remain only in `design-library/` and module packets because they
  still guide their R0–R18 product rows ([`03-NON-NEGOTIABLES.md`](03-NON-NEGOTIABLES.md) §6).

## How to start any task

1. Read root [`AGENTS.md`](../AGENTS.md).
2. If the owner supplied an explicit Goal, keep its objective and done condition fixed; use the
   roadmap/spec only for dependencies and acceptance anchors. Otherwise open
   [`05-ROADMAP.md`](05-ROADMAP.md) → the ACTIVE release → its spec in `specs/`.
3. Check Craft first: capability row in [`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md),
   inspect the code, classify REUSE / EXTEND / NEW.
4. Locate code via [`06-CODE-MAP.md`](06-CODE-MAP.md); confirm with `rg`.
5. Implement one coherent block; verify per [`09-QUALITY.md`](09-QUALITY.md); stop only at
   [`OWNER-GUIDE.md`](OWNER-GUIDE.md) checkpoints.
6. Update the spec/capability row/user-facing docs that actually changed; report with the fixed
   status vocabulary.
