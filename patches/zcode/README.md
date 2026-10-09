# ZCode host reconstruction

`.fleet/zcode` is the local candidate host. It is gitignored and is not present in this checkout. This directory records how to apply the tracked host loop onto that tree. It does not vendor a second session store.

## What is tracked

The executable loop lives on the retained Craft tree and is declared in `docs/UPSTREAM-DELTA.tsv`:

- `app/packages/shared/src/protocol/action-policy.ts`
- `app/packages/shared/src/protocol/usage-attribution.ts`
- `app/packages/shared/src/protocol/turn-admission.ts`
- `app/packages/shared/src/protocol/__tests__/turn-admission.test.ts`

`app/` stays where it is. Do not delete or relocate it.

## Execution boundary

Pi Agent Core sequences a default model turn only after the Fleet host admits that turn. It is not the permission authority, the durable journal, or the native executor.

The retained `app/packages/shared/src/agent/pi-agent.ts` subprocess still uses `@earendil-works/pi-coding-agent` as the Craft provider client. Keep that client. Do not describe it as the Fleet host.

`TODO.md`, `docs/product.md`, `docs/engineering.md`, `docs/references.md`, `docs/modules/agent-core.md`, and `docs/modules/models.md` are not in this checkout. Delivery order remains `docs/PROJECT-DIRECTION.md` and `docs/WAVE-MODULE-MAP.md`: kernel admission before feature pages. This change does not open a plugin or page wave.

## Local apply

When `.fleet/zcode` is available on a machine that has the candidate:

1. Port the three protocol modules into the host admission path.
2. Persist `KernelSnapshot` through the existing M00 journal. Do not open another session or cost database.
3. Call `admit`, `approve` or `reject`, `run`, `stop`, and `HostTurnKernel.restore` around any Pi default-turn sequencer.
4. Keep feature pages and plugins unchanged until a real executor is attached and recovery is proven on that tree.

Snapshot version `1` is the only readable version. A different version throws `unsupported_snapshot_version` and does not migrate data.

## Status

| Slice | Status |
|---|---|
| Process-local admission, permission gate, stop/recovery, usage confidence | `wired` |
| `.fleet/zcode` integration | not applied in this checkout |
| Product approval UI and native executor | `Locked` |
