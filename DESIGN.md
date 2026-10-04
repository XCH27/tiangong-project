# DESIGN — visual style, layout and interaction

Fleet requires one coherent visual language. The numeric tables below record the retained
Craft look pin; the active ZCode candidate preserves its own original primitives and tokens in
bounded corrections. They are different source scopes, not permission to mix arbitrary values.
A future unified visual-system change needs its own reviewed mapping and rendered acceptance.
ZCode supplies the selected conversation/settings reconstruction flow; Craft preserves valuable
Agent interaction; Cindy supplies named source comparisons. [Engineering](docs/engineering.md#component-development)
owns implementation, and each module owns its feature interaction.

For `app/`, compare rolling Craft and use the look pin to verify values. For `.fleet/zcode`,
compare the pinned ZCode component, the [candidate design guide](.fleet/zcode/DESIGN.md),
and its existing `styles.css`/shared controls. Root product and scope decisions take precedence.
The tables do not claim every candidate or v0.13.4 value was remeasured. Do not port an older
component tree or replace an already-working control simply to match a different host's class name.

Candidate Model Settings follows ZCode’s own `StatusCards` and Button typography: account/provider
titles use `text-ui-lg` and semibold; primary labels, quota text and action/state text use
`text-ui-base`; reset timestamps remain `text-ui-sm`. These follow the user’s UI font-size token
(default 14px), not a second size scale. Page headings retain the original responsive classes.
Desktop zoom is a separate preference; restore temporary QA zoom before presenting a comparison.

## Plugin UI contract

OV-026 requires Agent-authored plugins to belong to the same product. This is a proposed extension
contract, not an implemented UI kit. Runtime/authoring ownership is in
[`components.md`](docs/modules/components.md#agent-authored-native-plugins).

- The host renders navigation entries, panel headers, settings frames, permission prompts and
  failure/recovery controls. Plugins supply identities, content and operations, not replacement chrome.
- Standard settings, tables, lists, forms and result cards use versioned shared components/patterns.
  Agent scaffolds include the real imports, schemas and examples. Reuse existing primitives first;
  do not create a general page-description language before a concrete consumer requires it.
- Custom board/editor/canvas bodies use a packaged isolated view with the same SDK primitives and
  semantic tokens. Publish theme, typography, spacing, radius, elevation, icons, density, locale,
  reduced-motion and viewport context; subscribe to changes and reapply after reload/reparent.
- Check normal/loading/empty/denied/error/stale/disabled states, keyboard navigation, accessible
  labels, focus restore, narrow widths and light/dark plus English/Chinese. Missing capabilities
  have a named recovery action rather than a dead button or another settings home.
- Validate imports/API versions, token use and prohibited host/private-API access at package time.
  Test context binding and state transitions at runtime. Custom CSS can defeat token conventions:
  passing a linter is not proof of appearance or accessibility. Host-rendered standard controls give
  stronger consistency; custom domain bodies still require rendered checks and owner acceptance.
- Domain-engine drawing coordinates/colors can be content, not UI tokens. Keep those inside the
  declared editor surface; do not ban image colors or canvas dimensions to enforce shell styling.

## 0. Why this file exists

An agent asked to change UI previously had no numeric anchor — only the instruction "compare with
v0.10.5", whose `AppShell.tsx` is 3,565 lines. Unable to read the anchor, agents invented values.
Observed drift that this file exists to make impossible:

| Drifted value | Why it is wrong |
|---|---|
| `text-foreground/32`, `/38`, `/48`, `/[0.055]` | absent from both snapshots; the ladder is §3 |
| `rounded-[22px]` | absent from both snapshots; the preferred scale tops out at `rounded-[12px]` and the inherited tail is a closed list (§5) |
| `shadow-[0_18px_50px_rgba(0,0,0,0.07)]` | shadows come from the enforced allowlist (§6); arbitrary shadows are forbidden |
| `strokeWidth={1.9}` | icons own their stroke (§4) |
| `h-3.5 w-3.5` icon in an `h-5 w-5` slot | row action slot is 24 px (§4) |
| 28 px centered hero title | no surface in either snapshot uses a hero (§9) |

## 1. Foundations

| Token | Value | Note |
|---|---|---|
| `--font-size-base` | `15px` | body default |
| `--font-sans` | `system-ui, -apple-system, BlinkMacSystemFont, …` | Inter only where a theme overrides it |
| `--font-mono` / `--font-serif` | `"JetBrains Mono", ui-monospace, …` | code and monospace only |
| `--spacing` | `0.25rem` (4 px) | use the 4 px grid and the exact half-step/component exceptions in §7–§8 |
| `--radius` | `0rem` | the base token is 0; concrete radii come from §5 |

The theme has exactly six base colors — `background`, `foreground`, `accent`, `info`, `success`,
`destructive` — plus derived tokens. Do not introduce a seventh.

Semantic reservation: `accent` = brand / Auto mode. `info` = warning / Ask mode. `success` =
connected / confirmed. `destructive` = error / failed. **These four are reserved for real state.**
Decoration uses `foreground` at an opacity from §3.

## 2. Typography scale

Normative. `text-sm` and `text-xs` are the default choices; pixel escapes exist for dense chrome.

| Class | Size | Used for |
|---|---|---|
| `text-sm` | 14 px | body text, message content, form fields, most page copy |
| `text-xs` | 12 px | secondary metadata, badges, trailing counts, timestamps |
| `text-[13px]` | 13 px | sidebar rows, menu items, compact list rows |
| `text-[11px]` | 11 px | dense chrome, status pills, keyboard hints |
| `text-[10px]` | 10 px | smallest legible chrome; avoid for anything the user must read |
| `text-lg` | 18 px | page/section titles |
| `text-base` | 16 px | rare; only where a v0.10.5 component already uses it |

**Not permitted:** `text-xl` / `text-2xl` / `text-3xl` and any `text-[Npx]` not listed above, unless
the exact value already exists in the v0.10.5 component you are modifying. There is no display or
hero type size — see §9.

## 3. Foreground opacity ladder

The ladder is defined once, in CSS, as the `--foreground-*` variables:

```
2 · 3 · 5 · 10 · 20 · 30 · 40 · 50 · 60 · 70 · 80 · 90 · 95
```

| Step | Use |
|---|---|
| `/2` `/3` `/5` | surface fills, hover backgrounds, subtle separators |
| `/10` `/20` | borders, dividers, disabled fills |
| `/30` `/40` | trailing counts, placeholder text, decorative icons |
| `/50` `/60` | secondary text, inactive icons (`muted-foreground` = `--foreground-50`) |
| `/70` `/80` `/90` | primary-adjacent text; full `foreground` for primary |

Two forms exist and are not interchangeable:

- `text-foreground/50` — alpha compositing; use for **text and icons**.
- `var(--foreground-50)` — solid `color-mix` toward background; use where a **solid** fill is
  required (over images, in shadows, where stacking would compound alpha).

**Honest state of the baseline.** v0.10.5 itself also contains a thin unsystematized tail —
`/6 /7 /8 /12 /15 /25 /35 /45 /55 /65 /75 /85` — each appearing 1–11 times against 190 uses of `/5`
and 131 of `/50`. That tail is history, not license. Rule: **new code uses ladder steps only.** When
you edit a line that already carries a tail value for another reason, move it to the nearest ladder
step. Values absent from both snapshots — `/32`, `/38`, `/48` — are never acceptable.

The bracket form `foreground/[0.0N]` is the fill equivalent of a ladder step. Four are established in
the baseline and are the only ones permitted:

| Bracket | Equivalent | Established use |
|---|---|---|
| `[0.02]` | `/2` | faintest surface fill |
| `[0.03]` | `/3` | subtle fill |
| `[0.05]` | `/5` | hover fill — used by the `EntityListEmptyScreen` / `SurfaceState` action button |
| `[0.07]` | — | the selected sidebar row (`SidebarButton` `variant: 'default'`) |

Do not invent new bracket values such as `[0.055]` or `[0.08]`.

## 4. Icons

Source order: Craft custom icon (`components/icons/`, `packages/ui/src/components/icons/`) →
`lucide-react` → nothing else. Do not mix a third outline family into one control group.

| Slot | Icon size | Container | Where |
|---|---|---|---|
| Sidebar row | `h-3.5 w-3.5` (14 px) | inline, `shrink-0` | `LeftSidebar` rows, menu items |
| Row action | `h-4 w-4` (16 px) | fixed **24 px** (`h-6 w-6`) | hover actions in list rows |
| Top bar | `h-4 w-4` (16 px) | existing `TopBarButton` / `HeaderIconButton` | shell chrome |
| Inline marker | `h-3 w-3` (12 px) | inline | badges, status dots, inline affordances |
| Surface state | 40 px (`size-10`, `stroke-[1.5]`) | `<EmptyMedia variant="icon">` | empty/error/denied/offline/recovery only — the size and stroke come from the component; do not set them |

Rules:

1. **The icon component owns its stroke.** Never write a per-use `strokeWidth`. The only exception
   is matching an identical upstream control, and it must be the same literal value that control uses.
2. Sibling icons in one group share size, optical alignment, color, hover, focus, and reserved width.
3. Icons inherit semantic foreground color. Reserve `accent`/`info`/`success`/`destructive` for real
   state, never decoration.
4. Reserve the action column's fixed width **before** applying `truncate`. Text truncates; actions
   never shift, wrap, or get overlapped.
5. Do not hand-draw an SVG when a Craft or Lucide icon expresses the action.

## 5. Radius

| Class | Use |
|---|---|
| `rounded-[4px]` | badges, small chips, inline markers |
| `rounded-[6px]` | **sidebar rows, menu items, small buttons** (the workhorse) |
| `rounded-md` / `rounded-[8px]` | buttons, inputs, popover items |
| `rounded-lg` / `rounded-[10px]` | cards, panels, dialogs |
| `rounded-[12px]` | largest permitted container radius |
| `rounded-full` | avatars, status dots, pills only |

The table is the preferred scale for **new** work. The pinned v0.10.5 baseline itself carries an
inherited tail above it — 23× `rounded-xl`, 7× `rounded-2xl`, plus `rounded-[14px]`,
`rounded-[16px]`, `rounded-[20px]` and `rounded-[36px]` — including production components retained
in the current tree (`ContentFrame`, `DocumentFormattedMarkdownOverlay`, `UserMessageBubble`,
`SessionInfoPopover`, the `App.tsx` error card). Reuse in matching contexts is fine; do not add new
values. (This section previously banned that tail outright, which contradicted the measured
baseline — corrected 2026-07-26, the same defect class as the §6 correction.)

**Not permitted in new work:** `rounded-xl` / `rounded-2xl` and any `rounded-[Npx]` above 12 px,
unless the exact value already exists in the v0.10.5 component you are modifying.

## 6. Elevation

The named shadow utilities are the only elevation vocabulary. The enforced allowlist is the
`allowedClasses` option of `craft-styles/no-nonstandard-shadows` (a build-blocking error) in **two**
configs kept identical: `app/apps/electron/eslint.config.mjs` and `app/packages/ui/eslint.config.mjs`.
(The rule implementation exists as byte-identical copies under each package's `eslint-rules/`; its
built-in defaults are overridden by those options, so the configs are the authority, not the rule
file.) Prefer these three for new work:

| Token | Use |
|---|---|
| `--shadow-minimal` | resting elevation for buttons and small surfaces |
| `--shadow-minimal-flat` | same weight without the vertical offset |
| `--shadow-modal-small` | dialogs, popovers, floating panels |

The table names CSS variables. `shadow-minimal` and `shadow-modal-small` also exist as allowlisted
utility classes; `--shadow-minimal-flat` does **not** — it is applied only through a variable remap
(e.g. `PanelSlot`'s `'--shadow-minimal': 'var(--shadow-minimal-flat)'`), and writing
`shadow-minimal-flat` as a className trips the lint.

The remaining allowlisted utilities (`shadow-none/-xs/-thin/-middle/-strong/-tinted/-bottom-border/
-bottom-border-thin/-panel-focused`) are inherited Craft tokens that existing surfaces already use —
reuse in matching contexts is fine; do not add new names. (This section previously claimed "exactly
three tokens exist", which contradicted the enforced rule — corrected 2026-07-26.)

**Arbitrary `shadow-[…]` values and inline `boxShadow` are forbidden.** If a surface needs elevation
the allowlist does not express, that is a design question for the owner, not a local override.

## 7. Spacing

4 px grid. Dominant values, in order of frequency — prefer them before anything else:

- Horizontal padding: `px-2` (8) · `px-3` (12) · `px-4` (16)
- Vertical padding: `py-1` (4) · `py-1.5` (6) · `py-2` (8) · `py-2.5` (10) · `py-3` (12)
- Gaps: `gap-1` (4) · `gap-1.5` (6) · `gap-2` (8) · `gap-3` (12)

Sub-grid pixel values (`py-[3px]`, `py-[5px]`) exist only where a listed component spec (§8) uses
them for row density. Do not invent new ones.

## 8. Component specs (measured, binding)

### Sidebar row — `LeftSidebar` `SidebarButton`

```
container   flex w-full items-center gap-2 rounded-[6px] text-[13px] select-none outline-none
padding     px-2 · normal py-[5px] · compact py-[3px]
icon slot   h-3.5 w-3.5 shrink-0
selected    bg-foreground/[0.07]
trailing    text-xs text-foreground/30, revealed on group-hover/section
transitions opacity duration-150 · transform duration-200
```

A row action added to this component is a **sibling overlay**, never a nested `<button>` inside the
row button (nested interactive elements break keyboard and hit-testing). It occupies the 24 px slot
from §4 and stays keyboard reachable when hover-revealed.

**At-rest visibility of trailing elements (policy).** All trailing elements on a sidebar level
(counts, after-title meta, row actions) share one at-rest visibility language. The baseline is
**hover-reveal**, as measured above and **owner-confirmed 2026-07-26**
([`decisions.md`](docs/decisions.md) G7). Switching any element to always-visible reopens G7 as a
single owner decision applied to the whole level, never a per-control fork.

### Menu / popover / tooltip / dialog / entity row / panel header

Use the shared components. Do not locally recreate their padding, shadow, radius, animation, or
keyboard behavior:

`components/ui/dropdown-menu` · `context-menu` · `popover` · `dialog` · `drawer` · `entity-row` ·
`entity-list` · `entity-panel` · `button` · `badge` · `input` · `select` ·
`components/app-shell/PanelHeader` · `SidebarMenu`

### Model connection and tokenized model field

- The active candidate manages model services/accounts in the existing provider list and detail
  form. Do not rename or regroup it from the retained Craft tokenized-field experiment below.
- Add/edit expands in the existing page. A menu owns provider choice; the form is not placed inside
  that menu and does not navigate to onboarding.
- Where a retained tokenized model field exists, chips render before the text caret. Search and custom-ID
  creation use that same text value. A second search field, a chip row below the input, or an
  internal `pi/` display prefix fails the component contract.
- Chips are buttons with an accessible remove name, Backspace/Delete behavior and visible
  `focus-visible` state. Enter selects a highlighted known result; custom creation requires a
  labelled result/action so Enter never ambiguously saves the surrounding form.
- Provider icons come from one admitted icon projection. A missing brand uses the shared generic
  model/provider icon; it never introduces a one-off glyph or hand-drawn SVG.
  In the ZCode candidate, `ProviderLogo` maps existing asset keys to pinned Lobe Icons
  static SVGs, bundled locally. Preserve each caller's icon slot and semantic foreground;
  brand color variants may retain their supplied fills. Action icons remain Lucide.

### Candidate component-library boundary

The current candidate keeps `packages/ui/components.json` (shadcn radix-mira), the existing
`components/ui` wrappers and `styles.css` tokens. New pages compose these controls rather than
importing another general-purpose library or copying preview HTML. Lucide owns action icons;
`ProviderLogo` owns Lobe brand assets. Compact provider catalog cards use a shared-size neutral
backplate; supplied brand colors remain intact. Subscription/API choice uses the existing
`SettingsSegmentedTabs`; credentials and manual models use the same `ProviderDraft*` row controls.
Keep button roles, keyboard confirmation, persistent removal, busy/failed/saved states and spacing
consistent at the shared component, not separately in every caller. The
[TraeWork/open-source comparison](docs/references.md#shared-ui-library-comparison) supplies source
and licensing evidence; TraeWork is an organizational reference, not a replacement theme.

OV-049/057/058 keep ZCode's Usage summary → heatmap → trend → model-chart hierarchy.
Tokens and cache remain in the model card. One API-equivalent Cost section uses the same
range, groups positive priced requests by model or project, and segments bars by recorded
request source with the original Token-meter tones. Unpriced and zero requests remain in
coverage and model usage rather than empty monetary bars. The source legend sits below the
bars; Activity shares model focus without repeating the cache metric. Saved historical
payments are compatibility data, not a visible cost chart or an inferred invoice.

### Model picker, reasoning and runtime modes

- Desktop popover and compact drawer share `ModelPickerList` data, grouping, ordering, search and
  selection semantics. Container placement may change; information hierarchy may not.
- Model detail is a compact two-column list: `Model`, `Provider/runtime`, `Input`, `Reasoning`,
  `Context`. Values align right, truncate safely and use `—` for unknown. The list does not replace
  unknown with zero or infer support from a model name.
- Reasoning effort and runtime speed are separate fields in state/request data. The candidate
  combines model selection and exact effort rows in one composer entry (OV-074). OV-075 places
  Fast, Effort and Model in compact rows. Context appears only for evidenced executable choices and uses the same submenu/radio treatment;
  fixed capacity is inspectable in the original Token ring before first inference. Effort and Model open
  submenus; the composer menu has no Model Settings link. Fast uses the existing switch style. Insufficient width uses the original Brain icon with a short
  hint and full accessible name, driven by the existing toolbar fit owner. The Fast hint describes
  the selected model/connection's sourced allowance or API-rate impact. Speed never becomes
  a reasoning tier or a universal price multiplier.
- More than 50 model rows require windowing or an equivalent measured bound. Search remains visible
  while the result list scrolls.

### Context indicator, quota bars and turn footer

- The composer owns one compact context indicator. Its detail owns one primary context bar;
  authenticated subscription windows follow the current model’s last served account (OV-061),
  with the unsent default marked provisional. No independent account picker is added. There are
  no Settings/Usage page links in this detail; multiple decorative rings or persistent
  zero-value quota tracks are forbidden.
- Counts and shares for one category occupy one row. All numbers use tabular figures and locale
  formatting; percent bars expose their label/value to assistive technology.
- Candidate allowance meters reuse ZCode's `PlanUsageMetricCard`: 6px rounded bars, a visible
  `secondary` full-width track and the original `usage-chart` window palette in Settings and the composer.
- A turn footer may rest at `opacity-0`, but `group-hover`, `group-focus-within` and an explicit
  touch/coarse-pointer reveal path are all required. Hover-only metadata or actions fail review.
  Icon-only copy/revert controls require `aria-label`, tooltip/title and visible focus state.
- “Revert conversation” and “restore files” are distinct verbs and icons. A transcript-only action
  must not use copy that promises workspace recovery.

### Inline/menu versus dialog/system surface

Use inline expansion or a menu for reversible selection and compact editing. Use the existing
dialog/drawer/system surface for OAuth browser handoff, the OS folder picker, destructive
confirmation, credential recovery and conflict-heavy restore. “No modal” is not a reason to hide a
multi-step form inside an oversized dropdown; “use a dialog” is not a reason to navigate away from
ordinary connection editing.

## 9. Composition rules

- **No hero.** No surface in either pinned snapshot uses a centered oversized title, a decorative
  icon badge, or a marketing-style introduction. Creation and configuration surfaces are dense forms
  that start at the top-left. This is also binding as
  [`modules/shell.md`](docs/modules/shell.md) §8.
- **Progressive disclosure over new surfaces.** Prefer changing fields, grouping, wording, and
  disclosure inside the existing surface over adding a page, toolbar, sidebar, or settings category.
- **Density is the default.** This is a workbench, not a landing page. Whitespace communicates
  grouping, not importance.
- **A visible control has real behavior.** Loading/error/recovery states and the same underlying
  authority as every other caller. See §10.
- **Motion is functional.** `duration-150` for opacity, `duration-200` for transform. No decorative page/list entrance
  animations; shared occasional overlay transitions follow the motion specification. No parallax, no spring physics. Respect `prefers-reduced-motion`. The decidable
  rest — the frequency test that decides *whether* to animate at all, the easing curves, the
  per-surface durations, and the anti-patterns — is
  [`DESIGN.md`](#motion). Two durations and no curve was
  not enough to decide with, so every surface needing a third case invented one.

## 10. Required states

Use the states relevant to the real interaction; do not add empty/loading/offline machinery to
static controls or expose implementation notes merely to satisfy a generic checklist.

Every surface ships the applicable states from
[`capabilities.md`](docs/capabilities.md#page-structure) §4 using the shared components:

| State | Component | Rule |
|---|---|---|
| loading | existing skeleton/`LoadingIndicator` | never a bare spinner on a full page |
| empty | `components/ui/empty`, `entity-list-empty` | must state the next action in plain language |
| error | `ErrorState` | what happened + what to do; no stack dumps |
| denied | `DeniedState` | the permission truth, never a blank surface |
| offline / unavailable | `OfflineState` | honest service class (Decision P8) |
| recovery | `RecoveryState` | only what can actually be recovered (Decision S5) |
| narrow | — | truncate text before losing an action affordance |
| zh-Hans + en | i18n catalog | no English fallback shipped as normal UI in a translated locale |

## 11. Forbidden drift (file-level)

### 11.0 Reference workflows are not frozen screenshots

“One design language” does not mean preserving the current component tree. A reference such as
OpenCode Desktop may justify removing, regrouping, or replacing an interaction when it produces a
shorter and more coherent workflow. What remains fixed is the rendering grammar: Fleet/Craft type,
spacing, color, icon slots, radii, elevation, focus behavior, and shared overlay primitives. The
same capability must also share one data projection across desktop and compact containers; a
popover and drawer may differ in placement, but not in information hierarchy or selection rules.

Unless the owner's Goal explicitly authorizes it, a UI change may not:

1. add a color outside the six-color theme, or an opacity outside the §3 ladder;
2. add a font family, a type size outside §2, or a radius/shadow outside §5/§6;
3. write a per-use `strokeWidth`, or mix a third icon family into one control group;
4. locally recreate a shared primitive listed in §8;
5. add a hero, a marketing surface, or an entrance animation;
6. add a page, toolbar, sidebar section, or settings category when an existing surface can host it
   (owner UI rules; Decision P5);
7. change navigation structure, the default surface set, or which capability is primary — those are
   owner decisions recorded in [`decisions.md`](docs/decisions.md), not implementation choices;
8. ship a control whose behavior is not connected, outside the preview-gated frontend track
   (Decision G6).

## 12. Self-check before handoff

Run the repository guard against staged, unstaged, and untracked renderer additions:

```bash
cd app && bun run lint:ui-contract
```

**Current limitation:** the owner-requested original-source restoration removed `lint:ui-contract`; no current guard or fixture pass is claimed.
Any approved replacement must exercise staged, unstaged and untracked additions. The required guard covers
opacity, type, radius, elevation and icons. Recheck current Electron ESLint before claiming it also
rejects direct Radix imports from product surfaces: menus, dialogs, popovers, tooltips, and selects
must enter through `components/ui`, so a caller cannot silently create a second interaction
primitive. The underlying checks are equivalent to:

```bash
git diff -U0 | grep -E '^\+' | grep -oE 'foreground/(\[[0-9.]+\]|[0-9]+)' | sort -u | grep -vE '/(2|3|5|10|20|30|40|50|60|70|80|90|95)$' | grep -vE '/\[0\.0(2|3|5|7)\]$'
```

```bash
git diff -U0 | grep -E '^\+' | grep -nE 'shadow-\[|rounded-(xl|2xl|3xl)|text-(xl|2xl|3xl)|rounded-\[(1[3-9]|[2-9][0-9])px\]|strokeWidth=|text-\[(1[6-9]|[2-9][0-9])(\.[0-9]+)?px\]'
```

The repository guard must pass, or every exception must be an owner-approved intentional delta
encoded in the shared primitive or token authority rather than waived at an individual caller.

## Motion

> **Scope:** what moves, for how long, on which curve. [`DESIGN.md`](DESIGN.md) §9 still owns
> the composition rules; this file expands its one motion bullet into the decidable values, the same
> way UI-SPEC §1–§8 expanded "compare with v0.10.5" into numbers.
>
> **Provenance:** the frequency framework and easing rules come from Emil Kowalski's design-engineering
> skill (Vercel, Linear; author of Sonner and Vaul); the duration/distance/scale vocabulary comes from
> transitions.dev; the anti-pattern list is cross-checked against Impeccable. Install commands are at
> the bottom. Where an external rule conflicts with Fleet's spec, **Fleet wins and the conflict is
> stated**, because those references are written for marketing surfaces and product apps generally,
> and this is a workbench.

### 0. Why this file exists

UI-SPEC §9 said, in full:

> **Motion is functional.** `duration-150` for opacity, `duration-200` for transform. No entrance
> animations, no parallax, no spring physics. Respect `prefers-reduced-motion`.

Correct, and not enough to decide anything with. It gives two durations and no curve, so every
surface that needed a third case invented one. Observed drift this file exists to make impossible:

| Drifted decision | Why it is wrong |
|---|---|
| `transition-all` | animates properties nobody chose, including ones added later |
| default `ease` / `ease-in` on an entering element | `ease-in` delays the first frame — the one the user is watching |
| `scale(0)` entry | nothing in the world appears from nothing; it reads as a glitch |
| `transform-origin: center` on a popover | the surface grows from the wrong place, unanchored from its trigger |
| a 400 ms dropdown | past ~300 ms a UI animation stops reading as responsive |
| animating a keyboard-triggered action | repeated hundreds of times a day; motion makes it feel broken |

### 1. The first question is whether to animate at all

**Not "what animation" — "how often will someone see this".** This is the rule that keeps a workbench
from feeling like a toy, and it is why UI-SPEC bans entrance animations without banning motion.

| How often | Decision | In Fleet |
|---|---|---|
| 100+/day | **Never animate.** | ⌘K, sidebar toggle, send, model switch, every keyboard action |
| Tens/day | Remove, or reduce to opacity | session row hover, list navigation, trailing-action reveal |
| Occasional | Standard animation | dialogs, drawers, toasts, popovers, the rate editor expanding |
| Rare / first-run | May carry delight | onboarding, first connection succeeded |

**Never animate a keyboard-initiated action.** A person who reaches for a shortcut is asking for the
result, not for a transition to the result. This is stricter than "no entrance animations" and it is
the reason Raycast has no open/close animation at all.

Session-list interactions fall in the top two bands. Activity indication must derive from real
running state; this policy does not claim the former Fleet `SessionActivityDot` remains mounted.

### 2. Easing

**Enter and exit use `ease-out`. Never `ease-in` on UI.** `ease-in` starts slow, so it delays the
first frame — precisely the moment the user is watching hardest. A dropdown with `ease-in` at 300 ms
*feels* slower than the same 300 ms with `ease-out`.

The built-in CSS keywords are too weak to read as intentional. Fleet's curves:

| Token | Curve | Use |
|---|---|---|
| `--ease-out-strong` | `cubic-bezier(0.22, 1, 0.36, 1)` | enter and exit: popovers, dialogs, drawers, inline expansion |
| `--ease-in-out-strong` | `cubic-bezier(0.77, 0, 0.175, 1)` | on-screen movement: a panel resizing, a pill sliding between tabs |
| `ease` | — | hover and colour only |
| `linear` | — | constant motion only: shimmer, indeterminate progress, spinner |

`--ease-out-strong` is the default. Reach for another only when the element is moving *within* the
screen rather than entering or leaving it.

### 3. Duration

**Ceiling: 300 ms for anything in the product surface.** Above that a control stops feeling connected
to the click that caused it.

| What | Duration | Tailwind |
|---|---|---|
| Button press feedback | 100–160 ms | `duration-150` |
| Opacity-only reveal (UI-SPEC §9) | 150 ms | `duration-150` |
| Tooltip, small popover | 125–200 ms | `duration-150` / `duration-200` |
| Transform (UI-SPEC §9), dropdown, select | 200 ms | `duration-200` |
| Inline expansion (a row opening into a form) | 200–250 ms | `duration-200` |
| Dialog, drawer | 250–300 ms | `duration-300` |

Exit is faster than enter. The user has already decided; the system is only getting out of the way.

### 4. Rules that are not about timing

- **Never `transition-all`.** Name the properties. `transition-all` animates whatever gets added to
  the class list next year, which is how an unrelated change becomes a visual bug.
- **Prefer `transform` and `opacity` for movement.** Colour/opacity feedback in §2 is allowed;
  these rules do not prohibit a non-animated size change. Transform/opacity can avoid layout work. Animating `height`, `width`,
  `padding` or `margin` triggers all three, and on a list of eighty review rows that is visible.
- **Never enter from `scale(0)`.** Start at `0.96`–`0.98` with `opacity: 0`. Scale values, matched to
  surface size: dialog `0.96`, dropdown `0.97`, tooltip `0.98`.
- **Popovers are origin-aware.** `transform-origin: var(--radix-popover-content-transform-origin)`,
  so the surface grows out of its trigger. **Dialogs are exempt** — they are not anchored to
  anything, so they stay centred.
- **Press feedback follows the shared upstream primitive.** Do not add scale to every button:
  frequent and keyboard actions follow §1; existing colour/pressed/focus feedback may suffice.
- **Transitions, not keyframes, for anything retriggerable.** A transition retargets from its current
  position; a keyframe restarts from zero, so a rapidly-toggled element visibly jumps.
- **Gate hover motion behind `@media (hover: hover) and (pointer: fine)`.** Touch devices fire hover
  on tap, so an ungated hover animation plays on every touch.

### 5. `prefers-reduced-motion`

Reduced motion means **fewer and gentler**, not zero. Keep opacity and colour transitions — they aid
comprehension and cause no vestibular problem. Remove movement, scale and anything that travels.

```css
@media (prefers-reduced-motion: reduce) {
  /* keep: opacity, color */
  /* drop: translate, scale, rotate, and any looping animation */
}
```

In Tailwind: `motion-reduce:animate-none`, `motion-reduce:transition-none`, and no transform variant.
A person who asked for no motion is not asking for less of it, so do not merely shorten the duration.

### 6. Where Fleet overrules the references

| Reference says | Fleet says | Why |
|---|---|---|
| Springs feel natural; use for drag and "alive" elements | **No spring physics** (UI-SPEC §9) | A workbench is read, not played with. Reconsider only for canvas direct manipulation, as an owner decision. |
| Stagger list entries by 30–80 ms | **No stagger** | Fleet's lists are sessions and diffs — seen constantly, band 1 of §1. Stagger is for surfaces seen once. |
| Bounce/overshoot for playful moments | **No bounce** | Impeccable lists it as a dated tell, and nothing in Fleet is playful enough to earn it. |
| Blur to mask an imperfect crossfade | Not a default; compare the shared upstream primitive first | Legitimate, but it costs GPU on Safari and is usually a sign the durations are wrong. Fix those first. |

### 7. The references themselves

Vendored guidance for whoever picks this project up. None of it overrides `DESIGN.md`.

```bash
npx skills add emilkowalski/skills          # animation + design-engineering judgement
npx skills add Jakubantalik/transitions.dev # 18 tuned CSS transitions + motion tokens
npx impeccable install                      # 60 deterministic anti-pattern detectors
```

`impeccable detect` is the closest thing to `check-ui-contract.ts` from outside the project; it
catches the generic AI tells (Inter everywhere, purple gradients, cards inside cards, bounce easing),
whereas Fleet's own guard catches violations of *this* design system. External tool installation is advisory, not an additional mandatory gate.

### 8. Self-check

```bash
cd app && bun run lint:ui-contract   # tokens, radius, type, elevation, palette
```

The original-source restoration removed this script and command. It is a classified verification
gap until restored within an approved implementation slice; it has not passed on the restored tree.
Motion and shared-primitive reuse still need source review even when the guard is available.
