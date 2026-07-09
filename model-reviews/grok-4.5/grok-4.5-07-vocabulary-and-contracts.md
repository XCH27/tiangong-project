# grok-4.5-07 — Vocabulary & Contracts Unification Proposal

**Model:** Grok 4.5  
**Date:** 2026-07-09  
**Status:** Proposal for Lead/owner (not applied)

---

## 1. Goal

One vocabulary so that:

- A human reading OWNER-VOICE  
- A worker reading a module packet  
- A TypeScript compiler consuming protocol  
- An LLM tool manifest  

…all mean the same thing by the same string.

---

## 2. Product Naming Proposal

| Layer | Proposed default | Alternatives |
|---|---|---|
| Display name | Craft Agents (二开补强) | Keep Chinese qualifier if owner wants |
| Technical slug | `craft` | `tiangong` if owner wants brand separation from upstream Craft |
| Disk workspace meta | `<workspace>/.craft/` | only if slug = craft |
| Plugin core reserved | none needed; core uses `domain.verb` | — |
| Plugin prefix | `plugin.<id>.…` | `ext.<id>.…` |
| npm scope (if any) | `@craft-agent/…` (already real) | Do **not** invent `@fleet` |

**Recommendation:** Prefer technical slug aligned with existing `@craft-agent/*` packages to reduce rename cost.  
If “Fleet” remains a product brand, keep it **display-only**, never in paths/enums.

**Decision needed from owner:** brand display vs technical slug.

---

## 3. Actor & Role Vocabulary

### 3.1 Separate two planes

| Plane | Roles | Where used |
|---|---|---|
| **Repo development** | Lead, Worker Agent, Verification Agent | PARALLEL model, packets |
| **Product runtime** | Human user, Manager Agent, Project Agent seats | App, TeamRun |

Never use “Lead” for both without qualifier:

- `repo.lead`  
- `runtime.captain` (or `runtime.orchestrator`)

### 3.2 ActorRef proposal

```ts
type ActorKind = 'human' | 'agent' | 'manager_agent' | 'system'
```

### 3.3 AgentSeat role tags proposal

Keep:

- `role:captain` (rename from role:lead)  
- `role:worker`  
- `role:reviewer`  

Domain / trust layers can stay.

### 3.4 Manager Agent

| Property | Proposal |
|---|---|
| Kind | `manager_agent` |
| Scope | all-sessions / global low-context (D17) |
| Permissions | explicit whitelist actions; no L3 bypass |
| Seat | optional special seat outside ordinary TeamRun |

---

## 4. Permission Ladder (single)

| Level | Name | Meaning | Supervision |
|---|---|---|---|
| L0 | read_only | No durable side effects | No |
| L1 | reversible | Mutates but undo handle required | Optional per policy |
| L2 | irreversible | Cannot fully undo; needs elevated mode or confirm | Yes if policy requires |
| L3 | destructive | High blast radius (delete mass, external send, security) | **Always** |

### Mapping from action table

| destructive column | Min level |
|---|---|
| false + undo supported | L1 |
| false + undo n/a read | L0 |
| true | L2 or L3 (Lead chooses per action) |

### Relationship to decision automation D12

D12 automation grades can remain product language; each automated decision class maps into action levels when executing.

---

## 5. Action ID Grammar

### Core (first-party modules)

```
<domain>.<verb>[.<qualifier>]
```

Examples: `file.create`, `session.set_status`, `canvas.node_update`

### Plugin

```
plugin.<pluginId>.<domain>.<verb>
```

### Forbidden

- Core using `fleet.*` unless slug decision says otherwise  
- Silent overwrite on register  
- Identity matrix inventing `tool.*` aliases without mapping  

### W1 minimal frozen set (proposal)

```
file.create
file.update
file.delete
file.rename
session.rename
session.flag
session.set_status
session.set_labels
workspace.rename
```

Everything canvas/aigc/browser/video: under discussion until owning wave.

---

## 6. Identity Matrix → Actions (proposal sketch)

| Old matrix tool pattern | Maps to |
|---|---|
| `file.read` | future `file.read` or existing read tools outside registry if read-only RPC |
| `file.write` / `file.write.scoped` | `file.create` / `file.update` + lease scope |
| `tool.run_shell` | terminal/runtime actions (M02) not free shell |
| `tool.git_*` | explicit git actions when added |
| `memory.*` | M10 actions only |
| `session.*` | only captain; workers limited |
| `seat.assign` | captain-only TeamRun action |

**Principle:** If it is not an InternalActionId (or an explicitly non-mutating RPC), it is not in the Worker manifest.

---

## 7. Multi-Agent Spine Types (minimal fields)

### AgentSeat

```ts
type AgentSeat = {
  id: string
  sessionId: string
  identityTags: string[]      // role:/domain:/trust:
  displayName: string
  assignedSkills?: string[] | null
  // derived at create time:
  // manifest, loadedSkills, leaseScope
}
```

### RuntimeLane

```ts
type RuntimeLane = {
  id: string
  kind: 'api' | 'cli' | 'terminal' | 'external_job'
  seatId?: string
  cliRuntimeId?: string
  status: 'idle' | 'running' | 'stopping' | 'closed'
}
```

### TeamRun

```ts
type TeamRun = {
  id: string
  sessionId: string
  captainSeatId: string
  status: 'open' | 'closing' | 'closed'
  createdAt: string
}
```

### Bridge (CLI → platform)

```ts
reportLaneEvent(laneId, event)
requestTeamContext(laneId)
closeLane(laneId, outcome)
```

Platform owns team; lane owns process.

---

## 8. SessionEvent Collision Strategy

**Problem:** Craft already has SessionEvent.

**Proposal options:**

| Option | Pros | Cons |
|---|---|---|
| A. Extend Craft SessionEvent kinds | One timeline | Migration care |
| B. New `TimelineRecord` stored alongside | Cleaner new model | Two concepts to teach |
| C. Rename stub type to `ActionTimelineEvent` mapped into Craft | Explicit | Mapping layer work |

**Recommendation:** Option A or C — never two unrelated `SessionEvent` types with same export name.

---

## 9. Cost Source Enum (proposal)

If technical slug = craft:

```ts
type CostSource =
  | 'LOCAL_COMPUTE'
  | 'SUBSCRIPTION_QUOTA'
  | 'BYOK_API'
  | 'EXTERNAL_JOB'
  | 'UNKNOWN'
// avoid FLEET_CLOUD unless product actually sells cloud
```

D26 (no product subscription business) implies no Craft-cloud cost source unless later reversed.

---

## 10. Contract Versioning Policy (tighten)

| Artifact | Version field |
|---|---|
| action-ids.md | header FROZEN vX.Y.Z |
| internal-action.ts | CONTRACT_VERSION |
| protocol-stubs.md | header version |
| identity matrix | header version |

**Rule:** Any Worker packet must pin versions by hash/version string (already partly done).  
**Rule:** CI checks action-ids ⊆ code enum for frozen rows.

---

## 11. Demo Vocabulary (for narrative alignment)

| Demo | Name | Proves |
|---|---|---|
| Demo-0 | Baseline boot | Electron + server run |
| Demo-1 | Same-action write | Human + agent `file.update` → one timeline |
| Demo-2 | Terminal lane | Runtime → transcript → timeline |
| Demo-3 | Thin TeamRun | Captain assigns one worker lane, gets report |
| Demo-4 | Browser evidence | Select/annotate/screenshot, no external DOM write |
| Demo-5 | Canvas one-node | Engine adapter create/update/undo |

Use these names in WAVE map instead of ambiguous “Phase In Progress.”

---

## 12. Words to Ban in Active Specs (process)

| Avoid | Prefer |
|---|---|
| “Frozen” without version sync | “Frozen vX; code CONTRACT_VERSION=X” |
| “In Progress” without branch/owner | Board card with owner |
| “Fleet owns…” if brand dropped | Product display name + technical slug |
| “tool.foo” in identity without map | InternalActionId |
| “usable” without verification steps | usable + checklist |

---

## 13. Adoption Order

1. Owner picks technical slug + brand  
2. Lead lands permission + action grammar  
3. Lead lands multi-agent minimal types  
4. Then rewrite identity matrix tool lists  
5. Then module specs adopt vocabulary  

Do not rewrite all modules before (1)–(3).
