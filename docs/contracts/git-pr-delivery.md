# Git / PR Delivery Protocol (Agent-first)

> **Class:** behaviour contract (text freeze; not a WAVE gate alone).  
> **Authority:** Lead. Aligns with M02 terminal, M03 actions, M04 TeamRun, M05 leases, D51/D52.  
> **Updated:** 2026-07-10  
> **Owner intent:** Multi-agent parallel work and multi-project delivery; prefer **Agent/automation**
> over human PR review chrome.  
> **Not:** An IDE, a Graphite/GitHub PR product shell, or orchestration via PR instead of TeamRun.

## 1. What a PR is (product vocabulary)

A **Pull Request (PR)** is a **remote Git collaboration protocol**: propose merging a branch’s
commits into a base branch after optional CI and review policy.

It is **not**:

- the Fleet TeamRun / Workflow orchestrator;
- a required human-facing review workstation in v1;
- a substitute for M05 file leases during concurrent local edits.

Code’s native model remains (`PROJECT-DIRECTION`): **files, diffs, commands, tests, git state**.
PR is one durable shape of **git state + remote handoff**.

## 2. Importance under multi-agent + multi-project

| Need | Primary Fleet mechanism | PR’s role |
|---|---|---|
| Who does which task | M04 TeamRun / seats | None |
| Concurrent file writes | M05 leases (+ optional worktree/branch) | None (too late if disk already stomped) |
| Multi-step capability graph | M17 Workflow | None |
| Land changes on **remote main** with CI | git + host (GitHub/GitLab) | **Yes — delivery envelope** |
| Cross-repo / multi-project isolation | workspace roots + per-repo git | One PR **per repo** by default |
| Human-free operation | M03 actions + L2 for risk | Agent runs `git`/`gh` (or equivalent) |

**Conclusion:** With multi-agent parallel **and** multi-project remote delivery, a **PR protocol**
(Agent-operated) is **worth having**. A **human PR review surface** is **not** a v1 product goal.

## 3. Recommended lifecycle (Agent-first)

```text
TeamRun assigns code work
  → isolation: lease paths and/or branch/worktree (see subagent-context-handoff)
  → Agent mutates files under scope
  → tests/lint via terminal actions
  → commit + push branch (permissioned)
  → open PR (permissioned)
  → CI observed (poll/webhook when integrated)
  → optional review Agent: read diff → RunReport / comment artifact
  → merge only if policy + permission allow (often L2)
  → timeline evidence: commands, PR URL, CI conclusion, merge result
```

Humans may never open the host PR page; they see **Fleet timeline / RunReport**. High-risk steps
still go through M00 approval.

## 4. Capability layers (do not collapse)

| Layer | Status intent | Notes |
|---|---|---|
| **L0 Local git** | Early with M02/M03 | status, diff, commit; no remote required |
| **L1 Remote PR actions** | When multi-repo delivery needed | create/view/list checks/merge via CLI or API actions |
| **L2 Host integration** | Optional later | GitHub App / webhooks to mirror PR status onto work items |
| **L3 Human PR UI** | **Not planned as product shell** | External browser to host if needed; D51 |

## 5. Absorbed reference: Multica GitHub integration (black-box)

Studied pattern (not green-light product clone; Multica remains retired as a shell reference):

| Multica does | Fleet takeaway |
|---|---|
| **GitHub App install** at workspace, not “login as user identity” for the app account | Prefer App/installation for repo events; user login stays Fleet/Craft auth |
| Webhook mirrors **PR metadata** onto **issues** | If Fleet later has work items, link by id; do not invent a second tracker lightly |
| Issue sidebar lists PRs; click opens **GitHub** | Status chip + deep link > embedded full PR review UI |
| Read-heavy permissions; auto Done on merge | Agent/system may advance work state on merge with explicit policy |
| **No** full PR review console in-app | Matches Fleet: Agent review reports, not human PR studio |
| User auth is Google/email; GitHub connect is separate | Do not conflate “GitHub login” with “GitHub App for PR mirror” |

License: Multica is Apache-2.0 **plus** commercial hosting restrictions—**no** derivative product
embedding without promotion + license review.

## 6. Forbidden

| Forbidden | Prefer |
|---|---|
| PR as **primary** multi-agent orchestrator | TeamRun + Workflow |
| Human PR review **shell** as early UI | Agent `gh`/API + timeline |
| Using PR alone to fix concurrent local writes | M05 leases + path isolation |
| Silent merge of protected branches | L2/L3 + evidence |
| Copying Multica/Lobe/etc. Git UI | Craft shell + actions |

## 7. Acceptance (when L1 PR actions ship)

1. Agent can open a PR for a scoped branch with evidence on the session timeline.  
2. CI failure is visible without embedding a full GitHub SPA.  
3. Merge requires policy + permission; default is not silent auto-merge to main.  
4. Multi-project: PR actions are scoped to one git root unless brief allows multi-root.  
5. No second session/permission path for git operations.

## 8. Absorb record

| Date | Note |
|---|---|
| 2026-07-10 | Owner: multi-agent + multi-project; PR better?; Agent/automation over human UI. |
| 2026-07-10 | Multica study: App+webhook PR mirror, not PR review product; not GitHub IdP. |
| 2026-07-10 | Bound to M02/M03/M04/M05; complements `subagent-context-handoff.md`. |
