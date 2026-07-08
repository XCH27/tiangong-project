# 06 Browser Artifact Workflow

## 1. Mission

Turn Craft BrowserPane into the entry point for evidence, design annotation, and editable artifact handoff.

## 2. User-Visible Loop

User opens a page, selects an element/region, adds annotation or Comment AI request, evidence enters timeline, and editable artifacts can be handed to Artifact Studio.

User can also open browser settings, enable or disable Fleet browser control, choose where local URLs open, clear browser data, define screenshot inclusion, set approval behavior, override permissions per site, and opt into full CDP access only through an explicit high-risk developer setting.

## 3. Current App Reuse

Reuse BrowserPane, CDP/browser_tool, screenshots, network/console evidence, session ownership, and existing renderer browser hooks.

## 4. Reference Projects

Open Design for artifact/design workflow. Codex browser settings are the product reference for the control surface and permission vocabulary. Browser-harness/OpenClaw only as black-box reliability/profile ideas. Cloak/stealth is prohibited.

## 5. UI Placement

Extend existing BrowserPane/browser surface. Browser controls belong in Settings under the integrations/capabilities area, with a dedicated Browser page modeled after Codex's settings hierarchy. Do not make a separate Figma clone or stealth browser product.

Required browser settings groups:

- Browser: enable or disable Fleet control of the built-in browser.
- General: local URL open target, clear browser data, and annotated screenshot policy.
- Permissions: default approval behavior plus per-site permission overrides.
- Developer mode: full CDP access, clearly marked high risk and never enabled by default.

## 6. Backend / RPC / Locality

Browser control, local profiles, browser data clearing, screenshot capture, and CDP access are `LOCAL_ONLY`. External review submission requires explicit permission and evidence bundle. Full CDP access is a separate developer-mode capability, not implied by ordinary browser enablement.

## 7. Session / Timeline / Permission / Rollback

Selection, screenshot, annotation, approval decisions, site permission overrides, browser data clearing, developer-mode CDP access changes, and external submission write evidence or settings events. Remote web pages are annotate/evidence only; editable artifacts use native models.

## 8. Data Model

Browser settings, browser data scope, local URL target, screenshot inclusion policy, approval policy, site permission override, developer CDP flag, browser selection, AX/DOM ref, screenshot ref, annotation, evidence package, artifact link, review bundle.

## 9. Agent-Native Actions

Read browser settings, propose browser setting change, read page evidence, select element/box, annotate selection, capture screenshot according to policy, hand off artifact, submit review bundle with permission.

## 10. Files To Inspect First

- `app/packages/shared/src/agent/browser-tools.ts`
- `app/packages/server-core/src/sessions/RemoteBrowserPaneManager.ts`
- browser pane renderer atoms/components
- settings registry and browser settings pages

## 11. Files Likely Touched

Browser services, renderer selection overlay, evidence/timeline events, artifact handoff service, browser settings page, permission setting handlers.

## 12. Parallel Work Packages

Browser settings control surface, selection overlay, evidence service, annotation UI, and artifact handoff can split after settings and selection contracts freeze.

## 13. File Ownership

Browser/action contracts are Lead-owned. Browser UI and artifact UI must not invent hidden renderer state.

## 14. Validation Ladder

Browser settings persistence test, browser tool tests, UI selection smoke, screenshot/evidence verification, site permission override smoke, developer CDP toggle smoke, external review dry run without external upload.

## 15. Done / Not Done

`usable`: browser settings control real behavior, selected evidence can be referenced by agent and timeline, and site/CDP permission changes are visible and permissioned. `display-only`: settings or overlay render but do not affect browser behavior or timeline evidence.

## 16. Risks And Blocked Decisions

Risk: editing arbitrary remote websites. Decision: ordinary remote pages are read/annotate/evidence only.

Risk: treating full CDP as ordinary browser permission. Decision: full CDP is developer-mode only, high-risk, explicit, and off by default.
