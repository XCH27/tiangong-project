# ZP-FIX — existing plugin market corrections

1. **Scope/spec:** `docs/modules/zcode-plugin-market-rectification.md`, D56/D58; four proven
   existing-owner defects, preserving saved data and correct implementation.
2. **Wave:** ZP-FIX/U,T only, explicit Lead gates in Wave Map.
3. **Allowed:** separate ZCode worktrees from `85efd4aacbb187acc9b41da8a3e77e425879cc65`.
   U/Sol: `packages/ui/src/store/pluginManagementStore{,Loading}.ts`, same-owner helpers when
   file limits require, focused `packages/ui/test/` plugin tests. T/Sol: bootstrap
   `src/zcode-protocol/transport.ts` cancellation dispatch only and focused bootstrap tests.
   Lead owns shared lists/docs/contracts/build/integration/recipe and visible placement.
   Lead additionally owns original `PluginStorePage.tsx` add/close wiring and same-owner helper,
   plus actual renderer regression. U may add the concrete optional backend operation-id input
   to existing store `addMarketplace` only; public service/protocol already accepts that field.
4. **Forbidden:** `app/`, live profiles, other workers' paths, dependencies/lockfiles, shared
   schemas/registries, new authorities, unrelated debt/public effects.
5. **Contracts:** implemented ZCode service/handlers/operation ids and scope/grant/diagnostic
   contracts unchanged. Historical Craft 1.3.0 is not imported; public schema changes Lead-only.
6. **Consumed:** canonical service/catalog/registry, actual protocol, UI context/store,
   original permission and timeline owners.
7. **Produced:** existing generation/cache/error projection and timely control dispatch;
   no second queue/store/cancellation owner. New interfaces require Lead review.
8. **UI:** existing market/manage/detail/error/retry states; no new navigation or settings system.
9. **Permission/timeline:** original operations own checks/evidence; cancellation adds no grants.
   Isolated authored fixtures only, no real external install/run/provider input.
10. **Validation:** red real-service/handler counterexample → focused green public tests →
    race/scope/reopen/grant proof → types/lint/architecture → Lead build/render/reconstruction.
    Two non-progressing attempts: report precise blocker, no scope/waiver expansion.
11. **Handoff:** commit/branch/paths, red/green logs, actual owners, data/grant compatibility,
    proof limits and remaining issues. Label `wired but not visually checked`; Lead promotes only.
12. **Board Cards:** Lead tracks ZP-FIX/U,T here and Wave Map, Ready → In Progress on dispatch.
    No fabricated board service; historical waves Locked. Answer parallel pre-flight before edits.

GPT-6.1 Sol workers; Lead integrates. No shared branch or conflicting writer.
