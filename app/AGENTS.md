# Application instructions

These rules apply inside `app/` and refine the repository-root `AGENTS.md`.

- This tree is the Craft Agents v0.11 application base. Inspect existing behavior before replacing it.
- Preserve the existing session, workspace/project, permission, task, source, skill, automation, browser, and settings authorities.
- Treat `源码参考/software/craft-agents-oss` at tag v0.11.1 as a reference, not a directory to copy wholesale over the working tree.
- Trace complete behavior through renderer → atom/hook → RPC → handler → existing store/service.
- Reuse existing renderer and shared UI primitives. For structural/styling UI changes, agents also
  render the changed state in the existing playground or real local surface, compare it with the
  declared Craft/Fleet visual anchor at the same theme/width/state, and fix unintended drift.
  The owner accepts intentional visual direction and final feel; the agent owns consistency,
  keyboard reachability, state coverage, types, and targeted behavior.
- Retired waves, readiness tables, ownership matrices, and packets under `docs/` do not gate changes in this tree.
