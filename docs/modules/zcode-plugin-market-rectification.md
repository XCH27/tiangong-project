# Existing ZCode plugin market rectification

**Authority:** D56/D58. **Maturity:** execution-ready for ZP-FIX/U,T only. Wave Map owns gates.
ZCode plus ordered patches is the product base; historical Craft waves remain Locked.

## Required corrections

1. Post-mutation overview reads must not join or publish a pre-mutation in-flight read. Context
   switches and overlapping requests may not publish into the wrong context/generation.
2. Plugin detail cache must agree with current overview/version/scope after refresh/update.
   Stale in-flight detail reads may not repopulate invalidated caches.
3. Preserve installed-list fallback when overview/catalog fails, while exposing the retryable
   catalog failure. Failed source is not an empty successful marketplace. Keep unknown-state
   protections and existing mutation guards.
4. Existing `plugins/cancelOperation` must reach the original per-operation AbortController
   while a long NDJSON request occupies the work queue. Cancelled work must not persist success;
   unknown ids may not cancel unrelated work. Non-control ordering remains unchanged.
5. The existing human add-source dialog must submit an original unique backend operation id.
   Closing it while pending requests cancellation through that operation's original service;
   late completion cannot reopen/alter a newer dialog. Cancellation failure is visible, never
   claimed as a successful abort. Already completed writes retain their actual result/state.

## Canonical full loop

Keep `createPluginManagementService`, current catalog/registry and user/project paths, bootstrap
handlers, operation ids, grants, permission grades and timeline owners. Renderer is a projection,
not another plugin store. Human and Agent/plugin-workflow callers keep the same handlers. No new
authority, dependency, data migration, automatic install or grant. Keep market/manage/detail UI
locations; failure/retry uses existing error states. TraeWork/MiniMax and REA are analysis and
behavior references, not implementation sources or production dependencies.

## Acceptance

Red-to-green public-consumer regressions: held overview before configure, updated catalog/detail,
partial source failure, actual queued NDJSON cancellation. Check scope/races, non-control order,
grant/configuration preservation on reopen and existing install/enable/disable/config/uninstall
tests. Use authored temporary files/local servers only. Lead checks types/architecture/current
build/render/ordered reconstruction. Status stays `wired but not visually checked` until exact
rendered proof; no whole-product `usable` or historical Ready promotion.
