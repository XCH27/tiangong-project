# Interaction Modes, Planning, and Permission Selection

> **Status:** primary-source product and mechanism evidence, not implementation authority. Reviewed
> 2026-07-27. Craft v0.10.5 is the look pin; current implementation is Craft v0.13.4. This note classifies the proposed
> integration as `EXTEND`: it must reuse Fleet's one Session, permission path, timeline, task store,
> and settings home.

## 1. Current admission

The **current implementation contract is [R1](../../modules/shell.md)**,
revised by the owner on 2026-09-22 after ZCode/Cindy source comparison. ZCode's Plan checkbox is
independent of three permission radios: Confirm changes, Auto edit and Full access. Model and
reasoning are separate composer controls; the model popup follows Cindy. Craft owns visual tokens
and the existing Session, permission and provider paths.

The source findings in §§2–4 retain their original review date and revisions. They are comparison
evidence, not instructions to restore Explore / Plan / Execute or automatic work-phase routing.
The superseded Fleet recommendations have been replaced by the bounded admission below.

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
[`capabilities.md`](../../capabilities.md#craft-capability-map); the former `app/packages/shared/src/agent/work-mode.ts` was removed by the rebuild.
The target extends the current Session/permission authority and is `not implemented`.

## 5. Admitted mechanism and implementation limits

This is an `EXTEND` of the **Work modes, permission modes and Agent gate** capability row.
Do not build another mode engine or Settings-only permission system.

- ZCode `packages/ui/src/v4/composer/V4ComposerModeControls.tsx` renders an independent Plan
  checkbox above three permission radios. `packages/shared/src/execution-state.ts` separates
  `mode` and `planEnabled`. This is not four mutually exclusive modes.
- `apps/zcode-cli/packages/core/src/permission/service.ts` checks Plan even when `mode === "yolo"`;
  `edit` has a separate evaluator. A permission label alone cannot reproduce this behavior.
- `packages/ui/src/v4/composer/composerSubmissionConfig.ts` validates and snapshots the model,
  options and execution intent at Send. `agentConversationTransport.ts` rejects independent Plan
  when the host lacks protocol support. These mechanisms inform Fleet's existing submission path.
- Craft's `safe/ask/allow-all` and `SubmitPlan` are the starting authority. Add independent Plan and
  Auto edit coherently across persistence, protocol and both adapters. Preserve legacy read-only
  restrictions. Approving a plan must never silently change the selected permission to Full access.
- Keep one plan-review state and one Session evidence path. Resume reconstructs pending decisions;
  neither a model response nor a UI label establishes approval. Running actions retain the policy
  under which they were dispatched.

The ZCode observation is at `872ad960de7ec172591f7e1952f7849229f94521`; it does not change earlier
source audit revisions. Exact layout, transitions, migrations, failure recovery and acceptance
are owned by R1. This reference note does not duplicate that execution contract.
