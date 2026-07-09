# grok-4.5-08 — Risk Register

**Model:** Grok 4.5  
**Date:** 2026-07-09  

Severity: **S0** ship-stopper · **S1** high · **S2** medium · **S3** low  
Likelihood: **L** low · **M** medium · **H** high  

---

## 1. Active Risks

| ID | Risk | Sev | Lik | Trigger | Mitigation |
|---|---|---|---|---|---|
| R01 | Parallel workers implement against contradictory contracts | S0 | H | Open W1/W2 before P0 | Series A doc patches; block workers |
| R02 | Second session/event model forks Craft spine | S0 | M | New SessionEvent ignoring dto | Extend/map existing events |
| R03 | Ownership invents parallel packages | S0 | H | Workers follow matrix literally | Rewrite matrix to real paths |
| R04 | Browser automation violates ToS/compliance stance | S0 | M | Implement click/type/eval on external sites | Fix M06; enforce redlines in review |
| R05 | Action ID drift docs vs code | S1 | H | Already true | Sync + CI check |
| R06 | Namespace rename cost explodes after code lands | S1 | H | `.fleet` paths ship | Freeze slug before code |
| R07 | TeamRun depends on unfinished Batch/M11 | S1 | M | M04 implements batch early | Thin MVP; defer batch |
| R08 | Overbuilt canvas schema fights OpenPencil | S1 | M | Freeze CanvasDocument now | Draft until adapter spike |
| R09 | Process theater (waves/boards) without progress honesty | S1 | H | False In Progress | Status hygiene |
| R10 | Reference tree copy contamination | S1 | M | Agent copies Lobe/fleet-old/tapnow | Packet-scoped refs; policy |
| R11 | Manager Agent becomes superuser | S1 | M | Underspecified permissions | Whitelist + no L3 bypass |
| R12 | Memory modules create second store pre-M10 | S2 | M | Surface modules cache private memory | Explicit ban in modules |
| R13 | Messaging scope creep | S2 | M | Treat gateway as core product | W5 govern only |
| R14 | Optimistic 8-week plan drives burnout/false usable | S2 | H | Planning from comparison doc | Ignore for scheduling |
| R15 | Electron resource limits under multi-agent + video + canvas | S2 | M | OV-002 concurrency | Queues; externalize gen; serialize render |
| R16 | Upstream Craft sync pain | S2 | M | Heavy local edits to core | Minimize core forks; Lead-owned protocol |
| R17 | Plugin namespace redesign after plugins exist | S2 | L | M12 rule wrong then plugins ship | Fix rule pre-W4 |
| R18 | Dual openpencil directories confuse copy source | S3 | M | Engineers pick wrong tree | Canonical path in README |
| R19 | Absolute file links break on other machines | S3 | H | Already in docs | Relative links |
| R20 | Multi-model review packages diverge wildly | S2 | M | No comparison rubric | Use intersection of C1/S0 |

---

## 2. Blockers (Now)

| ID | Blocker | Owner | Unblock action |
|---|---|---|---|
| B01 | Semantic W0 incomplete | Lead | A2 stubs or deferrals |
| B02 | Action contract split-brain | Lead | A3 sync |
| B03 | Permission triple language | Lead | A4 map |
| B04 | Ownership unusable | Lead | A6 rewrite |
| B05 | Browser policy contradiction | Lead | A5 fix |
| B06 | Product slug undecided | Owner+Lead | A1 decision |
| B07 | BLK-001 vs W1 open ambiguity | Lead | Clarify skeleton-only |

---

## 3. Open Decisions (Need Human Input)

| ID | Question | Why it matters | Grok recommendation |
|---|---|---|---|
| O01 | Technical slug: `craft` vs `fleet` vs `tiangong`? | Paths, enums, packages | Prefer `craft` / `@craft-agent` alignment |
| O02 | Keep “Fleet” as marketing name? | Doc cleanup scope | Display-only or drop |
| O03 | External browser click forever forbidden? | Compliance product identity | **Yes, forbidden** for remote sites |
| O04 | First demo: file action or terminal? | Wave narrative | File action Demo-1 then terminal Demo-2 |
| O05 | Manager Agent in ActorKind? | Protocol shape | Yes, distinct kind |
| O06 | Rename role:lead → captain? | Collision with repo Lead | Yes |
| O07 | SessionEvent extend vs new type? | Migration cost | Extend or explicit map name |
| O08 | Promote any new green-light now? | Legal/copy risk | **No** until module need |

---

## 4. Risk Heatmap (qualitative)

```
        Likelihood →
        L        M        H
S0             R02     R01 R03
S1      R17  R07 R08   R05 R06 R09 R10 R11
S2      R18  R12 R13   R14 R15 R16 R20
S3             R19
```

---

## 5. Early Warning Signals (during future implementation)

Stop and re-open docs if you see:

1. Worker PR creates `app/packages/timeline` or second session DB  
2. Action executed without Session/timeline evidence  
3. Browser tool clicking third-party sites in demos  
4. Packet lists >3 reference repos  
5. “usable” claimed with only unit tests  
6. New action IDs merged without version bump  
7. TeamRun waiting on Batch API for interactive coding  
8. `.fleet` and `.craft` both appearing on disk  

---

## 6. Residual Risk After P0 (expected)

Even after Series A:

- Craft core complexity remains high  
- Creative surfaces still large  
- Multi-agent quality will lag single-loop quality  

These are **normal product risks**, not documentation failures.

---

## 7. Comparison Hook for Other Models

When merging multi-model output, build:

| Column | Source |
|---|---|
| Risk ID (normalize) | Each model’s Rxx |
| Sev intersection | Models agreeing S0/S1 |
| Mitigation | Prefer most concrete file-level fix |

Grok’s mandatory set: **R01–R06, R09, B01–B07**.

---

## 8. Closure Criteria for This Register

Risks R01–R06 and B01–B07 move to **mitigated** only when:

- Series A checklist in `grok-4.5-06` is complete  
- Lead announces revised W0 semantic gate  
- W1 packet no longer grants frozen-contract mutation  

Until then, treat implementation as **premature**.
