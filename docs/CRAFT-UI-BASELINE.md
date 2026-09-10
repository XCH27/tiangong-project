# Craft UI baseline

> Read this before changing navigation, page chrome, list rows, menus, icons, spacing, typography,
> colors, hover states, or responsive behavior.

## Authority

Fleet's product and interaction baseline is Craft Agents v0.10.5. The current implementation tree
is v0.11.1-derived, so UI work compares both pinned snapshots (stored in `/Volumes/AIGC/天工参考/源码参考/`, symlinked locally via `源码参考/`) before editing:

- `源码参考/software/craft-agents-oss-v0.10.5` (`/Volumes/AIGC/天工参考/源码参考/software/craft-agents-oss-v0.10.5`) — product/interaction baseline, official tag `v0.10.5`
- `源码参考/software/craft-agents-oss` (`/Volumes/AIGC/天工参考/源码参考/software/craft-agents-oss`) — selective-update reference, official tag `v0.11.2`
- `源码参考/software/craft-agents-oss/README.md` — official build and product overview
- `源码参考/software/craft-agents-oss/CONTRIBUTING.md` — official development workflow
- `源码参考/software/craft-agents-oss/apps/electron/README.md` — Electron architecture and playground
- `源码参考/software/craft-agents-oss/apps/electron/src/renderer/playground/` — component examples
- `app/apps/electron/resources/docs/` — the bundled feature documentation shipped with the app
- `源码参考/craft-docs/online-current/customisation/` — mirrored official
  Colors, Icons, and Themes guidance; current-hosted reference that may be newer than v0.11.2

Official documentation explains customization, semantic colors, icon overrides, and theme structure,
but it is not a complete component/layout specification. For visual decisions, authority remains the
v0.10.5 interaction code first, in this order:

1. The same v0.10.5 component or flow for product structure and interaction.
2. The v0.11.2 counterpart to identify an independent fix or bounded backend improvement.
3. The current component and existing shared primitives under `app/`.
4. Current tokens and semantic colors plus mirrored official customization guidance.
5. A new local component only when the first four cannot express the required behavior.

Generic web design systems, screenshot approximations, and unrelated reference apps may explain a
behavior, but they do not override Craft's component language.

Owner-intent design notes live under `docs/design-library/`. Optional **UI component kits** and page
samples live under `/Volumes/AIGC/天工参考/UI参考/` (symlinked locally as `UI参考/`; contains Doubao, Trae Work, UI designs, and screenshots;
not product authority or a build input). When present, start at its local index, then the kit's own `README.md` / `SKILL.md` /
`colors_and_type.css`. Neither overrides Craft components, tokens, or this baseline. Do not import
unlicensed third-party SVGs, CSS, or components into production.

## Frontend Goal contract (kept in Goal/thread state)

Before changing layout, styling, navigation, or a reusable component, lock these fields; do not
create a separate design document:

- **Visual anchor:** the exact upstream/current component, sibling flow, or playground fixture that
  defines the language. A new surface names an existing shell/page anchor plus reused primitives.
- **Intentional delta:** one sentence describing what may look or behave different. Everything else
  is preserved by default.
- **Reuse map:** shared components, semantic tokens, icon source, typography and interaction pattern.
- **State matrix:** applicable default/loading/empty/error/denied/offline/recovery states.
- **View matrix:** primary width/theme plus any affected narrow, light/dark, zh-Hans/en, hover,
  focus, disabled and reduced-motion variants.
- **Forbidden drift:** new palette, icon family, page/toolbar/settings home, locally recreated
  primitive, or unrelated restyling unless the Goal explicitly authorizes it.

If no concrete visual anchor can be named, the Agent may inspect and propose options but must not
invent and ship a new visual language. Temporary captures stay outside the product tree unless the
owner explicitly asks to retain them.

## Current convergence delta

The committed app is v0.11.1-derived and the unaccepted R0/R1 candidate tree contains later
Projects/Board interaction. R1 must compare it with v0.10.5 and classify each affected path as
KEEP, RESHAPE, REMOVE or LATER. Previously recorded deltas include:

- the required root `tsconfig.base.json` omitted by the upstream tag;
- the Pi adapter's verified `max → xhigh` saturation and its tests;
- a standalone primary Board navigation entry — **REMOVED 2026-07-24.** The sidebar item and its
  `kanban/sidebar-navigation.ts` helper are gone; the Kanban page stays reachable only from a task
  orchestrator session's "Edit task" action. Project/Task coupling remains unclassified and is still
  a candidate for REMOVE or LATER, not an accepted product delta;
- **Fleet delta, kept:** a Projects sidebar section whose rows expand to their sessions and carry a
  "+" create action (P6/P10). The action calls `routes.action.newSession({ project })` — the same
  Session path as the global New Task button. `ProjectInfoPage` correspondingly no longer has a
  Sessions tab (R1 §1/§4);
- What's New moved from the sidebar into the Debug submenu, with desktop/mobile wiring and tests;
- local `app/AGENTS.md` execution rules and targeted tests for the deltas above.

This list describes the last verified baseline, not the current dirty working tree — that tree is
being audited under [`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md), and this delta list
is updated as R0 lands features. Nothing is `usable` merely because it appears in a design or an
unverified working tree.

## Simplification is convergence, never deletion (binding)

The owner's repeated finding (2026-07-24, restated 2026-07-25): agents asked to "simplify" have
**deleted whole pages and features**, while the **small necessary buttons and affordances were not
preserved** — or were silently moved. The combined effect is that *no baseline can be established*:
after such a change you can no longer tell whether the current shape is an acceptable starting
point, because capability and position both moved at once.

Before removing anything user-visible, classify it:

| Class | Example | Rule |
|---|---|---|
| **Duplicate home** | the same capability with two permanent entry points | the only legitimate removal target — merge into one home |
| **Scope or filtered state** | Projects, Conversations, per-status views, Flagged, Archived, the label tree | **keep.** Projects and Conversations are the two honest folder-bound/folder-less scopes; the others add predicates to the same list implementation. A third All Sessions aggregate is a duplicate home and is removed by P10 |
| **Small affordance** | inline row buttons, context-menu items, quick entries | **keep by default.** If one genuinely must move, list `old location → new location` explicitly in the handoff |

Two hard requirements:

1. **Check upstream first.** Before deleting a user-visible control, confirm whether
   `源码参考/software/craft-agents-oss-v0.10.5/` has it and what it looks like. Absent there = a
   Fleet/v0.11 addition and a candidate for removal. Present there = it is baseline, and removing it
   needs an explicit owner decision.
2. **Never move and remove in the same breath.** A change may relocate a control or delete a
   duplicate home — doing both at once destroys the comparison the owner needs to accept the result.

Worked examples are the ✅/❌ pairs in
[`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md) §Binding interaction contract.

## Owner UI rules (binding)

Avoid unnecessary entities and settings. Simplify or improve the original Craft Agents interface
instead of inventing new surfaces. Exact owner wording is preserved once in
[`design-library/OWNER-VOICE.md`](design-library/OWNER-VOICE.md) as OV-002 and OV-003.

Operationally:

- Keep one primary home for each capability; a Session appears once under its Project or in the
  sibling Conversations scope. Search, labels and archive are filtered states, not additional
  homes.
- One create flow: **New Task** (P10), triggered globally or from a Project row. It uses the existing
  Session path in R1 and does not require a v0.11 Task/Board record. Do not show workspace/folder/
  project as parallel switchers (P6).
- Label definitions live in Settings; assignment stays in the Session menu. Project home owns
  documents/assets/settings and never repeats the Session list. Archive and Restore remain reachable.
- Prefer changing fields, grouping, wording, and progressive disclosure inside the existing Craft
  surface over adding a page, toolbar, sidebar, store, or settings category.
- Settings are for credentials, security/privacy, retention, connections, and rare preferences.
  Daily actions stay next to the work they affect.
- A visible control must have real behavior, loading/error/recovery states, and the same underlying
  authority as other callers. No display-only controls presented as usable.

## Rendered values live in UI-SPEC

Every **numeric or enumerable** visual rule — type scale, foreground opacity ladder, icon sources and
slot sizes, radius, elevation, spacing grid, the measured sidebar-row spec, the shared-primitive
list, motion durations, required states, and the file-level forbidden-drift list — is owned by
[`UI-SPEC.md`](UI-SPEC.md) and lives there only. Read it before writing UI code and run its §12
self-check against your diff.

This file keeps the parts that are judgment, not values: which component to start from, what the
intentional delta is, and how the change is reviewed and accepted.

Two rules stay here because they are about *choosing*, not measuring:

- Reuse Craft's custom icon when one exists (`components/icons/`, `packages/ui/src/components/icons/`
  — `SquarePenRounded`, `PanelLeftRounded`, `McpIcon`, status icons) before reaching for
  `lucide-react`; never hand-draw an SVG for an action either already expresses.
- Hover-only actions must remain keyboard reachable. Tooltips explain icon-only controls; they do not
  replace visible labels where the original Craft pattern uses text.

## Localization rules

- Every user-visible fixed label, description, empty/error state, menu heading, and action must use
  the existing i18n catalog. Do not ship English fallback text as normal UI in a translated locale.
- Built-in dynamic values (for example the default session statuses and untouched starter labels)
  are product copy and must resolve through i18n at render time. Keep their stored IDs and names
  stable. User-created or renamed labels/statuses, project names, and other user content remain
  verbatim.
- Preserve proper names and literal interface tokens: product/platform names, theme names such as
  Catppuccin and Dracula, API identifiers, file paths, commands, and physical key labels such as
  Enter. Translate the surrounding explanation, not the identifier itself.
- When adding or changing a user-facing field, update every locale key in the same slice and run the
  i18n parity/coverage checks. Give the owner the affected locale/English surfaces to inspect.

## Agent implementation review

For structural/styling changes, Agents apply the code checks and perform a deterministic rendered
comparison before handoff. The existing playground is the preferred isolated surface; use the real
local app when the state cannot be represented honestly in the playground. Copy-only changes may use
the existing component path plus locale tests when layout is unaffected.

1. Capture or inspect the declared visual anchor before editing; record the intentional delta in the
   Goal/thread state.
2. Compare the changed component with v0.10.5, its v0.11.2 counterpart, the current sibling and
   shared tokens. Name any retained later-upstream behavior and why it passes P2.
3. Check every icon in the changed group from component props/tokens for source, size, stroke, color,
   slot, hover, focus, and disabled state.
4. Run `cd app && bun run lint:ui-contract`; direct Radix imports from product surfaces and
   off-contract added values must be removed before rendering.
5. Render the changed state at the relevant view matrix. Compare anchor and result at the same
   viewport/theme/state; fix padding, type, color, radius, icon, focus and overflow differences not
   named in the intentional delta.
6. Preserve unrelated Craft behaviors such as context menus, relative time, labels, keyboard focus,
   drag/drop, and loading/error states unless the owner explicitly removes them.
7. Extend the existing playground registry for a new/reworked reusable component or state; do not
   fork a playground-only copy of production UI.

## Human acceptance

Agent visual comparison proves consistency, not taste. Give the owner the intentional delta and a
short CHECK THIS list. Promote a user-visible change to `usable` only after the owner accepts its
appearance and interaction; until then report `wired but not visually checked` (or `display-only`
when the real behavior is not connected).
