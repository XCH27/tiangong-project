# Backend-Value Port Policy (No Old UI)

> **Binding decision:** D50  
> **Owner:** Lead  
> **Updated:** 2026-07-10  
> **Intent:** Owner rejects old Fleet UI design. Migrate **backend value that fits the product spine**, not screens.

## 1. Visual / UI baseline

| Source | UI policy |
|---|---|
| Clean Craft Agents **v0.11.0** shell | **retain** as the only starting UI chrome (then simplify via M16) |
| Current monorepo `app/` experimental UI / playground productization | **drop** as design reference |
| `源码参考/software/fleet-old` renderer/pages/skins | **drop** — never copy layout, tokens, nav, or “almost product” panels |
| Future modular surfaces (terminal, canvas, jobs…) | **new** UI against Craft shell + M16 contributions; not resurrected old screens |

## 2. What “backend-valuable” means

A backend slice is a port candidate only if **all** hold:

1. Completes or enables a real loop (UI can be thin/new later).  
2. Routes through **one** session / permission / timeline / action path (M00/M03).  
3. Has a clear owner module and does not invent a second store.  
4. Fits DECISIONS + FORBIDDEN (no stealth, no second shell, no display-only fake usable).  
5. Listed in the migration ledger as **adapt** with source path + target v0.11 extension point.

## 3. Classification snapshot (Fleet / fleet-old / current app)

### 3.1 Prefer **adapt** (backend / protocol — fits current scheme)

| Area | Why valuable | Module / wave | UI note |
|---|---|---|---|
| ActorRef / SessionEvent kinds | Shared audit & identity | M00 / W1 | No UI port |
| AgentSeat, RuntimeLane, TeamRun types | Fleet owns team; CLI owns run | M00/M04 / W1–W2 | Host UI later via Craft + thin host |
| Internal Action registry (`internal-action`, action ids) | Human/Agent same path | M03 / W1 | New controls bind to actions later |
| Workspace file leases | Conflict-safe multi-agent writes | M05 / W2 | File pickers = Craft/new |
| ArtifactRef / provenance envelopes | Cross-module handoff without second asset DB | M05 / W2–W3A | Canvas shows refs only |
| ExternalJob + M11A cost vocabulary | Durable async work + honest cost | M08/M11A / W2–W3A | Jobs panel = new M16 contribution |
| Fleet Bridge event pipe (narrow) | CLI evidence into session | M02/M04 / W2 | Terminal chrome = new or Craft-native |
| BrowserPane **main/CDP host** (upstream) | Evidence capture stack | M06 / W3A | Overlay UI redesigned; keep host |
| Session/workspace/project/task **storage** (v0.11) | Single local authority | M00/M01 | Craft UI retained |
| Messaging **gateway packages** (not settings chrome) | Governed channel later | M15 / W5 | Settings IA rewritten under M13 |

### 3.2 **retain** upstream Craft (including its UI chrome)

| Area | Note |
|---|---|
| Electron shell, chat/session workbench, settings shell structure | Starting point; may simplify, not replace wholesale |
| Browser toolbar/empty states that ship with v0.11 | Keep until M06 redesign packet |
| Views.json / panel stack primitives | M16 registers into these; does not fork a second shell |

### 3.3 **drop** (old UI / low-value / misaligned)

| Area | Reason |
|---|---|
| fleet-old / old Fleet **visual design**, custom nav skins, marketing layouts | Owner dissatisfaction; D50 |
| Playground demos presented as product surfaces | Display-only risk |
| Canvas/design **UI** from old trees before M07 spike | Wrong host assumptions (OpenPencil-as-shell etc.) |
| Second workbench / parallel “Fleet home” pages | Violates D27-R / D42 |
| Any UI that bypasses action registry (button-only writes) | Violates D7/D40 |
| Quota/stealth/account-rotation UI | D23 |

### 3.4 **defer** (maybe later, not early spine)

| Area | Why defer |
|---|---|
| Full messaging settings UX | M15 after spine |
| Fancy kanban productization | Upstream task UI may stay; not a second task system |
| Plugin marketplace UI | M12 distribution W4 |
| Multi-surface creative editors UI | After D45 proof |

## 4. Agent rules when porting

1. Default for `renderer/**`, CSS tokens, layout graphs from fleet-old/current experiments: **drop**.  
2. Default for `protocol/**`, server handlers, storage, main-process hosts that match §3.1: evaluate **adapt**.  
3. If a complete loop needs a surface, **design new UI** on Craft shell + M16 — do not resurrect old screens “to save time.”  
4. If unsure: **defer** + ledger row; never silent UI copy.

## 5. Relationship to clean base

```text
clean Craft v0.11 UI shell  ──retain──►  simplify via M16
old Fleet / fleet-old UI    ──drop────►  do not port
old Fleet backend value     ──adapt───►  protocol/runtime/jobs/leases (ledger rows)
```
