# Identity Tags -> Permission Matrix

> **Status:** frozen (W0)
> **Owner:** Lead
> **Last updated:** 2026-07-09
> **Read by:** all agents before claiming a Seat
> **Modified by:** Lead only, via contract-change request

This document is the single source of truth for how an agent's identity tags
derive its permission scope, tool manifest, Skill load set, and plugin permit.
It is a frozen W0 contract. Workers must not modify it.

---

## 1 - Three-Layer Identity Tag System

Every AgentSeat carries a set of **identity_tags: string[]** injected by the Lead
when the Seat is created. Tags are orthogonal and composable.

| Layer | Prefix | Values | Meaning |
|---|---|---|---|
| **Role** | `role:` | `lead` / `worker` / `reviewer` | Orchestration authority in this TeamRun |
| **Domain** | `domain:` | `media` / `code` / `ui` / `data` | Knowledge / tool specialisation |
| **Trust** | `trust:` | `internal` / `host` / `external` | Data-access boundary |

**Rules:**
- Every Seat must carry **exactly one** `role:` tag.
- A `role:worker` Seat with no explicit `assigned_skills` must carry **at least one** `domain:` tag.
- A `role:reviewer` Seat's `loaded_skills` is forced to `[]` regardless of other tags.
- Tags are injected by the Lead; Workers cannot self-declare tags or read other Seats' tags.

---

## 2 - Permission Scope Derivation

All tags on a Seat are **unioned** to produce the final permission scope.
No explicit grant means default deny.

```
PermissionScope = UNION( PERMISSION_MATRIX[tag] for tag in identity_tags )
```

### Baseline Matrix

```
role:lead
  tools:    [session.*, plan.*, seat.assign, file.read, file.write, skill.run, memory.*]
  skills:   * (all loaded)
  assets:   read + write
  leases:   grant

role:worker
  tools:    [file.read, file.write.scoped, skill.run, memory.read]
  skills:   from_seat  (only seat.assigned_skills or domain-derived set)
  assets:   read + write.scoped
  leases:   consume

role:reviewer
  tools:    [file.read, plan.read, asset.read]
  skills:   [] (forced empty)
  assets:   read
  leases:   none

domain:media
  tools+:   [tool.inspect_image, tool.capture_ui, tool.probe_media]
  skills+:  [note, extract, visual, transcript, repurpose]

domain:code
  tools+:   [tool.run_shell, tool.read_file, tool.write_file, tool.git_*]
  skills+:  [chat, index]

domain:ui
  tools+:   [tool.capture_ui, tool.inspect_element]
  skills+:  [visual]

domain:data
  tools+:   [tool.read_file, tool.query_db]
  skills+:  [extract, index]

trust:internal
  tools+:   [memory.write, session.inspect, audit_log.write]
  assets+:  admin

trust:host
  tools+:   [host.call_mcp]
  assets:   read

trust:external
  tools+:   [] (no additions)
  assets:   read (public only)
```

---

## 3 - Tool Gating

`AgentSession.create(seat_def)` runs the following pipeline at Seat creation time:

```
1. PermissionResolver.resolve(seat_def.identity_tags)
       -> merged PermissionScope
2. ActionRegistry.filter(scope.tools)
       -> ActionManifest  (the only tools this Seat's LLM prompt will see)
3. SkillLoader.load(seat_def, scope, task.required_skills)
       -> loaded_skills[]
4. LeaseManager.create_scope(scope.assets)
       -> LeaseScope
5. Return AgentSeat { manifest, loaded_skills, lease_scope, ... }
```

The Worker LLM system prompt contains **only** the ActionManifest description.
Tools outside the manifest are physically absent from the prompt.
Calling a tool outside the manifest at execution time returns `PERMISSION_DENIED`
and is written to `audit_log`. It does not silently fail.

---

## 4 - Skill Mount Priority

Final `loaded_skills` is resolved in priority order (highest wins):

```
1. seat.assigned_skills          <- Lead explicit override (highest)
2. scope.skills AND task.required  <- domain-derived AND task minimum
3. (empty if neither applies)

Final = assigned_skills ?? (scope_skills AND task_required_skills)
```

### Domain -> Default Skill Set

| domain tag | default skills |
|---|---|
| `domain:media` | `note`, `extract`, `visual`, `transcript`, `repurpose` |
| `domain:code` | `chat`, `index` |
| `domain:ui` | `visual`, `chat` (read-only) |
| `domain:data` | `extract`, `index` |

A Skill not in `loaded_skills` returns `SKILL_NOT_LOADED` -- a graceful fallback,
not an error. Workers must not self-extend their Skill set.

---

## 5 - Plugin Permit

Heavy-cost plugins (`face_crop`, `ocr_dense`, `diarization`, etc.) are **not**
exposed in the Worker LLM prompt. They are mounted automatically by the
CapabilityPlanner when **all** of the following conditions hold:

```typescript
plugin_permit: {
  required_tags:  string[];  // all must be present on the Seat
  required_tools: string[];  // all must be in the Seat's manifest
  cost_cap:       number;    // must not exceed TeamRun.global_cost_cap / active_seat_count
}
```

The Worker sees a plan step in its AnalysisPlan output -- it does not call
the plugin directly.

---

## 6 - Invariants (Enforced at Seat Creation)

`AgentSession.create()` throws `SeatCreationError` if any invariant is violated:

1. `identity_tags` contains exactly one `role:` tag.
2. `role:worker` + `assigned_skills === null` -> at least one `domain:` tag present.
3. `role:reviewer` -> `loaded_skills` forced to `[]`.
4. No Seat manifest contains session-management verbs other than `session.ping`.
5. Plugin `cost_cap` <= `TeamRun.global_cost_cap / active_seat_count`.

---

## 7 - Module Interface Table

| Module | Interaction point | Constraint |
|---|---|---|
| **M00 Platform Spine** | `AgentSession.create()` / `AgentSeat` type | Seat type lives in `shared/src/protocol/agent-session.ts`, frozen at W0 |
| **M03 Action Registry** | `ActionRegistry.filter(tool_patterns)` -> `ActionManifest` | action-ids.md must be frozen before Seat creation can work |
| **M04 RuntimeLane / TeamRun** | One Lane per Seat; Lane does not share manifest across Seats | Lead Lane manifest includes `seat.assign` |
| **M05 Files / Leases** | `lease_scope` derived from `scope.assets`; `write.scoped` path only | |
| **M10 Memory** | `memory.write` requires `trust:internal`; `memory.read` open to all workers | |
| **M11 Model Routing** | routing decisions respect `scope.tools`; CLI lanes bypass Fusion | |
| **M12 Skill Library** | `loaded_skills` entries must match `skills/*/schema.json` `name` field | new Skills require explicit domain matrix entry |

---

## 8 - Orchestration Example

```
Lead Seat
  identity_tags: [role:lead, domain:media, trust:internal]
  manifest:      { session.*, plan.*, seat.assign, file.*, skill.run, memory.*, ... }
  loaded_skills: * (all)

  -> assigns Worker-A:
      identity_tags:   [role:worker, domain:media]
      assigned_skills: ["note", "transcript"]
      manifest:        { file.read, skill.run, memory.read,
                         tool.probe_media, tool.inspect_image }

  -> assigns Worker-B:
      identity_tags:   [role:worker, domain:code]
      assigned_skills: null   <- domain:code derives [chat, index]
      manifest:        { file.read, file.write.scoped,
                         tool.run_shell, tool.git_*, tool.read_file }

  -> assigns Reviewer:
      identity_tags:   [role:reviewer]
      loaded_skills:   []   <- forced
      manifest:        { file.read, plan.read, asset.read }
```

Each Worker's LLM system prompt contains only its own manifest.
Workers cannot sense each other's existence or tool sets.

---

## 9 - Decision Record

| Decision | Rationale |
|---|---|
| Tags over role enum | Enums are closed; tag union is open. `domain:media + trust:host` cannot be expressed in a flat enum without combinatorial explosion. |
| Static Skill load at Seat creation | Dynamic load introduces coordination overhead and security risk. Static load gives Lead full visibility and simplifies audit. |
| Plugins hidden from Worker LLM | Plugin descriptions in the prompt incentivise Workers to invoke expensive paths. CapabilityPlanner decides based on plan cost, not LLM preference. |
| Reviewer forced to empty Skills | Reviewer's job is judgment, not execution. Giving it Skills blurs the boundary and creates hallucination risk. |
| trust:internal required for memory.write | Memory is local, partitioned, and permissioned. Only internally-trusted Seats may mutate it. |
