# Environment Variables

> Configure Craft Agents through environment variables

Environment variables provide configuration and credentials for automation and server deployment scenarios.

## Supported Variables

### ANTHROPIC\_API\_KEY / CRAFT\_ANTHROPIC\_API\_KEY

Provide an Anthropic API key without storing it locally. Both names are supported; `CRAFT_ANTHROPIC_API_KEY` takes precedence if both are set.

```bash theme={null}
export ANTHROPIC_API_KEY="sk-ant-api03-..."
craft -p "Check my tasks"
```

### CRAFT\_CLAUDE\_OAUTH\_TOKEN

Provide a Claude OAuth token (for Claude Pro/Max subscriptions) without storing it locally.

```bash theme={null}
export CRAFT_CLAUDE_OAUTH_TOKEN="your-oauth-token"
```

### ANTHROPIC\_BASE\_URL

Override the API endpoint URL. This is set automatically by Craft Agents when you configure a non-Anthropic provider (OpenRouter, Vercel AI Gateway, Ollama, or custom endpoint) via the UI.

```bash theme={null}
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
```

You can also set this manually to route all API calls through a custom endpoint:

```bash theme={null}
# Use OpenRouter
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"

# Use local Ollama
export ANTHROPIC_BASE_URL="http://localhost:11434"
```

<Note>
  This variable is typically managed by Craft Agents based on your [API Provider configuration](/docs/reference/config/custom-endpoint). You only need to set it manually for automation or CI scenarios.
</Note>

### AWS Credentials (Bedrock)

When using AWS Bedrock with `authType: "environment"`, the subprocess inherits standard AWS environment variables from your shell:

```bash theme={null}
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."     # optional, for STS temporary credentials
export AWS_REGION="us-east-1"      # or set awsRegion in the connection config
export AWS_PROFILE="my-profile"    # use a named profile from ~/.aws/credentials
```

These follow the standard [AWS SDK credential chain](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html) — `~/.aws/credentials`, SSO sessions, IAM roles, and instance profiles all work.

<Note>
  With `authType: "iam_credentials"`, credentials are entered in the UI and injected into the subprocess automatically. You do **not** need to set these env vars in that case.
</Note>

### CRAFT\_CONFIG\_DIR

Override the default configuration directory. By default, Craft Agents stores configuration in `~/.craft-agent/`.

```bash theme={null}
export CRAFT_CONFIG_DIR="/custom/path/to/config"
```

This affects the location of:

* `config.json`
* `preferences.json`
* `credentials.enc`
* Workspace configurations

### CRAFT\_LOCAL\_MCP\_ENABLED

Enable or disable local MCP server support (stdio subprocess servers).

```bash theme={null}
export CRAFT_LOCAL_MCP_ENABLED="false"
```

| Value           | Behavior                                        |
| --------------- | ----------------------------------------------- |
| `"true"`        | Enable local MCP servers (default when not set) |
| Any other value | Disable local MCP servers                       |

<Note>
  This variable requires the exact lowercase string `"true"` to enable. Values like `"True"`, `"TRUE"`, `"yes"`, or `"1"` will be treated as disabled.
</Note>

This can also be configured per-workspace in the workspace settings.

### CRAFT\_DEBUG

Enable debug logging for troubleshooting. When set, additional diagnostic information is written to the log file.

```bash theme={null}
export CRAFT_DEBUG="true"
```

## Server Mode Variables

These configure the [remote server](/docs/server/headless) when running in standalone or embedded mode.

### CRAFT\_SERVER\_TOKEN

Bearer token for server authentication. Required for both server and client.

```bash theme={null}
export CRAFT_SERVER_TOKEN=$(openssl rand -hex 32)
```

### CRAFT\_SERVER\_URL

Server URL for client connections. Set this on the client side to connect to a remote server.

```bash theme={null}
export CRAFT_SERVER_URL=wss://your-server:9100
```

### CRAFT\_RPC\_HOST

Bind address for the server. Defaults to `127.0.0.1` (localhost only). Set to `0.0.0.0` to accept remote connections.

```bash theme={null}
export CRAFT_RPC_HOST=0.0.0.0
```

### CRAFT\_RPC\_PORT

Server port. Defaults to `9100`.

```bash theme={null}
export CRAFT_RPC_PORT=9100
```

### CRAFT\_RPC\_TLS\_CERT / CRAFT\_RPC\_TLS\_KEY

PEM certificate and private key files for TLS. Required for remote connections (`wss://`). Can be omitted for localhost development.

```bash theme={null}
export CRAFT_RPC_TLS_CERT=/path/to/cert.pem
export CRAFT_RPC_TLS_KEY=/path/to/key.pem
```

### CRAFT\_RPC\_TLS\_CA

Optional PEM CA chain file for custom certificate authorities.

```bash theme={null}
export CRAFT_RPC_TLS_CA=/path/to/ca.pem
```

## Development Variables

These variables are primarily used for development and multi-instance scenarios.

### CRAFT\_VITE\_PORT

Override the Vite dev server port. Automatically set when running from numbered instance folders.

```bash theme={null}
export CRAFT_VITE_PORT="5173"
```

### CRAFT\_APP\_NAME

Override the application display name. Useful for distinguishing multiple instances.

```bash theme={null}
export CRAFT_APP_NAME="Craft Agents [Dev]"
```

### CRAFT\_INSTANCE\_NUMBER

Instance identifier for multi-instance support. When set, adds a badge to the dock icon.

```bash theme={null}
export CRAFT_INSTANCE_NUMBER="1"
```

### CRAFT\_DEEPLINK\_SCHEME

Custom deep link URL scheme. Default is `craftagents`.

```bash theme={null}
export CRAFT_DEEPLINK_SCHEME="craftagents1"
```

### VITE\_DEV\_SERVER\_URL

URL of the Vite development server. Used internally during development.

```bash theme={null}
export VITE_DEV_SERVER_URL="http://localhost:5173"
```

## Precedence

For API credentials, the lookup order is:

1. `CRAFT_ANTHROPIC_API_KEY` or `ANTHROPIC_API_KEY` environment variable
2. `CRAFT_CLAUDE_OAUTH_TOKEN` environment variable (for OAuth)
3. Stored credential in `~/.craft-agent/credentials.enc`
4. Interactive prompt (if running interactively)

For API base URL:

1. `ANTHROPIC_BASE_URL` environment variable
2. Connection base URL (configured in LLM connections)
3. Default (`https://api.anthropic.com`)

For model selection:

1. LLM connection default model (if set)
2. App-level model defaults (per provider)
3. System default (Claude Sonnet)

For configuration directory:

1. `CRAFT_CONFIG_DIR` environment variable
2. Default `~/.craft-agent/`

## Usage Examples

### CI/CD Pipeline

```bash theme={null}
#!/bin/bash
export ANTHROPIC_API_KEY="${SECRETS_ANTHROPIC_KEY}"

craft -w "Work" -p "Generate release notes from recent commits"
```

### Docker Container

```dockerfile theme={null}
ENV ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
ENV CRAFT_CONFIG_DIR=/app/config

CMD ["craft", "-w", "default", "-p", "..."]
```

### Temporary Override

Use a different API key for one command:

```bash theme={null}
ANTHROPIC_API_KEY="sk-ant-different-key" craft -p "Quick check"
```

### Custom Configuration Directory

```bash theme={null}
export CRAFT_CONFIG_DIR="/home/user/.config/craft-agent"
craft -p "Using custom config location"
```

## Security Notes

<Warning>
  Avoid putting API keys directly in shell history or scripts. Use secret managers or secure environment injection.
</Warning>

Secure alternatives:

```bash theme={null}
# Read from file
export ANTHROPIC_API_KEY=$(cat ~/.secrets/anthropic-key)

# Read from secret manager
export ANTHROPIC_API_KEY=$(aws secretsmanager get-secret-value --secret-id anthropic-key --query SecretString --output text)

# Use .env file (not committed to git)
source .env && craft -p "..."
```
