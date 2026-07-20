# Browser automation and evidence module

Design state: `breadth`; implementation status: `not implemented`; development order: R3/R5
evidence path, R16 computer-environment closure.

The browser module must separate navigation/automation, evidence capture, downloads and local
artifacts. Remote pages are not silently editable documents. All consequential actions use the
core permission and timeline paths; captured screenshots, text and downloads become explicit
ArtifactRefs with provenance.

## Frontend and backend boundary

- P-15 extends Craft BrowserPane for tab, URL, navigation, loading, blocked, crashed, offline and
  credential-request states. P-16 inspects captures and downloads; neither surface owns artifacts.
- `browser-pane-manager.ts` remains the native window/session authority. `browser-tools.ts` remains
  the Agent-facing seam. Renderer code issues typed commands and receives state/events; it never
  calls CDP, Playwright or a remote browser provider directly.
- A capture adapter normalizes text/DOM snapshot, screenshot and download into one provenance-
  bearing ArtifactRef containing source URL, capture time, Session/actor correlation, media type and
  integrity metadata. The Library owns the resulting artifact bytes and lifecycle.
- Credential use and every external side effect pass core policy at execution time. A stored grant
  does not prove the current page or observation is fresh.

## Top-tier executor references

Playwright MCP is retained for its deterministic accessibility-snapshot/action split and compact
CLI/Skill alternative; Browser Use is retained for BrowserSession lifecycle, CDP snapshot processing,
stable element evidence and recovery behavior. Both are executor references behind Craft's browser
seam. Screenshots are evidence, not action selectors; page-derived accessibility text is untrusted
external content and cannot issue instructions or bypass policy.

The current Craft/Fleet BrowserPane authority was inspected at the paths listed by `AV-BRW-01` in
[`../../references/ADMISSION-V2-AUDIT.md`](../../references/ADMISSION-V2-AUDIT.md). That means the
browser route is `CRAFT_REUSE/EXTEND`, not a new browser framework. External automation projects
remain optional executors until their permission, credential, evidence and download paths are
compared against this existing seam.

Compatibility gates:

- existing BrowserPane and browser tool paths audited first;
- sandbox and full-CDP escalation boundaries defined;
- download, cookie/credential and external-side-effect policies are explicit;
- offline, denied, blocked and evidence-unavailable states have recovery behavior;
- no browser-owned duplicate Library, task or permission authority.
- executor removal falls back to the unchanged native BrowserPane path.

Activation acceptance: `BRW-001` opens a permitted target with session correlation; `BRW-002`
captures a provenance-bearing evidence ArtifactRef; `BRW-003` denies credentials/external effects
through core policy; `BRW-004` handles blocked, offline and evidence-unavailable states honestly.

## Reality and activation sequence

The Craft browser baseline exists at `app/apps/electron/src/main/browser-pane-manager.ts` and
`app/packages/shared/src/agent/browser-tools.ts`; capture-to-ArtifactRef does not.
Activation is: audit current BrowserPane/tool permissions, define the evidence adapter, add a
fixture capture and denial/offline tests, then wire the P-15/P-16 surfaces. The baseline must not
be reported as the Fleet evidence module. From `app/`, run
`bun test apps/electron/src/main/__tests__/browser-pane-manager.test.ts` for the baseline.
