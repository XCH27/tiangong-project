# R18 modular right workbench — owner-directed early slice

## Contract

The desktop shell has one resizable right workbench. It can host repeatable tabs without creating a
second Session, task, permission, browser, memory, source, Git, or process authority.

This slice is an **EXTEND** of the Craft shell and BrowserPane:

- Task board is a read-only projection of the focused Session's TodoWrite activity, explicit
  identity labels, used Skills/enabled Sources, reviewed Project `MEMORY.md`, attachments, badges,
  and referenced URLs.
- Browser reparents the existing BrowserPane page `BrowserView` into the main window while its tab
  is active. Switching or closing the tab detaches or destroys that existing BrowserPane instance.
  The main process also detaches on host-window close, because a forced destroy tears down the
  renderer without running its cleanup. Terminating the pane from the top-bar browser strip
  releases the tab's binding so it acquires a fresh pane instead of showing a dead surface.
  Browser creation has one product entry in the workbench module menu; the former standalone
  "New Browser Window" entry is removed. The top-bar browser strip remains a projection of those
  same BrowserPane instances, not a second browser surface or authority.
- Review is a read-only projection from the core RPC host over the focused Session's
  backend-resolved working directory. It cannot stage, restore, commit, or discard changes.
- Terminal is a bounded user-invoked command runner registered in the core RPC host. The renderer
  supplies only the Session id and command; the backend resolves the current working directory and
  rejects non-desktop or cross-Workspace callers. The renderer cannot start processes directly. A
  persistent PTY, interactive programs, cancellation, and shell session restoration are outside
  this slice.
- **Desktop identity is established by the host, never declared by the caller.** `webContentsId`
  and `workspaceId` arrive in the client's own transport handshake, so Git, Terminal and embedded
  BrowserView access resolve both from the window manager — a registry that exists only in the
  Electron main process. A host without one (the headless/WebUI server, which registers the same
  core handlers) therefore refuses these channels outright rather than trusting the envelope.
- Canvas is a `display-only` entry. It owns no canvas document or execution state.

## Acceptance

1. The top-right workbench toggle opens one URL-addressable right-sidebar host only while the
   focused route belongs to the Sessions navigator (folder-bound Project tasks or folder-less
   Conversations). Sources, Skills, Automations, Settings, and legacy Project-detail routes render
   neither the workbench nor its top-bar toggle and reserve no workbench width. Returning to a
   Sessions route may restore the still-open workbench state.
2. A single workbench module uses the same centered `PanelHeader` composition as the existing
   Session list and chat panels. Multiple modules use the existing browser-style compact tab
   treatment so every open module remains visible and directly selectable; tab close preserves
   surviving module state. The workbench add menu can create multiple entries of every registered
   kind. Side Task creation calls the existing Session creation authority from that workbench
   launcher; the removed top-bar plus is not recreated.
3. Task board content follows the focused Session and reads existing authorities only. Its four
   groups reuse the Session list's independent disclosure behavior: all-empty groups share the
   available height only while all four remain open, while a manual collapse returns them to the
   normal top-stacked list flow. When content first appears, that group opens and the others
   collapse. Closing every workbench module renders the same compact, centered launcher-row
   treatment as the existing sidebar instead of an empty-state hero or a second add menu.
4. An embedded browser navigates, preserves its page while switching tabs, and releases its
   BrowserPane instance when closed.
5. Review resolves the focused Session's working directory server-side and returns a compact Git
   status/numstat overview. The selected file's staged/unstaged patch is loaded lazily through a
   path-contained read-only RPC; no repository mutation is exposed.
6. Terminal resolves the focused Session's working directory server-side, rejects non-desktop and
   cross-Workspace calls, then executes a command through the core RPC registration path and
   returns output, exit code, and timeout state.
6a. A caller that forges `webContentsId`/`workspaceId`, and any host with no window registry, is
   refused by Git, Terminal and BrowserView embedding.
7. Missing Session, Project folder, repository, browser startup, Git read, and command-start
   failures render explicit states.
8. The workbench width is resizable and stored through the existing renderer preference path.

## Status

- Modular host, task projection, embedded browser, read-only review, and bounded command runner:
  `wired but not visually checked`.
- Canvas: `display-only`.
- Persistent tab restoration: `wired but not visually checked`. Interactive PTY/cancellation,
  writable Git actions, and canvas editing: `not implemented`.
