/**
 * Node-only half of the remote module: the on-disk device store and this machine's
 * stable id. Kept out of `./index` so the renderer bundle never reaches `fs`/`path`.
 */
export * from './store.ts';
