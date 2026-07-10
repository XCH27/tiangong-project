# Upstream Baseline and Migration Gate

> **Status:** blocking implementation migration  
> **Owner:** Lead  
> **Verified:** 2026-07-09

## Canonical Upstream

Fleet's upstream base is Craft Agents OSS [`v0.11.0`](https://github.com/craft-ai-agents/craft-agents-oss/releases/tag/v0.11.0), published 2026-07-07. The annotated tag resolves to `f4e172bf372f4ccc7389a189be1e0b0541f96282`.

The current `app/package.json` declares `0.10.5`; it is not the latest upstream baseline. The current repository and Craft Agents upstream have unrelated Git histories, so a normal merge is unsafe and was correctly refused in an isolated worktree.

## Required Migration Route

1. Treat a clean checkout of upstream `v0.11.0` as the next base, not as a patch to apply over the current tree.
2. Produce a path-by-path migration ledger for Fleet-only behaviour currently in `app/` and `源码参考/software/fleet-old`.
3. Port each accepted capability as an adapter or isolated feature on the clean base; do not copy an old shell wholesale.
4. Validate the complete baseline launch/typecheck before porting the first Fleet loop.
5. Only then replace the current `app/` baseline through a reviewed migration branch.

## Why This Gate Exists

The v0.11.0 difference includes upstream Projects, Tasks, Kanban, background-task surfaces, session/CLI changes, and dependency updates. The current tree also contains Fleet-specific protocol and Browser settings additions. A blind directory replacement would lose one side; a Git merge cannot provide conflict guidance because the histories are unrelated.

Before M16/M17 paths are frozen, the migration ledger must classify the upstream Projects, Tasks,
Kanban, background-task, panel/view, and layout behaviour as retain/adapt/drop/defer. Documentation
must not invent a second project/task/panel system while this evidence is missing.

## Old Project Use

`源码参考/software/fleet-old` is an older Craft/Fleet-derived checkout (its own metadata records a v0.10.3-era upstream sync and its manifest is v0.10.4). It is a green-light **reference for selective Fleet behaviour only**, never a base to merge or copy wholesale. Each accepted migration must record source path, source commit, target v0.11.0 path, adaptation owner, license/attribution, and validation evidence.

## W0.1 Exit Evidence

- The Lead records the v0.11.0 migration branch and clean baseline validation.
- A Fleet migration ledger classifies every current `app/` difference as retain/adapt/drop/defer.
- The same ledger records which upstream project/task/background/panel behaviours are reused by
  M04/M16/M17 and which are intentionally excluded.
- The contract re-freeze records the version implemented on that new baseline.
- Only then may W1 implementation packets be issued.
