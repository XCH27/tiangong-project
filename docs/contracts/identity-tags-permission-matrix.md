# Identity Tags -> Permission Matrix

> **Status:** frozen (W0)
> **Owner:** Lead

---

## 1 - Three-Layer Identity Tag System

Every AgentSeat carries a set of **identity_tags: string[]** injected by the Lead when the Seat is created.

| Layer | Prefix | Values | Meaning |
|---|---|---|---|
| **Role** | `role:` | `lead` / `worker` / `reviewer` | Orchestration authority |
| **Domain** | `domain:` | `media` / `code` / `ui` / `data` | Specialisation |
| **Trust** | `trust:` | `internal` / `host` / `external` | Data-access boundary |

---

## 2 - Permission Scope Derivation

Final permission scope is determined by **unioning role/domain grants**, then **intersecting them with the trust ceilings** (e.g. `trust:external` limits write and shell access), with **explicit denies taking absolute priority**.

```text
Grants = UNION( PERMISSION_MATRIX[tag] for tag in role/domain tags )
Ceilings = INTERSECT( PERMISSION_LIMITS[tag] for tag in trust tags )
PermissionScope = Grants ∩ Ceilings (explicit deny wins)
```

### Baseline Matrix

```text
role:lead
  tools:    [session.*, plan.*, seat.assign, file.read, file.write, skill.run, memory.*]
  skills:   *
  assets:   read + write
  leases:   grant

role:worker
  tools:    [file.read, file.write.scoped, skill.run, memory.read]
  skills:   from_seat
  assets:   read + write.scoped
  leases:   consume

role:reviewer
  tools:    [file.read, plan.read, asset.read]
  skills:   []
  assets:   read
  leases:   none

domain:media
  tools+:   [tool.inspect_image, tool.capture_ui, tool.probe_media]

domain:code
  tools+:   [tool.run_shell, tool.read_file, tool.write_file, tool.git_*]

domain:ui
  tools+:   [tool.capture_ui, tool.inspect_element]

domain:data
  tools+:   [tool.read_file, tool.query_db]

trust:internal
  tools+:   [memory.write, session.inspect, audit_log.write]
  assets+:  admin

trust:host
  tools+:   [host.call_mcp]
  assets:   read

trust:external
  tools:    Deny shell/PTY write operations, restrict to public reads.
  assets:   read (public only)
```

---

## 6 - Invariants (Enforced at Seat Creation)

1. `identity_tags` contains exactly one `role:` tag.
2. `role:worker` + `assigned_skills === null` -> at least one `domain:` tag present.
3. `role:reviewer` -> `loaded_skills` forced to `[]`.
4. For `worker` and `reviewer`, no Seat manifest contains session-management verbs other than `session.ping`.
5. Plugin `cost_cap` <= `TeamRun.global_cost_cap / active_seat_count`.
