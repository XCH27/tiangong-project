# Projects

> Group sessions, assets, and context inside a workspace

Projects let you organize sessions inside a workspace around a shared working directory and system-prompt context. Each session bound to a project inherits that project's directory and a `<project_context>` block, so the agent starts every conversation with the right background.

## How Projects Work

A project is a workspace-scoped folder that groups related sessions with the assets and context they share. Unlike workspaces — which separate whole configurations — projects sit *inside* a workspace and reuse its sources, skills, and statuses.

| Feature                  | Description                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------- |
| **Working directory**    | Sessions inherit the project's working directory automatically                     |
| **Project context**      | A `<project_context>` block is injected into every bound session's system prompt   |
| **Assets**               | Files under the project folder are surfaced to the agent through an asset manifest |
| **MEMORY.md**            | An optional long-lived memory file the agent can read on every turn                |
| **Accent color**         | Each project has an accent color used across the sidebar, board, and session list  |
| **Grouping & filtering** | Session list and Kanban board can group or filter by project                       |

## Project Storage

Projects live inside the workspace directory:

```
~/.craft-agent/workspaces/{workspace-id}/projects/{project-slug}/
├── config.json     # Project configuration (name, color, working directory)
├── MEMORY.md       # Optional long-lived project memory
└── assets/         # Files surfaced through the asset manifest
```

Sessions reference a project by its `projectId`. When the project is deleted, sessions remain but unbind from the project.

## Creating a Project

<Tip>
  **Just ask your agent.** Say things like "create a project called Alpha with working directory \~/code/alpha" and the agent will set it up for you.
</Tip>

To create a project manually:

1. Open the **Projects** navigator in the sidebar
2. Click **New Project**
3. Enter a name, choose an accent color, and pick a working directory
4. Save — the project appears in the navigator and can be selected from the session composer

## Binding Sessions to a Project

When you start a new session, pick a project from the composer. The session then:

* Uses the project's working directory as its default
* Receives a `<project_context>` block in the system prompt with the project name, description, and asset manifest
* Groups under that project in the session list and Kanban board

You can also move an existing session to a project from the session menu.

## Project Context

Every session bound to a project receives a `<project_context>` block at the top of its system prompt. The block contains:

* Project name and description
* Working directory
* A capped excerpt of `MEMORY.md`
* An asset manifest listing files under the project folder

Use `MEMORY.md` for durable context — coding conventions, product goals, personas, or anything the agent should carry between sessions. Keep it focused; the injected excerpt is size-capped so overly long files are truncated.

```markdown theme={null}
# Project Memory

## Product goals
- Ship v2 of the reporting dashboard by end of quarter.
- Prioritise accessibility parity across all charts.

## Conventions
- All new components live in `src/components/` and use TypeScript.
- Tests use Vitest. Never commit `.only`.

## People
- Design lead: Sam. Ping on Slack for visual decisions.
```

## Accent Colors and Appearance

Each project has an accent color that shows up in:

* The Projects navigator and session list
* Kanban board cards
* Session headers

Toggle the appearance treatment in project settings to make the accent color subtle (just a chip) or prominent (tinting cards and headers).

## Grouping and Filtering

* **Session list** — group by project or filter to a single project.
* **Kanban board** — filter the board to a single project. New tasks created while a filter is active inherit that project automatically.

## Tips

<AccordionGroup>
  <Accordion title="Start with one project per repository">
    A project per code repository is a natural fit — the working directory maps cleanly, and `MEMORY.md` becomes the place for repo-specific conventions.
  </Accordion>

  <Accordion title="Keep MEMORY.md short and current">
    The injected excerpt is size-capped. Prune outdated notes so the agent gets the freshest context on every turn.
  </Accordion>

  <Accordion title="Use accent colors to scan quickly">
    Pick distinct accent colors for projects you work on side by side. It makes the session list and Kanban board readable at a glance.
  </Accordion>
</AccordionGroup>
