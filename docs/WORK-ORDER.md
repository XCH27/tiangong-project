# Work Order — From Documentation to Accepted Implementation

> **Roadmap source:** [`05-ROADMAP.md`](05-ROADMAP.md). **Synchronization owner:** the main
> integration agent updates this projection in the same change that advances the ACTIVE release.

This is a convenient execution view of the suite integration queue. Read it only when a Goal asks
to execute that queue; ordinary owner Goals still start at root [`AGENTS.md`](../AGENTS.md). It
connects system suites, active specs, code entries, reference intake and acceptance evidence. It is
not a second roadmap: `05-ROADMAP.md` owns order, and `modules/REGISTRY.md` owns breadth.

## Goal execution rules

- The Goal prompt owns the objective and done conditions; this file supplies only the default order.
- One run selects one Task ID or active-spec slice, never all suites or the entire documentation set.
- Keep only `objective · paths · constraints · acceptance · next action` in execution context;
  research logs, full test output and sub-agent transcripts do not flow back into this file.
- Complete reversible preparation before an owner checkpoint; commit, tag, deletion, public and
  paid effects still wait for the applicable approval.

## Preflight discipline

1. Read root `AGENTS.md`, this file, the relevant suite packet and the ACTIVE spec.
2. Run `git status --porcelain`; touch only the registered boundary and preserve unrelated changes.
3. For EXTEND/NEW work, perform the bounded reference review. Without a fixed commit and exact
   source paths, a project remains `candidate`; do not copy it or claim adoption.
4. Keep a TaskBrief in Goal/thread state with `Outcome / Criteria / Classification / Frontend /
   Backend / Unchanged / Reserved / Docs after`; do not create a TaskBrief document unless asked.
5. SYS-01 alone integrates shared contracts. Other suites request an interface change and never add
   a second state owner.

## Complete development order

> Only the ACTIVE row is executable by default. Rows are dependency order, not time horizons.
> Every product domain ends in this queue. In R16–R18, evidence-backed `NO_GAP` is completion;
> leaving a row as “future” is not.

| Order | Task ID | Suite | Accepted outcome | Craft starting point | Entry contract | Unlock condition |
|---:|---|---|---|---|---|---|
| 0 | R0-BASELINE | SYS-01 | Classify every dirty-tree group as land/fix/drop and produce a runnable, attributable baseline | entire Craft v0.11.1 fork | `specs/R0-baseline-audit.md` | **ACTIVE** |
| 1 | R1-BOUNDARY | SYS-01 | One Project=folder concept + single switcher, New-Task-first sidebar (project-grouped tasks), control dedup, `zh-Hans`, identity labels — same Craft data paths | Workspace, Task store, app-shell, labels, i18n, settings | `specs/R1-one-boundary-language.md` | R0 |
| 2 | R2-INDEPENDENCE | SYS-01 | Make inherited Craft-hosted dependencies Fleet-owned, local, user-configured, or honestly unavailable | updater, sharing, docs, OAuth | `specs/R2-independence.md` | R0 |
| 3 | R3-PRODUCTION | SYS-01/03/04 | intent → research/evidence → Markdown → review → accepted output → delivery | Session, Sources, BrowserPane, TipTap, files | `specs/R3-first-production-chain.md`; TE1/profile work follows the roadmap | R0; R1/R2 improve the experience |
| 4 | R4-ACTION | SYS-01 | Two real human/Agent mutations share one Craft permission and evidence path | RPC, session tools, PreToolUse, owning service | `specs/R4-action-seam.md` | R3 |
| 5 | R5-ARTIFACT | SYS-01/04 | Exact version and provenance, one producer→consumer path, and stale-writer rejection | Workspace files, Session evidence, previews | accepted R5 spec | R3 |
| 6 | R6-DELEGATION | SYS-01/03 | TaskBrief → child Session → validated RunReport plus budget circuit breaker over Craft TaskRunner | TaskRunner, Session, Task, permission | accepted R6 spec | R4 + R5 |
| 7 | R7-CANVAS | SYS-05 | Canvas projects real Session/Artifact state and invokes one governed action | Craft shell/views + R4/R5 | accepted R7 spec | R5 + E5a |
| 8 | R8-WORKFLOW | SYS-07 | Promote the completed R3 chain to a finite versioned DAG without adding an executor | TaskRunner + governed actions | accepted R8 spec | R4 + R5 |
| 9 | R9-MEMORY | SYS-03 | Layered agent-maintained memory: working notes → logged consolidation → curated layers; optional curation; D5 floors | Workspace files + Session evidence + search index | accepted R9 spec | repeated R3 chains |
| 10 | R10-DESIGN-WEB | SYS-05 | Native design document plus versioned web edit/preview/export loop | Craft shell, TipTap/previews, R4/R5/R7 | accepted R10 spec | R4 + R5 + R7 |
| 11 | R11-JOB-IMAGE | SYS-06 | Extract one cancellable Job from a real image-generation loop and preserve provenance/cost | provider backends, UsageTracker, R4/R5 | accepted R11 spec | R4 + R5 |
| 12 | R12-VIDEO-AUDIO | SYS-06 | Media import, sequence editing, audio/captions, cancellable/retryable render and delivery | files/previews + R11 Job | accepted R12 spec | R11 |
| 13 | R13-DECK-SPATIAL | SYS-05/06 | Deck/motion export and 3D/panorama/relight/shot-grid manifests | R10 native documents + R11/R12 Job/Artifact | accepted R13 spec | R10 + R11 + R12 |
| 14 | R14-REMOTE-MSG | SYS-02 | User-owned remote target, worktree/Git/PR, grants and Workspace-scoped messaging | Craft transport, TaskRunner, messaging, settings | accepted R14 spec | R6 |
| 15 | R15-MARKET | SYS-08 | Local discovery, trust, install, loadout, rollback and revoke for Skill/plugin/MCP packages | Craft Skills/Sources/MCP/credentials/settings | accepted R15 spec | R6 + R9 |
| 16 | R16-COMPUTER | SYS-02/04 | Exhaust Craft structured routes on a real task, then add the smallest fallback or close `NO_GAP` | BrowserPane/CDP, file/shell/API, remote, permission | accepted R16 spec | R14 |
| 17 | R17-ADAPTIVE | SYS-01/03 | Add explainable routing/organization from accepted-outcome traces, or close `NO_GAP` | provider seam, UsageTracker, Task/Session | accepted R17 spec | R6 + R9 + R12 |
| 18 | R18-CONDITIONAL | SYS-01/02/05 | Resolve PTY, stronger sandbox and docking individually by implementation or gate-backed `NO_GAP` | Craft shell/process/isolation/settings | accepted R18 spec | R10 + R12 + R16 |

## Definition of done for every task

- A real path exists from caller through persistence/events back to the relevant surface.
- Required normal, empty, failure, denied, offline, cancel and recovery states are observable.
- The cheapest sufficient verification ran; type checking alone is not completion.
- Reference mechanism, license, same-task alternative and deletion test are in the admission ledger.
- The affected spec, registry/matrix row, page state and user-facing documentation are synchronized.
- Reports use exactly one capability status: `usable`, `wired but not visually checked`,
  `display-only`, or `not implemented`.

## Shared verification commands

Run from `app/`; a task packet may add commands but cannot omit the applicable level:

```bash
bun run typecheck:electron
bun test <changed-package-or-test>
bun run validate:dev
```

High-risk tasks also require a real data-path check, cancel/recovery coverage and independent
verification. Git, remote targets, credentials, deletion, publication or a new authority stop at
the [`OWNER-GUIDE.md`](OWNER-GUIDE.md) checkpoint.

## Handoff format

```text
TASK: <Task ID>
STATUS: usable | wired but not visually checked | display-only | not implemented
CHANGED: <exact paths>
AUTHORITY: <canonical store/contract>
EVIDENCE: <commands, fixtures, output paths>
REFERENCES: <admission IDs and exact symbols>
RECOVERY: <cancel/offline/denied/retry behavior>
DOCS: <updated spec, registry/matrix, page and user docs>
BLOCKER: <smallest unresolved decision, or none>
```

“Page complete” and “tests pass” never replace a capability status or real-path evidence.
