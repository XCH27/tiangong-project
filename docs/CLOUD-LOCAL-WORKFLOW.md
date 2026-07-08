# Cloud and Local Agent Workflow

This document defines how Fleet uses GitHub and the local checkout during the documentation
cleanup phase and later implementation work.

## Source of Truth

GitHub is the integration source of truth. The current integration branch is
`work/fresh-base-spine`.

Local checkouts are workspaces for editing and real behavior checks. A local checkout may be
temporarily ahead, behind, or dirty, but it must be synchronized through branches and pull
requests before its work counts as shared project state.

## Current Documentation Phase

The current phase is documentation cleanup. Agents should improve project documentation,
coordination rules, and work packet clarity before changing application code.

Allowed by default:

- `AGENTS.md`
- `README.md`
- `docs/*.md`
- `docs/modules/*.md`
- `docs/agent-packets/*.md`
- `.github/ISSUE_TEMPLATE/*`
- `.github/PULL_REQUEST_TEMPLATE.md`

Not allowed by default:

- `app/`
- `scripts/`
- `package.json`
- third-party source checkouts under `源码参考/software/*` or `源码参考/plugins/*`

Any task that needs a forbidden file must stop and ask the Lead for a new packet.

## Branch and PR Flow

Every agent works on its own branch. No agent pushes directly to `main` or
`work/fresh-base-spine`.

```bash
git fetch origin --prune
git switch -c docs/<short-task-name> origin/work/fresh-base-spine
```

After editing:

```bash
git status --short
git diff --check
git add <owned files>
git commit -m "docs: <short task summary>"
git push -u origin docs/<short-task-name>
```

Open a pull request into `work/fresh-base-spine`. The Lead reviews and merges.

## Local Sync

Before reviewing or starting new work locally:

```bash
git fetch origin --prune
git status --short --branch
git log --oneline --left-right HEAD...origin/work/fresh-base-spine
```

If the local checkout has uncommitted changes, do not pull over them. Either commit them to a
task branch, stash them with a clear message, or move to a clean worktree.

After a PR is merged:

```bash
git switch work/fresh-base-spine
git pull --ff-only
```

## Cloud vs Local Responsibilities

Use cloud agents for:

- documentation edits
- read-only documentation review
- GitHub templates and PR descriptions
- static consistency checks
- CI and scheduled automation review

Use local agents for:

- Electron launch checks
- UI and visual checks
- terminal, PTY, browser, and file-system behavior
- workflows that use local credentials or local files
- final review when feature status depends on real app behavior

## Minimal Documentation Agent Setup

Use two agents during documentation cleanup:

1. **Documentation Cleanup Agent** edits documentation in a dedicated PR.
2. **Read-only Documentation Reviewer** reviews that PR and does not commit.

Do not split documentation cleanup across more agents unless the Lead first assigns
non-overlapping file ownership.

## Prompt: Documentation Cleanup Agent

```text
You are the Fleet Documentation Cleanup Agent.

Goal:
Improve the active project documentation so future agents can understand the source of truth,
cloud/local sync workflow, branch/PR rules, and documentation-phase boundaries.

Base branch:
origin/work/fresh-base-spine

Create branch:
docs/fleet-docs-cleanup

Read first:
1. AGENTS.md
2. README.md
3. docs/README.md
4. docs/START-HERE.md
5. docs/PROJECT-DIRECTION.md
6. docs/DECISIONS-LEDGER.md
7. docs/DEVELOPMENT-PROCESS.md
8. docs/PARALLEL-AGENT-OPERATING-MODEL.md
9. docs/OWNERSHIP-MATRIX.md
10. docs/WAVE-MODULE-MAP.md
11. docs/CLOUD-LOCAL-WORKFLOW.md

Allowed files:
- AGENTS.md
- README.md
- docs/*.md
- docs/modules/*.md
- docs/agent-packets/*.md
- .github/ISSUE_TEMPLATE/*
- .github/PULL_REQUEST_TEMPLATE.md

Forbidden files:
- app/
- scripts/
- package.json
- docs/legacy/
- 源码参考/software/*
- 源码参考/plugins/*

Tasks:
1. Keep active docs English-only and remove references to nonexistent active files.
2. Keep AGENTS.md as a concise execution summary, not a second roadmap.
3. Clarify read order, branch/PR flow, and cloud/local responsibilities.
4. Make documentation-phase boundaries explicit: docs may change; app code must not change.
5. Preserve the exact status labels: usable, wired but not visually checked, display-only, not implemented.

PR requirements:
- Target branch: work/fresh-base-spine.
- List files changed.
- List conflicts fixed.
- List remaining open questions.
- Report documentation status using the allowed status labels.
```

## Prompt: Read-only Documentation Reviewer

```text
You are the Fleet Read-only Documentation Reviewer.

Goal:
Review the documentation cleanup PR for contradictions, missing workflow steps, bad links,
and unclear agent boundaries. Do not edit files and do not commit.

Review:
1. AGENTS.md
2. README.md
3. docs/README.md
4. docs/START-HERE.md
5. docs/CLOUD-LOCAL-WORKFLOW.md
6. docs/DEVELOPMENT-PROCESS.md
7. docs/PARALLEL-AGENT-OPERATING-MODEL.md
8. docs/OWNERSHIP-MATRIX.md
9. docs/WAVE-MODULE-MAP.md

Check:
1. There is one active documentation source of truth.
2. Branch and PR rules are clear.
3. Cloud vs local responsibilities are clear.
4. Documentation agents are not allowed to modify app code by default.
5. No active document points to nonexistent files.
6. Status wording uses only usable, wired but not visually checked, display-only, not implemented.

Output:
- Findings first, ordered P0/P1/P2.
- Include file path and line number for every finding.
- End with one recommendation: approve, request changes, or comment only.
```
