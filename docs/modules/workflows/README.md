# Composable workflows module

Design state: `breadth`; implementation status: `not implemented`; development order: R8. Workflows are versioned DAG
definitions that invoke governed actions; they do not become a second execution or permission store.
Acceptance: `WF-001` saves a typed version; `WF-002` invokes existing actions; `WF-003` projects
TaskRunner status; `WF-004` rejects stale definitions without a second run authority.

FlowGram is the standing editor reference for document, command, plugin, variable and runtime
separation. Fleet may absorb editor mechanisms only: its typed definition invokes existing governed
actions and Craft TaskRunner remains execution authority.

## Reality and activation sequence

`app/packages/server-core/src/tasks/TaskRunner.ts` is the Craft task runner, not a Fleet workflow
definition/run store; `app/scripts/test-workflow-local.sh` is a helper only. Activation is: define
typed DAG/version fixtures, validate cycles and stale versions, invoke one existing governed action,
project the run into TaskRunner, and test restart/failure. Until then no workflow editor or run view
may be labelled wired.
