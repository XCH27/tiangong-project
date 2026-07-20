# Legacy design migration map

The design-library documents are owner-intent source material, not executable specifications.
Durable facts migrate into the canonical context/module homes below; process-only or superseded
rules are deleted rather than archived. A row marked “planned recovery” is not evidence that the
destination design already exists.

| Legacy source | Destination context | Migration status |
|---|---|---|
| `design-library/05-files-library-artifactref--leases.md` | Information & Evidence | planned recovery: split into files, ArtifactRef, leases |
| `design-library/02-terminal---cli-runtime-loop.md` | Governed Execution | planned recovery: runtime lane, cancellation and evidence boundaries |
| `design-library/03-internal-action-registry.md` | Governed Execution | planned recovery: shared Action contract; remove duplicated process prose |
| `design-library/04-runtime-lanes--teamrun.md` | Governed Execution | planned recovery: runtime lanes, TeamRun and bounded mailbox semantics |
| `design-library/06-browser-artifact-evidence-surface.md` | Information & Evidence / Governed Execution | planned recovery: split evidence from automation |
| `design-library/08-aigc-jobs-surface.md` | Integrations & Delivery | planned recovery: single Job authority |
| `design-library/09-video-surface.md` | Creative Media | planned recovery: native media sequence design |
| `design-library/10-memory---context---review.md` | Intelligence | planned recovery: proposal/review/deletion design |
| `design-library/11-model-routing--cost-ledger.md` | Intelligence | planned recovery: one usage/cost ledger |
| `design-library/12-capability---skill---plugin-system.md` | Intelligence / Integrations | planned recovery: install/loadout/runtime boundaries |
| `design-library/13-settings--shell-ux.md` | Work Core / Composition | planned recovery: settings risk and shell/panel boundaries |
| `design-library/14-onboarding.md` | Work Core | planned recovery: first-run and provider setup behavior |
| `design-library/15-messaging.md` | Integrations & Delivery | planned recovery: channel adapter and approval routing boundaries |
| `design-library/16-workbench-panel-view-host.md` | Composition | planned recovery: one panel host |
| `design-library/17-composable-workflows.md` | Composition / Governed Execution | planned recovery: definition vs execution split |
| `design-library/18-web-artifact-surface.md` | Creative Media / Information & Evidence | planned recovery: web artifact authority and ArtifactRef |
| `design-library/19-presentation---motion-surface.md` | Creative Media | planned recovery: native deck and explicit exports |
| `design-library/07-canvas-spatial-orchestration-VISION.md` | Composition | retain projection and renderer boundaries |

No migration may create a second authority. Each recovered packet must cite the canonical context,
core seam, reference audit and current implementation status.
