# Fleet — what this software is

> **The single authority on what Fleet is and is not.** Read it before designing anything.
> Where any other document disagrees with this one, this one wins and the other is wrong.
>
> Owner definition, 2026-09-10. Everything below is either the owner's stated intent or a
> consequence of it that is named as such.

## One sentence

**A workbench a person and their agents operate together, where the work itself lives inside the
software** — not a chat window that drives other applications from the outside.

## The four sources, and what each one is for

Fleet is assembled deliberately, not blended. Each reference answers one question and is not
consulted on the others.

| Source | What it decides | What it does **not** decide |
|---|---|---|
| **Craft Agents** (Apache-2.0; current `app/` tracks **v0.13.3**) | The **look** and the **agent/runtime base** we fork. Spacing, type, colour, motion, tokens, session/agent SDK, connections, and Craft's own capabilities (including Pages). Not Fleet's product concepts | Product concepts, capability ownership, pane vs page |
| **Cindy** (Apache-2.0) | **Feature implementation and front/back interaction logic** — how a capability is actually built and how the surface talks to the backend | Visual style |
| **OpenChamber** (MIT) | **Git and GitHub**: which PR belongs to a branch, review, and the browser-control seam | Everything else |
| **Fleet's own** | The **built-in production surfaces**: the infinite canvas, document editing, video and animation. No reference project has these | — |

**QoderWork CN and TRAE SOLO CN are interface reference only.** Their layout and interaction
patterns may be read; their product concepts may not be imported. Taking Qoder's plugin model and
grafting it onto Craft's label store is exactly the mistake this line exists to prevent.

## The rule that decides scope

> **Build it in when the person and the agent need to touch the same artifact in the same place.
> Leave it outside when the tool owns a deep domain with its own project format, and the agent only
> needs to drive it occasionally.**

This is one rule, not a checklist, and it settles the cases by itself.

**Inside** — a person edits it, an agent edits it, and it is the same file:

- **The infinite canvas.** Images, video, websites and decks are generated, edited and laid out
  here. This is *one surface*, not four capabilities. A person drags and types on it; an agent
  produces and revises on it; both see the same board.
- **Document editing.** Word, Excel, PowerPoint, PDF, Markdown and HTML — opened by the person,
  edited by either, saved back in the real format. **The person must be able to edit them directly**,
  not only ask the agent to.
- **The browser.** Automated for the agent, watchable and annotatable by the person.
- **Video and animation editing.** A timeline on the canvas, not a separate application.

**Outside** — the agent drives it:

- **Blender, Godot** and their kind. They own a deep domain, carry their own project formats and
  years of interface. Rebuilding them is impossible and embedding them is worse than driving them.

**Neither** — libraries are an implementation choice inside a surface, never a capability of their
own. Three.js, PixiJS and React Three Fiber are answers to "what renders this canvas", decided when
the canvas needs them, not before.

## What Fleet does not do

Named so nobody designs them again:

- **Controlling external applications as a general capability.** Driving a specific tool for a
  specific job is fine; a general remote-control layer contradicts the first sentence of this
  document.
- **3D scene authoring, panorama relighting, multi-camera shot grids.** Modelling belongs to
  Blender, outside.
- **A second OS sandbox.** Fleet's permission path and process boundary already do what the
  candidates enforce on the platform it ships on.
- **Online sharing, collaboration invites, hosted accounts.** Local-first: nothing that requires an
  operator-run service to work.
- **Telemetry.** Same reason.
- **Speculative model routing and capability negotiation** with no real caller asking for it.

## The shape of a capability

Borrowed from Cindy, because Fleet has no answer of its own and needs one:

- **Core** carries only what the host must provide for everyone — the shell, agent and model
  connections, session and task lifecycle, the runtime and permission path that everything else runs
  inside, multi-device continuity, and the mechanics of installing things.
- **A Skill** describes *how work is done*. Natural language, scripts, or orchestration of existing
  tools. It needs no interface of its own.
- **A plugin** carries rich interaction — a surface with structured state that the person operates
  and the agent reads and writes.
- **An agent** provides the intelligence. Fleet connects it; Fleet does not reimplement it.

**Core stays pure.** No personal, team or industry-specific workflow enters it. When the boundary is
unclear, prove the capability as a Skill or a plugin first.

Two consequences:

1. **An assistant is an identity, not a label and not a Qoder “expert kit”.** The person creates one
   by hand, or the agent creates one. Either way it is the same record: its own system prompt,
   commands, model, permission request, skills, MCP servers and plugins. The *effect* to match is
   AionUi's assistant (`源码参考/software/AionUi`, Apache-2.0). The *runtime* to steal from is Cindy's
   (approved snapshot, install/loadout, permission is a request never a grant). Storage is its own
   authority — never `labels/config.json`. The kit-as-label store was dropped in the 2026-09-10
   rebase; do not rebuild it.

   **Who wears it is not the identity.** AionUi binds an assistant to a CLI engine. Fleet does not.
   The same record can be worn by this conversation, by a delegate, or optionally wrapped around a
   CLI — and wrapping a CLI is a choice, never a requirement. Mid-conversation change is allowed;
   casual costume-change is not. If this conversation already has an identity and the next need is a
   different specialty (research while implementing, review while writing), the default is to
   **delegate** that identity as a sub-agent, not to swap who *this* conversation is. Switching the
   session's own identity is a confirmed action for when the job of this conversation actually
   changed. Any session may delegate (H28); there is no captain mode.
2. **Determinism belongs in code.** Branching, validation, state machines, permission control, error
   handling and retry are written; the prompt carries only what genuinely needs language.
3. **Do not patch Craft's `AppShell` to express a new surface.** A surface is a pane on the layout
   tree (`packages/shared/src/layout`). Adding an `isXNavigation` branch, a sidebar row, or a
   second-level page is the discarded window model.

## How the interface behaves

- **Say the outcome, not the mechanism.** The person never needs to see `kind`, `valueType`,
  `.mcp.json`, or a storage schema's field names. Internal vocabulary stays internal.
- **Buttons name the action, not the state.** "Install", never "not installed".
- **No second-level pages where a panel will do** — and when a page is retired, its links keep
  resolving to whatever replaced it. Simplifying is not deleting.
- **Structured results beat prose.** Anything better shown as a table, a diff, a timeline or a
  canvas is not flattened into text.
- **Every refusal names its reason** so the surface can explain itself.
