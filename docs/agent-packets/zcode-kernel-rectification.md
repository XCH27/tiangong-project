# ZK-FIX — existing ZCode rectification

1. **Scope/spec:** `docs/modules/zcode-kernel-lifecycle.md`, D56/D57. Repair the reviewed existing
   paths; keep correct implementation/data. No Craft migration or feature expansion.
2. **Wave:** ZK-FIX/B,R,S,C,U only, explicitly opened by Lead in `WAVE-MODULE-MAP.md`.
3. **Allowed files:** relative to `.fleet/zcode`, one independent worktree/branch per worker.
   Core/bootstrap/CLI shorthand below means `apps/zcode-cli/packages/{core,bootstrap,cli}/src`;
   desktop shorthand means `packages/desktop/src`:
   - R: `core/src/runtime/methods/remote-host-attachment-stop-settlement.ts`, bootstrap
     `zcode-protocol/server-operations.ts` receipt handler only; desktop
     `host/remoteHostAttachmentStop{ProductWiring,SessionGlue}.ts`,
     `host/windowRemoteConnectionRegistry.ts` receipt/disposal order only and focused tests/spec.
     Return Host/index/service/shared-contract changes to Lead rather than overlapping files.
   - S: Core shutdown/admission/residency/queue files, bootstrap App/session-residency/
     Protocol resource-cleanup files, CLI lifecycle/entrypoint and focused tests/spec.
   - C: Core Started/Updated/Completed/cold materialization and bootstrap V4 cold merge/
     bridge reader wiring, focused tests/spec. Existing workflow journal implementation is read-only. Lead additionally authorizes the narrow
     original Runtime identity field/internal view, event persister call sites, and Core comparator
     export for proven same-epoch order (agent-runtime.ts, internal.ts, methods/events.ts, index.ts).
     This adds derived ordering metadata only, not a runtime or queue.
   - Lead: Vite/build, test lists, source recipe/root gates/docs, Guide and preference controls,
     integration and running verification. Lead delegates the existing parent transport child-process
     acceptance test under `packages/services/test/` to S after its main commit; temporary Lead
     budget files are test inputs only and excluded from that worker commit. Lead also delegates
     the four newly overflowing source leaves (`adapters/src/model/decision-model.ts`,
     `adapters/src/native-agent/{claude,codex-turn}.ts`, `core/src/runtime/methods/background.ts`)
     and same-owner extracted helpers to S/B after that test. No policy waiver or old-debt rewrite.
     Lead additionally delegates generic ACP acceptance honesty (existing acp-turn.ts, focused
     tests/spec and Core/stdio fallback test) to S/U: keep original same-session fallback, no new
     vendor API and no blanket Guide disable. Workers never edit shared `package.json` or root docs.
4. **Forbidden:** `app/`, profiles/data, other workers' paths, dependencies/lockfiles/reference
   pins, new authorities/services, broad layout changes and public effects.
5. **Contracts:** frozen Craft `CONTRACT_VERSION` 1.3.0 is historical, not imported into ZCode.
   Use the currently implemented ZCode ports/schemas and existing Session-entry types. Preserve
   backward reads. Shared public contract changes are Lead-only and require a concrete consumer.
6. **Consumed interfaces:** actual Runtime/App/Protocol/client, original SQLite/Artifact ports,
   original permission/admission and remote connection/pool owners.
7. **Produced interfaces:** corrected existing operations and receipts. Propose any necessary
   additive public interface to Lead first; no second command queue/journal/Host.
8. **UI:** original conversation/background/settings locations. Lead owns rendered changes.
9. **Permission/timeline:** effects retain existing Host checks and original identities. New
   acceptance/cancellation must not create permission. Test only isolated authored fixtures;
   logs distinguish observed effects, unknown outcomes and saved receipts.
10. **Validation ladder:** source/reference diff → failing real-consumer counterexample → focused
    public Host/store/transport test → types/lint/architecture → Lead integration/build/staged
    execution/current running view → owner UX acceptance. No level implies the next.
11. **Handoff:** exact changed paths and diff, original counterexample/result, tests/logs, actual
    writer/settlement ownership, old-data compatibility, unresolved boundaries and proof limits.
    Worker stops after two non-progressing attempts and reports to Lead; no scope expansion.
12. **Board Cards:** Lead tracks ZK-FIX/B,R,S,C,U here and in the Wave Map; no fabricated remote
    board service. R/S/C begin Ready and move In Progress on dispatch. Capability acceptance
    stays pending until the real path and owner experience are checked.

Workers use GPT-6.1 Sol. Lead owns integration. No two workers write the same branch or entity.
