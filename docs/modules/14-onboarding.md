# 14 Onboarding Empty States Specification

## 1. Purpose
Define empty state illustrations, user onboarding flows, and template project instantiation.

## 2. Non-Goals
-   Do not load vectors or search paths during empty onboarding status.

## 3. Inputs
-   User session startup signals.

## 4. Outputs
-   Rendered empty state templates.

## 5. State Model
-   `isNewUser` settings state in local storage.

## 6. Dependencies
-   M13 settings surfaces.

## 7. Acceptance Criteria
-   `usable`: User sees template project option on first load.

## 8. Failure & Rollback
-   Onboarding skips gracefully if state write fails.

## 9. Observability
-   Onboarding stage transitions are logged.

## 10. Agent Hooks
-   `onboarding:resetState`
