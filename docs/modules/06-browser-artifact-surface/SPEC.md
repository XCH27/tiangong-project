# 06 Browser Artifact Surface Specification

## 1. Purpose
Extend the existing Electron `BrowserPane` WebContentsView (not `<webview>`) to allow user and agent selection, annotation, and metadata bundling into the timeline.

## 2. Non-Goals
-   Do not implement a `<webview>` tag or duplicate profiles.
-   Do not allow write/mutation commands (e.g. click, type, eval) on external untrusted pages.

## 3. Inputs
-   Selected text, coordinates, page DOM annotations.

## 4. Outputs
-   `browser:artifact_captured` session events.
-   Screenshot hashes logged to timeline evidence.

## 5. State Model
-   Active BrowserView bounds and attachment handles.

## 6. Dependencies
-   Electron main process window manager and `BrowserPaneManager`.

## 7. Acceptance Criteria
-   `usable`: Selection and annotation from BrowserView generates valid timeline evidence bundle.

## 8. Failure & Rollback
-   Crashes trigger WebContents recovery loops. Page states do not support transactional rollbacks.

## 9. Observability
-   Page loads and captures emit events.

## 10. Agent Hooks
-   `browser:captureArtifact`
-   `browser:annotateView`
