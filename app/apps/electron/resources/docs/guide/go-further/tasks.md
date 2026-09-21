> **Fleet local copy.** Downloaded for offline use by people and agents. Not fetched from Craft at runtime. Craft cloud features (online sharing, hosted accounts, official updater) are disabled in Fleet.
> **本地副本。** 供人和 Agent 离线阅读，运行时不会访问 Craft 云。在线分享、官方更新等云能力已关闭。

> ## Documentation Index
> Fetch the complete documentation index at: https://agents.craft.do/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Tasks

> Orchestrate multi-step work with task DAGs, subtasks, and acceptance criteria

Tasks let you break a goal into a directed graph of subtasks that Craft Agents runs across child sessions. Each subtask can depend on earlier ones, each has its own acceptance criteria, and the runner repairs failures instead of giving up. Use tasks when a single conversation is too small for the work — anything that needs planning, branching, or verification.

## When to Use Tasks

Use a task when the work:

* Splits into steps that can run in parallel or must run in a specific order.
* Needs pass/fail acceptance criteria the agent can check on its own.
* Should retry or repair intermediate failures without you babysitting it.
* Might resume later — you close your laptop, come back, and the task picks up where it left off.

For a one-shot conversation, a normal session is still the right tool.

## Anatomy of a Task

A task is defined by a `task.yaml` DAG. Each node is a subtask; edges are dependencies. When you run the task, Craft Agents spawns a child session per subtask, respecting the dependency order.

```yaml theme={null}
name: Ship reporting dashboard
description: Build, test, and deploy the new dashboard.

subtasks:
  - id: scaffold
    prompt: Scaffold the dashboard route and page component.
    acceptance:
      - The route /reports renders without errors.

  - id: charts
    prompt: Implement the three summary charts.
    depends_on: [scaffold]
    acceptance:
      - Each chart renders with mocked data.
      - Storybook covers each chart.

  - id: tests
    prompt: Add Vitest coverage for the charts and route.
    depends_on: [charts]
    acceptance:
      - "`bun test` passes."

  - id: deploy
    prompt: Open a PR and request review.
    depends_on: [tests]
    acceptance:
      - PR is open against main with a passing CI run.
```

| Field                   | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `name`                  | Task title shown on the board and in the Task Editor             |
| `description`           | Optional summary shown in the task header                        |
| `subtasks[].id`         | Stable identifier for the subtask node                           |
| `subtasks[].prompt`     | The instruction sent to the child session                        |
| `subtasks[].depends_on` | List of subtask IDs that must finish before this one runs        |
| `subtasks[].acceptance` | Pass/fail criteria the runner checks after the subtask completes |

Subtasks with no `depends_on` run first, in parallel. Downstream subtasks unlock as their dependencies complete.

## Acceptance Criteria and the Repair Loop

After a subtask's child session finishes, Craft Agents evaluates the subtask's acceptance criteria. If a criterion fails, the runner enters a **repair loop**: it feeds the failure back into the child session with instructions to fix it, and re-checks. This continues until the criteria pass or the loop hits its retry cap.

Write acceptance criteria as short, verifiable statements. Prefer concrete signals — a test command exits cleanly, a file exists, a URL returns 200 — over subjective descriptions.

## Subtask Union

When a task runs, the parent session inherits a **subtask union**: the combined label set, project binding, and status signals of all its child sessions. This means the task card on the Kanban board reflects the aggregate state — for example, subtask progress like `3 / 5` shows how many subtasks have satisfied their acceptance criteria.

## Durable Resume

Task state is persisted after every subtask transition. If you quit the app, lose power, or your machine sleeps mid-run, reopening the task resumes from the last completed subtask. In-flight subtasks either continue or restart cleanly — you never lose the DAG's progress.

## The Task Editor

Open a task to see the Task Editor. It has two modes:

| Mode     | What it does                                                                            |
| -------- | --------------------------------------------------------------------------------------- |
| **View** | Read-only view of the DAG and each subtask's status                                     |
| **Edit** | Modify the `task.yaml` directly, add or remove subtasks, and adjust acceptance criteria |

The **Results** tab collects the outputs of every subtask into one place — useful for reviewing what the agent produced without opening each child session individually. The **Session binding** control ties the task to a specific parent session so results and artifacts stay linked.

<Info>
  The task **Playground** is available in **Manual mode** only. Manual runs let you step through subtasks one at a time to inspect behavior before turning the task loose end-to-end.
</Info>

## Creating and Running Tasks

<Tip>
  **Just ask your agent.** Say "create a task that scaffolds, tests, and deploys the reporting dashboard" and the agent will draft the `task.yaml` for you. Review it in the Task Editor before running.
</Tip>

You can also:

* Create a task from the Kanban board's **New Task** button — it inherits the active project filter.
* Create a subtask on an existing task and run it directly from the card.
* Use **Run from tile** on the board to start any task without opening it first.

## Tips

<AccordionGroup>
  <Accordion title="Keep acceptance criteria machine-checkable">
    "Tests pass" beats "code looks clean". The repair loop only helps when it has a clear signal to react to.
  </Accordion>

  <Accordion title="Start small, then split">
    Draft the task as two or three subtasks first, run it, and split further only when a subtask keeps failing or grows too broad.
  </Accordion>

  <Accordion title="Bind tasks to a project">
    Tasks bound to a project inherit its working directory and context, so subtasks don't have to re-establish where the code lives on every step.
  </Accordion>
</AccordionGroup>
