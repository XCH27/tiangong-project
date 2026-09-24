# Configuration File

> Reference for ~/.craft-agent/config.json

The main configuration file stores your workspace list, LLM connections, and app-wide defaults.

## Location

```
~/.craft-agent/config.json
```

## Structure

```json theme={null}
{
  "llmConnections": [
    {
      "slug": "anthropic-api",
      "name": "Anthropic (API Key)",
      "providerType": "anthropic",
      "authType": "api_key",
      "defaultModel": "claude-sonnet-4-6",
      "createdAt": 1737451800000
    }
  ],
  "defaultLlmConnection": "anthropic-api",
  "workspaces": [
    {
      "id": "ws-abc123",
      "name": "Personal Notes",
      "rootPath": "/path/to/workspace",
      "createdAt": 1737451800000
    }
  ],
  "activeWorkspaceId": "ws-abc123",
  "activeSessionId": "260121-swift-falcon",
  "notificationsEnabled": true,
  "colorTheme": "default"
}
```

## Fields

### llmConnections

Array of LLM connection configurations. Each connection represents a provider setup (Anthropic, Codex/OpenAI, OpenRouter, etc.).

See [LLM Connections](/docs/reference/config/llm-connections) for schema details and examples.

### defaultLlmConnection

Slug of the default LLM connection used for new sessions (unless overridden by a workspace). If omitted, the first connection in `llmConnections` is used.

### workspaces

Array of configured workspaces. Each workspace represents a directory or project context.

```json theme={null}
{
  "id": "ws-abc123",
  "name": "Personal Notes",
  "rootPath": "/Users/alex/projects/notes",
  "createdAt": 1737451800000,
  "lastAccessedAt": 1737538200000
}
```

| Field            | Required | Description                                                                 |
| ---------------- | -------- | --------------------------------------------------------------------------- |
| `id`             | Yes      | Unique identifier for the workspace                                         |
| `name`           | Yes      | Display name you assigned                                                   |
| `rootPath`       | Yes      | Filesystem path to the workspace directory                                  |
| `createdAt`      | Yes      | Unix timestamp (ms) when the workspace was created                          |
| `lastAccessedAt` | No       | Unix timestamp (ms) of last access, used for sorting                        |
| `iconUrl`        | No       | Custom icon URL for the workspace                                           |
| `mcpUrl`         | No       | Primary MCP server URL for the workspace                                    |
| `mcpAuthType`    | No       | Auth type for MCP: `"workspace_oauth"`, `"workspace_bearer"`, or `"public"` |

### activeWorkspaceId

The ID of the currently active workspace, or `null` if no workspace is selected. This determines which workspace context is used when Craft Agents starts.

### activeSessionId

The ID of the currently active session within the active workspace, or `null` if no session is selected.

### notificationsEnabled

Enable or disable desktop notifications for task completion events. Default: `true`.

### colorTheme

ID of the selected preset theme (e.g., `"dracula"`, `"nord"`). Default: `"default"`.

<Note>
  For per‑workspace defaults, use `defaults.colorTheme` in each workspace config. See [Workspaces](/docs/go-further/workspaces).
</Note>

### dismissedUpdateVersion

Version string of an update the user has dismissed. The app won't prompt to update to this specific version again.

### pendingUpdate

Object containing information about an update ready for auto-install on next launch:

```json theme={null}
{
  "version": "0.3.0",
  "installerPath": "/path/to/installer",
  "sha256": "abc123..."
}
```

## Example Configuration

For the modern multi-provider setup, use `llmConnections` plus `defaultLlmConnection`. Example:

```json theme={null}
{
  "llmConnections": [
    {
      "slug": "anthropic-api",
      "name": "Anthropic (API Key)",
      "providerType": "anthropic",
      "authType": "api_key",
      "defaultModel": "claude-sonnet-4-6",
      "createdAt": 1737451800000
    },
    {
      "slug": "codex",
      "name": "OpenAI (Codex)",
      "providerType": "openai",
      "authType": "oauth",
      "defaultModel": "codex-mini-latest",
      "createdAt": 1737451800000
    }
  ],
  "defaultLlmConnection": "anthropic-api",
  "workspaces": [...],
  "activeWorkspaceId": "ws-personal"
}
```

## Automatic Backups

On startup, Craft Agents snapshots an existing `config.json` to a dated file alongside it before any code path can mutate the workspace registry. This gives you a recoverable copy if a failure or accidental reset clobbers the live config.

```
~/.craft-agent/
├── config.json
├── config.json.bak-2026-06-20
├── config.json.bak-2026-06-21
└── config.json.bak-2026-06-22
```

Behavior:

* One backup per day, named `config.json.bak-YYYY-MM-DD`.
* The 3 most recent backups are retained; older ones are pruned automatically.
* The first startup of a given day captures the snapshot. Subsequent startups on the same day do not overwrite it, so the dated backup always holds the pre-mutation state.
* Backups are best-effort. If writing fails, the error is logged and startup continues normally.

To restore a backup, quit Craft Agents, then copy the dated file over `config.json`:

```bash theme={null}
cp ~/.craft-agent/config.json.bak-2026-06-21 ~/.craft-agent/config.json
```

## Modifying Configuration

Most settings can be changed through the app:

| Setting        | How to change                             |
| -------------- | ----------------------------------------- |
| API Connection | Settings → API Connection                 |
| Model          | Click the model name in the status bar    |
| Workspace      | Use the workspace dropdown in the sidebar |

For advanced changes, edit the file directly while Craft Agents is not running.

<Warning>
  Back up your config file before manual edits. Invalid JSON will prevent Craft Agents from starting.
</Warning>
