# 06 Browser Artifact Surface

## 1. Mission

Embed a real Chromium viewport inside Fleet so humans and agents can browse, test, and inspect live web content — with full action, permission, timeline, and rollback coverage.

---

## 2. User-Visible Loop

1. User opens a Browser surface from the workspace sidebar or via `browser.navigate` action.
2. Fleet renders a live Chromium webview inside the surface panel.
3. User browses normally; agent can also call `browser.navigate`, `browser.click`, `browser.screenshot` via the action registry.
4. All meaningful navigations and agent-driven interactions appear in the Session Timeline.
5. User or agent can take a snapshot (URL + screenshot) at any time and attach it to the session as evidence.

---

## 3. Embedding Strategy

Use Electron's **`<webview>` tag** (Chromium guest process) as the browser viewport. Do **not** use `<iframe>` — cross-origin restrictions make it unworkable for general web content.

`webview` is rendered inside the Browser surface component in the renderer process. Fleet's preload bridge controls the surface — the webview has no access to Fleet internals.

### 3.1 Security Boundary

- `nodeIntegration` is **false** inside the webview.
- `contextIsolation` is **true**.
- The webview is sandboxed: `sandbox` attribute is set.
- The Fleet action executor communicates with the webview only via Electron's `webview.executeJavaScript()` API — never by injecting Fleet internals.

---

## 4. Viewport Model

The Browser surface occupies the main content area. It is **not** embedded inside the chat panel.

| Property | Value |
|---|---|
| Default size | Fills the Fleet main area minus the top-bar spine |
| Resize | User can drag a splitter to resize the panel; webview fills its container |
| Dev Tools | Cmd+Option+I opens Electron detached DevTools for the webview |
| Zoom | Separate from Fleet's canvas zoom; controlled inside the webview via `webview.setZoomFactor()` |

---

## 5. Navigation Controls

The Browser surface renders a thin navigation bar above the webview:

- Back / Forward buttons (← →)
- Reload button
- URL bar (editable; shows current URL)
- Stop button (during load)
- Screenshot button
- Open-in-external-browser button

All navigation bar actions have agent-callable equivalents (see §7).

---

## 6. Canvas Embed (M07 Integration)

When a `browser_embed` node exists on a Canvas document (M07 §3), it shows a static thumbnail of the last captured browser frame. Clicking the node opens the full Browser surface. The live webview is **not** rendered inside the canvas — only the static thumbnail is.

This avoids rendering multiple live Chromium processes simultaneously.

---

## 7. Agent-Native Actions

These action ids are **under discussion** — not yet in the frozen table. Workers must not implement them until the Lead freezes them in `action-ids.md`.

| Candidate action id | Description | Permission | Undo |
|---|---|---|---|
| `browser.navigate` | Navigate to a URL | L1_reversible | supported (back) |
| `browser.click` | Click a CSS selector or coordinate | L1_reversible | not_supported |
| `browser.type` | Type text into a focused element | L1_reversible | not_supported |
| `browser.screenshot` | Capture the current viewport as an image | L0_read_only | n/a |
| `browser.get_dom` | Return a cleaned DOM snapshot | L0_read_only | n/a |
| `browser.scroll` | Scroll by a pixel or selector amount | L0_read_only | n/a |
| `browser.eval` | Execute arbitrary JS in the webview | L2_irreversible | not_supported |

`browser.eval` is destructive and requires `L2_irreversible` + a `SupervisionRequest`.

---

## 8. Timeline Events

The following events are recorded in the Session Timeline:

- `browser.navigate` — URL, timestamp, source (human or agent)
- `browser.screenshot` — image path in workspace artefact store
- `browser.eval` — script hash (not full content), actor, timestamp
- Page load errors — URL, HTTP status, error message

High-frequency scroll and mouse movement events are **not** recorded.

---

## 9. Session / Permission / Rollback

- `browser.navigate` is `L1_reversible`; the undo handle is a navigate-back invocation.
- `browser.eval` is `L2_irreversible`; it pauses at the PreInvoke Hook and emits a `SupervisionRequest` to the Captain before executing.
- Screenshots are saved to `<workspace>/.fleet/artefacts/browser/` and linked as `evidenceRefs` in the SessionEvent.

---

## 10. Files To Inspect First

- `app/apps/electron/src/main/` — BrowserWindow and webview setup
- `app/apps/electron/src/preload/` — IPC bridge
- `docs/contracts/action-ids.md` — browser action ids (under discussion)
- `docs/contracts/protocol-stubs.md` — `SessionEvent`, `ActionInvocation`

---

## 11. Files Likely Touched

Browser surface renderer component, browser action executor (once ids are frozen), webview IPC handler in main process, artefact store helper.

---

## 12. Validation Ladder

1. `pnpm typecheck` — zero errors.
2. Unit test: browser action executor emits the correct `SessionEvent` shape.
3. Smoke: open Browser surface, navigate to `https://example.com`, verify URL bar updates.
4. Agent action smoke: call `browser.navigate` via action registry, verify Timeline event appears.
5. Security check: confirm `nodeIntegration=false` and `sandbox=true` on webview.
6. Screenshot smoke: call `browser.screenshot`, verify file appears in artefact store.

---

## 13. Done / Not Done

**`usable`**: human can open the browser surface, navigate to a URL, and take a screenshot. Agent can call `browser.navigate` and `browser.screenshot` and both produce Timeline events.

**`display-only`**: webview renders but no action/timeline path exists.

**`blocked`**: browser action ids not yet frozen in `action-ids.md`.
