# SYS-06 — AIGC and media production

**Rows:** CREATE-02..16, ORCH-05, INFO-02, INFO-04, INFO-07. **Owner:** native sequence/document/
scene models and media/render Job adapters. **Depends on:** SYS-01 JobRef, actions and permissions.
**Development order:** R11–R13.
**Craft base:** Electron shell, Workspace files, previews, background execution, Session/Task,
permission and timeline evidence; only native media models and bounded render/provider adapters are
new.

## Closed loop

Prompt/source/reference → text/document/image/audio/video/3D asset → analysis/storyboard/captions/
multi-angle/relight/panorama → sequence/document → cancellable render Job → ArtifactRef → delivery.

## First proof

Import real media, perform one shared trim/split operation, render a real output with cancellation,
persist source/output provenance and expose failure/retry. Agent and human edits call one operation.

## Acceptance and references

Use `VID-001..004`, `CREATE-02-A` through `CREATE-16-A`, `JOB-001..004` and `CREATE-12-A`. Audit
OpenCut/opencut-classic, React Video Editor/Cutia/OpenReel, LosslessCut, Shotcut, Remotion,
Hyperframes, FFmpeg adapters, pyvideotrans, baocut, OpenMontage, video-use, Storyboard, Palmier,
Toonflow, waoowaoo and ChatCut; exact candidates are in `references/video/`.

## Stop conditions

Stop on non-cancellable render, missing provenance, provider-owned job state, or a 3D/panorama/shot
feature bypassing the native media model.
