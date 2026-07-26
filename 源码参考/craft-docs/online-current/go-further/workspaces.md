> ## Documentation Index
> Fetch the complete documentation index at: https://agents.craft.do/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Workspaces

> Organize your configurations with multiple workspaces

Workspaces let you maintain separate configurations for different contexts - personal projects, work, client projects, or different environments. Each workspace has its own sources, skills, statuses, and session history.

## Understanding Workspaces

A workspace is a self-contained configuration unit stored at:

```
~/.craft-agent/workspaces/{workspace-id}/
```

Each workspace contains:

| Component    | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| **Sources**  | MCP servers, APIs, and local filesystems connected to this workspace |
| **Skills**   | Reusable instructions invoked with `@mention`                        |
| **Statuses** | Workflow states for organizing sessions                              |
| **Sessions** | Chat history specific to this workspace                              |

## Adding a Workspace

During initial setup, you create your first workspace automatically. To add more:

1. Click the workspace dropdown in the sidebar (shows your current workspace name)
2. Select **Add Workspace...**
3. Enter a name for the new workspace
4. The workspace is created with default settings

## Switching Workspaces

To switch between workspaces:

1. Click the workspace dropdown in the sidebar
2. Select the workspace you want to switch to

The sidebar shows your current workspace name. Switching workspaces loads that workspace's sources, skills, statuses, and sessions.

## Workspace-Specific Configuration

Each workspace maintains its own:

| Data                       | Description                                                         |
| -------------------------- | ------------------------------------------------------------------- |
| **Sources**                | MCP servers, APIs, and local filesystems                            |
| **Skills**                 | Reusable instructions defined in `skills/`                          |
| **Statuses**               | Workflow states defined in `statuses/config.json`                   |
| **Sessions**               | Chat history stored in `sessions/`                                  |
| **Permissions**            | Optional Explore mode rules in `permissions.json`                   |
| **Theme**                  | Optional color theme override (configured in Settings → Appearance) |
| **Default LLM Connection** | Optional default AI connection for new sessions                     |

## Directory Structure

```
~/.craft-agent/
  workspaces/
    {workspace-id}/
      config.json           # Workspace configuration
      .claude-plugin/       # Plugin manifest (Claude Code SDK compatibility)
        plugin.json         # Plugin manifest with skills and agents
      sources/
        {source-slug}/
          config.json       # Source configuration
          guide.md          # Usage documentation
      skills/
        {skill-slug}/
          SKILL.md          # Skill definition
      statuses/
        config.json         # Status definitions
        icons/              # Custom status icons
          todo.svg
          done.svg
      sessions/
        {session-id}/
          session.jsonl     # Conversation in JSONL format
          attachments/      # Uploaded files
          plans/            # Implementation plans
      projects/
        {project-slug}/     # Optional workspace-scoped projects
          config.json       # Project configuration
          MEMORY.md         # Long-lived project memory
          assets/           # Files surfaced via the asset manifest
      permissions.json      # Optional Explore mode rules
      icon.png              # Optional workspace icon (png/jpg/svg)
```

## Workspace Defaults

Workspaces can override app defaults for AI connection and theme:

```json theme={null}
{
  "defaults": {
    "defaultLlmConnection": "claude-max",
    "colorTheme": "nord"
  }
}
```

Resolution order for connections:

1. **Session connection**
2. **Workspace default** (`defaults.defaultLlmConnection`)
3. **Global default** (`defaultLlmConnection` in `config.json`)
4. **First connection in the list**

## Multiple windows

You can open more than one window at a time — typically one per workspace — to keep different contexts side by side without constantly switching.

### Window titles

The title bar adapts to how many windows you have open:

| Open windows | Title shown on each window                |
| ------------ | ----------------------------------------- |
| 1            | `Craft Agents` (app name)                 |
| 2 or more    | The workspace name that window is viewing |

This makes it easy to pick the right window from Cmd-Tab, Mission Control, or the Windows taskbar when you have several open. Titles update automatically when you open or close a window, or switch a window to a different workspace.

<Note>
  If a window isn't tied to a workspace yet (for example, the onboarding window), it keeps the `Craft Agents` title.
</Note>

### Auto-updates preserve your window layout

When you accept an auto-update, Craft Agents now saves your open-window layout *before* the installer quits the app. On relaunch, every window — and the workspace it was viewing — is restored exactly as it was. You no longer lose a multi-window setup after updating.

## Remote Workspaces

You can connect to workspaces running on a [remote server](/docs/server/headless). Remote workspaces appear in your workspace switcher alongside local ones.

### Connecting to a remote server

1. Click the workspace dropdown in the sidebar
2. Select **Add Workspace...** → **Connect to Remote Server**
3. Enter the server URL (e.g., `wss://192.168.1.100:9100`) and the server token
4. Click **Test Connection** — a green checkmark confirms connectivity
5. Select an existing workspace from the dropdown, or create a new one

### Multiple remote workspaces

A single remote server can host multiple workspaces. When connecting, you can choose which workspace to add to your switcher. You can also connect to multiple servers — each remote workspace is independent.

### Connection state

Remote workspaces show their connectivity status in the switcher:

| Indicator     | Meaning                                       |
| ------------- | --------------------------------------------- |
| Normal icon   | Connected and healthy                         |
| CloudOff icon | Unreachable — server is down or network issue |

The app health-checks remote workspaces when you open the workspace switcher.

### Managing remote workspaces

* **Remove:** Right-click a workspace in the switcher and select **Remove**, or hover and click the trash icon. This disconnects the local reference — it does not delete the workspace on the server.
* **Switch:** Click any workspace (local or remote) to switch to it. The session list, sources, and skills load from that workspace.

### Session transfer

You can fork a session from one workspace to another using **Send to Workspace**:

1. Open the session menu (right-click or header menu)
2. Select **Send to Workspace**
3. Choose a remote workspace from the list
4. The session is copied to the target workspace with a conversation summary for context

This creates an independent copy — changes in one workspace don't sync to the other.

<Note>
  Session transfer is currently available from local to remote workspaces. The target workspace must be reachable at the time of transfer.
</Note>

## Use Cases

<AccordionGroup>
  <Accordion title="Personal vs Work separation">
    Keep your personal projects separate from work. Each workspace has its own sources, skills, and session history - no mixing of contexts.
  </Accordion>

  <Accordion title="Client projects">
    Consultants and freelancers can set up separate workspaces for each client, with dedicated sources and custom skills per project.
  </Accordion>

  <Accordion title="Development environments">
    Maintain separate workspaces for development, staging, and production - each with appropriate API endpoints and permissions.
  </Accordion>

  <Accordion title="Team collaboration">
    Share workspace configurations with team members by copying the workspace directory structure.
  </Accordion>
</AccordionGroup>

## Tips

<AccordionGroup>
  <Accordion title="Name workspaces clearly">
    Use descriptive names that make it easy to identify the context at a glance.
  </Accordion>

  <Accordion title="Start with one workspace">
    Get comfortable with the basics before adding multiple workspaces. You can always add more later.
  </Accordion>

  <Accordion title="Customize Explore mode">
    Add a `permissions.json` file to allow additional operations in Explore mode. See [Permissions](/docs/core-concepts/permissions) for details.
  </Accordion>
</AccordionGroup>
