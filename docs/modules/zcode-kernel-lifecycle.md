# Existing ZCode kernel rectification

**Authority:** D56/D57; `.fleet/zcode` plus ordered patches. **Spec maturity:** execution-ready
for the bounded ZK-FIX corrections only. The Wave Map owns execution gates. No new Host, Session,
permission or memory owner is introduced. Historical Craft drafts do not govern these paths.

## Existing owners and fixed order

1. Lead restores the actual desktop/CLI build and candidate verification/reconstruction path.
2. Correct Session-scoped remote receipts and draft/failure/disposal consumers.
3. Correct App/Protocol/pool/CLI settlement and current workflow cold recovery.
4. Rectify the audited Guide/preference regressions through their original controls/writers.

Human UI, Agent calls and transport callbacks continue through the existing domain operations.
Host admission/permission checks precede effects. Pi Core sequences default rounds only; whole
native executors retain their boundary. Test content and test transport are not product defaults.

| Mutable fact | Owner | Consumers |
|---|---|---|
| Admitted input, binding and queued payload | Core admission and existing Session queue/journal | Runtime, V4, cold recovery |
| Remote stop observation/intent | Existing remote connection owner; Session receipt writer | UI timeline and cold readers |
| Session receipt identity and durable facts | Existing SQLite/Artifact owners | Every Session-scoped read |
| Foreground/native/background lifetime | Existing Runtime/execution owners | App close, resident pool, protocol close |
| Process exit and absolute upper bound | Existing CLI lifecycle | Protocol cleanup and parent Host |
| Workflow current state | Existing workflow journal plus ordered Session evidence | Actual V4 Host materialization |
| Settings/preferences | Existing settings and original preference operations | Human controls and page Agent |

## Required behavior

Build/verification: load the actual Vite caller, build current sources and staged CLI, and verify
the exact product. Keep legacy checks separately named. A complete pin/patch recipe reproduces
the candidate tree from a fresh index without resetting any occupied checkout.

Remote receipts: one physical stop may relate to several conversations; each Session keeps its
own stable entry identity. Existing entries/types remain readable. Never relabel another
Session's row. Unsent drafts with no durable record do not fabricate a conversation or block
other writers. One write failure is reported independently and keeps recoverable original
identity. A disposed proxy cannot be an offline writer. The existing receipt gains optional `phase`
(`requested`, `settled`, `unknown`), with legacy omission read as `settled`. An idle teardown
request is saved while its canonical proxy is live; it never projects a terminal background task.
Later phase writes use the same Session-scoped physical-event ID; settled evidence cannot regress. Controlled close must retain truthful
durable intent/settlement through the existing canonical owner; abrupt disconnect is unknown
until evidence permits reconciliation. Never claim a pending write persisted or replay a paid
effect to repair a receipt. Do not add an outbox/store/authority casually.

Shutdown: fence new input synchronously. Preserve accepted original IDs, intent, model/account,
options, attachments and the existing cold discard policy; do not execute them during shutdown.
Settle every waiting caller honestly even if one preservation write fails. A transient failure
must permit reconciliation/retry under the same owner without inference or duplicate evidence.
Bounded acknowledgement is distinct from actual settlement. The resident pool retains its gate
until actual old-owner cleanup ends, including failure recovery; another operation cannot borrow
the same Session while cleanup is pending. Store/dependencies remain available to owned known
receipt writers. Join App construction already in flight and shared resource cleanup exactly once.

The CLI exit owner must observe actual shutdown settlement within an explicit finite grace
consistent with the App's existing close budget. Incomplete cleanup is not exit-code zero.
The existing shared shutdown-budget contract aligns App/CLI cleanup (6 seconds), output flush
(0.5 seconds), parent EOF wait (7 seconds), process-tree force (8 seconds), each Host remote/local
phase (10 seconds), and the serial Host parent deadline (21/22.5 seconds). Windows keeps its
absolute CIM/taskkill deadline inside the same phase. These are finite limits, not receipt guarantees.
Preserve hard termination for non-settling resources and report unknown outcome; never promise
receipt survival after explicit kill or indefinitely retain a dead process.

Cold recovery: an older terminal event cannot override newer same-ID resume evidence. Preserve
terminal authority against genuinely stale Started data using existing event/journal facts.
Preserve the original event emission timestamp in optional internal `entry.data.eventTimestamp`
for Started/Updated/Completed receipts, with finite validation and backward reads for old entries.
Legacy rows without a valid emission clock use original creation time; I/O update time cannot
prove resume. Ambiguous old evidence retains the known terminal observation, without rewriting data.
SQLite upsert creation time is not a resume event clock. The existing Runtime provides a private
sequence-namespace identity; optional `entry.data.eventEpoch` pairs it with the already stored
`sequenceNumber`. Same-owner sequences precede wall time, including clock correction. Cold
sequences from unknown/different epochs never gain comparability from their positive integers.
Restored ordering is derived from those existing entries, without changing the wire event DTO.
No schema change or old-data rewrite.
Pass the actual journal reader through production Host wrappers; a helper-only fixture is not
wiring proof. Missing/foreign/uncertain facts do not invent a running task or restart inference.

Guide: account for every vendor-accepted input exactly once, including multiple Guides and ACP
approval waits. A generic ACP local hold or unacknowledged custom notification is not vendor
acceptance; retain original normal-prompt continuation instead of inventing an extension. Proven
Claude SDK and Codex app-server controls remain unchanged. An old delivered Guide cannot become a new request or bypass approval. Settings:
confirmed commit precedes migration markers; failures retain original preferences and retry.
Human and Agent operations maintain the same current and recovery facts without changing owners.

## Acceptance and stop conditions

- Actual config load, current desktop and staged CLI build, product types/lint/architecture,
  applicable existing behavior suites and complete patch reconstruction.
- Real public Client/Server + Node MessageChannel + SQLite: A/B receipt isolation, unsent draft,
  independent failure, duplicate/late acknowledgement and cold reopen.
- Public App/pool/CLI + real store: slow close, known late effect, transient queue failure,
  retry, delayed factory, shared resource ownership, finite forced exit and no input replay.
- Public Host materialization: newer resume, older terminal, stale Started, journal-only record,
  foreign owner and interrupted/reopened state.
- Original rendered controls and applicable theme/locale/keyboard/narrow states; current-source
  running inspection precedes owner acceptance. `usable` is not implied by fixtures.

Stop and return to Lead at a new store/permission/security authority, data migration, dependency,
live provider cost, reference replacement, public action or unsupported product decision.
Keep paid-provider, real SSH/WSL/Windows, signed distribution and owner acceptance proof separate.
