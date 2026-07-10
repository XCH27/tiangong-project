# L04 — Intelligence & Distribution

| Field | Value |
|---|---|
| **Loop ID** | L04 |
| **Wave** | W4 |
| **Importance** | Medium — leverage after real work loops exist |
| **Difficulty** | Medium (privacy, cost truth, loadouts) |
| **Gate** | Locked |
| **Start when** | L03A exit (or WAVE-stated deps); M05/M08 contracts stable |
| **Exit when** | Packet criteria for M10 / M11 / M12 distribution met |

## Closed loops

### Memory / context / review

```text
project work → partitioned local memory → inspect/delete (L3)
  → context pack / review pipeline → single usage ledger hook
```

### Routing / cost (M11B only)

```text
API/OAuth lane → route/cache/fusion policy (CLI lanes bypass)
  → usage/cost record already uses M11A vocabulary from L02
```

**Note:** M11A usage/cost core is scheduled in **L02/W2**, not here. L04 only adds M11B routing/cache/native-batch.

### Capability distribution

```text
built-in manifests work first → later install/loadout/runtime separation
  → no global always-on tool pile
```

## Modules in this loop

| Module / slice | Spec | Role |
|---|---|---|
| M10 | [`modules/10-memory-context-review.md`](../../modules/10-memory-context-review.md) | Memory, context, review center |
| M11B | [`modules/11-model-routing-cost-ledger.md`](../../modules/11-model-routing-cost-ledger.md) | Routing, cache, native batch (not M11A) |
| M12 distribution | [`modules/12-capability-skill-plugin-system.md`](../../modules/12-capability-skill-plugin-system.md) | External distribution after core |

## Do not

- Create alternate memory/job/usage stores to bypass L01–L02
- Start “AI features” before spine loops are usable

## Active packet

None while Locked.

## Next loop

→ [L05-polish](../L05-polish/) when polish deps are Ready.
