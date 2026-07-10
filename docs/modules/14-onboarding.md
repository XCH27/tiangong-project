# M14 — Onboarding and Empty States

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft; canonical v0.11 preference keys/entry routes unresolved
> **Wave:** W5
> **Depends on:** M00/M05/M13/M16 and real provider/runtime diagnostics

## 1. Purpose

Help a first-time or empty-state user reach one real usable project without hiding setup failures,
creating duplicate state, or forcing an account/subscription flow.

The first closed loop is: launch with no workspace -> open or create a local project -> choose a
minimal real capability/runtime -> create one session -> dismiss the guide -> restart into the
same project with onboarding complete for the current version.

## 2. State Model

Do not use one ambiguous `isNewUser` boolean. Record:

```ts
type OnboardingProgress = {
  schemaVersion: 1
  onboardingVersion: number
  completedSteps: string[]
  dismissedOptionalSteps: string[]
  activeWorkspaceId?: string
  completedAt?: string
  updatedAt: string
}
```

Workspace existence, session existence, provider/runtime readiness, and onboarding completion are
separate facts. Progress uses canonical M13 preferences; workspace/session state remains with its
owner.

## 3. Empty-State Matrix

| Condition | Primary action | Secondary/recovery |
|---|---|---|
| no workspace | open folder or create local project | view privacy/local-storage explanation |
| workspace, no session | start first session from a real task | open terminal/runtime diagnostics |
| provider absent | configure a supported provider or local capability | continue with non-model file/project setup |
| runtime unavailable | diagnose exact runtime requirement | choose another installed capability |
| no files/assets | create/import one real artifact | use an explicitly installed template |
| capability denied | show policy reason | request permitted scope; never hide the feature as broken |
| migration/recovery required | show exact state owner and safe recovery | open read-only or retry migration |

Empty states are ordinary product states, not decorative illustrations only.

## 4. Template Projects

- Templates are versioned local artifacts with declared source/license.
- Instantiation writes real files through M05 and records provenance.
- No template is downloaded silently.
- Partial creation is rolled back/reconciled through the file action path.
- Templates never install plugins, enable high-risk browser control, or add secrets implicitly.

## 5. User and Agent Behaviour

The user controls setup, skip/dismiss, and reset. An Agent may explain diagnostics or propose the
next step after it has a valid session, but cannot silently complete onboarding, accept terms,
configure credentials, or reset progress.

Reset is a human preference action with snapshot undo; it does not delete projects, sessions,
credentials, or artifacts.

## 6. View Placement

Onboarding is a retained-shell entry/empty state hosted by M16, not a second shell. It uses M13
settings routes for configuration and opens M02/M05/M11/M12 diagnostics rather than copying them.

## 7. Error Handling

| Condition | Result | Recovery |
|---|---|---|
| preference write fails | completion not claimed | retry or continue with visible unsaved state |
| workspace create fails | no fake project card | inspect path/permission and retry |
| template partial write | reconciling/error state | M05 rollback/reconcile |
| provider/runtime check unknown | unknown, not ready | open diagnostics/retry |
| onboarding version changes | migrate known steps; show new required step | complete or dismiss only optional step |

## 8. Verification

1. Start from no workspace and complete the real project/session loop.
2. Restart; verify progress and active workspace through canonical authorities.
3. Exercise each empty-state row and accessibility/keyboard flow.
4. Fail preference and template writes; verify no false completion/partial project.
5. Reset onboarding; verify projects/sessions/artifacts remain untouched.
6. Attempt Agent completion/reset/credential changes and verify refusal or human approval.

## 9. Open Gates

- Map exact v0.11 startup/empty-state routes and canonical preference keys.
- Define onboarding version migration and required versus optional steps.
- Verify at least one real runtime/provider diagnostic path.

## 10. Non-Goals

- No Fleet account, subscription, forced template, silent network download, or fake sample-only
  success path.
