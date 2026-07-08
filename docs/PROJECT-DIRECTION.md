# Project Direction

## 1. Product Thesis

Fleet is a local-first AI workbench built on Craft Agents.

It is not a chat client, not a terminal skin, not an IDE clone, not a Figma clone, and not a collection of disconnected AI utilities. The product direction is a single workbench where a human and multiple AI agents work on the same project through the same sessions, files, permissions, runtime lanes, assets, and timeline.

The core product bet is:

> The user owns intent, taste, and final judgment. Agents do the middle execution. Fleet keeps every action inspectable, permissioned, reversible, and connected to real project artifacts.

In practical terms, humans own the top 10% of creative judgment and the bottom 10% of
common-sense guardrails; agents execute the middle 80% of concrete production work. Fleet must
make that split operational through shared surfaces, permissions, evidence, and rollback rather
than through a decorative chat layer.

This means Fleet must optimize for complete production loops, not impressive panels. A feature is valuable only when it can move real work from intent to output with evidence, permissions, state, and rollback.

## 2. The Product We Are Actually Building

Fleet should grow from Craft Agents into an AI work creation platform with five connected surfaces:

1. **Default Workbench**
   The home surface for sessions, agents, workspace files, project progress, settings, permissions, and runtime selection. This stays close to the Craft Agents shell. We should simplify it, not replace it with a new app shell.

2. **Terminal and CLI Runtime**
   The first serious product loop. Users can run local CLI agents and terminal sessions as first-class runtime lanes. Output, errors, permissions, cost attribution, and reports must flow back into the Craft session timeline.

3. **Browser, Document, and Artifact Workflow**
   The existing BrowserPane becomes the start of the design/review workflow: select, annotate, capture evidence, comment with AI, and hand off editable artifacts. Ordinary remote pages are read/annotate/evidence only. Editable artifacts must use a real document model.

4. **Canvas and Design Surface**
   A native creative surface for UI, layout, image composition, design nodes, and agent-controlled edits. This should not be iframe DOM mutation. The direction is a native design document engine, with OpenPencil as the approved reference/source.

5. **AIGC and Video Surface**
   Generation and editing are job-driven surfaces. Image/video generation, web animation rendering, and video editing use External Jobs plus a native timeline engine. OpenCut Classic is the approved reference/source for the video timeline direction.

The key point: these are separate surfaces, but not separate products. They share the same project, local files, Library, agents, permissions, timeline, and cost ledger.

## 3. Non-Goals

Do not build:

- a second session system
- a second permission system
- a second memory store
- a separate agent platform beside Craft
- a new UI shell before the Craft shell is stable
- a universal patch format that tries to edit code, design, documents, browser state, and video with one operation model
- a stealth browser, quota bypasser, anti-detection stack, or automatic account-rotation product
- a fake completed feature backed only by display UI, stubs, or hidden renderer state
- copied code from unapproved reference projects

The fastest way to ruin this product is to add broad-looking UI before the spine is real.

## 4. The Correct Unification Layer

Fleet should not unify every work surface through one universal `DesignPatch`.

The shared layer is:

- Craft session and `SessionEvent`
- permission and approval flow
- actor identity: user / agent / manager agent
- runtime identity: API / CLI / terminal / external job
- Internal Action Registry
- project files and Library assets
- timeline, evidence, rollback, and reports
- real / estimated / unknown usage and cost ledger

The surface-specific layer remains native:

| Surface | Native model |
|---|---|
| Code | files, diffs, commands, tests, git state |
| Terminal | PTY/runtime lane state |
| Browser | BrowserPane, CDP, screenshots, DOM/AX evidence |
| Documents | document/block model |
| Design canvas | design document tree, nodes, selection, history |
| AIGC | job inputs, outputs, provenance, cost |
| Video | media assets, tracks, clips, keyframes, render jobs |

The shared question is “who did what, was it allowed, where is the evidence, can it be undone?” The surface-specific question is “how does this surface edit its own native document?”

## 5. Agent-Native Control Model

Every serious capability must be usable by both the human UI and agents through the same structured action path.

The common verb set is:

- `read`: inspect the native structure
- `select`: create or update a selection
- `mutate`: apply a structured change
- `undo`: revert through the native history/rollback path
- `explain`: summarize what changed
- `handoff`: export or transfer the result to another surface

Examples:

- design: read nodes, select nodes, move/update/insert/delete nodes
- code: read symbols/files, apply diffs, run tests
- browser: select elements, capture screenshots, package evidence
- video: read tracks/clips, trim/split/reorder clips, render
- files: inspect, move, rename, delete with permission and undo

Human controls and agent tools must call the same underlying action. A button-only feature is incomplete. An agent-only tool that bypasses UI evidence is also incomplete.

## 6. First Development Spine

The first spine is not “build all surfaces.” It is the minimum product backbone that makes later surfaces real.

> **Phase → Wave cross-reference:** The phases below map to execution waves in
> `docs/WAVE-MODULE-MAP.md`. See the table at the end of this section for the full mapping.

### Phase 0: Clean Craft Baseline `[Wave 0 + U Track]`

Goal: Craft runs cleanly and remains recognizable.

Do:

- keep the Craft monorepo, Electron shell, renderer flow, settings storage, session manager, permissions, and BrowserPane
- remove or quarantine old experimental UI that does not support the new direction
- keep upstream sync possible
- verify install, typecheck, and basic Electron launch before feature migration

Do not:

- sync upstream on a dirty tree
- replace the shell
- add new top-level pages for every feature

Exit criteria: default Craft workbench is usable, and the repo has a known baseline state.

### Phase 1: Terminal and CLI Runtime Loop `[Wave 1]`

Goal: one real local runtime loop works end to end.

A valid loop is:

user intent -> UI selection of runtime -> backend handler -> runtime process/PTY -> streamed output -> session event -> visible timeline/output -> stop/error/report path

This is the first serious product loop because it turns Fleet from a chat surface into a local execution workbench.

Exit criteria: at least one CLI/runtime path is `usable`, not merely detected or displayed.

### Phase 2: Internal Action Spine `[Wave 0 → Wave 1]`

Goal: human UI and agents use the same action path for real project operations.

Start with narrow, useful actions:

- inspect files
- select files or objects
- edit/move/rename files with permission
- update progress
- record terminal/runtime events
- create evidence and reports

Exit criteria: a human action and an agent action both produce permissioned timeline events through the same registry path.

### Phase 3: Runtime Lanes and TeamRun `[Wave 0 → Wave 2]`

Goal: Fleet owns the team; a CLI owns one run.

Do not make “multi-agent” mean multiple chat bubbles. Use stable `AgentSeat`, runtime-specific `RuntimeLane`, and bounded `TeamRun` requests. A CLI leader may request a member run through Fleet Bridge, but it must not directly own the API teammate’s tools or bypass permissions.

Exit criteria: one leader runtime can request a bounded member task, receive a compressed report, and leave evidence in the shared timeline.

### Phase 4: Files and Library `[Wave 1]`

Goal: make the user’s workspace real inside Fleet.

There are two layers:

- **Files**: raw workspace files and folders
- **Library**: selected, indexed, licensed, reusable project assets

Agents may organize files only through permissioned actions. Library assets must track source, hash/version, license/provenance, and where they are used.

Exit criteria: files are visible, selectable, usable by agents, and write operations are permissioned and reversible.

### Phase 5: Browser and Artifact Workflow `[Wave 3]`

Goal: turn BrowserPane into the design/review entry point.

Build:

- Codex-style browser control settings
- element selection
- box selection
- multi-select
- annotation
- screenshot/evidence package
- Comment AI
- artifact handoff

Remote websites remain read/annotate/evidence surfaces. Editable artifacts must use a real artifact/design document model, not DOM mutation inside an iframe.

The browser settings model should be explicit and user-readable: browser enablement, local URL
open target, clear browser data, annotated screenshot inclusion, approval behavior, site-specific
permission overrides, and a separate high-risk developer toggle for full CDP access.

Exit criteria: selected web evidence can become agent context, timeline evidence, and an editable artifact handoff, while browser permissions and data controls remain visible in settings.

### Phase 6: Canvas, AIGC, and Video `[F Track + Wave 3]`

Goal: add the creative surfaces only after the spine works.

Design canvas uses a native design document model. AIGC uses External Jobs. Video uses a native timeline model. All three connect back to Library, permissions, and timeline.

Exit criteria for the first canvas slice: a human edits one design object, an agent edits one design object, both changes enter the same timeline, and both can be undone.

### Phase → Wave Reference Table

| Phase | Name | Wave / Track |
|---|---|---|
| Phase 0 | Clean Craft Baseline | Wave 0 + U Track |
| Phase 1 | Terminal and CLI Runtime Loop | Wave 1 |
| Phase 2 | Internal Action Spine | Wave 0 → Wave 1 |
| Phase 3 | Runtime Lanes and TeamRun | Wave 0 → Wave 2 |
| Phase 4 | Files and Library | Wave 1 |
| Phase 5 | Browser and Artifact Workflow | Wave 3 |
| Phase 6 | Canvas, AIGC, and Video | F Track + Wave 3 |

## 7. External Jobs

External work should be modeled once.

The same job system should cover:

- external AI review
- image generation
- image editing
- video generation
- web animation rendering
- video rendering
- deploy/publish
- artifact export

A job records:

- type
- inputs
- target runtime/provider/site
- permission level
- status
- outputs
- provenance
- cost/usage source
- evidence and rollback point where possible

This prevents “review center,” “generation center,” and “publish center” from becoming separate governance products.

## 8. Reference Project Policy

Reference projects are not the roadmap. They are source material for specific decisions.

Approved direct-source references:

- Craft Agents OSS: base application
- AionUi: ACP, CLI runtime, process lifecycle, team/agent patterns
- Open Design: design workflow, runtime definitions, prompt transport, artifact/eval patterns
- RTK: output compression and savings measurement
- Codegraph: local code graph and structured code query
- DeepSeek Reasonix: ACP/stdio and planner/executor ideas
- Deepcode CLI: skill paths, MCP, CLI/session management
- OpenPencil: design canvas/native design engine direction
- OpenCut Classic: video timeline/native video editing direction

Everything else remains black-box reference unless explicitly promoted.

## 9. Current App Reuse Policy

Do not start by asking “what can we keep?”

Start by asking:

1. Does this code support the product thesis?
2. Does it use Craft session, permission, timeline, settings, and renderer flow?
3. Does it complete a real user-visible loop?
4. Can both human UI and agents operate it through the same action path?
5. Can we verify it through real behavior?

Keep it if yes. Rewrite or discard it if no.

Current code should be treated as three categories:

- **baseline**: Craft code that remains the foundation
- **candidate asset**: Fleet additions that may be useful but need re-verification
- **legacy experiment**: display-only, stubbed, duplicated, or directionally wrong code

The next engineering pass should classify code against the development spine, not preserve it for sentimental reasons.

## 10. Quality Bar

A feature is `usable` only when it has:

- a real UI path
- a real backend path
- a real state/persistence path where needed
- permission and timeline behavior
- agent-native action access when it is writable
- error handling that tells the user what happened
- real behavior verification

Anything less is:

- `wired but not visually checked`
- `display-only`
- `not implemented`

“Tests pass” is not a product status.

## 11. Documentation Architecture For Parallel Development

The old corpus cannot remain as active execution material. It contains useful decisions, but it also contains reversals, stale states, parallel route proposals, and historical implementation claims. The active documentation must behave like a control plane for multiple agents.

Use this structure:

1. `DECISIONS-LEDGER.md`: final promoted decisions and reversals.
2. `OWNERSHIP-MATRIX.md`: package and contract ownership.
3. `WAVE-MODULE-MAP.md`: which modules can run in which wave.
4. `PARALLEL-AGENT-OPERATING-MODEL.md`: how Lead and workers coordinate.
5. `docs/modules/*.md`: one complete product loop per module.
6. `docs/agent-packets/*.md`: executable work packets for parallel agents.

The key change from the old docs is that a module document is not just a plan. It must be a complete frontend/backend/Agent/permission/timeline/validation loop that can be safely divided among agents.

## 12. Immediate Next Move

The next useful work is not another broad roadmap.

The next useful work is:

1. Finish the active English control-plane docs.
2. Write the first module specs only after the ownership and wave map are stable.
3. Create the Wave 0 agent packet for contract freeze and code classification.
4. Perform a code classification pass against this document:

   1. baseline Craft code
   2. candidate Fleet spine code
   3. legacy experiment code
   4. code to delete or quarantine

After that, implement the first complete loop: terminal/CLI runtime from UI to process to session timeline to visible output.
