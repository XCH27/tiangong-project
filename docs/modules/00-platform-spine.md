# 00 Platform Spine

## 1. Mission

Keep Craft Agents (二开补强) on one Craft spine: session, timeline, permission, actor identity, runtime identity, settings, and evidence.

## 2. User-Visible Loop

This module does not create a standalone screen. It enables every other module to become user-visible without creating a second truth system.

## 3. Current App Reuse

Reuse Craft `SessionManager`, session persistence, permission flow, BrowserPane ownership, settings/preferences, RPC, and renderer event flow.

## 4. Reference Projects

Craft is the base. AionUi informs agent/runtime patterns but cannot bring a second session or config store.

## 5. UI Placement

No new UI shell. Spine state is visible through existing session timelines, permission cards, settings, and module surfaces.

## 6. Backend / RPC / Locality

Core local capabilities are `LOCAL_ONLY` unless explicitly made remote eligible. Shared protocol changes are Lead-owned.

## 7. Session / Timeline / Permission / Rollback

All writes must emit `SessionEvent` with actor/runtime identity and permission result. Rollback is native history, inverse patch, snapshot, or explicit non-reversible reason.

## 8. Data Model

Primary concepts: `ActorRef`, `SessionEvent`, permission level L0-L3, `AgentSeat`, `RuntimeLane`, `ActionInvocation`, evidence refs, cost/usage source.

## 9. Agent-Native Actions

The spine exposes discovery and invocation only through registered internal actions and session tools.

## 10. Files To Inspect First

- `app/packages/server-core/src/sessions`
- `app/packages/shared/src/protocol`
- `app/packages/server-core/src/handlers/rpc`
- `app/packages/session-tools-core/src`

## 11. Files Likely Touched

Only Lead touches shared protocol, session persistence, permission schema, handler registration, and cross-module DTOs.

## 12. Parallel Work Packages

Workers do not own this module. They depend on it.

## 13. File Ownership

Lead-owned: shared protocols, session core, permission core, channel maps, handler registries, global i18n.

## 14. Validation Ladder

Typecheck shared/server/electron, targeted session/permission tests, then one real feature path proving a write enters timeline and permission.

## 15. Done / Not Done

`usable`: downstream module can prove human and agent writes enter the same timeline. `not implemented`: second store/session path appears.

## 16. Risks And Blocked Decisions

Risk: workers silently add fields to shared protocols. Decision: all shared contracts go through Lead.

## 17. Non-Goals & Prohibitions

- **No Second Store:** Do not create a second session store, permission system, memory store, team store, or settings database. All modules must reuse the single core platform spine.
- **No Backdoors:** Do not bypass the L0-L3 graded permission approval flow or timeline evidence logging for any action.
