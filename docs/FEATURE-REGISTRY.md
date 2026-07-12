# Feature Registry — who is building which big feature

> **This is a live state file, not a plan document.** It is the *only* thing an in-flight feature area
> shares with the others: a thin, read-only awareness of **who is building which big feature and which
> existing path scope they occupy** — so two areas don't independently build the same big thing (e.g. two agents
> both starting a spatial canvas from scratch).
>
> **The rule it enforces: know the boundaries, not the contents.** You may read this table to see *what*
> others are building and *where*. Do not inspect another **in-flight** branch merely to borrow its
> implementation or widen your scope. Already-merged code and public interfaces remain normal project
> context. Awareness of overlap is the only in-flight detail shared.

## What this is NOT

- **Not a task board / project system.** Craft's projects/tasks are the task authority; this is not a
  second one (`03-NON-NEGOTIABLES.md` #1). No progress %, no assignments, no approvals here.
- **Not for small changes.** Register only a **big feature** with a clearly bounded set of existing
  renderer/RPC/server/shared/package paths. Ordinary fixes/tweaks are not
  registered; that would just be noise.
- **Not a source of truth about code.** It records *claims of territory*, not what was built. The code,
  integration review, and observed behavior are the truth.

## How to use it (every big-feature area)

1. **Before you start**, read this table. If the big feature you're about to build is already listed as
   `in-progress` or `merged`, **do not build a duplicate.** Stop and report to the main agent for a
   decision (join / divide the work / or an explicitly-approved competing implementation).
2. **When you start**, add one row: your feature, your branch, the path scope you occupy, status
   `in-progress`. This is a lightweight edit — it does not require the main agent.
3. **If you discover an overlap or a boundary collision** (your path scopes touch), do not
   resolve it yourself — record it and escalate to the main agent (matches the single-owner /
   main-agent-decides rules in `07-AGENT-RULES.md`).
4. **When your area merges or is dropped**, update your row's status to `merged` / `dropped`. Keep the
   table short — prune long-dead rows into the note section if it grows.

Competing implementations (two areas on the same big feature) are allowed **only** when the main agent
has explicitly approved it as deliberate competition for a high-risk/high-uncertainty feature
(`07-AGENT-RULES.md` → bounded feature development). Mark both rows `competing` and note the
decision.

## Registry

> Status values: `in-progress` · `merged` · `dropped` · `competing`.
> Keep rows to big features only. One row per area.

| Big feature | Branch | Occupies (folder / scope) | Status | Notes |
|---|---|---|---|---|
| _(none yet — stabilize the current baseline before Milestone 1)_ | — | — | — | See `04-MILESTONES.md`. |

## Notes / resolved overlaps

_(Record here any overlap the main agent resolved, and any dropped/superseded areas, so the history is
visible without cluttering the live table.)_
