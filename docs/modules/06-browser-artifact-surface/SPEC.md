# 06 Browser Artifact Surface

## 1. Mission

Embed a real Chromium viewport inside Fleet so humans and agents can browse, test, inspect live
web content, annotate elements, and hand off editable artifacts — with full action, permission,
timeline, and rollback coverage.

---

## 2. User-Visible Loop

1. User opens a Browser surface from the workspace sidebar or via `browser.navigate` action.
2. Fleet renders a live Chromium webview inside the surface panel.
3. User browses normally; agent can also call `browser.navigate`, `browser.click`,
   `browser.screenshot` via the action registry.
4. User selects an element or region, adds an annotation or Comment AI request; evidence
   enters the Session Timeline and editable artifacts can be handed to Artifact Studio.
5. All meaningful navigations and agent-driven interactions appear in the Session Timeline.
6. User or agent can take a snapshot (URL + screenshot) at any time and attach it to the
   session as evidence.
7. Browser settings (Fleet control toggle, permissions, developer CDP mode) live in Settings
   under the integrations/capabilities area.

---

## 3. Embedding Strategy

Use Electron's **`<webview>` tag** (Chromium guest process) as the browser viewport. Do **not**
use `<iframe>` — cross-origin restrictions make it unworkable for general web content.

`webview` is rendered inside the Browser surface component in the renderer process. Fleet's
preload bridge controls the surface — the webview has no access to Fleet internals.

Reuse existing BrowserPane, CDP/browser_tool, screenshots, network/console evidence, session
ownership, and existing renderer browser hooks from the Craft base.

### 3.1 Security Boundary

- `nodeIntegration` is **false** inside the webview.
- `contextIsolation` is **true**.
- The webview is sandboxed: `sandbox` attribute is set.
- The Fleet action executor communicates with the webview only via Electron's
  `webview.executeJavaScript()` API — never by injecting Fleet internals.
- Full CDP access is a **developer-mode only** capability, clearly marked high-risk,
  never enabled by default. It is not implied by ordinary browser enablement.
- Cloak/stealth behavior is prohibited.

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

## 6. Settings UI Placement

Browser controls belong in **Settings → Integrations/Capabilities → Browser**, modeled after
Codex's settings hierarchy. Do not create a separate browser settings screen outside Settings.

Required browser settings groups:

- **Browser**: enable or disable Fleet control of the built-in browser.
- **General**: local URL open target, clear browser data, annotated screenshot policy.
- **Permissions**: default approval behavior plus per-site permission overrides.
- **Developer mode**: full CDP access — clearly marked high-risk, off by default.

---

## 7. Canvas Embed (M07 Integration)

When a `browser_embed` node exists on a Canvas document (M07 §3), it shows a static thumbnail
of the last captured browser frame. Clicking the node opens the full Browser surface. The live
webview is **not** rendered inside the canvas — only the static thumbnail is.

This avoids rendering multiple live Chromium processes simultaneously.

---

## 8. Backend / RPC / Locality

Browser control, local profiles, browser data clearing, screenshot capture, and CDP access are
`LOCAL_ONLY`. External review submission requires explicit permission and an evidence bundle.
Full CDP access is a separate developer-mode capability.

Remote web pages are **annotate/evidence only**; editable artifacts use native models.

---

## 9. Session / Timeline / Permission / Rollback

- `browser.navigate` is `L1_reversible`; the undo handle is a navigate-back invocation.
- `browser.eval` is `L2_irreversible`; it pauses at the PreInvoke Hook and emits a
  `SupervisionRequest` to the Captain before executing.
- Selection, screenshot, annotation, approval decisions, site permission overrides, browser
  data clearing, and developer-mode CDP access changes all write evidence or settings events.
- Screenshots are saved to `<workspace>/.fleet/artefacts/browser/` and linked as `evidenceRefs`
  in the SessionEvent.

The following events are recorded in the Session Timeline:

- `browser.navigate` — URL, timestamp, source (human or agent)
- `browser.screenshot` — image path in workspace artefact store
- `browser.eval` — script hash (not full content), actor, timestamp
- Page load errors — URL, HTTP status, error message
- Annotation created, site permission override, developer CDP toggle

High-frequency scroll and mouse movement events are **not** recorded.

---

## 10. Data Model

Browser settings, browser data scope, local URL target, screenshot inclusion policy, approval
policy, site permission override, developer CDP flag, browser selection, AX/DOM ref, screenshot
ref, annotation, evidence package, artifact link, review bundle, `WorkspaceBrowserArtefact`.

---

## 11. Agent-Native Actions

These action ids are **under discussion** — not yet in the frozen table. Workers must not
implement them until the Lead freezes them in `action-ids.md`.

| Candidate action id | Description | Permission | Undo |
|---|---|---|---|
| `browser.navigate` | Navigate to a URL | L1_reversible | supported (back) |
| `browser.click` | Click a CSS selector or coordinate | L1_reversible | not_supported |
| `browser.type` | Type text into a focused element | L1_reversible | not_supported |
| `browser.screenshot` | Capture the current viewport as an image | L0_read_only | n/a |
| `browser.get_dom` | Return a cleaned DOM snapshot | L0_read_only | n/a |
| `browser.scroll` | Scroll by a pixel or selector amount | L0_read_only | n/a |
| `browser.eval` | Execute arbitrary JS in the webview | L2_irreversible | not_supported |
| `browser.select_element` | Select an element/region for annotation | L0_read_only | n/a |
| `browser.annotate` | Attach annotation to a selection | L1_reversible | supported |
| `browser.handoff_artifact` | Hand off selected artifact to Artifact Studio | L1_reversible | supported |
| `browser.read_settings` | Read current browser settings | L0_read_only | n/a |
| `browser.propose_setting` | Propose a browser setting change | L2_irreversible | not_supported |
| `browser.submit_review` | Submit review bundle (requires explicit permission) | L2_irreversible | not_supported |

`browser.eval` is destructive and requires `L2_irreversible` + a `SupervisionRequest`.

---

## 12. Files To Inspect First

- `app/apps/electron/src/main/` — BrowserWindow and webview setup
- `app/apps/electron/src/preload/` — IPC bridge
- `app/packages/shared/src/agent/browser-tools.ts`
- `app/packages/server-core/src/sessions/RemoteBrowserPaneManager.ts`
- Browser pane renderer atoms/components
- Settings registry and browser settings pages
- `docs/contracts/action-ids.md` — browser action ids (under discussion)
- `docs/contracts/protocol-stubs.md` — `SessionEvent`, `ActionInvocation`

---

## 13. Files Likely Touched

Browser surface renderer component, browser action executor (once ids are frozen), webview IPC
handler in main process, artefact store helper, renderer selection overlay, evidence/timeline
events, artifact handoff service, browser settings page, permission setting handlers.

---

## 14. Parallel Work Packages

Browser settings control surface, selection overlay, evidence service, annotation UI, and
artifact handoff can split after settings and selection contracts freeze.

Browser/action contracts are Lead-owned. Browser UI and artifact UI must not invent hidden
renderer state.

---

## 15. Validation Ladder

1. `pnpm typecheck` — zero errors.
2. Unit test: browser action executor emits the correct `SessionEvent` shape.
3. Browser settings persistence test; settings changes reflect in real behavior.
4. Smoke: open Browser surface, navigate to `https://example.com`, verify URL bar updates.
5. Agent action smoke: call `browser.navigate` via action registry, verify Timeline event appears.
6. Security check: confirm `nodeIntegration=false` and `sandbox=true` on webview.
7. Screenshot smoke: call `browser.screenshot`, verify file appears in artefact store.
8. Site permission override smoke; developer CDP toggle smoke.
9. External review dry run without external upload.

---

## 16. Done / Not Done

**`usable`**: human can open the browser surface, navigate to a URL, take a screenshot, select
an element, and annotate it — all producing Timeline events. Agent can call `browser.navigate`,
`browser.screenshot`, and `browser.annotate` with Timeline evidence. Browser settings control
real behavior; site/CDP permission changes are visible and permissioned.

**`display-only`**: webview renders but no action/timeline path exists, or settings render but
do not affect browser behavior.

**`blocked`**: browser action ids not yet frozen in `action-ids.md`.

---

## 17. Risks and Blocked Decisions

- **Risk**: editing arbitrary remote websites. **Decision**: ordinary remote pages are
  read/annotate/evidence only; no write path to live remote DOM.
- **Risk**: treating full CDP as ordinary browser permission. **Decision**: full CDP is
  developer-mode only, high-risk, explicit, off by default, and requires L2_irreversible
  + SupervisionRequest.
- **Risk**: Browser UI inventing hidden renderer state outside the spine. **Decision**:
  all browser state must flow through the action registry and Session Timeline.

## 17. Non-Goals & Prohibitions

- **No Stealth Browsing:** Do not build or inject stealth automation, quota bypass, cookie extraction, or terms-of-service evasion stacks.
- **No DOM Mutators:** Do not modify the DOM of external/remote websites. External pages are read/annotate/evidence only.
