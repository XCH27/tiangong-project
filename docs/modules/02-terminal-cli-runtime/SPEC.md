# M02 — Terminal and CLI Runtime

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft; runtime discovery/process/output contracts require v0.11 inspection
> **Wave:** W2
> **Owner:** M02 Worker after the W2 gate opens.
> **Spec version:** draft v1.1 — 2026-07-09
> **Depends on:** M00/M03 usable, M16 host slice, approved terminal-host boundary.

## 1. Purpose

Make one local terminal/CLI execution loop visible and governable: a human chooses a runtime and command, the terminal host runs one bounded RuntimeLane, output returns to the session timeline, and the user can stop, diagnose, or recover without bypassing permission.

## 2. Scope

### In Scope

- A docked terminal surface, runtime selection, one local PTY-backed RuntimeLane, streaming stdout/stderr, stop, exit, and failure presentation.
- Electron main process as the terminal-host owner; `node-pty` is not a Bun-server dependency in this wave.
- Bounded Fleet Bridge reporting for a CLI lane; a lane owns one process/run, not Fleet team state.

### Out of Scope

- A physical daemon, unauthenticated WebSocket port, remote shell, arbitrary command bypass, or TeamRun orchestration UI.
- Generic Git checkout/revert as a rollback mechanism for arbitrary workspace writes.

## 3. User-Visible Loop

```
user selects approved runtime and enters command → M03 invocation → M00 permission decision
→ terminal host starts one RuntimeLane → output streams to terminal panel and timeline evidence
→ exit / stop / error is shown with lane status and report reference
```

Failure path:

```
permission denied, launch error, PTY exit, bridge loss, or interrupted app
→ no unapproved command runs or lane becomes interrupted → terminal panel shows reason and retry/stop/reconnect option → evidence remains in the session timeline
```

## 4. Action and Permission Rules

The exact terminal action IDs must be frozen before M02 implementation. Until then, M02 describes required behaviour only; it does not invent `terminal:*` action IDs.

| Operation | Minimum rule |
|---|---|
| start a lane | Permission checked before spawn; command, cwd, actor, and runtime identity become evidence. |
| stream output | Read-only observation after spawn; sensitive content follows evidence/redaction policy. |
| stop a lane | Permissioned state change; records requested/confirmed termination. |
| workspace write caused by command | Must be reported through the shared action/timeline path; terminal output alone is not proof of an authorized file mutation. |

## 5. State, Timeline, and Recovery

- M00 is authoritative for lane identity, permission decisions, and SessionEvents; the PTY process descriptor is ephemeral host state with durable lifecycle evidence.
- A restart never fabricates success. An in-flight lane is reported as interrupted and the user chooses a documented recovery path.
- File rollback is operation-specific: snapshot/atomic-write/explicit inverse actions where supported. Version-control operations are optional user-visible commands, not implicit rollback.
- Bridge messages are limited to the frozen `reportLaneEvent`, `requestTeamContext`, and `closeLane` boundary.

## 6. UI and Agent Surface

M02 registers a `runtime_continues_when_hidden` bottom-panel contribution through M16. The human
control and Agent action both use M03; an Agent cannot obtain raw shell access merely by being in a
RuntimeLane. The panel must show running, stopped, exited, failed, and interrupted states plus the
evidence reference. Closing/hiding the view does not kill the process; stop is an explicit action.

## 7. Error Handling

| Condition | User-visible result | Recovery |
|---|---|---|
| command denied | no process starts; reason and approval path shown | revise scope or request approval |
| spawn/PTY failure | lane marked failed with host error evidence | retry after fixing runtime/environment |
| non-zero exit | exit code and captured output shown | inspect, retry as a new invocation, or stop |
| app interruption | lane marked interrupted, never completed | reconnect if supported or start a new lane |
| Bridge boundary violation | lane action refused and audited | use one of the frozen Bridge methods |

## 8. Verification Procedure

1. Open the terminal panel and choose the approved local runtime.
2. Run a permitted harmless command; expected: one lane, streamed output, ordered timeline evidence, visible exit result.
3. Attempt a denied/high-risk command; expected: no spawn before permission/approval and clear recovery text.
4. Stop a running lane; expected: termination result and timeline evidence.
5. Restart during an active lane; expected: interrupted status, no false success, and user-visible recovery option.
6. Run the same permitted operation through an authorized agent action; expected: the same permission, host, and timeline path.

## 9. Open Questions

| Question | Owner | Required before |
|---|---|---|
| Frozen terminal action IDs and payloads | Lead | W2 packet |
| Command allow-list / approval policy | Lead | W2 packet |
| Output redaction and retention policy | Lead | W2 packet |

## 10. Change Log

| Date | Version | Summary |
|---|---|---|
| 2026-07-09 | draft v1.1 | Removes early daemon dependency and unsafe implicit Git rollback. |
