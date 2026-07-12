# Application instructions

These rules apply inside `app/` and refine the repository-root `AGENTS.md`.

- This tree is the Craft Agents v0.11 application base. Inspect existing behavior before replacing it.
- Preserve the existing session, workspace/project, permission, task, source, skill, automation, browser, and settings authorities.
- Treat `源码参考/software/craft-agents-oss` v0.10.5 as a reference, not a directory to copy wholesale over v0.11.
- Trace complete behavior through renderer → atom/hook → RPC → handler → existing store/service.
- Reuse existing renderer and shared UI primitives. UI changes require a real Electron check when feasible.
- Retired waves, readiness tables, ownership matrices, and packets under `docs/` do not gate changes in this tree.
