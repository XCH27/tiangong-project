# 03 Internal Action Registry Specification

## 1. Purpose
Make all local platform actions discoverable, versioned, permission-gated, and callable uniformly by both human UI clicks and agent RPC tools.

## 2. Non-Goals
-   Do not expose separate APIs for humans and agents.
-   Do not allow action payload schemas to mutate without contract version bumps.

## 3. Inputs
-   `ActionInvocation` envelopes containing action ID, version, and payload.

## 4. Outputs
-   `ActionSuccessEvent` or `ActionBlockedEvent` on the timeline.
-   Action execution output payloads.

## 5. State Model
-   `InternalActionDefinition` schemas.
-   Hook execution state (PreInvoke and PostInvoke pipelines).

## 6. Dependencies
-   M00 platform spine database.
-   Zod schema validators.

## 7. Acceptance Criteria
-   `usable`: Executing an action writes timeline events and handles permission barriers correctly. All payloads validate against active schemas.

## 8. Failure & Rollback
-   Hook rejections emit `ActionBlockedEvent` and do not execute. Reversible actions invoke declared inverse patches or undohandlers.

## 9. Observability
-   All invocations pass through PreInvoke/PostInvoke audit logging and output verification.

## 10. Agent Hooks
-   `actions:listRegistered`
-   `actions:invoke`
