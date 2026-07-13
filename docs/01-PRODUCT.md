# 01 — Product

> What we are building, why, and the shape of the system. This is context, not a work queue.
> The work queue is [`04-MILESTONES.md`](04-MILESTONES.md).

## 0. The vision, and the honest line under it

**Traditional products lodge an agent inside a tool; Fleet turns the whole work chain into an
environment an agent can understand, execute, compose, and learn from.** A code agent understands only
the code stage, a design agent only design files, an office agent only documents — and the moment work
crosses a software boundary, context, artifact relationships, human feedback, and execution history all
break. Fleet's bet is to fix the *environment*, not any single tool: Fleet itself owns the project,
sessions, permissions, execution record, workflows, artifact relationships, and context, so a human and
multiple agents can run continuously from intent to delivery. API, CLI, terminal, local programs,
external services, async jobs, and other agents become **execution methods chosen per task**, not
walled-off product entrances. External software can still be used, but it is demoted to a replaceable
capability provider / runtime / adapter — it no longer owns Fleet's project context or collaboration
authority.

**Read this next sentence as carefully as the one above it.** Everything in the paragraph above, and
the "moat" in §7 below, is the **target value and architectural vision** — a set of hypotheses to be
earned, not facts already true. What is actually verified today is essentially the upstream Craft
Agents v0.11 baseline; **the full chain described here is not yet built.** The hardest, most
distinctive parts (a composable creative chain; governable experience distilled from the work) sit at
the *far* end of the road, not near it. This document set exists precisely because a previous version of
this project let the vision outrun the code. So: state the ambition plainly, and always carry this
honest line with it.

## 1. The product in one paragraph

Fleet turns Craft Agents from a chat surface into a **local execution workbench**. A human sets
intent; agents carry out concrete production work — running tools, editing files, generating assets —
and every consequential action is evaluated by one caller-aware policy path and leaves attributable
evidence on one timeline. The human can see what happened, approve what's risky, and recover honestly
when recovery is possible. Fleet is
valuable only when it can move real work from intent to output **with evidence, permission, state,
and honest undo.** Impressive-looking panels with no real behavior behind them are worthless here.

## 2. What "agent-native" means (the core design constraint)

Every serious capability must be usable by **both** the human UI **and** an authorized agent through
one canonical invocation model. They share the action definition, policy evaluator, executor, state
authority, and evidence schema. They do **not** have to enter through the same lifecycle hook or receive
the same policy result: a human click is an explicit user action, while an Agent call is delegated work.
`PreToolUse` is the Agent-side adapter into this model, not a universal UI gateway.

The shared verb set for any capability:

- `read` — inspect the native structure
- `select` — create or update a selection
- `mutate` — apply a structured change (permissioned)
- `undo` — revert through the native history
- `explain` — summarize what changed
- `handoff` — pass the result to another surface

A button-only feature is incomplete. An agent-only tool that bypasses visible evidence is also
incomplete. This is the single most important product property, and it is why the first milestone
— caller-aware action invocation, a.k.a. the action spine (see `05-MILESTONE-1-ACTION-SPINE.md`) —
comes before everything else. Note that "share one path" does **not** mean every caller enters through
the same hook: an agent enters via the SDK's PreToolUse adapter, while a human UI click is explicit
user intent and may get a different policy result — they converge on one executor, state authority, and
attributed evidence, not one identical entry hook.

## 3. The layer model

Fleet grows from Craft in five connected layers. **Only the first two are near-term.** The rest are
context for where this is heading — they are explicitly deferred (see [`04-MILESTONES.md`](04-MILESTONES.md)).

1. **Retained Craft workbench (exists today).**
   The home shell for sessions, projects, agents, settings, permissions, and the BrowserPane.
   Fleet simplifies and extends it. It is never replaced.

2. **Action spine + execution (the near-term build).**
   One structured action path that both humans and agents call, producing permissioned timeline
   evidence. On top of it, the first real product loop: **local terminal / CLI runs** whose output,
   errors, and permission checks flow back into the session timeline.

3. **Files, evidence, and artifact handoff (later).**
   Versioned references to real files and native documents; the BrowserPane as a governed
   evidence-capture surface. Remote pages stay read/annotate/evidence only. A produced image, video,
   website, code result, document, or captured page can be passed by reference into a later Agent or
   capability without silently copying its bytes. This cross-use of exact artifact versions is the
   connective tissue of the whole work chain, not a canvas-specific feature.

4. **Spatial canvas + composable workflows (later).**
   An infinite canvas that *arranges and projects* project entities and their artifact relationships —
   Fleet's **spatial orchestration surface**, where you see at a glance which agents lead which, what
   they produced, and which exact output became a later task's reference or input. Cards (Agent card = a
   shrunk chat box, artifact, generation, file/evidence) are projections of entities owned elsewhere.
   Spatial grouping, reference intent, recorded execution inputs, provenance, and executable workflow
   edges are different relationship classes; drawing or moving something never silently executes work or
   rewrites history. The product model is renderer-independent. React Flow is the leading first adapter
   to benchmark for rich Agent/media cards, not a committed dependency; tldraw and GPU-backed rendering
   remain evidence-driven alternatives or escalation paths. Full owner-directed vision and selection
   gates are in
   [`design-library/07-canvas-spatial-orchestration-VISION.md`](design-library/07-canvas-spatial-orchestration-VISION.md).

5. **Native creative modules (much later).**
   Image/asset/video/web/deck modules that each *register capabilities and views* on the spine
   instead of becoming separate apps.

The through-line: **native authorities per surface, one shared spine underneath.** The shared spine is
session + permission + identity + action registry + timeline + files + cost. The native layer is
whatever document/job model each surface genuinely needs. There is no universal "edit everything with
one patch format" model — that is a known trap.

### 3a. One user-visible project boundary

Fleet's target user model has one work boundary: **Project equals the backend Workspace**. Workspace
remains the code-level storage, configuration, session, permission, and remote-routing authority; a
future migration may present that authority as Project and retire Craft's nested Project entity.
This is a target decision, not current behavior: today the clean v0.11.1-derived shell still exposes
Craft's Workspace and Project structures. Exact navigation, migration, and remote-project placement
must be delivered and verified as separate vertical slices. Decision P6 records the durable model;
[`design-library/20-workspace-project-session-remote-connections.md`](design-library/20-workspace-project-session-remote-connections.md)
is source material for those slices, not a screen contract to apply wholesale.

## 4. UI philosophy (owner-set, binding)

Two owner statements govern all UI work. Quoted verbatim; do not paraphrase them into your own
definition of "minimal":

- 「对于界面安排应该做到如无必要，勿增实体。现在大部分Agent的软件的前端界面都非常的简约。也不会有
  过多的没必要的设置，这样才能适配大多数的用户。」
- 「我在UI上的很多设计都会选择在原版Craft Agents的基础上做简化或者做优化，而不是凭空增加。」

Operationally: **the visual baseline is clean Craft v0.11.** Default UI work is to *simplify or
optimize an existing Craft surface*, not to invent a new one. A new surface is justified only when a
capability genuinely needs to be visible and no existing Craft surface can host it — and even then it
is hosted *inside* the Craft shell, not as a parallel app. Do not add empty panels, docks, settings,
or routes for hypothetical future features.

### 4a. Easy to start, high ceiling (the audience includes non-programmers)

Fleet is meant to be usable by non-technical people (the owner included) **and** to have a high ceiling
for power users. The design rule that delivers both is **progressive disclosure**: the default surface
shows the few things a newcomer needs; advanced power, settings, and detail are reachable but not in the
way. This is the same intent as the owner UI statements above — a simple default is what "适配大多数的
用户" means — extended with an explicit second half: *simple by default must not mean limited.*

Concretely, for any user-facing capability:

- **The common path is obvious and short.** A first-time user can do the main thing without reading
  docs, without configuration, and without understanding the architecture underneath.
- **Depth is available, not absent.** Advanced options, raw evidence, and fine control exist for power
  users — behind a click, a disclosure, an "advanced" affordance — never crowding the default view and
  never removed to look clean.
- **Safe by default for a non-expert.** Because the owner and many users don't read code, dangerous or
  costly actions must be clearly surfaced and confirmed in plain language, not buried in a flag (this is
  the product-side reflection of [`OWNER-CHECKPOINTS.md`](OWNER-CHECKPOINTS.md)).
- **Plain language over jargon** in anything a user reads — labels, errors, confirmations. An error
  should say what happened and what to do, not print an internal stack.

Do not confuse "minimal" with "shallow." Removing a capability, or hiding it so deep a power user can't
reach it, is **not** the goal. The goal is a clean, calm default that a beginner can start from, sitting
on top of real depth a professional can grow into.

## 5. External work is modeled once

Any external or long-running job — AI review, image generation, image/video editing, rendering,
deploy/publish, artifact export — uses **one** job model: `{ type, inputs, target, permissionLevel,
status, outputs, provenance, cost, evidence }`. This prevents a "review center", a "generation
center", and a "publish center" from each becoming a separate governance product. This matters later;
it is stated here so no one builds three parallel job systems.

## 6. What success looks like

A capability is `usable` only when it has all of: a real UI path, a real backend path, real
state/persistence where needed, permission + timeline behavior, agent-native access when it's
writable, error handling that tells the user what happened, and a real-behavior check in the actual
app. Anything less is reported as `wired but not visually checked`, `display-only`, or
`not implemented`. "Tests pass" is never a product status.

## 7. The intended moat (hypotheses to earn, not facts to claim)

The long-term differentiation is **not** "the most built-in software" or "one universal canvas." It is
the set of properties below. Each is a *hypothesis* — it becomes a moat only after it is built,
verified, and actually used. Do not describe any of these as an existing advantage; describe them as
what Fleet is trying to earn.

1. **Continuous whole-chain project context** — one project's intent → research → creation → execution
   → revision → review → delivery, unbroken.
2. **One capability system shared by humans and agents** — one caller-aware invocation, policy,
   executor, and evidence model, not three disconnected implementations.
3. **Traceable, versioned artifact flow** — the same exact artifact version can flow into web, video,
   or deck; browser evidence can flow into design and review; code/file/terminal results return to one
   timeline.
4. **Composable, reusable workflows.**
5. **Governable domain and cross-domain experience** distilled *after* verification (see §8).
6. **Execution scheduling not bound to a single model, tool, or external platform.**
7. **Local, inspectable, deletable, reversible governance.**

## 8. What "experience distillation" precisely means (and does not)

This is the most distinctive claim in the vision and also the hardest and latest to build. State it
precisely, because the loose version ("the agent automatically learns everything it does") is wrong and
dangerous.

Fleet turns a completed work chain into **governable experience carrying source, scope, confidence,
artifact version, and outcome feedback** — not just *what* was done, but *why*; which inputs and tools
were used; where a human edited, rejected, or confirmed; which result was finally adopted; where failure
occurred and how it recovered; what the artifact was later used for downstream; and which experience is
project-local versus verified as cross-project reusable.

The raw timeline **never** becomes long-term memory automatically. An agent may *propose* an experience;
a human or a rule reviews it; only then is it retained as project knowledge, tool experience, user
preference, or a reusable workflow. This is what lets Fleet accumulate experience without
unconditionally amplifying errors, sensitive information, or accidental actions. Because this property
sits on top of every layer below it (there is no "which result was adopted" without a traceable artifact
flow, and no "where a human rejected" without one shared execution path), it is deliberately scheduled
**late** — see the Experience milestone in [`04-MILESTONES.md`](04-MILESTONES.md). It is a *result* of
the spine working, never a starting point.

One hard boundary from [`02-DECISIONS.md`](02-DECISIONS.md) §F applies throughout: demoting external
services to "replaceable adapters" is a product strategy, **never** a license for quota bypass,
anti-detection, or credential extraction.
