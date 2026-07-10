# Worker PR Template

Every PR submitted by a parallel Worker Agent must include this template as the PR description.
A PR missing any section will be sent back without review.

---

## Packet

> Which **active** `docs/agent-packets/*.md` file owns this work?
> (Never use paths under `docs/legacy/agent-packets/`.)

Packet: <!-- e.g. only a Lead-issued post-W0.1 packet -->

---

## Three-Axis Status

```text
module_or_slice:
capability_status: not implemented | display-only | wired but not visually checked | usable
execution_gate: Locked | Ready | In Progress | Blocked
spec_maturity: concept | contract draft | execution-ready
implementation_authorized: yes | no
```

If `implementation_authorized` is `no`, do not open this PR for feature work.

---

## Pre-Flight Gate

Answer each question in one sentence. If any answer is "unknown", stop and return to Lead before opening this PR.

1. **Which module spec owns this work?**
   >

2. **Which wave packet assigns this work?**
   >

3. **Which files may I edit?**
   >

4. **Which files are forbidden?**
   >

5. **Which shared/frozen contracts do I depend on (exact version)?**
   >

6. **Does this work create another session, permission, timeline, memory, skill, job, artifact, or UI truth?**
   > (must be "no" — if "yes", stop and escalate to Lead; see `FORBIDDEN-ANTIPATTERNS.md`)

7. **Which Internal Action or Agent callable path makes this UI agent-native?**
   >

8. **Is the wave gate Ready and the slice execution-ready?**
   >

9. **What exact behavior proves this slice is `usable`?**
   >

---

## Forbidden Files Check

- [ ] Did NOT touch `app/packages/shared/src/protocol/` (any file)
- [ ] Did NOT touch Electron channel maps or preload transport files
- [ ] Did NOT touch RPC handler registries
- [ ] Did NOT touch global i18n locale JSON files
- [ ] Did NOT touch session persistence fields
- [ ] Did NOT touch permission profile schema
- [ ] Did NOT touch shared settings registry structure
- [ ] Did NOT touch any file marked Forbidden in my packet

---

## Files Changed

```
modified:
created:
deleted:
```

---

## Board Card Update

Paste the updated Board card for this slice:

```md
### Card: <wave> / <module> / <slice-name>

- Owner:
- Worktree:
- Branch:
- Status: <not implemented | display-only | wired but not visually checked | usable>
- UI State: <not started | placed by lead | implemented | verified>
- Backend State: <not started | service wired | handler wired | verified>
- Contracts:
- Allowed Files:
- Forbidden Files:
- Validation:
- Remaining Not Implemented:
- Blocker:
```

---

## Validation Run

```
$ <command>
output:
```

---

## Handoff Status

- [ ] `usable`
- [ ] `wired but not visually checked`
- [ ] `display-only`
- [ ] `not implemented` / blocked

Remaining not-implemented items (skip only if `usable`):
-
