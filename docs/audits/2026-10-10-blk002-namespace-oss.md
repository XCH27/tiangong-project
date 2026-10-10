# BLK-002 — product and internal namespace

> **Date:** 2026-10-10
> **Role:** Fleet Lead. The user authorized the Lead to choose by OSS cross-compare: reuse a mature scheme, and invent a string only when none of the peers fit.
> **Base:** `92ee3ea5` (`work/fresh-base-spine` after #43).
> **Ledger:** D50 in `docs/DECISIONS-LEDGER.md`. D49 criterion 2 (the namespace) is met by D50. Settings stays Locked.
> **What this does not do:** It does not mark W0.1 or W1 Ready. It does not promote any capability to `usable`. It does not add a Settings caller, a shell control, or a new action id. It does not bump `CONTRACT_VERSION`. `plugin.loadout_mutate` still has no production caller.

## How the comparison was bounded

`docs/REFERENCE-PROJECT-POLICY.md` is the license gate. Craft in `app/` is the green-light base. AionUi is green-light for skill and ACP patterns and must adapt into the Craft session. Claude Code, VS Code, Agent Skills, MiniMax, and Hermes are behavior references. This note does not copy source, tests, types, or manifests.

`docs/ARCHITECTURAL-COMPARISON.md` is not evidence. Its versions are unverified.

The cloud checkout has no AIGC reference volume and no `源码参考/latest`. Peers are the public docs cited below plus the in-repo Craft paths, skill loader, and Agent Plugins reader. `docs/OWNERSHIP-MATRIX.md` uses the word "namespace" for file-ownership domains (`sessions/ (permissions namespace)` and the rest). Those rows are ownership labels. They are not identifier prefixes, and this decision does not change them.

Directions stay separate:

| Decision | Module | Outside this decision |
|---|---|---|
| 1. Internal host strings | M00 journal and execution role | Not a plugin id, not a directory |
| 2. Plugin ids and manifest API keys | M12 catalog | Not a Settings unlock, not W4 distribution |
| 3. Storage prefixes | M00 config, M05 bytes, M12 skills | Not a new control directory |
| 4. Action and contribution prefixes | M03 owner field, M16 contribution ids | Not a rename of frozen action ids |

## 1. Internal namespace (M00)

**Choice.** The internal owner namespace is the string `fleet`. The host record type stays `fleet_host_session_event`. The host execution role stays `fleet_host_turn_admission`. Both already exist in `app/packages/shared/src/protocol/turn-admission.ts` and the session journal. A plugin name cannot be `fleet` or `craft-agent`.

`ownerKind: 'core_module'` carries namespace `fleet`. Counting dots in an action id is not the check. D35 stands: the frozen two-segment ids (`file.create`, `plugin.loadout_mutate`, and the rest of v1.3.0) stay those strings.

### Peers (what the host reserves)

| Peer | What was compared | Result |
|---|---|---|
| Craft session kernel | In-repo `CONFIG_DIR` is `~/.craft-agent/`. The journal record is `fleet_host_session_event`. The execution role is `fleet_host_turn_admission`. Package scope is `@craft-agent`. MCP client name is `craft-agent`. | **Winner.** The host strings that already exist stay the internal namespace. |
| Claude Code | Plugin `name` is kebab-case. Components are namespaced under that name (`deploy-tools:reviewer`). `enabledPlugins` is a user setting, separate from the plugin name. [Plugins reference](https://code.claude.com/docs/en/plugins-reference) | **Winner for a reserved host side.** The product name and the user setting are different keys. **Loser:** adopting `enabledPlugins` as a Fleet file. |
| VS Code | The extension id is `publisher.name` (`vscode-samples.helloworld-sample`). Built-in API calls go through `vscode.*`. Command ids (`helloworld.helloWorld`) are a third string. [Extension anatomy](https://code.visualstudio.com/api/get-started/extension-anatomy) | **Winner.** The product id, the built-in API, and a contribution id are different strings. **Loser:** treating `publisher.name` as Fleet's id. Fleet has no Marketplace publisher. |
| Hermes | Published docs register discovered tools as `mcp_<server>_<tool>` so they do not collide with built-ins. Config key is `mcp_servers` in `~/.hermes/config.yaml`. [MCP](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) | **Winner for a host prefix on host-registered tools.** **Loser as a Fleet tool name.** Fleet does not inject MCP tools into a global toolset (D25). |
| Agent Skills | `name` matches the directory. Lowercase letters, digits, and single hyphens. The spec has no product prefix inside `name`. [Specification](https://agentskills.io/specification) | **Winner.** A skill name is not the host prefix. |
| MiniMax | Marketplace packages use `.minimax-plugin/plugin.json` and a lowercase `name`. That directory is the vendor package root. [Plugin marketplace](https://agent.minimax.io/docs/code/agents/plugins) | **Loser as Fleet's internal prefix.** `minimax` is not the host. |
| AionUi | Skills are `SKILL.md` folders. Assistant rules are Markdown under the app data directory (`assistant-rules/`). The skill folder is not that data directory. [Assistant configuration](https://github.com/iOfficeAI/AionUi/wiki/Assistant-Configuration-Guide) | **Winner for keeping host data and skill names apart.** **Loser:** an `assistant-rules/` store beside Craft sessions. |

### Strings that lost

- Rewriting frozen action ids so the internal namespace is spelled inside the id (`fleet.file.create` and similar).
- `mcp_<server>_<tool>` and the later Hermes proposal `mcp__<server>__<tool>` as the Fleet tool registry.
- `vscode.*` or `publisher.name` as the internal owner string.
- A new directory `~/.fleet/` for host records. Host records already live in `session.jsonl`.

## 2. Plugin identifiers and manifest API keys (M12)

**Choice.** A Fleet product plugin `name` is kebab-case, the same grammar as an Agent Skills name and the in-repo skill slug check: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

Catalog ids that already exist stay the product identifiers:

| Kind | Id string | Where it already lives |
|---|---|---|
| Workspace skill | `skill:<slug>` | `projectWorkspacePlugins` |
| Workspace MCP source | `mcp:<slug>` | `projectWorkspacePlugins` |
| Skill inside a package | `skill:<plugin>.<skill>` | `readAgentPluginPackage` |
| MCP server inside a package | `mcp:<plugin>/<server>` | `readAgentPluginPackage` |

`<plugin>` in a product id is the kebab-case `name`. `<skill>` is the `SKILL.md` directory name. A dotted package name may still be projected by the display-only reader (`PLUGIN_NAME` allows dots). That projection is not a product id.

Manifest API keys for a product plugin are the keys the reader already accepts:

| Key | Rule |
|---|---|
| `$schema` | `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` |
| `name` | Required. Kebab-case. Not `fleet`, `craft-agent`, or `.agents`. |
| `version`, `description`, `homepage`, `repository`, `license`, `author`, `keywords` | Optional metadata. Types stay as the reader checks them. |
| Skill `name`, `description` | Required frontmatter. `name` matches the directory. |
| MCP `$schema` | `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json` |
| MCP `mcpServers` | The only server map. |

The package file is `plugin.json` at the package root, plus `skills/<skill>/SKILL.md` and optional `mcp.json`. Secret material in those files stays `credential_material_rejected`. An `apiKey`, token, or authorization value is not a manifest field.

`allowed-tools` is not a Fleet grant (D25, D49).

### Peers (the public id and the field names)

| Peer | What was compared | Result |
|---|---|---|
| Claude Code | `name` is kebab-case and namespaces components (`deploy-tools:reviewer`, `/deploy-tools:about`). Enablement is `enabledPlugins` with `name` or `name@marketplace`. Non-sensitive user values sit in `pluginConfigs`. The manifest path is `.claude-plugin/plugin.json`. [Plugins reference](https://code.claude.com/docs/en/plugins-reference) | **Winner for kebab-case `name` and for hanging components off that name.** **Loser:** `enabledPlugins`, `pluginConfigs`, `userConfig`, and `.claude-plugin/plugin.json` as Fleet's API. |
| Agent Skills | `name` and `description` are required. `name` is 1–64 characters, lowercase, digits, hyphens, no leading, trailing, or doubled hyphen, and it matches the directory. `allowed-tools` is experimental. [Specification](https://agentskills.io/specification) | **Winner for the skill document.** **Loser:** `allowed-tools` as a standing grant. |
| MiniMax community / Agent Plugins 1.0.0 | Root `plugin.json` with `$schema` `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` and `name`. Skills are immediate children of `skills/`. MCP is `mcp.json`. [plugin-compatibility.md](https://github.com/MiniMax-AI/MiniMax-Code-Plugins/blob/main/docs/plugin-compatibility.md) | **Winner.** This is the reader already in `agent-plugin-manifest.ts`. |
| MiniMax marketplace | `.minimax-plugin/plugin.json`, `schemaVersion`, `displayName`, `apps`, `mcpServers`, and a `skills` path array. [Plugin submission](https://agent.minimax.io/docs/code/agents/plugin-submission) | **Loser as a second package root.** `apps` is a MiniMax connector, not a Fleet field. |
| VS Code | `contributes.commands[].command`, `contributes.views`, and extension id `publisher.name`. [Extension manifest](https://code.visualstudio.com/api/references/extension-manifest) | **Winner for one contribution list owned by the host.** **Loser:** a `contributes` object beside the M12 manifest. M16 owns view mounting. |
| Hermes | Server identity is the `mcp_servers` key. The `mcp_` tool prefix is applied by the host after discovery. | **Winner for keeping the server's own tool name.** **Loser:** renaming those tools with `mcp_`. The catalog id is already `mcp:<slug>`. |
| Craft skills | Directories are `~/.agents/skills/`, `{workspace}/skills/{slug}/`, and `{project}/.agents/skills/`. The SDK plugin basename is `.agents`, so a loaded skill is addressed as `.agents:<slug>`. Catalog ids are `skill:` and `mcp:`. | **Winner for the three directories and the catalog ids.** **Loser:** replacing `skill:<slug>` with `.agents:<slug>` or with Claude's `plugin:skill`. |
| AionUi | A custom skill is a folder of `SKILL.md`. Settings attaches that skill to an assistant. ACP backends symlink the folder into the CLI's own skills directory. [Assistant configuration](https://github.com/iOfficeAI/AionUi/wiki/Assistant-Configuration-Guide) | **Winner for one skill folder.** **Loser:** a symlink catalog as a second store. Fleet keeps the Craft scan paths. |

### Strings that lost

- `deploy-tools:reviewer` as a replacement for `skill:deploy-tools.reviewer`.
- `publisher.name` and `contributes`.
- `.minimax-plugin` and `schemaVersion` / `apps`.
- `enabledPlugins`, `pluginConfigs`, `userConfig`.
- `mcp_filesystem_read_file` as a Fleet action id.
- A manifest field named `apiKey`.

## 3. Storage prefixes (M00, M05, M12)

**Choice.** Durable locations stay the Craft locations already on disk.

| Prefix | Role |
|---|---|
| `~/.craft-agent/` | `CONFIG_DIR`. Override is `CRAFT_CONFIG_DIR`. |
| `preferences.json`, `config.json` | Files inside `CONFIG_DIR`. |
| `~/.agents/skills/` | Global skills. |
| `{workspace}/skills/{slug}/` | Workspace skills. |
| `{project}/.agents/skills/` | Project skills. |
| `fleet_host_` | Record-type prefix inside the existing `session.jsonl` (`fleet_host_session_event` only). |
| Craft credential manager | Secret API keys and tokens. `src/credentials/`. |

`.claude-plugin/loadout.json` is not a product store. D49 already says the catalog is the skills and sources the agent loads. This decision does not add a key under `preferences.json` for a loadout copy.

### Peers (where bytes live)

| Peer | What was compared | Result |
|---|---|---|
| Craft paths | `paths.ts` sets `CONFIG_DIR` to `~/.craft-agent/`. Skills use the three directories above. Credentials stay in `src/credentials/`. | **Winner.** |
| Claude Code | User settings hold `enabledPlugins` and `pluginConfigs`. Sensitive `userConfig` goes to the platform credential store. Plugin data uses `CLAUDE_PLUGIN_DATA`. The manifest directory `.claude-plugin/` is inside the package, not the workspace authority. [Plugins reference](https://code.claude.com/docs/en/plugins-reference) | **Winner for secrets leaving the manifest.** **Loser:** `.claude-plugin/loadout.json` and `~/.claude/settings.json` as Fleet stores. |
| VS Code | Extension state is scoped by the extension host (`globalState`, `workspaceState`, `secrets`). A plugin does not pick a shared disk prefix. | **Winner.** Fleet state stays in Craft preferences and the credential manager. |
| Agent Skills | Discovery paths include `.agents/skills/`, `.claude/skills/`, and `.github/skills/`. The skill does not choose a storage prefix. [VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills) | **Winner for `.agents/skills/`**, which Craft already scans. **Loser for this decision:** adding `.claude/skills/` or `.github/skills/` as a second authority. |
| MiniMax | `.minimax-plugin/` is the package entry for the hosted marketplace. It is not user state. | **Loser as a workspace prefix.** |
| Hermes | `~/.hermes/config.yaml` under `mcp_servers`. | **Loser.** A second home directory. |
| AionUi | Rules live in the app data directory. Skills are symlinked into the backend's native skills directory so the CLI scans its own path. | **Winner for scanning the agent's own skill path.** **Loser:** a new AionUi data root. |

### Strings that lost

- `~/.fleet/`
- `~/.hermes/`
- `.claude-plugin/` as the workspace loadout
- `.minimax-plugin/` as the package root
- A new `preferences.json` key for plugin enablement

## 4. Action and contribution prefixes (M03, M16)

**Choice.** When an `ActionOwner` is written, `namespace` is `fleet` for `ownerKind: 'core_module'` and the plugin `name` for `ownerKind: 'plugin'`. The registry rejects a plugin whose namespace is `fleet` or `craft-agent`, and it rejects a plugin that reuses a frozen core action id. The owner kind is the boundary.

M16 contribution ids, when a later freeze lists them, use these prefixes:

| Owner | Contribution id |
|---|---|
| Core | `fleet:<token>` |
| Plugin | `<plugin-name>:<token>` |

`<token>` uses the same kebab-case grammar as a skill name. Catalog kind prefixes stay the closed pair `skill:` and `mcp:`. `fleet:` is the core contribution owner and is not a third catalog kind. `workbench.sidebar_focus` is an action id. It is not a contribution id. `workbench.view_open` and the other M16 draft ids stay under discussion.

### Peers (contribution names)

| Peer | What was compared | Result |
|---|---|---|
| VS Code | `contributes.views` and `contributes.commands` are host contribution points. The command string is namespaced (`myExtension.sayHello`) and is not the extension id. [Commands](https://code.visualstudio.com/api/extension-guides/command) | **Winner for a host-owned contribution id, distinct from the package id.** |
| Claude Code | The component name is prefixed by the plugin (`deploy-tools:about`). The colon is the boundary because the plugin name is kebab-case and contains no colon. | **Winner for `<plugin-name>:<token>`.** |
| Agent Skills | The skill `name` has no colon, slash, or dot. Clients add the prefix outside the file. | **Winner.** The token grammar stays hyphen-only. |
| MiniMax | The skill directory name is the skill. The plugin `name` is a separate field. | **Winner for two levels.** |
| Hermes | The host prefix is applied at registration, not stored as the server's tool name. | **Winner for a host prefix that plugins cannot mint.** `fleet:` is that prefix. |
| Craft / M16 draft | `contributionId` is stable and `instanceId` is per open occurrence. Plugin contributions wait until M12 distribution is usable. | **Winner.** This decision records the prefix only. |
| AionUi | Extension skills are still `SKILL.md` folders attached to an assistant. They do not register dock panels. | **Loser as a panel id scheme.** |

### Strings that lost

- Inferring core versus plugin from the number of dots in an action id.
- Using `skill:` or `mcp:` as the contribution prefix. Those two prefixes are catalog ids.
- Freezing `workbench.view_open` in this note.

## Module directions

These are consequences of the strings above. None of them is a packet, and none of them changes a gate.

| Module | Direction |
|---|---|
| M00 | Keep `fleet_host_session_event` and `fleet_host_turn_admission`. Do not publish either string as a plugin id. |
| M03 | Leave the v1.3.0 action-id table as it is. A future `ActionOwner.namespace` for a core row is `fleet`. |
| M05 | Workspace bytes stay on the filesystem the agent already uses. No new control directory for plugins. |
| M12 | Product ids and manifest keys are section 2. Distribution, signing, and marketplaces stay W4. The Settings caller stays absent. |
| M13 | Settings → Plugins stays Locked (D49). Criterion 2 is met. The page still does not call `plugin.loadout_mutate`. |
| M16 | Contribution prefixes are section 4. The contribution table is not frozen. |

## Still under discussion

- Claude `name@marketplace`, marketplace sources, `commands`, `hooks`, `agents`, and `userConfig`.
- VS Code `publisher.name` and `contributes`.
- Extra skill roots `.claude/skills`, `.github/skills`, and `~/.copilot/skills`.
- Hermes tool prefixes (`mcp_<server>_<tool>` and `mcp__<server>__<tool>`) and `~/.hermes/`.
- MiniMax `.minimax-plugin/`, `schemaVersion`, `displayName`, and `apps`.
- A `preferences.json` key that would copy enablement out of the skills and sources the agent loads.
- Signing, trust, and the W4 distribution ADR.
- Physical persistence adapters (W0.1 exit item 5).
- The M16 contribution table and the unfrozen `workbench.view_*` action ids.
- Workspace skill slugs that fail kebab-case. `safeSlug` still admits them as `skill:<slug>`. Tightening that check is a later change.

## D49 after this decision

Criterion 2 in `docs/audits/2026-10-10-w01-lead-decisions-oss.md` is met: the product and internal strings are D50. Criteria 3, 4, and 5 are not met. There is still no production Settings caller. Install, enable, and disable stay Locked.

Follow-up: `SessionManager.applySessionPluginMutation` and `resolveSessionPluginGrant` now build `plugin.loadout_mutate` and stay `test-only`. `file.update` still refuses that payload. Settings stays Locked. D50 is unchanged.

## W0.1

Exit item 6 and BLK-002 are closed as a name decision. Items 1–5 and 7–9 in `docs/WAVE-MODULE-MAP.md` §3 stay open. W0.1 stays Locked. W1 is not Ready. Nothing in this note is `usable`.
