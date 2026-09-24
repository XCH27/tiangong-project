# First Conversation

Now that you’re set up, let’s explore what you can do with Craft Agents. This page covers common interactions and helps you understand how the agent works with your documents.

## Basic Queries

Start by asking about your documents:

```plaintext
> What documents do I have?
```

The agent searches your workspace and lists what it finds. You’ll see tool calls appear as the agent works, then the results.

## Searching Documents

Find specific content across your workspace:

```plaintext
> Search for documents about "quarterly review"
```

```plaintext
> Find my notes from last week's team meeting
```

```plaintext
> What did I write about the marketing budget?
```

## Reading Document Content

Ask about specific documents:

```plaintext
> Show me what's in my Project Planning document
```

```plaintext
> Summarize my Q4 Goals
```

```plaintext
> What are the key points from the Meeting Notes - Dec 10?
```

## Working with Daily Notes

Access your daily notes:

```plaintext
> What's in today's daily note?
```

```plaintext
> Show me yesterday's daily note
```

```plaintext
> Search my daily notes for mentions of "client meeting"
```

## Creating Content

Add new content to your documents:

```plaintext
> Add a new task to my Project Planning: "Review Q4 metrics"
```

```plaintext
> Create a new document called "2024 Retrospective"
```

```plaintext
> Add a bullet point to my meeting notes: "Follow up with design team"
```

Caution

Write operations modify your actual Craft documents. The agent will show you what it’s about to do before making changes.

Tip

The documents you create can also become custom agents. Write instructions in a document, and Craft Agents brings it to life. Learn more in [Skills](/docs/skills/overview).

## Working with Collections

If you use Craft collections (databases):

```plaintext
> Show me my Expenses collection
```

```plaintext
> Add a new item to Expenses: $45 for lunch, category: meals
```

```plaintext
> What expenses do I have this month?
```

## Managing Tasks

View and manage tasks across your documents:

```plaintext
> What tasks do I have due this week?
```

```plaintext
> Mark the "Review PR" task as complete
```

```plaintext
> Add a task: "Send follow-up email" due tomorrow
```

## Running Commands

Execute shell commands when needed:

```plaintext
> What's the current git status of this directory?
```

For potentially dangerous commands, you’ll see a permission prompt asking you to approve the action. See [Permissions](/docs/core-concepts/permissions) for details.

## Tips for Better Results

Be specific

Instead of “find my notes”, try “find my notes about the product launch from last month”.

Use context

The agent remembers your conversation. You can say “summarize that document” after finding one.

Ask for clarification

If results aren’t what you expected, ask the agent to refine the search or try a different approach.

Watch the tool calls

The tool call boxes show exactly what the agent is doing. This helps you understand how it interprets your requests.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| SHIFT+TAB | Cycle permission modes (Explore → Ask → Execute) |
| ↑ / ↓ | Navigate message history |
| ESC | Cancel current request |
| Tab | Auto-complete mentions (@skill, @source) |

## Next Steps

- [Learn about skills](/docs/skills/overview) — Extend Craft Agents with reusable instructions for your workflows.
- [Connect to anything](/docs/go-further/connect-to-anything) — Connect MCP servers, REST APIs, and local filesystems to your workspace.
