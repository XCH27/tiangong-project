> **Fleet local copy.** Downloaded for offline use by people and agents. Not fetched from Craft at runtime. Craft cloud features (online sharing, hosted accounts, official updater) are disabled in Fleet.
> **本地副本。** 供人和 Agent 离线阅读，运行时不会访问 Craft 云。在线分享、官方更新等云能力已关闭。

> ## Documentation Index
> Fetch the complete documentation index at: https://agents.craft.do/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Rich Output

> Interactive tables, diagrams, HTML previews, PDFs, and code diffs — rendered natively in your conversations

Craft Agent goes beyond plain text. Your conversations can include interactive data tables, diagrams, styled HTML, PDFs, and code diffs — all rendered natively with no setup required.

## Data Tables

When the agent presents structured data, it uses interactive **datatable** blocks instead of static markdown tables. You get:

* **Click column headers** to sort ascending/descending
* **Type to filter** across all columns
* **Smart formatting** — currencies, percentages, dates, and status badges are rendered with appropriate styling

```text theme={null}
"Show me our top 10 customers by revenue"
```

The agent returns a sortable table with columns like Revenue (`$4,200,000`), Growth (`+15.2%` in green), and Status (colored badges) — not just raw numbers.

### Column Types

| Type         | What it does          | Example                           |
| ------------ | --------------------- | --------------------------------- |
| **text**     | Plain text            | `John Doe`                        |
| **number**   | Formatted with commas | `1,500,000`                       |
| **currency** | Dollar formatting     | `$4,200,000`                      |
| **percent**  | Colored percentage    | `+15.2%` (green) or `-3.0%` (red) |
| **boolean**  | Yes/No display        | `Yes` / `No`                      |
| **date**     | Formatted date        | `Jan 15, 2025`                    |
| **badge**    | Colored status pill   | `Active`, `Pending`               |

## Spreadsheets

For financial reports or data you might want to export, the agent uses **spreadsheet** blocks — Excel-style grids with row numbers and column letters.

```text theme={null}
"Create a Q4 revenue report by region"
```

The result looks like a real spreadsheet and can be **exported as .xlsx or .csv** directly from the conversation.

## Diagrams

Craft Agent renders **Mermaid diagrams** as beautiful themed SVGs. The agent uses these proactively when explaining architecture, data flows, or relationships.

```text theme={null}
"Show me how the authentication flow works in our app"
```

### Supported Diagram Types

<CardGroup cols={3}>
  <Card title="Flowcharts" icon="diagram-project">
    Process flows, decision trees, system architecture
  </Card>

  <Card title="Sequence Diagrams" icon="arrow-right-arrow-left">
    API interactions, request/response flows, protocol sequences
  </Card>

  <Card title="Entity Relationship" icon="database">
    Database schemas, data models, table relationships
  </Card>

  <Card title="State Diagrams" icon="circle-nodes">
    State machines, workflow transitions, lifecycle states
  </Card>

  <Card title="Class Diagrams" icon="sitemap">
    Object models, inheritance hierarchies, interfaces
  </Card>

  <Card title="Charts" icon="chart-line">
    Bar charts, line charts for metrics and trends
  </Card>
</CardGroup>

## HTML Preview

When the agent works with rich HTML content — emails, newsletters, styled reports — it renders them inline as live previews rather than converting to plain text.

```text theme={null}
"Show me the latest marketing email from Gmail"
```

The HTML renders in a sandboxed iframe, preserving all CSS styling, table layouts, and formatting. This is particularly useful for:

* **Email bodies** from Gmail or Outlook
* **HTML reports** from analytics tools
* **Newsletter previews** with complex layouts
* **Styled documents** where markdown would lose formatting

### Tabbed Views

When you have multiple related items (like an email thread), the agent shows them as tabs — click to switch between the original, replies, and forwards.

## PDF Preview

PDF documents are displayed inline with the first page visible and an expand button for full multi-page navigation.

```text theme={null}
"Show me the Q4 financial report PDF"
```

The agent can also display multiple PDFs as tabs — useful for comparing quarterly reports or contract versions side by side.

## Markdown Preview

When the agent writes or references a `.md` file on disk — a spec, a plan, a draft, a README — it can render it inline as a **markdown preview** instead of dumping the raw text into a code block. You see the parsed result (headings, tables, syntax-highlighted code, lists) using the same renderer as the rest of chat.

```text theme={null}
"Draft a project spec and show it to me"
```

The agent writes the file, then displays it rendered. Inline previews are capped at 400px tall with an expand button for taller content. Links and other preview blocks inside the markdown still work, so a `mermaid` diagram embedded in the spec renders normally.

### When the agent picks this format

* You asked it to **create or update a markdown file** (spec, plan, decision log, notes).
* You referenced an existing `.md` file and want to **see** it rather than edit it.
* It wants to compare **multiple drafts side by side** — different versions appear as tabs in a single block.

For HTML emails, PDFs, or structured data, the agent reaches for the matching preview block instead.

### Asking for a markdown preview

You can prompt for this format explicitly:

```text theme={null}
"Show the rendered version of ~/notes/decision.md"
```

```text theme={null}
"Compare v1, v2, and the final spec as tabs"
```

The agent uses an absolute path to the file. Paths must live under your home directory, the system temp directory, or a workspace directory — arbitrary paths elsewhere on disk are rejected by the same safety layer the other preview blocks use.

## Code Diffs

When the agent modifies files, it shows changes as **unified code diffs** — a familiar format with red (removed) and green (added) lines, making it easy to review exactly what changed.

```text theme={null}
"Refactor the authentication module to use async/await"
```

The diff view shows precisely which lines were changed, added, or removed — no guessing about what the agent did.

<AccordionGroup>
  <Accordion title="How does the agent choose which format to use?">
    The agent picks the best format automatically based on the data:

    * **Structured data** (rows and columns) → datatable or spreadsheet
    * **Relationships or flows** → Mermaid diagram
    * **Rich HTML content** (emails, reports) → HTML preview
    * **PDF files** → PDF preview
    * **Markdown files** (specs, plans, READMEs) → markdown preview
    * **Code changes** → unified diff
    * **Simple text** → regular markdown

    You can also ask for a specific format: "show this as a spreadsheet" or "draw a diagram of this".
  </Accordion>

  <Accordion title="Can I export data from tables?">
    Spreadsheet blocks include export functionality — you can download the data as `.xlsx` or `.csv`. Datatable blocks are optimised for viewing and filtering rather than export.
  </Accordion>

  <Accordion title="What about large datasets?">
    For datasets with 20+ rows, the agent writes the data to a file and references it instead of including all rows inline. This keeps conversations fast and responsive even with thousands of rows.
  </Accordion>
</AccordionGroup>
