> **Fleet local copy.** Downloaded for offline use by people and agents. Not fetched from Craft at runtime. Craft cloud features (online sharing, hosted accounts, official updater) are disabled in Fleet.
> **本地副本。** 供人和 Agent 离线阅读，运行时不会访问 Craft 云。在线分享、官方更新等云能力已关闭。

> ## Documentation Index
> Fetch the complete documentation index at: https://agents.craft.do/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Deep Links

> Launch Craft Agents from anywhere using the craftagents:// URL scheme

The `craftagents://` URL scheme lets you launch Craft Agents directly from browsers, scripts, documentation, or other apps.

## New Chat

Create a new chat session, optionally with pre-filled input:

```
craftagents://action/new-chat
craftagents://action/new-chat?input=Hello%20world
craftagents://action/new-chat?input=Hello%20world&send=true
craftagents://action/new-chat?input=Hello%20world&name=My%20Chat
```

**Parameters:**

| Parameter | Description                                   |
| --------- | --------------------------------------------- |
| `input`   | Text to pre-fill in the input field           |
| `send`    | Set to `true` to immediately send the message |
| `name`    | Custom name for the session                   |

## Workspace Targeting

Target a specific workspace by adding the workspace ID to the path:

```
craftagents://workspace/{workspaceId}/action/new-chat
craftagents://workspace/{workspaceId}/action/new-chat?input=Hello&send=true
craftagents://workspace/{workspaceId}/allSessions
```

Without workspace targeting, deep links use the currently focused window.

## View Routes

Navigate directly to specific views:

**Sessions:**

```
craftagents://allSessions
craftagents://allSessions/session/{sessionId}
craftagents://flagged                         # legacy route for Pinned
craftagents://flagged/session/{sessionId}     # legacy route for Pinned
craftagents://state/{statusId}
craftagents://state/{statusId}/session/{sessionId}
```

**Sources:**

```
craftagents://sources
craftagents://sources/source/{sourceSlug}
```

**Skills:**

```
craftagents://skills
craftagents://skills/skill/{skillSlug}
```

**Settings:**

```
craftagents://settings
craftagents://settings/workspace
craftagents://settings/permissions
craftagents://settings/shortcuts
craftagents://settings/preferences
```

## Session Actions

Manage sessions via deep links:

```
craftagents://action/flag-session/{sessionId}
craftagents://action/unflag-session/{sessionId}
craftagents://action/delete-session/{sessionId}
craftagents://action/rename-session/{sessionId}?name=New%20Name
```

## Window Modes

Open links in a new window instead of the current one:

```
craftagents://action/new-chat?window=focused
craftagents://allSessions?window=full
```

| Mode      | Description        |
| --------- | ------------------ |
| `focused` | New focused window |
| `full`    | New full window    |

## Use Cases

<AccordionGroup>
  <Accordion title="Browser bookmarks">
    Create bookmarks that launch specific workflows:

    * Morning briefing: `craftagents://action/new-chat?input=Give%20me%20my%20morning%20briefing&send=true`
    * Quick task check: `craftagents://action/new-chat?input=What%20are%20my%20top%203%20priorities%3F&send=true`
  </Accordion>

  <Accordion title="Documentation links">
    Add links in your team docs that open agent conversations:

    ```markdown theme={null}
    [Ask the assistant](craftagents://action/new-chat?input=How%20does%20the%20auth%20system%20work%3F)
    ```
  </Accordion>

  <Accordion title="Shell aliases">
    Create shell aliases for common tasks:

    ```bash theme={null}
    alias morning="open 'craftagents://action/new-chat?input=Morning%20briefing&send=true'"
    alias standup="open 'craftagents://action/new-chat?input=Prepare%20my%20standup%20notes&send=true'"
    ```
  </Accordion>

  <Accordion title="Raycast / Alfred shortcuts">
    Configure launcher apps to trigger workflows with keyboard shortcuts using the deep link URLs.
  </Accordion>

  <Accordion title="iOS Shortcuts">
    On iOS, create Shortcuts that open deep links:

    1. Create a new Shortcut
    2. Add "Open URL" action
    3. Enter your `craftagents://` deep link
    4. Run from the Shortcuts widget or Siri
  </Accordion>
</AccordionGroup>

## Tips

<AccordionGroup>
  <Accordion title="URL encode your input">
    When creating deep links with input text, URL-encode special characters:

    * Space → `%20`
    * Question mark → `%3F`
    * Ampersand → `%26`
    * Newline → `%0A`
  </Accordion>

  <Accordion title="Test deep links in Terminal">
    Test your deep links before sharing:

    ```bash theme={null}
    open "craftagents://action/new-chat?input=Hello%20world"
    ```
  </Accordion>

  <Accordion title="Auto-send for quick workflows">
    Add `&send=true` to immediately execute the prompt without manual confirmation - great for automated workflows.
  </Accordion>
</AccordionGroup>
