# UI-SPEC — the measurable half of the UI baseline

> **Scope:** the decidable numbers an agent needs to render a surface without inventing a visual
> language. It is not a second authority: [`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md) still owns
> *which component to start from* and *how the change is reviewed*; this file owns *what the values
> are*. When a value here disagrees with the pinned v0.10.5 component, the component wins and this
> file is corrected in the same slice.
>
> **Provenance:** every table below is measured from
> `源码参考/software/craft-agents-oss-v0.10.5/apps/electron/src/renderer/` and
> `app/packages/ui/src/styles/index.css`, not designed. Both pinned snapshots agree on all scales.

## 0. Why this file exists

An agent asked to change UI previously had no numeric anchor — only the instruction "compare with
v0.10.5", whose `AppShell.tsx` is 3,565 lines. Unable to read the anchor, agents invented values.
Observed drift that this file exists to make impossible:

| Drifted value | Why it is wrong |
|---|---|
| `text-foreground/32`, `/38`, `/48`, `/[0.055]` | absent from both snapshots; the ladder is §3 |
| `rounded-[22px]` | radius scale tops out at `rounded-[12px]` (§5) |
| `shadow-[0_18px_50px_rgba(0,0,0,0.07)]` | three shadow tokens exist (§6); arbitrary shadows are forbidden |
| `strokeWidth={1.9}` | icons own their stroke (§4) |
| `h-3.5 w-3.5` icon in an `h-5 w-5` slot | row action slot is 24 px (§4) |
| 28 px centered hero title | no surface in either snapshot uses a hero (§9) |

## 1. Foundations

| Token | Value | Note |
|---|---|---|
| `--font-size-base` | `15px` | body default |
| `--font-sans` | `system-ui, -apple-system, BlinkMacSystemFont, …` | Inter only where a theme overrides it |
| `--font-mono` / `--font-serif` | `"JetBrains Mono", ui-monospace, …` | code and monospace only |
| `--spacing` | `0.25rem` (4 px) | **every** spacing value is a multiple of 4 px, or `2px`/`6px` where a listed component spec says so |
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

**Not permitted:** `rounded-xl`, `rounded-2xl`, and any `rounded-[Npx]` above 12 px.

## 6. Elevation

Exactly three shadow tokens exist. Use them by name:

| Token | Use |
|---|---|
| `--shadow-minimal` | resting elevation for buttons and small surfaces |
| `--shadow-minimal-flat` | same weight without the vertical offset |
| `--shadow-modal-small` | dialogs, popovers, floating panels |

**Arbitrary `shadow-[…]` values are forbidden.** If a surface needs elevation that these three do not
express, that is a design question for the owner, not a local override.

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

### Menu / popover / tooltip / dialog / entity row / panel header

Use the shared components. Do not locally recreate their padding, shadow, radius, animation, or
keyboard behavior:

`components/ui/dropdown-menu` · `context-menu` · `popover` · `dialog` · `drawer` · `entity-row` ·
`entity-list` · `entity-panel` · `button` · `badge` · `input` · `select` ·
`components/app-shell/PanelHeader` · `SidebarMenu`

## 9. Composition rules

- **No hero.** No surface in either pinned snapshot uses a centered oversized title, a decorative
  icon badge, or a marketing-style introduction. Creation and configuration surfaces are dense forms
  that start at the top-left. This is also binding as
  [`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md) §8.
- **Progressive disclosure over new surfaces.** Prefer changing fields, grouping, wording, and
  disclosure inside the existing surface over adding a page, toolbar, sidebar, or settings category.
- **Density is the default.** This is a workbench, not a landing page. Whitespace communicates
  grouping, not importance.
- **A visible control has real behavior.** Loading/error/recovery states and the same underlying
  authority as every other caller. See §10.
- **Motion is functional.** `duration-150` for opacity, `duration-200` for transform. No entrance
  animations, no parallax, no spring physics. Respect `prefers-reduced-motion`.

## 10. Required states

Every surface ships the applicable states from
[`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) §4 using the shared components:

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

Unless the owner's Goal explicitly authorizes it, a UI change may not:

1. add a color outside the six-color theme, or an opacity outside the §3 ladder;
2. add a font family, a type size outside §2, or a radius/shadow outside §5/§6;
3. write a per-use `strokeWidth`, or mix a third icon family into one control group;
4. locally recreate a shared primitive listed in §8;
5. add a hero, a marketing surface, or an entrance animation;
6. add a page, toolbar, sidebar section, or settings category when an existing surface can host it
   ([`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md) owner UI rules; Decision P5);
7. change navigation structure, the default surface set, or which capability is primary — those are
   owner decisions recorded in [`02-DECISIONS.md`](02-DECISIONS.md), not implementation choices;
8. ship a control whose behavior is not connected, outside the preview-gated frontend track
   (Decision G6).

## 12. Self-check before handoff

Run against the diff, not from memory:

```bash
git diff -U0 | grep -E '^\+' | grep -oE 'foreground/(\[[0-9.]+\]|[0-9]+)' | sort -u | grep -vE '/(2|3|5|10|20|30|40|50|60|70|80|90|95)$' | grep -vE '/\[0\.0(2|3|5|7)\]$'
```

```bash
git diff -U0 | grep -E '^\+' | grep -nE 'shadow-\[|rounded-(xl|2xl|3xl)|rounded-\[(1[3-9]|[2-9][0-9])px\]|strokeWidth=|text-\[(1[6-9]|[2-9][0-9])(\.[0-9]+)?px\]'
```

Both must come back empty, or every hit must be named in the Goal's intentional delta. Verified
against the reverted drift: the first command reports 11 off-ladder values and the second 14 hits,
so the checks do catch this failure class.
