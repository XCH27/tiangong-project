# M15 — Governed Messaging Gateway

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft; credential/bridge adapters require evidence
> **Wave:** W5
> **Depends on:** M00, M03, M05 ArtifactRef, M13 settings/secrets, M16 views

## 1. Purpose

Retain messaging integrations as governed session inputs/outputs without turning Fleet into an
autonomous mass-messaging or second chat platform.

The first closed loop is: user configures one bridge through protected credentials, explicitly
routes one inbound message to a session, sends one approved reply, and sees delivery/evidence and
failure recovery without exposing the credential or messaging unrelated contacts.

## 2. Scope

### In Scope

- one configured bridge/profile, health state, allowlist, inbound routing, outbound send,
  attachment ArtifactRefs, delivery status, idempotency, redaction, disable/revoke;
- session/timeline correlation through M00/M03;
- settings integration and compact status/triage projection.

### Out of Scope

- an independent contact/chat database, autonomous outreach, bulk campaigns, scraping, spam,
  account rotation, or a gateway that executes tools from inbound text automatically.

## 3. Credential and Profile Authority

Credentials live only in the canonical protected secrets mechanism selected on the v0.11
baseline. Documents, actions, events, logs, workflows, and settings snapshots hold an opaque
credential reference and redacted profile label only.

```ts
type MessagingBridgeProfile = {
  profileId: string
  provider: string
  credentialRef: string
  displayLabel: string
  inboundPolicy: 'disabled' | 'allowlist' | 'manual_triage'
  allowedSenders: string[]
  outboundPolicy: 'human_only' | 'agent_with_approval'
  targetSessionPolicy: 'manual' | 'fixed_session' | 'triage_session'
  redactionPolicyRef: string
  enabled: boolean
}
```

These fields are a proposal until canonical promotion.

## 4. Inbound Routing

1. adapter authenticates provider event and deduplicates provider message ID;
2. apply sender/profile allowlist before content enters a session;
3. apply attachment size/type and redaction policy;
4. route to fixed/triage/manual target without executing commands;
5. append one generic SessionEvent typed payload with source/profile/message hash and safe summary;
6. expose message to the session as untrusted external content.

An inbound message never grants tool, file, browser, workflow, or Agent authority.

## 5. Outbound Routing

- Human send is explicit and shows recipient/profile/content/attachments.
- Agent send requires an effective capability and the configured approval policy for every
  recipient/message; draft creation alone does not send.
- Attachments are exact ArtifactRefs whose sensitivity/license/size is rechecked.
- Every send has an idempotency key and provider delivery correlation.
- Unknown delivery reconciles before retry; no duplicate message is sent silently.

## 6. Candidate Actions — Not Frozen

| Candidate | Purpose | Policy intent |
|---|---|---|
| `messaging.profile_read` | filtered status/config read | L0, no credential value |
| `messaging.profile_update` | change routing/allowlist/policy | L2 security/network setting |
| `messaging.message_route` | route inbound message to permitted session | L1 local session mutation |
| `messaging.message_send` | send one exact message/attachments | L2 external side effect by default |
| `messaging.bridge_disable` | stop new provider traffic | L2 reversible setting |
| `messaging.credential_revoke` | remove provider credential | L3/security-critical, explicit confirmation |

## 7. UI Contributions

- M13 integration/settings page for profiles, policies, health, revoke;
- M16 compact triage/status panel only when inbound routing is enabled;
- session message/evidence view using retained session UI;
- no permanent primary navigation unless a real product loop later justifies it.

## 8. State and Persistence

- credentials: canonical secret authority;
- profile policies: canonical preferences/config;
- provider message/delivery correlation: M00/M15 execution state;
- attachment bytes/provenance: M05;
- displayed messages: retained session authority;
- adapter caches are derived and rebuildable.

M15 creates no second session or contact-message database.

## 9. Error Handling

| Condition | Result | Recovery |
|---|---|---|
| invalid/revoked credential | bridge disabled/unhealthy | reconfigure explicitly |
| sender not allowed | content not routed; safe rejection evidence | update allowlist manually |
| redaction/attachment validation fails | message/attachment held from session/send | inspect/remove/reconfigure |
| delivery unknown | reconciling, no automatic duplicate | query provider then retry if safe |
| target session missing | manual triage state | choose/create permitted session |
| Agent send denied | draft retained, nothing sent | human reviews/sends or changes policy |

## 10. Verification

1. Configure one real or approved sandbox bridge without credential leakage.
2. Route one allowlisted inbound message and reject one unlisted sender.
3. Prove inbound content cannot execute a tool/workflow automatically.
4. Send one human message and one Agent-proposed approved message through the same action.
5. Attach a permitted ArtifactRef and block a restricted/oversized attachment.
6. Simulate unknown delivery/restart and reconcile without duplicate send.
7. Revoke credential and verify bridge stops while historical safe evidence remains.

## 11. Open Gates

- Select canonical secrets integration and one bridge adapter under license/terms review.
- Freeze profile/message/action/redaction schemas and provider retention rules.
- Verify exact retained session routing path on v0.11.

## 12. Non-Goals and Prohibitions

- No silent/background send, autonomous mass messaging, credential logging, inbound command
  execution, or second messaging product.
