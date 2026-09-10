# Design library — owner-intent source notes

Current owner-intent and code-grounded design notes. **Not** a plan set, not implementation
authorization, and not the place for reusable UI component kits.

| Design area | Source notes |
|---|---|
| Owner and baseline | [`OWNER-VOICE.md`](OWNER-VOICE.md), [`01-clean-craft-v0.11-baseline-notes.md`](01-clean-craft-v0.11-baseline-notes.md), [`21-entry-overlap-framework-audit.md`](21-entry-overlap-framework-audit.md) |
| Platform and execution | [`00-platform-spine.md`](00-platform-spine.md), [`02-terminal---cli-runtime-loop.md`](02-terminal---cli-runtime-loop.md), [`03-internal-action-registry.md`](03-internal-action-registry.md), [`04-runtime-lanes--teamrun.md`](04-runtime-lanes--teamrun.md) |
| Files, evidence and browser | [`05-files-library-artifactref--leases.md`](05-files-library-artifactref--leases.md), [`06-browser-artifact-evidence-surface.md`](06-browser-artifact-evidence-surface.md) |
| Canvas and design | [`07-canvas---design-surface.md`](07-canvas---design-surface.md), [`07-canvas-spatial-orchestration-VISION.md`](07-canvas-spatial-orchestration-VISION.md) |
| AIGC and media | [`08-aigc-jobs-surface.md`](08-aigc-jobs-surface.md), [`09-video-surface.md`](09-video-surface.md), [`19-presentation---motion-surface.md`](19-presentation---motion-surface.md) |
| Context and capabilities | [`10-memory---context---review.md`](10-memory---context---review.md), [`11-model-routing--cost-ledger.md`](11-model-routing--cost-ledger.md), [`12-capability---skill---plugin-system.md`](12-capability---skill---plugin-system.md) |
| Shell and collaboration | [`13-settings--shell-ux.md`](13-settings--shell-ux.md), [`14-onboarding.md`](14-onboarding.md), [`15-messaging.md`](15-messaging.md), [`16-workbench-panel-view-host.md`](16-workbench-panel-view-host.md) |
| Composition and delivery | [`17-composable-workflows.md`](17-composable-workflows.md), [`18-web-artifact-surface.md`](18-web-artifact-surface.md), [`20-workspace-project-session-remote-connections.md`](20-workspace-project-session-remote-connections.md) |

## Authority scope

Cross-document precedence is defined once in [`../PRODUCT.md`](../PRODUCT.md). This
library is owner-intent and product-design input only: it may explain why a direction matters, but it
cannot override a decision, active spec, current code status, or module compatibility gate. Code
citations in a note are evidence to verify, not a second code map.

Every design area is owned by an R0–R18 anchor in
[`../modules/PACKET-INDEX.md`](../modules/PACKET-INDEX.md). Any Wave, phase, “later” or similar
scheduling word retained inside a recovered note is historical design prose, not development order;
an executing Agent must use the packet-index anchor and ACTIVE roadmap spec.

## Not here

- Interface component kits, icon packs, page HTML dumps → `/Volumes/AIGC/天工参考/UI参考/` (symlinked locally as `UI参考/`)
- Open-source product checkouts → `/Volumes/AIGC/天工参考/源码参考/` ([`../../源码参考/`](../../源码参考/README.md))
