# grok-4.5-04 — Reference Projects Review

**Model:** Grok 4.5  
**Date:** 2026-07-09  
**Trees reviewed:** `源码参考/`, `docs/REFERENCE-PROJECT-POLICY.md`, green-light claims in module specs

---

## 1. Inventory Health

### 1.1 Layout (good)

| Path | Role |
|---|---|
| `源码参考/software/` | Full apps / agents / editors |
| `源码参考/plugins/` | Libraries, engines, skills, sidecars |
| `源码参考/assets/` | UI screenshots / design refs |
| `clone_repos.sh` / `update_repos.sh` | Local refresh only |

README correctly states third-party checkouts are **not** product source of truth and should not pollute main git status.

### 1.2 Stale documentation links (C1 process)

`源码参考/README.md` still references:

- `docs/26-源码参考使用规则与索引.md`
- `docs/27-源码迁移清单.md`
- `docs/14-源码参考目录专项审计.md`

These are **not** in the active English control plane. Active truth is `docs/REFERENCE-PROJECT-POLICY.md` (+ legacy archive).

**Recommendation:** Rewrite 源码参考 README links to active policy only.

### 1.3 Volume risk (C2)

The tree is large (dozens of software clones + huge plugins like `stitch-sdk`, `open-design`, `remotion`).  
Without per-packet “allowed reference list”, agents will **wander and over-copy**.

**Recommendation:** Every agent packet must list **at most 1–3** allowed reference roots for that slice.

---

## 2. Green-Light Sources — Deep Stance

### 2.1 craft-agents-oss (Apache-2.0) — BASE

| | |
|---|---|
| **Disk** | `源码参考/software/craft-agents-oss` and live product in `app/` |
| **Use** | Main application base |
| **Review** | Correct. Product already is this stack (0.10.5) |
| **Risk** | Diverging `app/` from upstream without sync policy |
| **Rec** | Document upstream sync cadence; never “second Craft” |

### 2.2 AionUi (Apache-2.0) — CLI / ACP / process patterns

| | |
|---|---|
| **Disk** | `源码参考/software/AionUi` (monorepo packages, Electron-oriented) |
| **Use** | Runtime catalog, custom agents, ACP, process lifecycle, team/skill patterns |
| **Review** | Strong fit for **M02** behavior reference |
| **Risk** | Importing a second session/config store (policy already forbids) |
| **Rec** | Adapt patterns into Craft session/permission/timeline; black-box team UI |

### 2.3 open-design (Apache-2.0) — design workflow

| | |
|---|---|
| **Disk** | `源码参考/plugins/open-design` (very large) |
| **Use** | Runtime definitions, prompt transport, artifact/eval, design workflow |
| **Review** | Good for **handoff / artifact** thinking (M06→M07), not as shell |
| **Risk** | Subdirectory licenses; accidental template/asset copy |
| **Rec** | Packet-scoped reads; check LICENSE per subdirectory before any copy |

### 2.4 openpencil (+ open-pencil duplicate)

| | |
|---|---|
| **Disk** | `software/openpencil` and `software/open-pencil` (duplicate naming) |
| **Use** | Native design canvas engine |
| **Review** | Right engine class for M07 |
| **Risk** | Using it as permission/timeline; freezing Craft `CanvasDocument` incompatible with engine model |
| **Rec** | (1) Pick **one** canonical checkout name in README. (2) Adapter layer owns Craft actions. (3) Do not freeze full node enum until spike |

### 2.5 opencut-classic vs opencut

| | |
|---|---|
| **Disk** | both present |
| **Policy** | Classic approved; incomplete rewrite not for copy |
| **Review** | Policy correct |
| **Rec** | README should mark `opencut` as **do-not-copy** explicitly next to classic |

### 2.6 rtk (Apache-2.0)

| | |
|---|---|
| **Use** | Output compression, savings measurement |
| **Review** | Fits M10/M11 context efficiency |
| **Rec** | Sidecar/adapter; no global hook auto-install (policy already) |

### 2.7 codegraph (MIT)

| | |
|---|---|
| **Use** | Local code graph / structured query |
| **Review** | Good for code domain tools later |
| **Rec** | Optional W4+ capability; not spine |

### 2.8 DeepSeek-Reasonix (MIT)

| | |
|---|---|
| **Disk** | Go-heavy ACP/stdio planner/executor ideas |
| **Review** | Useful black-box/green patterns for CLI lane design |
| **Rec** | Do not import Go runtime into Electron spine; reimplement ideas in TS |

### 2.9 deepcode-cli (MIT)

| | |
|---|---|
| **Use** | Skills paths, MCP, CLI/session management ideas |
| **Rec** | Patterns only into M02/M12; Craft owns session |

---

## 3. High-Risk / Black-Box — Policy vs Disk

| Reference | Policy | Disk present? | Review |
|---|---|---|---|
| LobeHub | High-risk community license; no copy | `software/lobehub` | OK to study UI IA only |
| context-mode | ELv2 high-risk | `plugins/context-mode` | No code copy; FTS ideas only |
| OpenClaw | Browser profile/gateway study | may vary | Stealth/profile automation forbidden |
| CloakBrowser | Closed / anti-detect | policy forbids | Keep forbidden |
| Remotion | Bespoke non-commercial risk | `plugins/remotion` | Do not bundle as product dependency without legal check |
| hermes-agent | MIT candidate | present | Dynamic tools — study only |
| omnigent | Apache candidate | present | Orchestration study only |
| mem0 / supermemory / letta / memanto | memory candidates | present | Ideas for M10; no second memory platform |
| dockview / react-resizable-panels / react-rnd | layout | present | Prefer Craft UI stack first; promote only if needed |
| react-timeline-editor | video timeline UI ideas | present | Prefer OpenCut Classic for engine |
| Cline / OpenHands | agent platforms | present | Behavior only; no second agent OS |
| orca | worktree isolation | present | Aligns with parallel agent worktrees — process ideas, not shell copy |
| fleet-old | historical | present | **Dangerous nostalgia** — classify as legacy experiment only |
| tapnow-reverse-config | reverse-engineered client | present | Legal/ethics risk; treat as black-box at most; prefer no use |
| trae-*-kits / doubao-ui-assets | UI kits | present | Visual reference only; not product design system truth |

**Policy quality:** `REFERENCE-PROJECT-POLICY.md` is largely correct.  
**Gap:** disk inventory grows faster than policy table; README still Chinese-legacy.

---

## 4. Architectural Lessons Worth Taking (Behavior Only)

### From App Server peers (OpenCode / Codex-class patterns, via comparison doc + local clones)

- Single local server owns session truth  
- CLI/GUI reconnect to same state  
- Do **not** mirror Cursor’s detached CLI agent  

### From AionUi

- Runtime catalog + diagnostics UX  
- Process lifecycle clarity  
- Avoid multi-agent dashboard as second product  

### From Open Design

- Artifact handoff packages  
- Eval / review as jobs  
- Versioned capability snapshots  

### From RTK / Headroom / Repomix (mixed licenses)

- Compress tool output before LLM  
- Pack repos with secret scanning  
- Measure savings — feed M11 ledger honesty  

### From OpenPencil / OpenCut Classic

- Native document engines beat iframe DOM editing  
- Keep Craft action envelope outside engine  

### From Orca (process)

- Worktree isolation for parallel agents — already in PARALLEL model  

### Explicitly reject

- Stealth browser stacks  
- LobeHub structure copy  
- Building “Omnigent-scale” meta-orchestrator before one TeamRun works  
- Re-absorbing `fleet-old` wholesale  

---

## 5. Mapping References → Modules (recommended max)

| Module | Primary refs (≤3) | Forbidden pull |
|---|---|---|
| M00 | craft-agents-oss | Any second session store |
| M02 | AionUi, Reasonix, deepcode-cli | Full agent platforms as base |
| M03 | craft internal-action, Open Design snapshots | Per-action one-off tools |
| M04 | AionUi patterns, Omnigent **behavior** | Omnigent engine copy |
| M05 | codegraph ideas (index), open-design artifact | File manager clones |
| M06 | Craft BrowserPane, Codex settings **behavior** | Cloak/stealth, OpenClaw automation copy |
| M07 | openpencil | open-design as canvas engine |
| M08 | open-design job ideas | Unapproved provider SDKs without policy |
| M09 | opencut-classic | opencut rewrite, Remotion as core |
| M10 | RTK, mem* **ideas** | mem0 backend, Letta as host |
| M11 | RTK, Reasonix cache ideas | Treating CLI as API route |
| M12 | deepcode-cli skills, AionUi injection boundaries | LobeHub marketplace copy |
| M13 | Craft settings, Codex browser settings IA | TRAE full shell clone |
| M14 | existing messaging packages | AstrBot as product pivot |

---

## 6. Reference Policy Modifications Recommended

1. Update `源码参考/README.md` to point at `REFERENCE-PROJECT-POLICY.md` only.  
2. Add explicit **canonical path** for openpencil (resolve open-pencil vs openpencil).  
3. Mark `opencut` (non-classic) and `fleet-old` and `tapnow-reverse-config` with danger labels in README.  
4. Require agent packets to list allowed reference roots.  
5. Add “last license verified date” column when promoting copy.  
6. Keep green-light promotion process (already good) — enforce it.

---

## 7. Verdict on Reference Strategy

| Question | Answer |
|---|---|
| Is green-light list roughly right? | **Yes** |
| Is black-box discipline right? | **Yes** |
| Is the local tree useful? | **Yes, as library** |
| Is the local tree dangerous? | **Yes, without packet scoping** |
| Should more projects be promoted now? | **No** — promote only when a module needs code |
| Biggest reference mistake to avoid? | Copying orchestration shells (Lobe/Omnigent/fleet-old) instead of extending Craft spine |

---

## 8. Suggested First Reference Spikes (post-P0, still pre-wide implementation)

1. **AionUi → M02 design spike** (doc only): runtime catalog fields mapping to Craft settings  
2. **OpenPencil → M07 adapter spike** (prototype branch later): one node read/write through actions  
3. **OpenCut Classic → M09 thin clip export mapping** (later)  
4. **RTK → output compression adapter interface** (W4)  

No spike should precede P0 contract/namespace cleanup.
