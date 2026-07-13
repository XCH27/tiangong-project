> ## Documentation Index
> Fetch the complete documentation index at: https://agents.craft.do/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Browser

> Control a built-in Chromium browser to automate web tasks, extract data, and interact with any website

Craft Agent includes a built-in Chromium browser that your agent can control directly. Navigate pages, fill forms, click buttons, extract data, run JavaScript, and inspect network traffic — all without leaving the conversation.

## When to Use the Browser

<CardGroup cols={2}>
  <Card title="Good fit for the browser" icon="globe">
    * One-off tasks that don't need a reusable integration
    * UI-only workflows where no API exists
    * When source setup is blocked and you need results now
    * Scraping or extracting data from web pages
    * Filling forms or completing multi-step web workflows
  </Card>

  <Card title="Better with a source" icon="plug">
    * Repeatable tasks you'll run regularly
    * Team-wide automation and reporting
    * Workflows that need stable, programmatic access
    * When an API or MCP server already exists for the service
  </Card>
</CardGroup>

## Core Workflow

Every browser interaction follows the same pattern:

<Steps>
  <Step title="Open the browser">
    The agent opens a browser window in the background (or reuses an existing one).
  </Step>

  <Step title="Navigate to a page">
    Load a URL — the agent can navigate to any website, including ones where you're already logged in.
  </Step>

  <Step title="Inspect the page">
    The agent takes a **snapshot** of the page — a structured accessibility tree that identifies every interactive element (buttons, links, inputs) with a reference ID like `@e1`, `@e2`, etc.
  </Step>

  <Step title="Interact">
    Using those references, the agent can click buttons, fill text inputs, select dropdown options, scroll, and send keyboard shortcuts.
  </Step>

  <Step title="Extract or verify">
    Read the results — extract data with JavaScript, take screenshots for visual verification, or inspect network traffic to understand what happened.
  </Step>
</Steps>

## What You Can Do

<CardGroup cols={3}>
  <Card title="Navigate & Click" icon="arrow-pointer">
    Open URLs, click buttons and links, go back/forward in history
  </Card>

  <Card title="Fill Forms" icon="input-text">
    Type into text fields, select dropdowns, submit forms
  </Card>

  <Card title="Extract Data" icon="database">
    Run JavaScript to query the DOM and pull structured data from any page
  </Card>

  <Card title="Screenshots" icon="camera">
    Capture full-page or targeted screenshots of specific elements or regions
  </Card>

  <Card title="Inspect Network" icon="wifi">
    See what API calls a page makes — debug failures or discover internal endpoints
  </Card>

  <Card title="Keyboard Input" icon="keyboard">
    Send key presses and shortcuts (Enter, Escape, Cmd+K, etc.)
  </Card>
</CardGroup>

## Permissions

Browser tools work in **all permission modes**, including Explore. The agent can browse, read, and extract data without switching to a higher permission level.

<Note>
  The agent reads a browser tools guide before its first browser interaction in each session. This ensures it uses the tools correctly and follows best practices. If you see a brief pause on the first browser action, that's why.
</Note>

## Window Lifecycle

The browser window persists across interactions within a session. When the agent is done:

| Action      | What happens                                  | When to use                                    |
| ----------- | --------------------------------------------- | ---------------------------------------------- |
| **Close**   | Window is destroyed, all state lost           | Task fully complete, browser not needed        |
| **Release** | Agent overlay dismissed, window stays visible | Agent done, you may want to keep browsing      |
| **Hide**    | Window hidden but preserved in memory         | Temporarily done, may need browser again later |

Closing the browser window via the OS close button **hides** it rather than destroying it — the agent can re-open it instantly.

## Per-workspace tabs

Browser windows are scoped to the [workspace](/go-further/workspaces) that opened them. When you switch workspaces, the toolbar and tab strip only show the browser tabs that belong to the active workspace — sessions in another workspace can keep their own windows running in parallel without cluttering your view.

Manual windows you open from the top bar follow the same rule: they belong to the workspace that was active when you opened them.

## Browser on remote workspaces

When you connect to a [remote workspace](/server/headless) from the desktop app, the agent running on the server drives **your local browser** rather than spawning a headless Chromium on the remote machine. The remote agent calls back to your desktop client over the same WebSocket connection, and you see the browser window open on your own computer — already signed in to your accounts, with your cookies and extensions.

<Note>
  Remote browser support requires the desktop app as the client. The browser tool is not available when the only connected client is the web UI or the CLI.
</Note>

### What this means in practice

* The browser window opens on your desktop, not on the server.
* Your logins and session cookies are used — no need to sign in again on the remote side.
* If you disconnect the desktop client mid-task, the remote agent's next browser call fails with a clear "client disconnected" error instead of hanging.
* Switching workspaces does not steal windows from the remote session — they stay tied to the workspace that opened them.

### Security guard for remote JavaScript

`browser_tool evaluate` runs arbitrary JavaScript in the page. Because the page is loaded on **your** machine with **your** cookies, the desktop client enforces a local switch before letting a remote agent run JS:

| Setting               | Default | Effect when off                                                                                                                                  |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `allowRemoteEvaluate` | `true`  | Remote `evaluate` calls are rejected locally with `BROWSER_REMOTE_EVALUATE_BLOCKED`. Navigation, clicks, form fills, and screenshots still work. |

Flip it off in **Settings → AI → Advanced** (or set `"allowRemoteEvaluate": false` in `~/.craft-agent/config.json`) if you don't fully trust the remote workspaces you connect to. Local sessions are not affected — the guard only applies to agents on remote servers.

File uploads (`browser_tool upload_file`) are always blocked over the remote bridge, since the file would have to be read from the remote machine.
