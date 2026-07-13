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

The official repository does not publish a separate visual style guide. For visual decisions, the
authority is therefore the v0.11.1 code itself, in this order:

1. The same upstream component or flow.
2. An existing shared component under `apps/electron/src/renderer/components/ui/` or `packages/ui/`.
3. Tokens and semantic colors in `apps/electron/src/renderer/index.css` and `packages/ui/src/styles/index.css`.
4. A new local component only when the first three cannot express the required behavior.

Generic web design systems, screenshot approximations, and unrelated reference apps may explain a
behavior, but they do not override Craft's component language.

Local Doubao and TRAE Work kits may exist at `源码参考/ui-kits/`. They are ignored reference-only
material: their root contains no clear redistribution license, so do not import their SVGs, markup,
CSS, or components into production. Use them only to study information hierarchy, density, and state
coverage after comparing the equivalent Craft surface.

## Current intentional delta from upstream v0.11.1

As audited on 2026-07-12, the tracked application differs from the pinned upstream checkout only in:

- the required root `tsconfig.base.json` omitted by the upstream tag;
- the Pi adapter's verified `max → xhigh` saturation and its tests;
- a standalone primary Board navigation entry, with the former list/board toggle removed;
- a Board header that keeps the existing Project filter visible and aligns status control heights;
- What's New moved from the sidebar into the Debug submenu, with desktop/mobile wiring and tests;
- local `app/AGENTS.md` execution rules and targeted tests for the deltas above.

Treat anything beyond this list as new work that requires its own comparison and coherent slice. The
current Project=Workspace, remote connection, label, archive, file-browser, and settings redesigns are
documents or recoverable WIP only; none is current application behavior.

## Owner rules recovered from the pre-reset documents

> 「对于界面安排应该做到如无必要，勿增实体。现在大部分Agent的软件的前端界面都非常的简约。也不会有过多的没必要的设置，这样才能适配大多数的用户。」

> 「我在UI上的很多设计都会选择在原版Craft Agents的基础上做简化或者做优化，而不是凭空增加。」

Operationally:

- Keep one primary home for each capability; do not repeat the same list or action in several places.
- Prefer changing fields, grouping, wording, and progressive disclosure inside the existing Craft
  surface over adding a page, toolbar, sidebar, store, or settings category.
- Settings are for credentials, security/privacy, retention, connections, and rare preferences.
  Daily actions stay next to the work they affect.
- A visible control must have real behavior, loading/error/recovery states, and the same underlying
  authority as other callers. No display-only controls presented as usable.

The historical full redline remains recoverable at
`git show ec499338d^:docs/00A-UI改造红线与挂点地图.md`. Its retired Wave/ownership language is not
current; the Craft reuse and UI placement rules above remain applicable.

## Icon rules

1. Reuse Craft's custom icon when one exists under
   `apps/electron/src/renderer/components/icons/` or `packages/ui/src/components/icons/`.
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

## Required UI review

Before declaring a UI slice usable:

1. Compare the changed component with the same upstream v0.11.1 component and current shared tokens.
2. Inspect every icon in the changed group for source, size, stroke, color, slot, hover, focus, and
   disabled state.
3. Inspect normal and narrow widths for truncation and action overlap.
4. Inspect the actual Electron surface in light and dark mode when the change affects colors.
5. Preserve unrelated Craft behaviors such as context menus, relative time, labels, keyboard focus,
   drag/drop, and loading/error states unless the owner explicitly removes them.
