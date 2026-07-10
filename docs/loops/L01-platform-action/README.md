# L01 — Platform Spine & Action Path

| Field | Value |
|---|---|
| **Loop ID** | L01 |
| **Wave** | W1 |
| **Importance** | Critical — every later surface calls this |
| **Difficulty** | Hard (identity, permission, idempotency, events) |
| **Gate** | Locked (until L00 exit) |
| **Start when** | W0.1 closed; W1 Ready; slices execution-ready; active packet |
| **Exit when** | M00 backbone + M03 executor `usable`; M12 capability-core contract frozen |

## Closed loop (what “done” means)

```text
human or Agent intent
  → M03 action invoke (same schema for both)
  → M00 permission / approval decision
  → durable SessionEvent + invocation correlation
  → allow | deny | approval-required visible to caller
  → no second session/permission/timeline store
```

## Modules in this loop

| Module / slice | Spec | Role |
|---|---|---|
| M00 | [`modules/00-platform-spine.md`](../../modules/00-platform-spine.md) | Session, identity, permission, timeline, durable control state |
| M03 | [`modules/03-internal-action-registry.md`](../../modules/03-internal-action-registry.md) | Action definitions, dispatch, undo correlation |
| M12 capability core | [`modules/12-capability-skill-plugin-system.md`](../../modules/12-capability-skill-plugin-system.md) | Manifest/operation descriptors (core only; not distribution) |

## Parallelism note (after Ready)

From `PARALLEL-AGENT-OPERATING-MODEL.md`:

1. M00 skeleton ∥ M03 skeleton (protocol files remain Lead-owned)
2. Wait for Lead **M00 backbone-merged**
3. Then M03 executor to usable

## Cross-cutting docs

- [`DECISIONS-LEDGER.md`](../../DECISIONS-LEDGER.md) — D7, D11, D12, D40, D38
- [`FORBIDDEN-ANTIPATTERNS.md`](../../FORBIDDEN-ANTIPATTERNS.md) §1
- [`contracts/`](../../contracts/) — only the **re-frozen** version named by the packet

## Active packet

None while Locked. Superseded W1 packet lives under `docs/legacy/agent-packets/` and **must not** be used.

## Reading order inside L01

1. This README
2. M00 → M03 → M12 (core sections)
3. Identity / action contracts named by future W1 packet
4. Pre-Flight Gate in `PARALLEL-AGENT-OPERATING-MODEL.md`

## Next loop

→ [L02-local-workbench](../L02-local-workbench/) after L01 exit criteria.
