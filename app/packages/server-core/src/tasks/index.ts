/**
 * @craft-agent/server-core/tasks
 *
 * Delegation Kernel (TaskRunner / Conductor) — the in-process DAG runner for
 * Tasks. Builds on the spec, validation, and storage primitives in
 * @craft-agent/shared/tasks and the SessionManager completion/output seams.
 * Sole scheduling authority; no second team/task store.
 */
export { TaskRunner } from './TaskRunner';
export type {
  ChildSessionRuntimeState,
  ConductorSessionHost,
  TaskRunnerDeps,
  RunOptions,
  RunSnapshot,
  RunStatus,
  NodeRunStatus,
} from './TaskRunner';
