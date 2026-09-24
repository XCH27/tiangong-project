# Kanban board

> Visualize and move sessions across columns with a drag-and-drop board

The Kanban board turns your session list into a drag-and-drop board. Each session is a card, each column is a workflow state, and moving a card between columns updates its status. It's the same data as the session list — just laid out for visual planning.

## When to Use the Board

Use the board when you want to:

* See work-in-progress at a glance across many sessions.
* Move sessions through a workflow (Backlog → In progress → Review → Done) by dragging.
* Plan and prioritise multiple tasks against a single project.
* Track subtask progress on tasks that fan out into child sessions.

Stick with the session list when you need dense filtering, search, or long history — the board is optimised for planning, not archival browsing.

## Opening the Board

Switch to the board from the view toggle in the sidebar. The board shows one column per status by default, plus any custom columns you have added.

## Columns

Columns map to statuses. You can:

* **Reorder** columns by dragging the header.
* **Rename** or recolor a column from the column header menu.
* **Set the drop status** — the status a card gets when dropped into the column. By default this matches the column name, but you can override it (for example, drop into a "Blocked" column that applies a `needs-review` status).
* **Add per-project columns** — when a project filter is active, columns you add are scoped to that project.

Column colors are set from the board header and are shared across all board views.

## Cards

Each card represents a session. Cards show:

| Element              | Meaning                                  |
| -------------------- | ---------------------------------------- |
| **Title**            | Session title, truncated if long         |
| **Labels**           | All labels applied to the session        |
| **Subtask progress** | Completed / total subtasks for task DAGs |
| **Project accent**   | The color of the session's project       |

Cards stay expanded — they don't auto-close when you click elsewhere, so you can compare details across multiple cards side by side.

### Run from tile

Click the run button on a card to start or resume that session directly from the board — no need to open it first. This is handy for kicking off multiple queued tasks in sequence.

## Project Filter

Filter the board to a single project from the board header. When a filter is active:

* Only sessions bound to that project appear.
* **New Task** creates the task with that project already selected.
* New columns you add are scoped to the project.

Clear the filter to see all sessions across all projects.

## Creating and Running Tasks

From the board, you can create a task and run it in one step — the session is created, bound to the current project (if filtered), and started immediately. The same flow works for subtasks: create a subtask on an existing task and it runs against the task's DAG. See [Tasks](/docs/go-further/tasks) for how DAGs and subtasks work.

## Tips

<AccordionGroup>
  <Accordion title="Match columns to your actual workflow">
    The default columns work well, but the board pays off most when the columns reflect how *your* team ships. Rename or add columns until dragging feels natural.
  </Accordion>

  <Accordion title="Use column colors sparingly">
    Bright colors highlight the columns that need attention (for example, "Blocked" or "Needs review"). Leave the rest neutral so the highlights stand out.
  </Accordion>

  <Accordion title="Filter by project for focused planning">
    Combine the project filter with a project accent color to plan one initiative at a time without noise from other work.
  </Accordion>
</AccordionGroup>
