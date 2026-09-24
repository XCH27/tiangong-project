# AGENTS.md — collaboration and code-development rules

Mandatory entry for every executing agent. Read this file, then only the documents your task routes
to. Do not preload the whole `docs/` tree.

## Current boundary

- `app/` is official Craft Agents v0.13.4 plus the bounded, declared entry corrections.
  `scripts/check-upstream-delta.py` enforces zero undeclared difference from the pin; every change
  you make must earn a line in
  [`docs/UPSTREAM-DELTA.tsv`](docs/UPSTREAM-DELTA.tsv).
- The owner's order is **documentation and preparation → joint walkthrough of original Craft →
  approved rectification slices → implementation and acceptance → added capabilities.**
- The owner reauthorized **one bounded R1 entry slice**: separate All Conversations and Board
  navigation; place Release Notes under Settings → App → About; move the desktop Craft logo menu to the lower-left
  footer, informed by ZCode. The upper-right Help button remains; the later owner direction removes
  genuinely duplicate desktop menu entries and the Debug submenu after checking other access paths
  and shortcuts. App Settings owns update check/install UI; developer tools keep their debug gate.
  The latest owner-approved Settings correction **reuses the original left sidebar slot**: opening
  Settings replaces its rows with Settings categories, and the top New Conversation row becomes
  Back to Workspace. The selected form occupies the existing content panel; no extra sidebar or
  drill-in page is mounted. The upper-right Help button retains Craft's topic menu and opens
  packaged local Craft reference documents in its existing full-document reader; the native Help
  action and contextual Learn More use the same local documents. Existing feature-page Agent
  controls own contextual questions and edits. Page titles and ellipses
  are reduced without changing Craft's visual values. The owner also authorized the Messaging
  settings width correction and a source-backed review of additional IM channels. A channel is
  not surfaced as connectable until receive, scope, permission, send and reconnect are real.
  This does not authorize the old 11-item R1 plan,
  Conversation/Project data changes, Workspace removal, unrelated composer or right-panel work. See
  [`docs/modules/shell.md`](docs/modules/shell.md#active-entry-slice) and [`TODO.md`](TODO.md).
- Later owner instructions separately authorize a model-connection correction across setup,
  discovery, model/effort selection and runtime credentials. Keep it bounded to existing
  connection, credential, Session and provider owners; do not infer model capabilities,
  subscription allowances or Grok subscription login from API-key support. See
  [`docs/modules/context.md`](docs/modules/context.md#model-connection-correction).
- A 2026-09-22 attempt at this slice was rejected and reverted. The owner's words:
  「你的很多修改是完全错误的，我只让你修改所有对话和项目等模块，你却随意修改了其他部份，而且你的UI
  设计没有遵循原版的配色间距设计风格，交互逻辑和排版方案也没使用两个参考项目的，完全自己随意创建了
  一套」. Rules 1–3 below exist so that does not happen again.

## Read this first

[`docs/product.md`](docs/product.md) is the single authority on what Fleet is and is not.
Where another document disagrees, it wins. In one line: **Craft Agents decides the look and the
runtime base; Cindy decides how features are built and how surfaces talk to the backend; ZCode is
the layout and interaction reference for the conversation shell and composer; OpenChamber decides
Git and GitHub; the canvas, documents and video are Fleet's own.**

## Rules

1. **Port, do not invent.** Almost every surface already exists in Craft, and the surfaces being
   rectified exist in Cindy or ZCode. Before writing a line, open the upstream component and the
   reference component and diff them (see *Before you write UI*). Take their structure, layout and
   interaction; apply only Craft's colour, spacing, radius, type and motion tokens. If you cannot
   name why your version differs from the reference, the difference is an invention.
2. **Change only what the slice names.** Do not touch neighbouring surfaces, shared styles or
   unrelated behaviour. A change outside the slice needs its own approval.
3. **Never create a second authority.** One Session store, one permission path, one timeline, one
   task store, one settings home. Extend the existing owner.
4. **Simplifying is not deleting.** A control, page or function that disappears must have a named
   new home, declared as `L2` in `docs/UPSTREAM-DELTA.tsv`. `scripts/check-orphaned-components.py`
   flags components upstream mounts and we do not.
5. **Decide with evidence; ask only what is genuinely the owner's.** Research how Codex, Claude
   Code, Cursor and the reference projects solve the problem, then propose the landing path. Do not
   ask the owner how they want something designed. Report designs and landing plans for
   confirmation before large implementation.
6. **Keep the task fixed.** Do not silently change the request, acceptance, tests or harness.
7. **Halt after two non-progressing attempts.** Preserve evidence and report the smallest next
   decision.
8. **Check reality first.** Existence, installation, running process, permission, input path —
   cheapest checks first. A missing tool or preview is a classified limitation, not permission to
   rebuild infrastructure.
9. **Report status with the fixed vocabulary only:** `usable` · `wired but not visually checked` ·
   `display-only` · `not implemented`. "Tests pass" is never a capability status.
10. **Documentation serves implementation.** Update the canonical document whose contract changed;
    absorb, relink, then delete superseded material. No dated progress reports, duplicate plans or
    in-tree archives. Git history is the archive. Documentation is English-first; keep Chinese for
    exact owner quotations and `zh-Hans` UI literals.
11. **Do not dispatch sub-agents to decide design, layout or architecture**, and do not dispatch
    them casually at all (owner: 「不要乱派子智能体」). They arrive without this context and invent.

## Routing — read before you touch

Every document has one job. Modules are self-contained: each opens with a generated card (its
register rows, status, release, surfaces), then owns its contract, code entry points, references
and execution rows. Read the module first, and the shared documents only for what it points to.

| Before you touch… | Read |
|---|---|
| **Anything rendered** — a value, layout, motion | [`DESIGN.md`](DESIGN.md), then the module — mandatory before UI code |
| Sidebar, navigation, Workspace/Project, new conversation, composer, right panel (paused R1) | [`docs/modules/shell.md`](docs/modules/shell.md) |
| Updater, hosted Pages, telemetry, help, OAuth relays, branding (R2) | [`docs/modules/services.md`](docs/modules/services.md), then [packaging](docs/engineering.md#building-and-packaging) |
| The walkthrough, baseline exit, or any original-Craft behaviour (R0) | [`docs/modules/baseline.md`](docs/modules/baseline.md) |
| Sessions, permissions, actions, tasks, orchestration | [`docs/modules/agent-core.md`](docs/modules/agent-core.md) |
| Prompt, tools, tokens, memory, Skills loadout | [`docs/modules/context.md`](docs/modules/context.md) |
| Browser pane, capture, evidence | [`docs/modules/browser.md`](docs/modules/browser.md) |
| Canvas, design, documents | [`docs/modules/canvas.md`](docs/modules/canvas.md) |
| Image, audio, video, decks | [`docs/modules/media.md`](docs/modules/media.md) |
| Workflows, schedules, delivery | [`docs/modules/workflow.md`](docs/modules/workflow.md) |
| Remote targets, worktrees, messaging, computer use | [`docs/modules/remote.md`](docs/modules/remote.md) |
| Plugins, Skills, MCP catalogs, component distribution | [`docs/modules/marketplace.md`](docs/modules/marketplace.md) |
| Panel host, components, workspace compositions | [`docs/modules/components.md`](docs/modules/components.md) |
| Scope — "should Fleet do this at all?" | [`docs/product.md`](docs/product.md) |
| A capability's status, acceptance ID, page or surface ID | [`docs/capabilities.md`](docs/capabilities.md) — the register; edit rows there |
| "Is this already decided?", the owner's exact words | [`docs/decisions.md`](docs/decisions.md) |
| A cross-module invariant, authority or code entry point | [`docs/architecture.md`](docs/architecture.md) |
| A component, a gate, a test, a commit, a build | [`docs/engineering.md`](docs/engineering.md) |
| Which open-source project to reference, and where | [`docs/references.md`](docs/references.md) |
| What to do now | [`TODO.md`](TODO.md) |

Where to write: a fact belongs to exactly one of these. Module-specific detail goes in its module,
never in a shared document; a status goes in the register row, never in prose; history goes in
[`CHANGELOG.md`](CHANGELOG.md). Documents other than the ledgers (`capabilities`, `decisions`,
`references`, `CHANGELOG`) stay under 700 lines — the gate enforces it; split by module, not by
raising the limit.

## Preflight

```bash
bash scripts/init.sh
```

It wires the commit gates (`core.hooksPath` is not carried by a clone), checks the toolchain, and
checks that both Craft pins are on their pins. `源码参考/` and `UI参考/` are symlinks into
`/Volumes/AIGC/天工参考/` and are not tracked. When the volume is not mounted, every "compare the
reference first" step is unexecutable — report it and stop rather than work from memory.

```bash
git -C 源码参考/software/craft-agents-oss-v0.10.5 describe --tags   # look pin: exactly v0.10.5
git -C 源码参考/software/craft-agents-oss describe --tags           # rolling pin: must equal app/ (v0.13.4)
```

These checkouts carry their own `.git`. A `checkout` run inside one silently moves the baseline.

## Before you write UI

### Step 0 — open the upstream and reference components and diff them

```bash
U=源码参考/software/craft-agents-oss
diff app/apps/electron/src/renderer/<path> $U/apps/electron/src/renderer/<path>
```

For a future approved R1 surface, also open the named Cindy and ZCode components listed in [source comparison](docs/modules/shell.md#source-comparison) and in
[`docs/references.md`](docs/references.md). Read what they do, then justify each delta. Real cases
this step would have caught: a button given `h-7` because `size="sm"` "looked too big" while
upstream uses `size="sm"` everywhere; a dropdown hand-rolled from `<button>` rows beside a sibling
using `Popover` + `cmdk`; a picker rebuilt next to two steps that already use
`AddWorkspace_RadioOption`.

**Never produce a concept mockup or redesign image as implementation input.** The reference is
source code, not a picture you drew.

### Then the values

[`DESIGN.md`](DESIGN.md) — colours, opacity ladder, type, radius, elevation, icon slots, shared
primitives, required states, and motion. The in-app `lint:ui-contract` guard was removed with the
original-source reset; restoring it is part of an approved slice, not a preparation patch.

## Owner protocol

- **Checkpoints — stop and get explicit approval before:** spending money or any irreversible or
  public effect (paid APIs, deletion, deployment, publication, external messages, merge to remote
  `main`); adding a production dependency or external service; creating or replacing an authority
  or security boundary (Session storage, permissions, credentials, migrations); choosing between
  materially different product outcomes or changing established behaviour; removing or re-pinning a
  reference project. Present **what · why · cost and risk · two or three options ·
  recommendation**, in words a non-programmer understands.
- **Proceed without approval:** reversible in-scope work, code organization and technical patterns,
  read-only inspection, tests, builds, fixing your own regression, documenting changed facts.
- **Acceptance:** every delivery states the outcome in plain language, the status, a short
  **CHECK THIS** list, and what was deliberately left unchanged. The owner judges look and feel —
  light and dark, `zh-Hans` and English, narrow windows — and accepts, which promotes the capability
  to `usable`, or names the mismatch for the next bounded fix. Agents own logic, data integrity and
  code quality. Show the running change; do not describe it.
- **Status meanings:** `usable` = real path verified and visible behaviour owner-accepted;
  `wired but not visually checked` = real path verified, visual acceptance pending; `display-only` =
  UI without real behaviour; `not implemented` = absent. "Mostly done" and "should work" are not
  statuses.
- **Duty to dissent:** if an instruction conflicts with a recorded decision or will lose data or a
  function, say so once with evidence, then follow the owner's call and record it in
  [`docs/decisions.md`](docs/decisions.md).
- **Test content is not product intent.** Session content, Project names and fixtures (for example
  the stock-trading test chats) are data, never requirements or defaults.
- **Reference projects are retained unless the owner decides otherwise.** Present target, evidence
  and recovery plan before removing or re-pinning one.

## Learned owner preferences

- Reviews must be deep and evidence-backed: paths, diffs, file:line. Survey-style reviews are
  rejected.
- Bound improvement work with measurable goals and stop conditions; no open-ended optimizing loops.
- Rectify the project, do not pile up documents (「我是要你整改项目而不是堆砌文档」).
- Fleet is not another pure coding-agent IDE; coding-agent forks are harness and interaction
  references, not the product shape.
