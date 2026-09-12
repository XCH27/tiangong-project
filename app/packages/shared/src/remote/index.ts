/**
 * Browser-safe remote-connection logic. Everything here is pure: no filesystem, no
 * crypto source of truth, no Node builtins — so the renderer (and a future phone
 * client) can import the same rules the host enforces.
 *
 * Persistence lives in `./node` because it touches `fs` and `CONFIG_DIR`; importing
 * it from the renderer pulls `path` into the browser bundle and fails the build.
 */
export * from './devices.ts';
export * from './authenticate.ts';
export * from './invite-link.ts';
export * from './mint-ledger.ts';
export * from './reachability.ts';
export * from './endpoint-race.ts';
export * from './run-targets.ts';
