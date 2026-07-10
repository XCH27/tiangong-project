# M06 Implementation Constraints

> **Status:** `not implemented` — M06 is W3 Locked. This is a design constraint, not an implementation instruction.

## Required Path

```
BrowserPane / WebContentsView selection
→ browser artifact ActionInvocation
→ M00 permission decision
→ M06 capture/annotation handler
→ M05 evidence asset registration when needed
→ SessionEvent evidence reference and UI feedback
```

The renderer must not write directly to the timeline through ad-hoc IPC such as `timeline:addEvidence`. It may request an approved action only. The handler records a structured evidence bundle containing the selection geometry, capture hash, source metadata, and redaction result.

## External-Site Boundary

- External, untrusted pages are read/annotate/evidence only.
- No click, type, form submit, DOM mutation, JavaScript evaluation, cookie/token extraction, or stealth behaviour.
- Any future high-risk CDP mode needs a separately frozen action, visible setting, explicit approval, and audit trail.

## Adapter Boundary

M06 extends the existing BrowserPane/WebContentsView path. It does not introduce a `<webview>`, a second profile store, or a renderer-owned browser state authority.
