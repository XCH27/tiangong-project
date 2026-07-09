# 14 Messaging

## 1. Mission

Retain messaging gateways as governed integrations that feed Craft Agents (二开补强) sessions without creating another communication product.

## 2. User-Visible Loop

User configures a messaging bridge, receives or sends an authorized message through Craft Agents (二开补强), and the activity appears in session timeline with source and permission boundaries.

## 3. Current App Reuse

Reuse existing messaging packages, settings framework, session timeline, permission, and automation hooks.

## 4. Reference Projects

AstrBot and messaging platforms are product-boundary references only unless explicitly approved. Do not turn Craft Agents (二开补强) into an IM bot platform.

## 5. UI Placement

Messaging belongs in settings/integrations or capability area, not primary workbench navigation.

## 6. Backend / RPC / Locality

Gateway behavior may be networked. Credentials, tokens, and account state require explicit secure handling and permission.

## 7. Session / Timeline / Permission / Rollback

Inbound/outbound events record source platform, account/profile, target session, and whether user/agent initiated the action.

## 8. Data Model

Gateway, account/profile, message event, target session, delivery status, permission record, redaction policy.

## 9. Agent-Native Actions

Read messaging status, send approved message, route inbound message to session, disable bridge.

## 10. Files To Inspect First

- `app/packages/messaging-gateway`
- `app/packages/messaging-whatsapp-worker`
- settings integration pages

## 11. Files Likely Touched

Messaging services, settings UI, session routing, permission/timeline events.

## 12. Parallel Work Packages

Gateway audit, settings restoration, permission boundary, session routing can split after ownership is assigned.

## 13. File Ownership

Messaging package owners can edit gateway code. Shared session/protocol changes go through Lead.

## 14. Validation Ladder

Typecheck messaging packages, settings UI smoke, mock inbound/outbound event, permission/timeline verification.

## 15. Done / Not Done

`usable`: one bridge path writes real session event. `display-only`: settings page exists without gateway path.

## 16. Risks And Blocked Decisions

Risk: leaking credentials or creating automated spam behavior. Messaging is governed integration, not autonomous mass messaging.

## 17. Non-Goals & Prohibitions

- **No Silent Messaging:** Do not allow background messaging adapters (e.g., SMS/WhatsApp gateway workers) to execute tasks or send data without user auditing and timeline logging.
