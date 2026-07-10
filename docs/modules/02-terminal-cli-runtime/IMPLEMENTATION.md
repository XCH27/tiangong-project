# M02 Implementation Constraints

> **Status:** planning constraint only; M02 is Locked.
> **Canonical behaviour:** `SPEC.md`. This file does not prove any current source path or RPC
> implementation.

## 1. Required v0.11 Inspection

Before an implementation plan is issued, record on the clean v0.11 baseline:

- actual CLI/session transport and authentication lifecycle;
- Electron main-process terminal/PTY extension point;
- runtime detection/configuration authority;
- terminal panel contribution point in M16;
- output/session evidence path;
- stop/process-group/restart behaviour;
- exact build/test/launch commands.

The retired `CliRpcClient` code sample and assumed always-running App Server topology are not an
implementation contract.

## 2. Fixed Boundaries

```text
human or Agent request
-> canonical M03 action
-> M00 permission/approval
-> Electron main terminal host
-> one bounded RuntimeLane/process group
-> streamed view plus durable redacted evidence
-> explicit stop/exit/interrupted result
```

- No physical daemon is required in W1/W2.
- The terminal host does not own sessions, TeamRun, permissions, or file rollback.
- M16 owns panel instance/layout; hiding the view does not stop the process.
- A command's filesystem effects are not made authorized merely by recording terminal output.
- CLI transport gets only the bounded Bridge/contract available on the verified baseline.

## 3. Stop Conditions

Do not implement if terminal action IDs, process host, authentication, output redaction/retention,
stop escalation, or restart semantics are still unresolved. Do not bypass the gap with an
unauthenticated socket, renderer child process, generic shell tool, or temporary second session
store.
