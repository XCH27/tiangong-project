# SYS-01 — Agent operating system and governance

**Rows:** CORE-01..11, EXEC-01..08, EXEC-10..11, EXEC-13..14, ORCH-03..04, ORCH-06..09.
**Development order:** R0–R6 spine; R9/R14–R18 integration. **Owner:** foundation integration.
**Depends on:** Craft v0.11.1. **Consumers:** every other suite.
**Authority:** Craft Session/Task/Permission remain current truth; SYS-01 integrates R4 Action and
R11 Job contracts only after real callers extract them. No parallel stores.

## Closed loop

End state: intent → prompt/profile → ActorRef → PermissionDecision → governed action → Session/Task
execution → RunReport/event evidence → optional Git/PR delivery receipt. This is delivered as
roadmap-ordered Craft extensions, never as one greenfield kernel rewrite.

## First proof

Use two real mutations (labels and the R3 deliverable). Add caller identity and an action envelope
without changing their stores. Prove allow, deny, approval, failure, restart and evidence. Do not
add prompt/profile, delegation or Git/PR work to this proof; those retain their TE1/R6/SYS-02 gates.

## Acceptance and references

Use `EXEC-01-A`, `EXEC-02-A` and R3/R4 specs for the first proof. TE1/R6/R14 release rows may consume
`EXEC-14-A`, `EXEC-04-A` and `EXEC-13-A` respectively, only under their own accepted specs.
Craft remains authority. Compare Pi for harness weight, Codex/OpenCode for bounded protocol and
Session patterns, and OpenHands for executor isolation. Hermes/OpenClaw are used only for the
owner-requested complex-environment comparison. Absorb mechanisms only after same-task and deletion tests.

## Stop conditions

Stop at a new authority, policy bypass, unbounded delegation, public Git side effect, or shared
contract change. Record the smallest contract revision and use the owner checkpoint.
