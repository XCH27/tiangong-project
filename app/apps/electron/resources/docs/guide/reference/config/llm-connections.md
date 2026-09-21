> **Fleet local copy.** Downloaded for offline use by people and agents. Not fetched from Craft at runtime. Craft cloud features (online sharing, hosted accounts, official updater) are disabled in Fleet.
> **本地副本。** 供人和 Agent 离线阅读，运行时不会访问 Craft 云。在线分享、官方更新等云能力已关闭。

> ## Documentation Index
> Fetch the complete documentation index at: https://agents.craft.do/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# LLM Connections

> Configure multiple AI provider connections (Anthropic, AWS Bedrock, Codex/OpenAI, OpenRouter, and more)

LLM Connections let you add **multiple AI provider configurations** and switch between them. Each session locks to a specific connection after the first message, and workspaces can define their own default connection.

## Location

LLM connections are stored in:

```
~/.craft-agent/config.json
```

## How Connections Are Used

Connections resolve in this order:

1. **Session connection** (locked after first message)
2. **Workspace default connection** (`defaults.defaultLlmConnection`)
3. **Global default connection** (`defaultLlmConnection`)
4. **First connection in the list** (fallback)

<Note>
  Each session locks to a connection after the first message. To change connections, start a new session.
</Note>

## Connection Schema

```json theme={null}
{
  "slug": "anthropic-api",
  "name": "Anthropic (API Key)",
  "providerType": "anthropic",
  "authType": "api_key",
  "baseUrl": "https://api.anthropic.com",
  "defaultModel": "claude-sonnet-5",
  "createdAt": 1737451800000
}
```

### Fields

| Field               | Required | Description                                                                                                                                                                                     |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`              | Yes      | URL-safe identifier (e.g., `anthropic-api`, `codex`)                                                                                                                                            |
| `name`              | Yes      | Display name shown in the UI                                                                                                                                                                    |
| `providerType`      | Yes      | Provider backend (see list below)                                                                                                                                                               |
| `authType`          | Yes      | Auth mechanism (see list below)                                                                                                                                                                 |
| `baseUrl`           | No       | Custom base URL for compatible providers                                                                                                                                                        |
| `models`            | No       | Explicit model list. Accepts strings (`"gpt-5.4"`) or objects with optional `contextWindow` and `supportsImages` overrides (see [Custom Endpoint Capabilities](#custom-endpoint-capabilities)). |
| `customEndpoint`    | No       | Custom endpoint protocol config. Use `api` to select the wire format and optional `supportsImages` to opt an entire endpoint into image input.                                                  |
| `midStreamBehavior` | No       | How mid-stream user sends are handled (`"steer"` or `"queue"`). Defaults to `"queue"` for `anthropic`, `"steer"` for Pi-backed providers. See [Mid-stream behavior](#mid-stream-behavior).      |
| `defaultModel`      | No       | Default model for this connection                                                                                                                                                               |
| `codexPath`         | No       | Path to Codex binary (OpenAI/Codex only)                                                                                                                                                        |
| `awsRegion`         | No       | AWS region for Bedrock                                                                                                                                                                          |
| `gcpProjectId`      | No       | GCP project for Vertex                                                                                                                                                                          |
| `gcpRegion`         | No       | GCP region for Vertex                                                                                                                                                                           |
| `createdAt`         | Yes      | Timestamp (ms) when created                                                                                                                                                                     |
| `lastUsedAt`        | No       | Timestamp (ms) when last used                                                                                                                                                                   |

## providerType Values

| Value              | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `anthropic`        | Direct Anthropic API                                                   |
| `anthropic_compat` | Anthropic‑compatible endpoints (OpenRouter, Vercel AI Gateway, custom) |
| `openai`           | OpenAI via Codex app‑server                                            |
| `openai_compat`    | OpenAI‑compatible endpoints                                            |
| `bedrock`          | AWS Bedrock                                                            |
| `vertex`           | Google Vertex AI                                                       |

## authType Values

| Value                   | Description                               |
| ----------------------- | ----------------------------------------- |
| `api_key`               | API key only                              |
| `api_key_with_endpoint` | API key + custom endpoint                 |
| `oauth`                 | OAuth login (Claude Max / Codex / OpenAI) |
| `iam_credentials`       | AWS IAM credentials (Bedrock)             |
| `service_account_file`  | GCP service account JSON (Vertex)         |
| `environment`           | Uses environment variables                |
| `none`                  | No auth required                          |

## Examples

### Anthropic (API Key)

```json theme={null}
{
  "slug": "anthropic-api",
  "name": "Anthropic (API Key)",
  "providerType": "anthropic",
  "authType": "api_key",
  "defaultModel": "claude-sonnet-5",
  "createdAt": 1737451800000
}
```

### Claude Max (OAuth)

```json theme={null}
{
  "slug": "claude-max",
  "name": "Claude Max",
  "providerType": "anthropic",
  "authType": "oauth",
  "defaultModel": "claude-opus-4-8",
  "createdAt": 1737451800000
}
```

<Note>
  `claude-opus-4-8` is the current default Opus model. `claude-opus-4-7` remains selectable as the previous generation. Existing connections pinned to Opus 4.7 are upgraded to Opus 4.8 on launch; older selections (Opus 4.5 or 4.6) migrate to the best available Opus model. Opus 4.6 has been removed from model pickers.
</Note>

<Note>
  **Claude Sonnet 5** (`claude-sonnet-5`) is the current default Sonnet-class model, with a 1M-token context window and the best combination of speed and intelligence for everyday tasks. It's available on direct Anthropic connections and on AWS Bedrock (`us`/`eu`/`global` inference profiles). `claude-sonnet-4-6` remains selectable as the previous Sonnet generation. Opus 4.8 is still the app-wide default; pick Sonnet 5 in the model picker (or set `defaultModel: "claude-sonnet-5"` on the connection) when you want speed over depth. Toggling thinking off works normally on Sonnet 5.
</Note>

### OpenRouter (Anthropic‑compatible)

```json theme={null}
{
  "slug": "openrouter",
  "name": "OpenRouter",
  "providerType": "anthropic_compat",
  "authType": "api_key_with_endpoint",
  "baseUrl": "https://openrouter.ai/api",
  "models": [
    "anthropic/claude-opus-4.8",
    "anthropic/claude-haiku-4.5"
  ],
  "defaultModel": "anthropic/claude-opus-4.8",
  "createdAt": 1737451800000
}
```

### OpenRouter (OpenAI‑compatible)

```json theme={null}
{
  "slug": "openrouter-openai",
  "name": "OpenRouter (OpenAI‑compat)",
  "providerType": "openai_compat",
  "authType": "api_key_with_endpoint",
  "baseUrl": "https://openrouter.ai/api/v1",
  "models": [
    "openai/gpt-5.2-codex",
    "openai/gpt-5.1-codex-mini"
  ],
  "defaultModel": "openai/gpt-5.2-codex",
  "createdAt": 1737451800000
}
```

### AWS Bedrock (IAM Credentials)

```json theme={null}
{
  "slug": "bedrock",
  "name": "AWS Bedrock",
  "providerType": "bedrock",
  "authType": "iam_credentials",
  "awsRegion": "us-east-1",
  "defaultModel": "claude-sonnet-5",
  "createdAt": 1737451800000
}
```

With `iam_credentials`, your AWS Access Key ID, Secret Access Key, and optional Session Token are stored securely and injected into the subprocess environment at runtime. Use this when you want to configure credentials directly in the UI.

### AWS Bedrock (Environment)

```json theme={null}
{
  "slug": "bedrock",
  "name": "AWS Bedrock",
  "providerType": "bedrock",
  "authType": "environment",
  "awsRegion": "us-east-1",
  "defaultModel": "claude-sonnet-5",
  "createdAt": 1737451800000
}
```

With `environment`, the subprocess inherits your shell's AWS credential chain — `~/.aws/credentials`, `AWS_PROFILE`, IAM roles, SSO sessions, and environment variables all work. No credentials are stored in Craft Agents.

<Tip>
  To set up Bedrock in the UI: **Settings → AI → Add Connection → I use other provider → Amazon Bedrock**. You can choose between IAM Credentials and Environment (AWS CLI) authentication.
</Tip>

Set `awsRegion` to the region where you have Bedrock model access enabled (e.g., `us-east-1`, `us-west-2`, `eu-west-1`).

### Codex / OpenAI (OAuth)

```json theme={null}
{
  "slug": "codex",
  "name": "OpenAI (Codex)",
  "providerType": "openai",
  "authType": "oauth",
  "codexPath": "/Applications/Craft Agents.app/Contents/Resources/vendor/codex/darwin-arm64/codex",
  "defaultModel": "codex-mini-latest",
  "createdAt": 1737451800000
}
```

## Custom Endpoint Capabilities

Custom endpoints default to a **128K context window** and **text-only input**. If your model supports a larger context window or accepts image input, set those capabilities explicitly in the connection config.

<Tip>
  For toggling per-model **image support** specifically, the chat input model picker now exposes an inline image icon on each row of a custom-endpoint connection — one click flips `models[i].supportsImages` and persists. See [API Providers → Image Input for Custom Endpoints](/docs/reference/config/custom-endpoint#image-input-for-custom-endpoints). The JSON forms below remain useful for automation and for setting `customEndpoint.supportsImages` (the endpoint-wide default), which has no UI surface.
</Tip>

### Per-model overrides (recommended)

Use model objects when an endpoint hosts a mix of text-only and multimodal models:

```json theme={null}
{
  "slug": "ollama",
  "name": "Ollama",
  "providerType": "pi_compat",
  "authType": "none",
  "baseUrl": "http://localhost:11434/v1",
  "customEndpoint": { "api": "openai-completions" },
  "models": [
    { "id": "gemma4", "contextWindow": 262144, "supportsImages": true },
    { "id": "qwen3-coder", "contextWindow": 131072 }
  ],
  "defaultModel": "gemma4",
  "createdAt": 1737451800000
}
```

### Whole-endpoint opt-in

If every model behind the endpoint is multimodal, you can opt in at the endpoint level:

```json theme={null}
{
  "customEndpoint": {
    "api": "openai-completions",
    "supportsImages": true
  }
}
```

<Note>
  Craft Agents does **not** auto-detect image support for arbitrary endpoints. Custom endpoints stay text-only unless you explicitly set `supportsImages: true` at the endpoint or model level. Plain string model entries continue to use the default **128K** context window and **text-only** input.
</Note>

<Tip>
  For models like **Gemma 4** served through Ollama, vLLM, or another OpenAI-compatible proxy, prefer the per-model form so only the vision-capable model opts into image input.
</Tip>

## Mid-stream Behavior

When you send a message while the agent is still streaming a previous turn, Craft Agents needs to decide whether to deliver it into the in-flight turn or hold it for the next one. The `midStreamBehavior` field on the connection controls this.

| Value     | Behavior                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| `"steer"` | Deliver the message into the in-flight turn (Pi's native `.steer()` or Claude's `PreToolUse` hook injection). |
| `"queue"` | Hold the message; let the current turn finish naturally; replay as a new turn afterwards.                     |

```json theme={null}
{
  "slug": "anthropic-api",
  "providerType": "anthropic",
  "authType": "api_key",
  "midStreamBehavior": "queue",
  "createdAt": 1737451800000
}
```

### Defaults by backend

If `midStreamBehavior` is omitted (legacy connections, fresh setups), the default depends on the backend:

* **`anthropic`** → `"queue"`. Claude's emulated steer relies on the model invoking a tool before the turn ends. If no tool fires, the steer becomes undelivered and Craft Agents falls back to a re-queue anyway — with the original turn's tokens already paid. Defaulting to queue avoids the wasted round-trip.
* **`pi` / `pi_compat`** → `"steer"`. Pi's native steer is non-destructive: your message is delivered after the current tool finishes, full conversation context preserved.

### Changing it from the UI

Open **Settings → AI**, scroll to the **Connections** section, click the **`…`** menu on the relevant connection (or right-click the row), and choose **Mid-stream sends → Steer immediately** or **Queue until ready**. The selection is saved on the connection and takes effect immediately for the next mid-stream send.

<Note>
  This is a per-connection setting, not per-session. Two sessions sharing the same connection will both use the same mode.
</Note>

For the user-facing concept and UI walkthrough, see [Interactions → Sending while the agent is responding](/docs/core-concepts/interactions#sending-while-the-agent-is-responding).

## Managing Connections

Connections are managed in **Settings → AI**:

* Add/edit/delete connections
* Set a **global default connection**
* Validate connection status
* Set **per‑workspace defaults**

<Tip>
  If you only need a single provider, keep one connection and set it as default.
</Tip>
