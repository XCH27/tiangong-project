> ## Documentation Index
> Fetch the complete documentation index at: https://agents.craft.do/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Colors

> Configure colors for labels, statuses, and smart labels using the EntityColor system

Labels, statuses, and smart labels support configurable colors via the `EntityColor` type. Colors can reference the theme's design system (auto-adapting to light/dark mode) or specify explicit custom values.

## EntityColor Type

The `color` field in entity configs accepts two forms:

### System Colors

Reference one of 5 design system colors by name. These map to CSS variables defined by your [theme](/customisation/themes), so they automatically adapt to light and dark mode.

```json theme={null}
{
  "color": "accent"
}
```

Available system color names:

| Name          | Default Appearance | Semantic Usage                       |
| ------------- | ------------------ | ------------------------------------ |
| `accent`      | Purple             | Brand, primary actions, Execute mode |
| `info`        | Amber              | Warnings, attention, Ask mode        |
| `success`     | Green              | Completion, connected, confirmed     |
| `destructive` | Red                | Errors, failures, delete actions     |
| `foreground`  | Text color         | Neutral, muted states                |

### System Colors with Opacity

Append `/{opacity}` to any system color name, where opacity is 0-100:

```json theme={null}
{
  "color": "foreground/50"
}
```

This renders as a semi-transparent version of the system color. Useful for muted or secondary states.

**More examples:**

* `"accent/80"` — 80% opacity accent
* `"destructive/60"` — 60% opacity red
* `"foreground/30"` — very subtle text color

### Custom Colors

Specify explicit CSS color values with an object containing `light` and optionally `dark`:

```json theme={null}
{
  "color": {
    "light": "#EF4444",
    "dark": "#F87171"
  }
}
```

If `dark` is omitted, it's auto-derived from `light`:

* **Hex colors**: Brightened by blending 30% toward white
* **Other formats** (OKLCH, RGB, HSL): Used as-is — specify `dark` explicitly for best results

```json theme={null}
{
  "color": {
    "light": "#3B82F6"
  }
}
```

## Color Formats

Custom colors accept any valid CSS color format:

| Format | Example                             |
| ------ | ----------------------------------- |
| Hex    | `#8b5cf6`, `#8b5cf6cc` (with alpha) |
| RGB    | `rgb(139, 92, 246)`                 |
| HSL    | `hsl(262, 83%, 58%)`                |
| OKLCH  | `oklch(0.58 0.22 293)`              |

<Note>
  **Recommendation**: Use OKLCH for perceptually uniform colors. For simple cases, hex with auto-derived dark variant works well.
</Note>

## Where Colors Are Used

### Labels

Labels render as **colored circles**. The `color` field controls the circle color:

```json theme={null}
{
  "id": "bug",
  "name": "Bug",
  "color": "destructive"
}
```

```json theme={null}
{
  "id": "feature",
  "name": "Feature",
  "color": {
    "light": "#8B5CF6",
    "dark": "#A78BFA"
  }
}
```

Labels without a `color` field render as a muted foreground circle.

### Statuses

Statuses use color for their icon and visual indicators:

```json theme={null}
{
  "id": "in-progress",
  "label": "In Progress",
  "color": "success",
  "category": "open"
}
```

**Default status colors** (applied when no `color` is specified):

| Status ID      | Default Color   | Appearance |
| -------------- | --------------- | ---------- |
| `backlog`      | `foreground/50` | Muted      |
| `todo`         | `foreground/50` | Muted      |
| `in-progress`  | `success`       | Green      |
| `needs-review` | `info`          | Amber      |
| `done`         | `accent`        | Purple     |
| `cancelled`    | `foreground/50` | Muted      |

### Smart Labels

Smart labels support the `color` field:

```json theme={null}
{
  "id": "smart-error",
  "name": "ERROR",
  "color": "destructive",
  "expression": "hasError == true"
}
```

## Theme Relationship

System colors (`accent`, `info`, `success`, `destructive`, `foreground`) reference the same CSS variables that your [theme](/customisation/themes) defines. This means:

* Entity colors **automatically adapt** when you change themes
* A status with `"color": "accent"` will be purple with the default theme, but blue if you override accent to blue
* Custom colors (`{ light, dark }`) are independent of the theme

## OKLCH Reference

For custom colors using OKLCH format: `oklch(lightness chroma hue)`

| Component | Range | Description                       |
| --------- | ----- | --------------------------------- |
| Lightness | 0–1   | 0 = black, 1 = white              |
| Chroma    | 0–0.4 | 0 = gray, higher = more saturated |
| Hue       | 0–360 | Color wheel angle                 |

**Common hues:**

* Red: \~25
* Orange: \~70
* Yellow: \~100
* Green: \~145
* Cyan: \~195
* Blue: \~250
* Purple: \~293
* Pink: \~330

## Examples

### Minimal — system color

```json theme={null}
{ "color": "success" }
```

### Muted state

```json theme={null}
{ "color": "foreground/40" }
```

### Brand color with explicit dark variant

```json theme={null}
{
  "color": {
    "light": "oklch(0.55 0.20 250)",
    "dark": "oklch(0.70 0.18 250)"
  }
}
```

### Hex with auto-derived dark mode

```json theme={null}
{
  "color": {
    "light": "#059669"
  }
}
```

## Tips

<AccordionGroup>
  <Accordion title="Start with system colors">
    System colors are the simplest option — they adapt to themes and modes automatically. Only use custom colors when you need a specific brand color or shade not covered by the 5 system colors.
  </Accordion>

  <Accordion title="Use opacity for hierarchy">
    `foreground/50` and `foreground/30` are useful for muted, secondary, or disabled states without introducing new colors.
  </Accordion>

  <Accordion title="Test in both modes">
    If using custom colors, always verify appearance in both light and dark mode. Specify explicit `dark` values for best results with non-hex formats.
  </Accordion>

  <Accordion title="Color not applying?">
    * Ensure the `color` field is at the top level of the entity config (not nested)
    * System color names are case-sensitive: use `"accent"` not `"Accent"`
    * Opacity must be 0–100 (not 0–1): use `"foreground/50"` not `"foreground/0.5"`
    * Custom color objects require at minimum a `light` field
  </Accordion>
</AccordionGroup>
