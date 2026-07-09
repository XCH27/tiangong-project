# grok-4.5-02 — Full Review Report

**Model:** Grok 4.5 (xAI)  
**Date:** 2026-07-09  
**Confidence legend:** C1 = factual contradiction / blocker · C2 = architectural risk · C3 = optimization opinion

---

## Part A — Product Thesis & Philosophy

### A1. Thesis (healthy)

Craft Agents (二开补强) aims to be a **local-first AI work creation platform**: humans own judgment and guardrails; agents execute the middle 80% of production work; every serious mutation is permissioned, timeline-evident, and preferably reversible.

This is a coherent thesis. It correctly rejects:

- Chat-app-only UX  
- IDE clone  
- Figma clone as default shell  
- Account/subscription product for the app itself  
- Stealth / quota-evasion browser product  

### A2. Philosophy strengths

1. **One spine, many surfaces** — correct separation of shared governance vs native engines  
2. **Agent-native UI** — buttons and tools share actions  
3. **Status honesty** — `usable` requires real loops  
4. **Owner-voice translation** — D37 / OV-003 correctly put route choice on agents  

### A3. Philosophy risks

| Risk | Severity | Notes |
|---|---|---|
| Scope gravity | C1 | Modules M00–M14 + F-track + creative engines is a multi-quarter product; docs sometimes imply near-term completeness |
| Contract over-freeze | C1 | Freezing incomplete + over-detailed types at once freezes the wrong things |
| Manager Agent ambiguity | C2 | “No backdoor” is right; missing concrete action whitelist invites superuser creep |
| Memory ambition early coupling | C2 | Seven partitions referenced before M10 exists |
| Parallel-agent process vs thin team | C2 | High process overhead is good for multi-agent coding; overkill until Lead + 1–2 workers |

---

## Part B — Technical Route Selection

### B1. Base platform: Craft OSS Electron + Bun

**Decision (D27-R, PROJECT-DIRECTION §13): KEEP.**

Evidence:

- `app/` is Craft 0.10.5 monorepo with real `server-core`, WS RPC (`MessageEnvelope`), Electron apps, session manager  
- Headless server path exists (`server:dev`, `packages/server`)  
- Rewriting to Tauri would recreate session/permission/browser pane at high cost  

**Optimize:** Document the *real* process topology as-is (Electron main may host or connect to Bun server — clarify single-process vs split for local desktop default).

### B2. CLI ↔ GUI: App Server (Mode 3)

**Decision: KEEP.**

Aligned with Codex/OpenCode pattern: CLI and GUI as equal clients of a local server.

**Gaps:**

- Ownership matrix does not map server-core/session-tools as spine center of gravity  
- Bridge interface is prose-only; types missing from protocol stubs  
- W1 packet invents `@fleet/*` packages that do not exist  

### B3. Internal Action Registry

**Decision: KEEP as primary extension point.**

Code already has a partial frozen contract file:

- `app/packages/shared/src/protocol/internal-action.ts`  
- `CONTRACT_VERSION = '1.0.0'`  
- Limited IDs: file create/update/delete/rename, session ops, `canvas.node_update`, `workspace.rename`  
- Permission levels include `L3_destructive`  

Docs claim more IDs and different version (action-ids v1.2.0). **This is a freeze integrity failure (C1).**

### B4. Terminal / CLI Runtime as first serious loop (D3)

**Direction: KEEP, but reorder narrative.**

Engineering order should be:

1. SessionEvent + Action invoke path (M00/M03)  
2. One file write loop human+agent  
3. Terminal/PTY/runtime lane (M02)  
4. TeamRun single member (M04 thin)  

D3 currently reads as if terminal is *first* everything; WAVE map correctly places it in W2. **Reconcile wording (C1 narrative).**

### B5. RuntimeLane / TeamRun / Bridge

**Direction: KEEP concept; THIN first implementation.**

Full identity-tag matrix + multi-domain seats + plugin cost caps is too heavy for first multi-agent demo.

**Thin MVP:**

- One TeamRun  
- One leader lane + one member lane  
- Bridge: report event / get context / close lane  
- No batch executor dependency  
- Journal optional after crash pain is real  

### B6. Files / Library / Leases

**Direction: KEEP separation (D15).**

Must land before creative surfaces (W3 gate is right).  
PROJECT-DIRECTION Phase 4 “Wave 1” conflicts with M05 = W2 (**C1**).

### B7. Browser surface

**Direction: KEEP BrowserPane extension; FIX policy contradiction.**

Correct:

- Codex-style settings  
- Evidence / annotate / screenshot  
- Full CDP developer-only  

Incorrect in current M06 candidate actions:

- `browser.click`, `browser.type`, `browser.eval` on external sites vs “no DOM mutation” non-goal  

**Hard rule recommendation:**  
External site = read/annotate/evidence only.  
Click/type only if future ADR defines *owned interactive surface* (local preview, user artifact), never default agent tools for remote pages.

### B8. Canvas (OpenPencil)

**Direction: KEEP green-light engine reference; DEFER full document freeze.**

Risks of current specs:

- CanvasDocument node enum frozen early  
- Full keyboard map / minimap / concurrency rAF as if product-ready  
- Conflicts with “adapter over native engine”  

**First canvas slice:** one node type create/update/delete via actions + timeline + undo.

### B9. Video (OpenCut Classic) + FFmpeg

**Direction: KEEP late; THIN player-clip-export first.**

Avoid shipping a full NLE. Bundle FFmpeg when M09 starts, not as W1 distraction.

### B10. AIGC External Jobs

**Direction: KEEP unified ExternalJob model (PROJECT-DIRECTION §7).**

Good: provider interface, Library provenance.  
Watch: jobs.json under `.fleet` naming; timeout defaults; batch mode ownership (M11).

### B11. Memory / context / review (M10)

**Direction: KEEP philosophy (“remember accurately, not more”); implement late.**

Dual-track (evidence timeline vs distilled facts) is strong.  
Do not let W1–W3 modules invent private memory stores.

### B12. Model routing / cost / batch (M11)

**Direction: KEEP API-only routing (D5); CLI bypass.**

Batch native APIs: good cost optimization for offline.  
Do not wire TeamRun interactive coding through batch.

### B13. Skills / plugins (M12)

**Direction: KEEP install vs loadout vs runtime separation (D25).**

**Namespace rule is currently broken** relative to core action IDs (exactly-two-dots + `fleet.*` core). Must rewrite before any plugin work.

### B14. Messaging (M14 / packages exist)

**Direction: GOVERN, don’t grow early.**

Large existing `messaging-gateway` + whatsapp worker. D28 keep-and-govern is right.  
WAVE map mislabels M14 as onboarding (**C1**).

### B15. Daemon / sandbox (D22)

**Decision: KEEP deferred.** Correct.

TeamRun SQLite journal-on-startup is a reasonable middle ground; ensure it does not become a hidden daemon.

---

## Part C — Documentation Control Plane Quality

### C1. What works

- Clear entry (`START-HERE`)  
- Decisions ledger as binding truth  
- Ownership + wave + packets as parallel-dev OS  
- Module closed-loop template intent  
- Human feedback → ledger promotion path  

### C2. Structural defects

1. **Dual product names** across control plane  
2. **Template drift** — modules/README template not applied to most modules  
3. **Thickness inversion** — late surfaces more detailed than spine  
4. **Status fiction** in WAVE phase overview  
5. **Stale absolute `file://` links** in docs  
6. **Chinese section mixed into English PROJECT-DIRECTION §13**  
7. **源码参考/README** points to deleted numbered docs (`docs/26-…`, `docs/27-…`)  
8. **Duplicate §17** in several modules  
9. **LEGACY-LESSONS** still says “Fleet” and encourages browser interaction patterns that conflict with active redlines  

### C3. Contract freeze quality (critical)

| Contract file | Claimed | Assessment |
|---|---|---|
| `action-ids.md` | FROZEN v1.2.0 | Content ahead of code; not fully synchronized |
| `internal-action.ts` | FROZEN v1.0.0 | Real code; incomplete vs docs |
| `protocol-stubs.md` | FROZEN v1.0.0 | Missing core multi-agent types; Canvas types over-included |
| `identity-tags-permission-matrix.md` | frozen | Internally coherent, but tool vocabulary ≠ action-ids; references non-existent `agent-session.ts` |
| Bridge interface in PARALLEL model | “types in stubs” | Types absent from stubs |

**Conclusion:** Calling W0 “passed” is process-true (files exist + headers) but **semantically false** for worker safety.

---

## Part D — Wave & Dependency Graph

### D1. Intended logic (good)

```
W0 contracts → W1 M00+M03 → W2 M01/M02/M04/M05 → W3 surfaces → W4 intelligence → W5 polish
```

### D2. Broken edges

| Edge | Issue |
|---|---|
| M04 → M11 BatchJobExecutor | W2 depends on W4 concept |
| M04 → ExternalJob batch | ExternalJob detailed in M08 W3 |
| PROJECT Phase4 Files = W1 | Map says M05 W2 |
| Phase status In Progress | Modules not started |
| BLK-001 M00 not committed | Contradicts open W1 without stating skeleton-only |
| F-track canvas needs protocol/canvas.ts | Stub present as freeze but not implemented; promotion timing vague |
| W3 needs M05 usable | Correct; ensure M05 not started too late relative to surface pressure |

### D3. Recommended dependency rewrite (conceptual)

```
W0': thin spine types + action IDs synced to code + identity map v0 mapped to actions
W1:  M00 backbone + M03 registry/executor + one file action demo
W2a: M02 terminal loop
W2b: M05 files/leases/library write path
W2c: M04 TeamRun thin (no batch)
W3:  M06 read-only browser evidence; M08 jobs; M07 thin canvas adapter; M09 thin video
W4:  M10 memory; M11 routing/cost/batch; M12 skills loadout
W5:  M13 settings IA; messaging governance; onboarding
```

---

## Part E — Code Reality Snapshot (2026-07-09)

### Present and reusable

- Session manager, WS RPC protocol, channels/events  
- Permissions craft tests, labels, statuses, skills packages  
- Browser pane managers / remote browser capability errors  
- Messaging gateway (substantial)  
- Internal action protocol skeleton  
- Electron + server monorepo scripts including `validate:fleet`  

### Not present (docs speak as if designed/near)

- `AgentSeat` / `RuntimeLane` / `TeamRun` types as first-class protocol  
- Action registry service + executor pipeline as described in M03  
- Library / lease packages  
- Canvas/video/aigc packages under shared  
- `@fleet/*` packages  
- Paths like `shared/src/timeline`, `shared/src/action-registry` (ownership-claimed)  

### Implication

Workers following ownership matrix will create **second trees** next to real Craft packages. That violates “no second spine.”

---

## Part F — Reference Projects (summary; full in 04)

| Source | Policy | Review stance |
|---|---|---|
| craft-agents-oss | Green base | Actual base in `app/`; keep sync discipline |
| AionUi | Green patterns | Strong for CLI runtime catalog / process lifecycle; adapt only |
| open-design | Green patterns | Workflow/artifact; check subdirectory licenses |
| openpencil / open-pencil | Green (naming dupe on disk) | Engine only; not permission system |
| opencut-classic | Green | Prefer over incomplete `opencut` rewrite |
| rtk, codegraph, deepcode-cli, Reasonix | Green limited | Sidecar/adapter preferred |
| lobehub, context-mode | High-risk licenses | Black-box only — policy already right |
| fleet-old | Local history | Treat as legacy experiment; do not re-merge blindly |
| 源码参考 volume | Huge | Good library; high distraction risk without packet-level “allowed refs” |

---

## Part G — Severity-Ranked Finding List

### C1 — Must fix before parallel implementation

1. Product naming / path namespace  
2. Action ID + version sync (docs ↔ code)  
3. Protocol stubs missing multi-agent spine types OR W0 claim reduced  
4. Permission vocabulary unification  
5. Identity-matrix tools ↔ InternalActionId mapping  
6. Browser DOM mutation contradiction  
7. Ownership matrix real paths  
8. Wave/phase status honesty  
9. M14 messaging vs onboarding  
10. Plugin namespace rule vs core actions  
11. Bridge types missing  
12. W1 packet rights vs frozen contracts  

### C2 — Fix soon / shape architecture

1. CanvasDocument over-freeze  
2. M04↔M11 batch dependency  
3. Manager Agent identity  
4. 8-week / competitor table credibility  
5. Module template non-compliance  
6. Memory pre-references  
7. FFmpeg W1 packaging noise  
8. Captain vs Lead vs role:lead naming collision  
9. Dual “Fleet” cost source / brand  

### C3 — Improvements

1. English-only active docs consistency  
2. Absolute file links → relative  
3. Research doc quarantine  
4. Per-module “code reality” section  
5. Thin UX drafts split from contracts  

---

## Part H — Overall Assessment

| Dimension | Score (1–5) | Comment |
|---|---|---|
| Product vision clarity | 5 | Excellent |
| Spine architecture choice | 5 | Excellent |
| Contract executability | 2 | Freeze incomplete / inconsistent |
| Wave plan realism | 3 | Structure OK; status/edges dirty |
| Ownership realism | 2 | Paths wrong |
| Compliance coherence | 3 | Strong redlines; browser actions leak |
| Reference policy | 4 | Policy good; inventory docs stale |
| Ready for multi-worker coding | 1 | Not yet |
| Ready for Lead doc convergence | 5 | Yes |

**Final:** Architecture is worth building. Documentation needs a **convergence sprint**, not more features and not more vision docs.
