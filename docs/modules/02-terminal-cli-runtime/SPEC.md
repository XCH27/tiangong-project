# 02 Terminal CLI Runtime Specification

## 1. Purpose
Expose a local terminal CLI command launcher (`craft-cli`) that connects securely to the Bun App Server daemon, enabling workers and humans to execute shell runs and stream outputs to the shared session timeline.

## 2. Non-Goals
-   Do not run unauthenticated WebSocket RPC ports.
-   Do not allow raw shell executions that bypass permission checks.

## 3. Inputs
-   Command string and arguments from CLI client.
-   Secure handshake authorization token.

## 4. Outputs
-   PTY stdout/stderr streamed log blocks.
-   `cli:command_completed` status events.

## 5. State Model
-   Active process descriptors (`Pid`, `Cwd`, `cliRuntimeId`).
-   Local `.fleet/session.lock` socket configuration.

## 6. Dependencies
-   Bun backend WebSocket engine.
-   Native `node-pty` bindings in Electron main/Bun layers.

## 7. Acceptance Criteria
-   `usable`: Shell executions stream logs directly to the UI terminal panel and log evidence to the DB timeline under the correct actor ref.

## 8. Failure & Rollback
-   PTY failures return status code >0. General shell modifications are marked irreversible. File system edits rollback via workspace Git checkouts.

## 9. Observability
-   Every shell input, execution target, and output block is recorded as timeline evidence.

## 10. Agent Hooks
-   `terminal:executeCommand`
-   `terminal:killProcess`
