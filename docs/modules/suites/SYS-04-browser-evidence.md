# SYS-04 — Governed browser and evidence

**Rows:** INFO-03, INFO-07, EXEC-01, EXEC-08, ORCH-07. **Owner:** BrowserPane capture/evidence
adapter. **Development order:** R3/R5 evidence, R16 fallback closure. **Depends on:** SYS-01 policy and INFO-02 ArtifactRef.

## Closed loop

Permitted target → navigation/automation → annotation/capture/download → evidence ArtifactRef →
session/task/document/media consumer, with approval and failure state at every consequential action.

## First proof

Capture one page with URL, timestamp, source identity and annotation; link it to a session; exercise
denied credential action, blocked external effect, offline target and failed-download recovery.

## Acceptance and references

Use `BRW-001..004`, `INFO-03-A`, `INFO-07-A`, `EXEC-01-A`, `EXEC-08-A`. Craft BrowserPane is the
baseline; audit agent-browser, browser-use/video-use, Chrome DevTools MCP and crawl candidates only
as replaceable executors. ChatCut is product behavior evidence only.

## Stop conditions

Stop on policy bypass, credential leakage, untraceable capture, or browser code writing directly to
another suite's authority.
