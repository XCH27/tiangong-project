# Motion — the half of the UI baseline that was one sentence

> **Scope:** what moves, for how long, on which curve. [`UI-SPEC.md`](../UI-SPEC.md) §9 still owns
> the composition rules; this file expands its one motion bullet into the decidable values, the same
> way UI-SPEC §1–§8 expanded "compare with v0.10.5" into numbers.
>
> **Provenance:** the frequency framework and easing rules come from Emil Kowalski's design-engineering
> skill (Vercel, Linear; author of Sonner and Vaul); the duration/distance/scale vocabulary comes from
> transitions.dev; the anti-pattern list is cross-checked against Impeccable. Install commands are at
> the bottom. Where an external rule conflicts with Fleet's spec, **Fleet wins and the conflict is
> stated**, because those references are written for marketing surfaces and product apps generally,
> and this is a workbench.

## 0. Why this file exists

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

## 1. The first question is whether to animate at all

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

Everything on a session list row falls in the top two bands. That is why `SessionActivityDot` renders
no transition and pulses only while a session is actually running.

## 2. Easing

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

## 3. Duration

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

## 4. Rules that are not about timing

- **Never `transition-all`.** Name the properties. `transition-all` animates whatever gets added to
  the class list next year, which is how an unrelated change becomes a visual bug.
- **Only `transform` and `opacity`.** They skip layout and paint. Animating `height`, `width`,
  `padding` or `margin` triggers all three, and on a list of eighty review rows that is visible.
- **Never enter from `scale(0)`.** Start at `0.96`–`0.98` with `opacity: 0`. Scale values, matched to
  surface size: dialog `0.96`, dropdown `0.97`, tooltip `0.98`.
- **Popovers are origin-aware.** `transform-origin: var(--radix-popover-content-transform-origin)`,
  so the surface grows out of its trigger. **Dialogs are exempt** — they are not anchored to
  anything, so they stay centred.
- **Pressable things respond to press.** `active:scale-[0.97]` with `duration-150`. Without it a
  control gives no evidence it heard the click until its result arrives.
- **Transitions, not keyframes, for anything retriggerable.** A transition retargets from its current
  position; a keyframe restarts from zero, so a rapidly-toggled element visibly jumps.
- **Gate hover motion behind `@media (hover: hover) and (pointer: fine)`.** Touch devices fire hover
  on tap, so an ungated hover animation plays on every touch.

## 5. `prefers-reduced-motion`

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

## 6. Where Fleet overrules the references

| Reference says | Fleet says | Why |
|---|---|---|
| Springs feel natural; use for drag and "alive" elements | **No spring physics** (UI-SPEC §9) | A workbench is read, not played with. Reconsider only for canvas direct manipulation, as an owner decision. |
| Stagger list entries by 30–80 ms | **No stagger** | Fleet's lists are sessions and diffs — seen constantly, band 1 of §1. Stagger is for surfaces seen once. |
| Bounce/overshoot for playful moments | **No bounce** | Impeccable lists it as a dated tell, and nothing in Fleet is playful enough to earn it. |
| Blur to mask an imperfect crossfade | Allowed, ≤ 2 px | Legitimate, but it costs GPU on Safari and is usually a sign the durations are wrong. Fix those first. |

## 7. The references themselves

Vendored guidance for whoever picks this project up. None of it overrides `UI-SPEC.md`.

```bash
npx skills add emilkowalski/skills          # animation + design-engineering judgement
npx skills add Jakubantalik/transitions.dev # 18 tuned CSS transitions + motion tokens
npx impeccable install                      # 60 deterministic anti-pattern detectors
```

`impeccable detect` is the closest thing to `check-ui-contract.ts` from outside the project; it
catches the generic AI tells (Inter everywhere, purple gradients, cards inside cards, bounce easing),
whereas Fleet's own guard catches violations of *this* design system. Run both — they do not overlap.

## 8. Self-check

```bash
cd app && bun run lint:ui-contract   # tokens, radius, type, elevation, palette
```

The guard gained palette and `primary` rules on 2026-07-31, after four raw Tailwind colours shipped
through it green. It still does **not** check motion; the items in §4 are review-time rules until
someone encodes them.
