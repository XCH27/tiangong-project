# Fleet — AI Work Workbench

A **local-first desktop workbench** where a person and their agents operate the same artifacts in
the same place. Fork of Craft Agents (Apache-2.0). What Fleet is and is not:
[`docs/PRODUCT.md`](docs/PRODUCT.md).

Project vision and the Harness architecture are documented in
[`docs/WHITEPAPER.md`](docs/WHITEPAPER.md).

> Craft supplies the look and the agent/runtime **base** (currently **v0.13.3**). Cindy supplies
> how features are implemented and how surfaces talk to the backend — **capabilities, not
> typesetting**. OpenChamber supplies Git/GitHub. Canvas, documents and video are Fleet's own.

## First run on a new machine

```bash
bash scripts/init.sh        # wires the commit gates, checks the toolchain and the Craft pins
bash scripts/fleet-verify.sh   # the full gate
```

`scripts/init.sh` is not optional. The pre-commit gate is wired through `core.hooksPath`, which
lives in `.git/config` and **is not carried by a clone** — until 2026-09-20 a fresh clone silently
ran no typecheck, i18n or doc-contract gate at all.

## Where to start

| Who you are | Start at |
|---|---|
| Executing agent | [`AGENTS.md`](AGENTS.md) |
| The owner | [`docs/OWNER-GUIDE.md`](docs/OWNER-GUIDE.md) |
| What Fleet is | [`docs/PRODUCT.md`](docs/PRODUCT.md) |
| What integrates next | [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md) — one ACTIVE row |
| Capability status | [`docs/08-CRAFT-CAPABILITY-MAP.md`](docs/08-CRAFT-CAPABILITY-MAP.md) |

## Repository layout

| Path | What it is |
|---|---|
| `app/` | Runnable application. Craft **v0.13.3** base plus Fleet work on top. |
| `docs/` | Product authority. [`PRODUCT.md`](docs/PRODUCT.md) wins disagreements. |
| `源码参考/` | Read-only reference checkouts (`/Volumes/AIGC/天工参考/源码参考/`). Not product code. |
| `UI参考/` | UI kits only. Not product authority. |

## Current state (honest)

- **Base:** `app/` tracks Craft Agents OSS **v0.13.3** (rolling pin `源码参考/software/craft-agents-oss` at tag `v0.13.3`). v0.10.5 remains a *look* measurement pin, not a shell to restore.
- **Upstream is ahead: v0.13.4 exists and we are not on it.** It is not a patch release — it ships
  agent steering / mid-stream queueing, context-window usage and a composer viewport rewrite as
  upstream code, none of which this fork has. **Do not hand-build those three.** Measured delta and
  rebase cost: the P2 note in [`docs/02-DECISIONS.md`](docs/02-DECISIONS.md). Sequencing: take the
  tag *after* `fleet-baseline-r0`, never before. `scripts/init.sh` warns when the pin falls behind.

### Branches (one working line)

| Branch | What it is |
|---|---|
| `work/craft-0.12-rebase` | **The working line.** HEAD. The name is historical — the tree is v0.13.3, not v0.12.0. |
| `work/fresh-base-spine` | Ancestor of the working line (0 unique commits). The R0 work done *on its renderer* is closed; do not cut `fleet-baseline-r0` there. |
| `main` | Ancestor, 73 commits behind, last moved 2026-07-26. Not a release line. |
| `backup/pre-r0-audit-2026-09-09` | **Keep.** The last tracked mirror content is reachable here (`AGENTS.md` preflight cites it). |
| `backup/pre-r0-audit` | **Keep.** Older dirty-tree snapshot, 2026-07-20. |
| `archive/musing-dubinsky-2026-09-20` (tag) | A removed worktree's final state (2157 files). 53 of them are the output of a broken automated link rewrite; archived, not adopted. The worktree itself was 1.8 GB and was deleted on 2026-09-21. |
| `archive/stash-2026-07-31-unlanded` (tag) | **43 files of work that was never landed** — see below. |

### Unlanded work you would otherwise never find

`git stash` has held **43 files, +1006/−730**, since **2026-07-31**, based on `f8a340021` on
`work/fresh-base-spine`. Nothing in this repository mentioned it until 2026-09-21, and a `git stash
clear` would have destroyed it silently, so it is now also reachable as the tag
`archive/stash-2026-07-31-unlanded`.

It is **not** already in the tree: spot-checked by grepping for the double-settle guard it adds to
`app/apps/cli/src/client.ts`, which is absent from the current branch. It touches `SessionManager`,
`transport/server.ts`, `claude-agent.ts`, `pre-tool-use.ts`, `search.ts`, `mode-manager.ts`,
markdown/HTML-preview components and more, and every file it touches still exists.

**It predates the 2026-09-11 v0.13.3 rebase**, so applying it wholesale will conflict heavily and
must not be attempted as one operation. Treat it as a salvage list to review hunk by hunk after the
`fleet-baseline-r0` tag exists, not as a branch to merge. Inspect with:

```bash
git stash show -p stash@{0}          # or: git show archive/stash-2026-07-31-unlanded
```

  Every branch except the two `backup/*` snapshots is an ancestor of the working line, so there is
  nothing to merge — consolidation here means naming, not integration.
- **Board and conversation are separate navigators.** `/board` is not a session-list view mode.
- **Canvas is `not implemented`.** Do not put an empty pane in the default window. When it is built, the reference is Canvasight's same-board Pages/Tasks/Assets.
- **Assistants** exist as a domain (`packages/shared/src/assistants`) and are **not** on the chrome yet. A kit is not a label.
- **ACTIVE release is R0** (Craft v0.13.3 baseline stabilization) — see
  [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md), which owns release order. R15 is `DEP`, not ACTIVE.
  Whatever R0 retains, it is not rearranging Craft chrome.
- R0 on the discarded `work/fresh-base-spine` renderer is closed. Do not cut `fleet-baseline-r0` on that tree.
- **The working tree is dirty on purpose and R0 is the job of explaining it.** The count changes as
  intake and review work lands, so never treat it as a completion percentage. Reproduce the split
  against the rolling Craft pin before touching it:

  ```bash
  U=源码参考/software/craft-agents-oss
  git status --porcelain | sed 's/^...//' | while read p; do
    rel=${p#app/}; [ -f "$U/$rel" ] && cmp -s "$p" "$U/$rel" && echo "INTAKE $p" || echo "FLEET  $p"
  done
  ```

  Only the non-intake paths carry Fleet decisions worth reviewing. Do not reset or overwrite the
  tree to make it look clean.
- **P6 is not finished, whatever the R1 row used to say.** 62 zh-Hans strings still say 工作区 beside
  50 saying 项目; the top bar switches Workspace while the sidebar row named 项目 only filters. See the
  R1 row in [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md) and OV-008 in
  [`docs/design-library/OWNER-VOICE.md`](docs/design-library/OWNER-VOICE.md).

`源码参考/` and `UI参考/` are gitignored symlinks. Preflight: [`AGENTS.md`](AGENTS.md).

There are no near/mid/far-term buckets. Every capability maps to R0–R18 through
[`docs/modules/PACKET-INDEX.md`](docs/modules/PACKET-INDEX.md); conditional rows must end in a
small proven Craft extension or `NO_GAP` evidence. External source is consumed only at that row via
[`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](源码参考/meta/CAPABILITY-REFERENCE-MAP.md), never as a
replacement roadmap or product kernel.
