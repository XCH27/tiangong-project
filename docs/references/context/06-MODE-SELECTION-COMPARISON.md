# Interaction Modes, Planning, and Permission Selection

> **Status:** primary-source product and mechanism evidence, not implementation authority. Reviewed
> 2026-07-27. Craft v0.10.5 remains Fleet's interaction baseline. This note classifies the proposed
> integration as `EXTEND`: it must reuse Fleet's one Session, permission path, timeline, task store,
> and settings home.

## 1. Executive answer

Fleet can combine its current Explore / Ask / Execute control with planning in **one visible mode
picker**, but it must not collapse task phase and action authorization into one underlying state.
Current products converge on this pattern:

- a small set of user-selectable work modes controls whether the agent is answering, planning, or
  implementing;
- plan completion creates a transient review state, not another mode the user selects;
- approving a plan transitions the same conversation into execution and may let the user choose the
  execution approval posture;
- automatic mode selection may propose or enter a safer task phase, but it must not silently grant
  broader tool permissions.

The evidence therefore supports this Fleet model:

```text
visible work mode: Explore | Plan | Execute
                           |
                           +-- Plan ready -> transient plan review
                                                |
                                                +-- approve -> Execute

independent action policy: ask | scoped auto-approve | deny
```

`planning`, `awaiting_plan_approval`, and `executing` are lifecycle states. Only the stable work
intent is selectable. `awaiting_plan_approval` belongs in the plan review UI and Session timeline,
not in the mode picker.

## 2. Cursor

Cursor exposes task modes as first-class interaction choices:

- Ask is read-only exploration; Agent can explore, edit, and run commands. The official mode
  documentation describes a mode picker and `Ctrl+.` quick switching
  ([Cursor Modes](https://docs.cursor.com/en/agent/modes)).
- Plan is entered with `Shift+Tab`; it researches the codebase, asks clarifying questions, creates
  an editable plan, waits for approval, and then builds from that plan
  ([Plan Mode](https://cursor.com/blog/plan-mode),
  [agent best practices](https://cursor.com/blog/agent-best-practices)).
- Cursor may suggest Plan for a complex request. A later release added agent-proposed mid-conversation
  mode switches plus user-configurable auto-approve or auto-reject for those transitions
  ([Cursor 2.4 changelog](https://cursor.com/changelog/2-4)).
- The CLI exposes `/plan`, `--mode=plan`, `/ask`, and `--mode=ask`
  ([CLI modes](https://cursor.com/changelog/cli-jan-16-2026)).

Cursor keeps action approval separately configurable. Its editor and CLI permissions include **Run
Everything**, **Auto-Run in Sandbox**, and **Ask Every Time**, independent of the selected task mode
([Cursor 2.4 changelog](https://cursor.com/changelog/2-4)).

**Finding:** Cursor unifies mode discovery and switching in the composer, but does not equate
“select Plan” with “change how shell/edit approvals work.” Automatic behavior is a mode-transition
proposal with its own approval policy, not automatic privilege escalation.

## 3. Claude Code

Claude Code goes furthest in flattening these concepts into one user-facing selector:

- its permission-mode surface includes `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, and
  `bypassPermissions`;
- CLI `Shift+Tab` cycles `default -> acceptEdits -> plan`; `/plan [description]` enters planning
  directly; VS Code and Desktop use the mode indicator/menu near the composer;
- Plan researches and proposes without editing source files. Fine-grained allow/ask/deny rules still
  layer on top of the selected baseline mode;
- when the plan is ready, Claude presents an inline review. The user may keep planning or approve
  into Auto, Accept edits, or manual edit review. Approval exits Plan and starts editing in the
  chosen execution permission mode.

Sources:

- [Choose a permission mode](https://code.claude.com/docs/en/permission-modes)
- [Review and approve a plan](https://code.claude.com/docs/en/permission-modes#review-and-approve-a-plan)
- [Claude Code Desktop shortcuts and mode menu](https://code.claude.com/docs/en/desktop#keyboard-shortcuts)
- [`/plan` command](https://code.claude.com/docs/en/commands)
- [Agent SDK `PermissionMode` type](https://github.com/anthropics/claude-agent-sdk-python/blob/main/src/claude_agent_sdk/types.py)

Claude's Auto mode is an action-approval mechanism: a separate classifier checks pending actions.
It is not documented as a classifier that decides whether a task should be planned
([Auto mode](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode)).

**Finding:** one visible selector is compatible with separate internal semantics. Plan-ready is not a
peer mode. The plan approval itself chooses the next execution permission posture.

## 4. Comparable inspectable projects

### 4.1 Codex

Codex is the clearest counterexample to treating planning and permission as one state:

- the current TUI exposes only `Default` and `Plan` as collaboration modes and cycles those modes
  independently;
- `/permissions` separately selects permission profiles such as Read Only and Full Access;
- the protocol carries collaboration mode, approval policy, sandbox policy, and active permission
  profile as separate fields;
- the newer Auto-review path changes the approval reviewer and permission profile, not the
  collaboration mode.

Sources:

- [collaboration mode types and visible modes](https://github.com/openai/codex/blob/bd2de422aa287b97b06ca6425a10935bcf1b3731/codex-rs/protocol/src/config_types.rs#L625-L673)
- [collaboration-mode cycling](https://github.com/openai/codex/blob/bd2de422aa287b97b06ca6425a10935bcf1b3731/codex-rs/tui/src/collaboration_modes.rs)
- [thread settings keep approval and collaboration fields separate](https://github.com/openai/codex/blob/bd2de422aa287b97b06ca6425a10935bcf1b3731/codex-rs/app-server-protocol/src/protocol/v2/thread.rs)
- [Auto-review permission posture](https://github.com/openai/codex/blob/bd2de422aa287b97b06ca6425a10935bcf1b3731/codex-rs/tui/src/app.rs#L362-L382)

**Finding:** Codex proves that phase and authorization must remain separate, but its split interaction
is less direct than Claude's unified selector. Fleet should borrow Codex's state separation, not its
extra user-facing friction.

### 4.2 Gemini CLI

Gemini CLI also places Plan in the visible approval-mode cycle:

- `Shift+Tab` cycles Default, Auto-Edit, and Plan; `/plan`, `--approval-mode=plan`, and a natural
  language request may enter planning;
- Plan is read-only apart from its controlled plan artifact;
- the finalized plan asks whether implementation should automatically or manually accept edits;
- the policy engine still evaluates mode-specific rules, so the combined selector does not remove
  the distinction between planning constraints and action authorization.

Sources: [Gemini CLI Plan Mode](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/plan-mode.md)
and [policy engine](https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/policy-engine.md).

The non-interactive path is a caution, not a Fleet default: Gemini automatically approves plan entry
and exit there and switches to YOLO for implementation. Fleet must not copy that privilege widening
into an interactive Session.

### 4.3 Cline

Cline exposes a direct Plan / Act toggle. Plan can read, search, and discuss but cannot edit files or
execute commands; Act retains the same conversation context and implements
([Plan & Act](https://docs.cline.bot/core-workflows/plan-and-act)). Cline documents no automatic
Plan/Act classifier. Auto Approve is evaluated per tool call, while YOLO separately approves all
actions, including mode transitions
([Auto Approve and YOLO](https://docs.cline.bot/features/auto-approve)).

**Finding:** the task phase and approval policy are explicit independent axes.

### 4.4 Roo Code

Roo Code's Ask, Architect, Code, Debug, and Orchestrator modes are task personas with different tool
groups. Users switch through the composer, commands, or shortcuts; Roo can also suggest a switch.
Orchestrator and custom `whenToUse` descriptions support automatic task routing. Permission to switch
modes automatically is itself a separate, low-risk Auto-Approve category, while edits, commands,
browser, and MCP actions keep separate approvals.

Sources:

- [Using modes](https://roocodeinc.github.io/Roo-Code/basic-usage/using-modes/)
- [Custom modes](https://roocodeinc.github.io/Roo-Code/features/custom-modes/)
- [Auto-approving actions](https://roocodeinc.github.io/Roo-Code/features/auto-approving-actions/)

**Finding:** automatic mode selection does not imply automatic access expansion.

### 4.5 OpenCode (local source, re-cloned 2026-07-27)

Local checkout: `源码参考/software/opencode` at `40e4d730cac33cc9e76659ae7acb16b3a6132b83`
(MIT). Earlier sparse snapshot under this path was incomplete (no `.git`); replaced with a sparse
clone of https://github.com/anomalyco/opencode covering agent/tool/session/permission.

**Primary agents (not permission modes):**

| Agent | Role in source | Mutation |
|---|---|---|
| `build` | **Default** primary agent: “Executes tools based on configured permissions.” | Edits allowed under permission rules; **owns `plan_enter`** |
| `plan` | Optional primary: “Plan mode. Disallows all edit tools.” | `edit:*` deny except plan markdown paths; **owns `plan_exit`** |
| `explore` | **Subagent only** (not the daily composer default) | Fast read/search for delegated research |

Evidence: `packages/opencode/src/agent/agent.ts` (`build` / `plan` / `explore` definitions;
`default_agent` falls back to `build`).

**How Plan is entered — never by message heuristic:**

- User switches primary agent (composer cycle / Tab-class UX via `agent.cycle`).
- From **build**, the model may call **`plan_enter`**, whose description says it **asks the user**
  whether to switch to plan (`packages/opencode/src/tool/plan-enter.txt`). Defaults deny
  `plan_enter` except on build.
- Leaving plan uses **`plan_exit`**: asks “switch to build and implement?” then injects a synthetic
  user message with `agent: "build"` (`packages/opencode/src/tool/plan.ts`).
- Permission rules (`allow` / `ask` / `deny`) stay independent of which agent is selected
  (`packages/opencode/src/permission/`, agent rulesets in `agent.ts`).

**Finding:** OpenCode’s daily path is **build = search + edit**. Plan is a **named primary agent
you opt into**. `explore` is a specialized subagent for research, not “Auto demotes you to read-only.”
There is **no** regex router that forces Plan on “broad change.” Agent may **propose** Plan entry;
**humans approve** enter (via plan_enter question) and exit (via plan_exit question).

The admitted behavior is recorded once in
[`../../08-CRAFT-CAPABILITY-MAP.md`](../../08-CRAFT-CAPABILITY-MAP.md); implementation lives in
`app/packages/shared/src/agent/work-mode.ts` and the Session authority.

## 5. Recommended Fleet contract

This is an `EXTEND` of the capability-map row **Permission modes and Agent gate**, not a new mode
engine.

### 5.1 User-facing modes

| Mode | Stable intent | Mutation behavior |
|---|---|---|
| Explore | Investigate, explain, compare, answer | Read-only; no implementation plan is required |
| Plan | Investigate toward an implementation contract | Read-only except the governed plan artifact; submit for review |
| Execute | Implement the current request or approved plan | Mutations pass through the existing permission path |

The existing Chinese label `询问` currently describes an approval posture, not a distinct task phase.
It should move under Execute as **执行时询问**, rather than remain a peer beside Explore, Plan, and
Execute. The current `allow-all` behavior should be shown as an explicit autonomous execution grant,
not implied by merely entering Execute.

### 5.2 One picker, two internal dimensions

- The composer has one mode picker. Its effective work mode is always Explore, Plan, or Execute.
- The default selection policy is **Auto**. Auto is not a fourth work mode: the control renders the
  effective result as `Auto · Explore`, `Auto · Plan`, or `Auto · Execute`.
- The menu also lets the user lock Explore, Plan, or Execute manually. A manual choice overrides
  automatic routing for the current task; a separate explicit setting may make it the Workspace
  default.
- Session state records the selected work mode and the transient execution phase.
- The existing permission authority continues to resolve each legal action as allow / ask / deny.
- Mode transition never edits global or workspace permission rules.
- Automatic selection may soft-route Explore for pure Q&A. It must **not** auto-enter Plan (OpenCode
  / Grok / Cursor daily usage: Plan is opt-in). Execute remains the productive default under the
  already-selected execution approval posture.

The internal contract needs three orthogonal values, stored through the existing Session authority:

```text
selection policy: auto | locked
effective work mode: explore | plan | execute
execution approval: ask | auto-review | bypass
```

`bypass` must never be selected automatically. It is an explicit, warned, session-scoped grant.
Execute means “implementation is allowed to begin”; it must not mean “all permission checks are
disabled.”

### 5.3 Automatic routing and transition rules (revised after OpenCode + Grok source + owner use)

Align Auto with **OpenCode `build` + Grok `PromptMode::Agent` + Cursor Agent**, not with a
plan-first process:

1. explicit user lock wins (`manual` Explore / Plan / Execute);
2. **default Auto phase is Execute** (search + edit under existing execution approval);
3. only **clearly read-only / audit** turns may soft-route to Explore (Ask-like); weak or ambiguous
   text stays sticky or falls back to Execute — never thrash;
4. **Auto must not heuristically enter Plan** for “broad”, “architecture”, or “plan-worded”
   requests. Plan is **opt-in only**:
   - user: UI picker, Shift+Tab, `/plan …`;
   - agent: typed `EnterPlan` / OpenCode-style `plan_enter` **proposal** (prefer ask or highly
     visible phase badge; never silent privilege change that blocks edits without the user noticing);
5. irreversible / monetary / production / authority-changing work still hits owner checkpoints via
   the existing permission path — that is **not** the same as forcing Plan mode;
6. leaving Plan for Execute requires human plan approval (`SubmitPlan` / OpenCode `plan_exit` /
   Grok `exit_plan_mode`).

The model may propose Plan via a typed tool (Grok `enter_plan_mode`, OpenCode `plan_enter`, Fleet
`EnterPlan`). Prompt regex is not the authority. OpenCode’s stricter pattern — **ask before
switching agents** — is the better product default for entry; Grok’s **session-owned plan gate +
mid-turn-safe state machine** is the better enforcement default once Plan is active.

Transitions follow monotonic privilege:

| Transition | Automatic behavior |
|---|---|
| Execute -> Explore or Plan | Allowed at the next tool/turn boundary |
| Explore -> Plan | Allowed and recorded; both remain non-mutating |
| Explore -> Execute | Allowed only when current execution approval already authorizes it; otherwise ask |
| Plan -> plan review | Automatic when a concrete plan version is submitted |
| Plan review -> Execute | Requires plan approval; approval selects or retains execution approval posture |
| Any mode -> bypass | Never automatic |
| Resume after interruption | Restore the persisted phase and pending decision; never infer approval |

Mode changes during an active tool call are queued to the next safe boundary. They must not replace
the policy beneath an already-dispatched action.

### 5.4 Plan handoff

When a plan is submitted:

1. keep Plan selected;
2. render one inline review state with approve, revise, and cancel;
3. on approval, record the exact approved plan version and decision in the existing Session/Task
   evidence path;
4. switch the same conversation to Execute;
5. use the user's existing execution approval posture, or ask once which posture to use;
6. never expose `awaiting_plan_approval` as a mode choice.

This adopts the strongest shared product pattern from Cursor, Claude Code, Gemini CLI, Cline, Roo
Code, OpenCode, and the audited Grok Build source while preserving Fleet's non-negotiable single
permission and Session authorities.

### 5.5 Migration from Fleet's current modes

The present storage keys can be migrated without creating a second permission engine:

| Current value | New work mode | New execution approval |
|---|---|---|
| `safe` / Explore | Explore | unchanged deny/read-only baseline |
| `ask` / Ask | Execute | Ask during execution |
| `allow-all` / Execute | Execute | Bypass, preserved only as an explicit legacy grant |

The UI-facing `询问` label therefore moves from the primary three-way picker into Execute's approval
setting. Existing allow/ask/deny evaluation remains the sole action authority. Plan enforcement is
an additional phase gate intersected with that authority, never a replacement for it.
