# 00 Platform Spine Specification

## 1. Purpose
Unify Fleet on a single core desktop runtime spine. Ensure actor identity, session timelines, settings, and graded permission evaluations route through a single source of truth to avoid duplicate storage models.

## 2. Non-Goals
-   Do not build a secondary session store, memory cache, or permissions database.
-   Do not support automated L3 decisions without explicit user UI interaction.

## 3. Inputs
-   `ActorRef` (human or agent seat identity).
-   `MessageEnvelope` payloads via WS connection.
-   RPC command invocation requests.

## 4. Outputs
-   `SessionEvent` records logged in SQLite.
-   Handshake acknowledgement and client status envelopes.
-   L0-L3 permission approval or denial events.

## 5. State Model
-   SQLite session table schema (Timeline, Audit evidence, Leases).
-   `AgentSeat` state models containing role and domain tags.

## 6. Dependencies
-   Craft native session and workspace controllers.
-   SQLite file lock bindings.

## 7. Acceptance Criteria
-   `usable`: Downstream modules can write action records to the single timeline database and get verified permission checks.
-   No concurrent SQLite database busy locks during parallel worker agent reads.

## 8. Failure & Rollback
-   State modification failures emit a structured `SessionErrorEvent`.
-   Unsaved session transactions roll back cleanly to the last SQLite WAL checkpoint.

## 9. Observability
-   Every state change writes an audit trail to the unified session timeline.
-   Timeline events support JSON serialization for inspection.

## 10. Agent Hooks
-   `sessions:listEvents`
-   `sessions:checkPermission`
