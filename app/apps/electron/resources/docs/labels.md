# Label Configuration

Labels are additive tags that can be applied to sessions. Unlike statuses (which are exclusive — one per session), labels are multi-select (many per session). They support hierarchical organization via nested JSON trees.

> **CLI-first workflow (recommended):** Use `craft-agent label ...` commands instead of editing JSON directly.
> - `craft-agent label --help`
> - Canonical command reference: [craft-cli.md](./craft-cli.md)

## Storage Locations

- Config: `~/.craft-agent/workspaces/{id}/labels/config.json`

## Built-in Labels

New workspaces include a small system catalog (`development`, `code`, `bug`, `automation`, `content`,
`writing`, `research`, `design`, `priority`, and `project`). Their IDs are stable selectors;
their untouched display names follow the UI language. Users may also create or rename labels, whose
names are shown verbatim.

Starter labels are functional labels: they organize, filter, and drive auto-rules without changing
the Agent role. A user-created or edited label becomes an **identity** label only when it explicitly
sets `kind: "identity"`; optional `systemPromptPreset` role guidance then applies to sessions carrying
that label.

Sessions and automations reference label IDs. Skill, Source, and permission **bindings** are not
implemented (product Decision E10). Do not invent bind fields in this file. Permission is never
granted by a label display name or by writing extra keys here.

## Visual Representation

Labels are color-only — rendered as colored circles in the UI. No icons or emoji are supported.

## Hierarchical Labels (Nested Tree)

Labels form a nested JSON tree. Hierarchy is the structure itself — parent/child relationships are expressed via the `children` array. Array position determines display order (no `order` field needed).

**Example:**
```json
{
  "version": 1,
  "labels": [
    {
      "id": "eng",
      "name": "Engineering",
      "color": "info",
      "children": [
        {
          "id": "frontend",
          "name": "Frontend",
          "children": [
            { "id": "react", "name": "React", "color": { "light": "#3B82F6", "dark": "#60A5FA" } }
          ]
        },
        { "id": "backend", "name": "Backend" }
      ]
    },
    { "id": "bug", "name": "Bug", "color": "destructive" }
  ]
}
```

This renders as a tree in the sidebar:
```
Engineering
  ├─ Frontend
  │    └─ React
  └─ Backend
Bug
```

**Rules:**
- IDs are simple slugs (lowercase alphanumeric + hyphens)
- IDs must be globally unique across the entire tree
- Maximum nesting depth: 5 levels
- Array position = display order (no `order` field)
- Filtering by a parent includes all descendants

## config.json Schema

```json
{
  "version": 1,
  "labels": [
    {
      "id": "bug",
      "name": "Bug",
      "color": "destructive"
    },
    {
      "id": "feature",
      "name": "Feature",
      "color": "accent",
      "children": [
        { "id": "ui", "name": "UI", "color": { "light": "#6366F1", "dark": "#818CF8" } },
        { "id": "api", "name": "API", "color": { "light": "#10B981", "dark": "#34D399" } }
      ]
    }
  ]
}
```

## Label Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique slug, globally unique across tree (e.g., `"bug"`, `"frontend"`). Lowercase alphanumeric + hyphens. |
| `name` | string | Display name |
| `color` | EntityColor? | Optional color. System color string (e.g., `"accent"`, `"info/80"`) or custom object (`{ "light": "#hex", "dark": "#hex" }`). Rendered as a colored circle in the UI. |
| `valueType` | `'string' \| 'number' \| 'date' \| 'link'`? | Optional value type hint. Tells UI what input widget to show and agents what format to write. `link` values render as a clickable chip that opens in the browser. Omit for boolean (presence-only) labels. |
| `children` | LabelConfig[]? | Optional nested child labels. Array position = display order. |
| `kind` | `'functional' \| 'identity'`? | Omit/`functional` = organize/filter/automate only. `identity` = may inject role guidance via `systemPromptPreset`. |
| `systemPromptPreset` | string? | Identity only: role guidance injected when the session carries this label. Does not bypass permissions. |
| `autoRules` | AutoLabelRule[]? | Regex auto-apply rules for this label. |

## Color Format

Same as statuses — see [statuses documentation](./statuses.md#color-format) for full details on supported formats and common mistakes.

**System colors:** `"accent"`, `"info"`, `"success"`, `"destructive"`, `"foreground"` (with optional `/opacity` 0–100)

**Custom colors:** `{ "light": "#EF4444", "dark": "#F87171" }` — supports hex, OKLCH, RGB, HSL formats

## Session Labels

Sessions store labels as an array of strings. Boolean labels are bare IDs; valued labels use the `::` separator:

```json
{
  "labels": ["bug", "priority::3", "due::2026-01-30", "linear::https://linear.app/issue/ENG-456"]
}
```

## Editing

**Humans (Settings → Labels):**
1. Hierarchy **tree table** (expand children; click a row to select).
2. Editor under the table: name, color, purpose (`kind`), value type, role prompt (`systemPromptPreset`); Delete.
3. **Add** creates a root label, or optionally a **child of the selected** node.
4. **Edit** (agent) and open `labels/config.json` for bulk/move/reorder; auto-rules section below.

**Agents:**
- Prefer `craft-agent label list|create|update|delete|move` (direct writes under `labels/` may be blocked).
- Example: `craft-agent label update research --json '{"kind":"identity","systemPromptPreset":"Focus on risks and acceptance evidence."}'`

**Runtime:** session carries `#id` with `kind=identity` + non-empty `systemPromptPreset` → role text injected. Does not grant tools. Skill/Source/permission bindings on labels are not implemented (E10).

## Session Behavior

- Labels are additive: a session can carry zero or many labels.
- Boolean labels use the bare ID (`"bug"`); valued labels use `id::value`
  (`"priority::3"`).
- Parsing splits on the first `::`, so a value may itself contain `::`.
- Unknown label IDs are filtered when sessions are read.
- Deleting a label removes it and its descendants from sessions.
- Filtering by a parent includes sessions carrying any descendant.
- Value parsing checks ISO date, then finite number, then string. `valueType` is
  a UI hint; `link` adds the browser-opening affordance without changing storage.

## CLI Examples

```bash
craft-agent label create --name "Bug" --color "destructive"
craft-agent label create --name "Priority" --color "accent" --value-type number
craft-agent label create --name "Due Date" --color "info" --value-type date
craft-agent label create --name "Alpha" --color "info" --parent-id project
```

After a direct JSON edit, validate the existing label authority:

```text
config_validate({ target: "labels" })
```

Validation covers recursive structure, globally unique slug IDs, maximum depth,
color shape, identity fields, and auto-rule regular expressions.

## Auto-Label Rules

`autoRules` scan user messages and add matching label entries. They do not scan
assistant output or tool results.

```json
{
  "id": "linear-issue",
  "name": "Linear Issue",
  "color": "info",
  "valueType": "string",
  "autoRules": [
    {
      "pattern": "\\b([A-Z]{2,5}-\\d+)\\b",
      "valueTemplate": "$1",
      "description": "Issue keys such as ENG-123"
    }
  ]
}
```

| Property | Meaning |
|----------|---------|
| `pattern` | Required JavaScript regular expression with capture groups |
| `flags` | Optional flags; global matching is always enabled |
| `valueTemplate` | Optional `$1`, `$2` substitution; defaults to the first group |
| `description` | Optional explanation shown to humans |

Rules run when a user message is accepted, ignore fenced and inline code,
deduplicate identical label values, and cap matches per message. Invalid or
unsafe expressions are rejected during configuration validation and skipped
fail-soft at runtime.
