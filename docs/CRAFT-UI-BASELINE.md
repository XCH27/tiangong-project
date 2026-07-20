# Craft UI baseline

> Read this before changing navigation, page chrome, list rows, menus, icons, spacing, typography,
> colors, hover states, or responsive behavior.

## Authority

Fleet extends Craft Agents v0.11.1. UI work starts from the matching upstream implementation at:

- `源码参考/software/craft-agents-oss` — pinned to official tag `v0.11.1`
- `源码参考/software/craft-agents-oss/README.md` — official build and product overview
- `源码参考/software/craft-agents-oss/CONTRIBUTING.md` — official development workflow
- `源码参考/software/craft-agents-oss/apps/electron/README.md` — Electron architecture and playground
- `源码参考/software/craft-agents-oss/apps/electron/src/renderer/playground/` — component examples
- `app/apps/electron/resources/docs/` — the bundled feature documentation shipped with the app
- `源码参考/craft-docs/online-current/customisation/` — mirrored official
  Colors, Icons, and Themes guidance; current-hosted reference that may be newer than v0.11.1

Official documentation explains customization, semantic colors, icon overrides, and theme structure,
but it is not a complete component/layout specification. For visual decisions, authority remains the
v0.11.1 code first, in this order:

1. The same upstream component or flow.
2. An existing shared component under `app/apps/electron/src/renderer/components/ui/` or `app/packages/ui/`.
3. Tokens and semantic colors in `app/apps/electron/src/renderer/index.css` and `app/packages/ui/src/styles/index.css`.
4. The mirrored official Colors, Icons, and Themes guidance for supported customization semantics.
5. A new local component only when the first four cannot express the required behavior.

Generic web design systems, screenshot approximations, and unrelated reference apps may explain a
behavior, but they do not override Craft's component language.

Owner-intent design notes live under `docs/design-library/`. Optional **UI component kits** and page
samples may live under the local untracked `UI参考/` cache (kits, tokens, icons and page showcases;
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

## Current intentional delta from upstream v0.11.1

As audited on 2026-07-12, the tracked application differs from the pinned upstream checkout only in:

- the required root `tsconfig.base.json` omitted by the upstream tag;
- the Pi adapter's verified `max → xhigh` saturation and its tests;
- a standalone primary Board navigation entry, with the former list/board toggle removed;
- a Board header that keeps the existing Project filter visible and aligns status control heights;
- What's New moved from the sidebar into the Debug submenu, with desktop/mobile wiring and tests;
- local `app/AGENTS.md` execution rules and targeted tests for the deltas above.

This list describes the last verified baseline, not the current dirty working tree — that tree is
being audited under [`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md), and this delta list
is updated as R0 lands features. Nothing is `usable` merely because it appears in a design or an
unverified working tree.

## Owner UI rules (binding)

Avoid unnecessary entities and settings. Simplify or improve the original Craft Agents interface
instead of inventing new surfaces. Exact owner wording is preserved once in
[`design-library/OWNER-VOICE.md`](design-library/OWNER-VOICE.md) as OV-002 and OV-003.

Operationally:

- Keep one primary home for each capability; do not repeat the same list or action in several places.
- One create verb: **New Task** (P10). Do not reintroduce separate "new chat" entries, and do not
  show workspace/folder/project as parallel switchers (P6) — overlapping controls merge per the R1
  dedup inventory.
- Prefer changing fields, grouping, wording, and progressive disclosure inside the existing Craft
  surface over adding a page, toolbar, sidebar, store, or settings category.
- Settings are for credentials, security/privacy, retention, connections, and rare preferences.
  Daily actions stay next to the work they affect.
- A visible control must have real behavior, loading/error/recovery states, and the same underlying
  authority as other callers. No display-only controls presented as usable.

## Icon rules

1. Reuse Craft's custom icon when one exists under
   `app/apps/electron/src/renderer/components/icons/` or `app/packages/ui/src/components/icons/`.
   Examples: `SquarePenRounded`, `PanelLeftRounded`, `McpIcon`, and status icons.
2. Otherwise use the already-installed `lucide-react` icon closest to the upstream meaning. Do not
   mix another outline library into the same navigation or control group.
3. Let the icon component own its stroke. Do not add arbitrary per-use `strokeWidth` values. An
   explicit stroke override is allowed only when matching the same upstream control.
4. Match the existing slot, not merely the SVG:
   - normal sidebar navigation icon: `h-3.5 w-3.5` (14 px);
   - compact row/action icon: `h-4 w-4` (16 px) inside a fixed 24 px action slot;
   - top-bar icon: copy the exact existing `TopBarButton` or `HeaderIconButton` pattern.
5. Icons inherit semantic foreground colors. Default icons use the existing foreground opacity;
   accent/info/success/destructive colors are reserved for real state, not decoration.
6. Sibling icons must share size, optical alignment, color, hover treatment, focus treatment, and
   reserved width. Long text truncates before the icon slot and never pushes or overlaps actions.
7. Do not hand-draw a new SVG when a Craft or Lucide icon already expresses the action.

## Component and layout rules

- Sidebar rows follow the upstream `LeftSidebar` baseline: 13 px text, 14 px leading icon,
  `rounded-md`/the existing radius, semantic foreground opacity, and the existing hover/selected state.
- Use shared menu, tooltip, popover, button, entity-row, and panel-header components. Do not recreate
  their padding, shadow, radius, animation, or keyboard behavior locally.
- Use the six-color Craft theme (`background`, `foreground`, `accent`, `info`, `success`,
  `destructive`) and derived tokens. Do not hard-code a parallel palette.
- Reserve fixed action columns before applying `truncate`; narrow widths remove text, not action
  affordances. Verify the same component at narrow and normal sidebar widths.
- Hover-only actions must remain keyboard reachable. Tooltips explain icon-only controls; they do
  not replace visible labels where the original Craft pattern uses text.

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
2. Compare the changed component with the same upstream v0.11.1 component, closest current sibling,
   and shared tokens. For copy/localization fixes, confirm the current shared path.
3. Check every icon in the changed group from component props/tokens for source, size, stroke, color,
   slot, hover, focus, and disabled state.
4. Render the changed state at the relevant view matrix. Compare anchor and result at the same
   viewport/theme/state; fix padding, type, color, radius, icon, focus and overflow differences not
   named in the intentional delta.
5. Preserve unrelated Craft behaviors such as context menus, relative time, labels, keyboard focus,
   drag/drop, and loading/error states unless the owner explicitly removes them.
6. Extend the existing playground registry for a new/reworked reusable component or state; do not
   fork a playground-only copy of production UI.

## Human acceptance

Agent visual comparison proves consistency, not taste. Give the owner the intentional delta and a
short CHECK THIS list. Promote a user-visible change to `usable` only after the owner accepts its
appearance and interaction; until then report `wired but not visually checked` (or `display-only`
when the real behavior is not connected).
