# M06 — Browser Evidence and Artifact Surface

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft; selection-overlay adapter requires v0.11 inspection/spike
> **Wave:** W3
> **Depends on:** M00, M03, M05, M13 browser settings, M16 view host

## 1. Purpose

Extend the single retained BrowserPane/WebContentsView path so humans and Agents can navigate
under visible policy, select/annotate page evidence, capture a provenance-preserving bundle, and
hand owned/local artifacts to native editors. External pages remain evidence sources, not hidden
editable documents.

## 2. First Closed Loop

```text
open permitted page -> select text/element/region -> annotate -> capture screenshot/evidence
-> register evidence ArtifactRef -> timeline reference -> reveal in canvas/workflow context
```

The failure loop covers blocked site permission, stale selection, capture/redaction failure, page
crash, and denied Agent access with visible recovery.

## 3. Trust Boundary

### External or Untrusted Page

- read, navigate with policy, select, annotate in Fleet-owned state, screenshot, and package
  evidence;
- no form submission, arbitrary click/type/eval, cookie/token extraction, stealth, or DOM
  mutation in the standard mode;
- high-risk full CDP developer mode remains separate, visible, default off, and explicitly
  approved per D30.

### Owned Local Artifact Preview

M18 local web projects may open in the same governed browser path with an explicit owned-preview
route. Editing still happens through real files/M18 operations, not arbitrary preview DOM
mutation. Preview trust must never leak to an unrelated external origin.

## 4. Browser Evidence Model

```ts
type BrowserSelectionAnchor = {
  pageUrl: string
  navigationId: string
  frameRef: string
  kind: 'text' | 'element' | 'region'
  textQuote?: { exact: string; prefix?: string; suffix?: string }
  selectorHints?: string[]
  accessibilityRef?: string
  geometry?: { x: number; y: number; width: number; height: number; deviceScale: number }
  capturedAt: string
}

type BrowserEvidenceBundle = {
  schemaVersion: 1
  evidenceId: string
  sourceUrl: string
  finalUrl: string
  title?: string
  capturedAt: string
  selection: BrowserSelectionAnchor
  screenshotRef?: ArtifactRef
  extractedTextRef?: string
  contentHash?: string
  redactionSummary: { applied: boolean; fields: string[] }
  staleState: 'fresh' | 'page_changed' | 'unresolvable'
}
```

These are proposed fields, not frozen protocol. Evidence stores stable quotes/hints and geometry;
no single selector is claimed to survive arbitrary page changes.

## 5. Selection and Annotation Architecture Gate

WebContentsView is a separately composed surface. Before implementation, a spike must verify where
the visible selection layer can safely live while preserving pointer/keyboard input and capture
coordinates. Acceptable designs may use a Fleet-owned sibling overlay plus controlled read-only
page inspection. The final route must not introduce a `<webview>`, duplicate profile, or hidden
second browser manager.

Annotations are Fleet-owned records bound to BrowserSelectionAnchor. They do not inject permanent
markup into the page. On navigation/content change, M06 re-resolves text/accessibility/selector
hints and marks the anchor fresh, changed, or unresolvable; it never silently points at a new
element.

## 6. Capture Pipeline

1. confirm browser enablement, site rule, screenshot/redaction policy, and caller permission;
2. freeze navigation/frame identity and current selection anchor;
3. capture screenshot and permitted text/metadata;
4. redact protected fields before external handoff;
5. validate hashes, URL, geometry, and capture metadata;
6. register screenshot/text/evidence through M05 as ArtifactRefs;
7. emit one generic SessionEvent kind with canonical action ID, typed payload, and evidence refs;
8. reveal the result through M16/M07 when requested.

M06 never appends a custom `browser:artifact_captured` event kind outside the canonical event
catalog.

## 7. Candidate Actions — Not Frozen

| Candidate | Purpose | Policy intent |
|---|---|---|
| `browser.navigate` | navigate permitted BrowserPane | L0/L1 depending on policy; no external side effect |
| `browser.selection_set` | create/update ephemeral selection | L0 view state |
| `browser.annotation_create` | persist Fleet annotation | L1 snapshot undo |
| `browser.artifact_capture` | create evidence bundle/ArtifactRefs | L1 local write; higher if external handoff |
| `browser.screenshot` | render screenshot in memory or write through M05 | split render from file side effect |
| `browser.data_clear` | clear selected browser data scope | L3 destructive |

Tool/RPC names are derived; `browser:captureArtifact` and `browser:annotateView` are not parallel
semantic action names.

## 8. Settings Contract

M13 provides one Browser section with exact keys/schemas for:

- enable/disable built-in browser control;
- local URL open target;
- screenshot/evidence inclusion and redaction policy;
- default navigation/capture approval behaviour;
- site-specific permission overrides;
- browser data clearing scope;
- separate full-CDP developer mode and warning.

M06 consumes these settings. It does not duplicate toggles inside multiple panels.

## 9. UI Contributions

- main Browser surface through M16;
- address/navigation controls under the retained BrowserPane owner;
- selection/annotation toolbar active only when supported;
- right evidence inspector with freshness, URL, capture, redaction, and ArtifactRefs;
- M07 evidence card with static screenshot and source metadata;
- M17 evidence ArtifactRef output port.

## 10. State and Persistence

- browser profile/lifecycle remains the single retained BrowserPane authority;
- selection highlight is ephemeral;
- annotations/evidence bundles are versioned project artifacts through M05;
- browser settings use canonical preferences;
- page content is never copied into a hidden editable browser document;
- crash recovery restores allowed navigation state only according to existing profile/session
  policy; unsaved selection is allowed to be lost with visible notice.

## 11. Error Handling

| Condition | Result | Recovery |
|---|---|---|
| site/action denied | no navigation/capture; policy reason shown | change explicit setting/approval |
| selection stale | evidence marked changed/unresolvable | reselect or capture with stale warning |
| page/frame navigated mid-capture | capture aborted, no false evidence | retry on stable page |
| redaction fails | external handoff blocked | inspect/reconfigure redaction |
| BrowserPane crash | surface recovery state | reload permitted page |
| output write fails | no completed evidence claim | retry M05 commit |
| Agent lacks read scope | filtered denial, no page metadata leak | user performs action or changes scope |

## 12. First Usable Verification

1. Open a permitted real page in the retained BrowserPane path.
2. Select text, element, and region; verify visible overlay and stable capture coordinates.
3. Create annotation and evidence through human and Agent paths using the same actions.
4. Navigate/change the page and verify stale/unresolvable anchor behaviour.
5. Verify screenshot/text/evidence ArtifactRefs, provenance, redaction, and timeline correlation.
6. Deny a site and disable Agent browser control; verify no hidden capture occurs.
7. Crash/reload the BrowserPane and verify user-visible recovery.
8. Open an M18 owned local preview and prove its trust does not grant writes to an external page.

## 13. Open Gates

- v0.11 BrowserPane/WebContentsView lifecycle and overlay spike.
- Freeze evidence/selection/action payloads and M13 setting keys.
- Confirm data/profile/clear semantics without a second profile store.
- Produce a narrow M06 packet after M03/M05 are usable.

## 14. Non-Goals and Prohibitions

- No `<webview>` replacement path.
- No external-page editing through DOM mutation.
- No stealth, cookie/token extraction, or approval bypass.
- No custom event-kind system beside SessionEvent.
