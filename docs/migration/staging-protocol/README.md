# Staging protocol (Lead port sources)

> **Not live code.** Do not import from the running `app/` tree.  
> **Freeze id:** `w0.1-doc-freeze-2026-07-09`  
> **Port target:** clean Craft v0.11.0 `packages/shared/src/protocol/` after monorepo base replace.  
> **Owner:** Lead only.

These modules are TypeScript **text freezes** ready to copy during L00→W1 base port.
They mirror `docs/contracts/*` and must stay in sync with the freeze record.

## Port order

1. `artifact-ref.ts`  
2. `m11a-usage-cost.ts`  
3. `action-invocation-vnext.ts`  
4. `external-job.ts`  
5. `workflow.ts`  
6. `view-contribution.ts`  
7. Wire barrel exports in clean-base `protocol/index.ts`  
8. Re-freeze `CONTRACT_VERSION` on `internal-action.ts` when ActionInvocation VNext lands  

## Existing Fleet files to copy carefully (from current `app/`)

See `../v0.11-PORT-CHECKLIST.md` for `actor.ts`, `agent-session.ts`, `session-event.ts`,
`internal-action.ts`, `lease.ts` (adapt onto clean base; do not blind overwrite v0.11 channels/dto).
