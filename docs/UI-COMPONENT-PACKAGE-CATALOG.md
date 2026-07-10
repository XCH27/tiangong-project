# UI Component Package Catalog (Future Redesign Candidates)

> **Class:** research catalog — **not** green-light, **not** a WAVE gate, **not** permission to replace Craft.  
> **Authority:** Lead. Aligns with D50–D52, `REFERENCE-PROJECT-POLICY.md`.  
> **Updated:** 2026-07-10  
> **Purpose:** Collect component **packages** (and package-shaped kits) the owner may evaluate for a
> **later UI overhaul**. Implementation remains Craft TipTap + Craft shell until Lead promotes a path.

## 0. How to use this file

1. **Now (D52):** ship by simplify/optimize on Craft Agents v0.11 (`Radix` + `Tailwind` + `CVA` + `lucide`).  
2. **Later redesign:** pick **one primitive layer + one composed kit + layout/editor gaps**; run
   Promotion Process; update DECISIONS + this catalog’s “Promoted” section.  
3. **Do not** clone entire product monorepos (LobeHub app, cherry-studio, …) as the redesign base.  
4. **Do** audit **each package LICENSE** (product monorepo ≠ sibling MIT package).  
5. Prefer **copy-in kits** (shadcn-style) over opaque design systems when you want full visual control.

### Craft baseline already in `app/` (diff against this first)

| Layer | Present today |
|---|---|
| Styling | Tailwind CSS 4, `@tailwindcss/typography`, `tailwind-merge` |
| Primitives | `@radix-ui/react-*` (avatar, collapsible, dialog, dropdown, select, tabs, tooltip, scroll-area, separator, slot, context-menu, …) |
| Variants | `class-variance-authority` |
| Icons | `lucide-react` |
| Layout | `react-resizable-panels` |
| DnD | `@dnd-kit/*` |
| Document editor | TipTap 3 + markdown extensions (not Lexical) |
| UI package | monorepo `packages/ui` |

A “big redesign” should usually **extend or re-skin this stack**, not invent a second React tree.

---

## 1. Headless / primitive layers (foundation)

| Package / repo | License (typical) | Fit for Fleet | Notes |
|---|---|---|---|
| **[Radix Primitives](https://www.radix-ui.com/)** `@radix-ui/react-*` | MIT | **Already in Craft** | Default primitive layer; keep unless migrating deliberately |
| **[Base UI](https://base-ui.com/)** `@base-ui/react` (MUI) | MIT | Strong alt | Unstyled; shadcn supports Base UI path (2025+) |
| **[React Aria](https://react-spectrum.adobe.com/react-aria/)** / **[React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html)** | Apache-2.0 | Strong a11y | Heavier API; excellent keyboard/screen-reader |
| **[Ariakit](https://ariakit.org/)** | MIT | Strong | Lightweight headless; good for custom design systems |
| **[Ark UI](https://ark-ui.com/)** (Zag.js) | MIT | Candidate | Framework-agnostic machine-based primitives |
| **[Headless UI](https://headlessui.com/)** (`@headlessui/react`) | MIT | Optional | Smaller set; Tailwind-friendly |
| **[Zag.js](https://zagjs.com/)** | MIT | Niche | State machines under Ark; rare direct use |

**Redesign rule:** pick **one** primitive family as the single source of truth (Radix *or* Base UI *or* Aria), then compose.

---

## 2. Composed component kits (buttons, forms, dialogs, menus…)

| Package / kit | License | Ownership model | Fit notes |
|---|---|---|---|
| **[shadcn/ui](https://ui.shadcn.com/)** | MIT (generated code you own) | Copy components into repo | **Best aligned** with current Craft (Radix + Tailwind + CVA). Natural “big redesign” path without new runtime dep monopoly |
| **[shadcn registry ecosystem](https://ui.shadcn.com/docs/directory)** | Varies per registry | Copy-in | Blocks, charts, AI, sidebar registries — audit each |
| **[Origin UI](https://originui.com/)** | MIT-oriented copy patterns | Copy-in | Dense shadcn-style patterns; good for settings density |
| **[AlignUI](https://alignui.com/)** | Check site/repo | Kit | Modern SaaS patterns; verify license before adopt |
| **[Untitled UI React](https://www.untitledui.com/react)** | Commercial / freemium layers | Kit | High polish; **license careful** for commercial product |
| **[Mantine](https://mantine.dev/)** `@mantine/core` | MIT | npm library | Batteries-included; strong forms/hooks; different visual language from shadcn |
| **[Chakra UI v3](https://chakra-ui.com/)** | MIT | npm library | Design tokens + recipes; less “Craft-like” default |
| **[HeroUI](https://www.heroui.com/)** (ex-NextUI) | MIT | npm library | Tailwind + Framer-friendly; product look is opinionated |
| **[Park UI](https://park-ui.com/)** | MIT | Copy/Pandan-based | Ark UI + recipes; alternative to shadcn |
| **[DaisyUI](https://daisyui.com/)** | MIT | Tailwind plugin | Fast themes; less app-chrome control |
| **[Ant Design](https://ant.design/)** `antd` | MIT | npm library | Enterprise density; **heavy**; Lobe stack uses it — **not** default for Craft Electron |
| **[MUI Material](https://mui.com/material-ui/)** | MIT | npm library | Enterprise; Material look unless heavily themed |
| **[MUI Joy](https://mui.com/joy-ui/)** | MIT | npm library | Lighter MUI skin |
| **[React Bootstrap](https://react-bootstrap.github.io/)** | MIT | npm library | Legacy web feel; low priority for Agent desktop |
| **[Semantic UI React](https://react.semantic-ui.com/)** | MIT | npm library | Aging; low priority |
| **[gluestack-ui](https://gluestack.io/)** | MIT | Universal | RN+web; only if multi-platform becomes a goal |
| **[@lobehub/ui](https://github.com/lobehub/lobe-ui)** | **MIT** | npm library | Open component library; **not** green-light (D52 Craft). Candidate only if Lead wants Lobe visual language + full theming audit |

---

## 3. Layout, panels, windowing (workbench chrome)

| Package | License | Hook | Notes |
|---|---|---|---|
| **[react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)** | MIT | M16 | **Already in Craft** |
| **[Dockview](https://github.com/mathuo/dockview)** | MIT | M16 | IDE-like tabs/dock; already black-box in policy — prefer Craft panels first |
| **[Allotment](https://github.com/johnwalley/allotment)** | MIT | M16 | Split panes; simple |
| **[rc-dock](https://github.com/ticlo/rc-dock)** | MIT | M16 | Complex docking; heavier |
| **[FlexLayout](https://github.com/caplin/FlexLayout)** | Apache-2.0 | M16 | Golden-layout style |
| **[React Grid Layout](https://github.com/react-grid-layout/react-grid-layout)** | MIT | Dashboard | Not default workbench; canvas ≠ grid home |
| **[react-rnd](https://github.com/bokuweb/react-rnd)** | MIT | Floating | Already black-box for drag ideas |
| **[Blueprint](https://blueprintjs.com/)** `@blueprintjs/core` | Apache-2.0 | Desktop density | Desktop-first chrome; large surface |

---

## 4. Document / editor-adjacent packages

| Package | License | Stack | Fleet stance |
|---|---|---|---|
| **TipTap** `@tiptap/*` | MIT (Pro extensions may be commercial) | ProseMirror | **Current 文稿 path** — `markdown-document-surface.md` |
| **ProseMirror** modules | MIT | Core | Under TipTap; fine |
| **[BlockNote](https://www.blocknotejs.org/)** | MPL-2.0 | TipTap-based block editor | Strong **block modular** kit; evaluate if B1 drag is too costly DIY — **license + UI chrome audit** |
| **[Novel](https://github.com/steven-tey/novel)** | Apache-2.0 | TipTap Notion-like | Ideas / partial patterns |
| **[Plate](https://platejs.org/)** | MIT | Slate | Different core; higher migration cost |
| **[Lexical](https://lexical.dev/)** + **[@lobehub/editor](https://github.com/lobehub/lobe-editor)** | MIT | Lexical | **Second editor stack** — not default; only if Lead abandons TipTap deliberately |
| **[Milkdown](https://milkdown.dev/)** | MIT | ProseMirror/Crepe | Markdown-first alternative |
| **[CodeMirror 6](https://codemirror.net/)** | MIT | Code | Code panels / skill files |
| **[Monaco](https://github.com/microsoft/monaco-editor)** | MIT | Code | Heavy; use sparingly in Electron |
| **[Shiki](https://shiki.style/)** | MIT | Highlight | Craft already uses Shiki-oriented code blocks |

---

## 5. AI / chat surface kits (optional later)

| Package | License | Notes |
|---|---|---|
| **[assistant-ui](https://www.assistant-ui.com/)** | MIT | Composable chat thread primitives; pairs with AI SDK |
| **[Vercel AI SDK UI](https://sdk.vercel.ai/docs/ai-sdk-ui)** | Apache-2.0 | Streaming hooks/components; not a full shell |
| **[CopilotKit](https://www.copilotkit.ai/)** | MIT / check cloud | Productized copilots; evaluate lock-in |
| **[prompt-kit](https://www.prompt-kit.com/)** | Check | Prompt/chat UI blocks (often shadcn-based) |
| **[ai-elements / shadcn AI registries](https://ui.shadcn.com/)** | MIT-ish copy | Message list, reasoning, tool cards — audit each registry |

**Rule:** chat chrome must remain on Craft session authority (no second session store).

---

## 6. Motion, overlay, feedback, icons

| Package | License | Role |
|---|---|---|
| **[lucide-react](https://lucide.dev/)** | ISC | **Already in Craft** — default icons |
| **[Phosphor Icons](https://phosphoricons.com/)** | MIT | Alt icon set |
| **[Radix Icons](https://www.radix-ui.com/icons)** | MIT | Matches Radix |
| **[@lobehub/icons](https://github.com/lobehub/lobe-icons)** | MIT | Model/provider icons; optional asset source with attribution |
| **[Framer Motion](https://motion.dev/)** `motion` | MIT | Motion; use sparingly (D51 简约) |
| **[sonner](https://sonner.emilkowal.ski/)** | MIT | Toasts |
| **[vaul](https://vaul.emilkowal.ski/)** | MIT | Drawer |
| **[cmdk](https://cmdk.paco.me/)** | MIT | Command palette |
| **[react-hotkeys-hook](https://github.com/JohannesKlauss/react-hotkeys-hook)** | MIT | Hotkeys |
| **[Floating UI](https://floating-ui.com/)** | MIT | Positioning (Radix uses related patterns) |
| **[OverlayScrollbars](https://kingsora.github.io/OverlayScrollbars/)** | MIT | Custom scrollbars for dense panels |
| **[Embla Carousel](https://www.embla-carousel.com/)** | MIT | Carousels (rare) |

---

## 7. Data display, tables, charts, trees

| Package | License | Role |
|---|---|---|
| **[TanStack Table](https://tanstack.com/table)** | MIT | Headless tables |
| **[TanStack Virtual](https://tanstack.com/virtual)** | MIT | Long lists (sessions, files) |
| **[AG Grid Community](https://www.ag-grid.com/)** | MIT | Heavy grids; only if needed |
| **[recharts](https://recharts.org/)** / **[visx](https://airbnb.io/visx/)** | MIT | Charts (cost/usage later) |
| **[react-arborist](https://github.com/brimdata/react-arborist)** / **[react-complex-tree](https://github.com/lukasbach/react-complex-tree)** | MIT | File trees |
| **[cmdk](https://cmdk.paco.me/)** + list virtualization | MIT | Quick open |

---

## 8. Canvas / spatial (M07) — not shell UI, but redesign-adjacent

| Package | License | Notes |
|---|---|---|
| **[xyflow / React Flow](https://github.com/xyflow/xyflow)** | MIT | **Preferred M07 spike** (already in policy) |
| **[tldraw](https://tldraw.dev/)** | tldraw license | Behaviour study; production SDK not “free MIT” |
| **[Konva / react-konva](https://konvajs.org/)** | MIT | Imperative canvas |
| **[PixiJS](https://pixijs.com/)** | MIT | WebGL; usually overkill |

---

## 9. Desktop / Electron UI helpers

| Package | License | Notes |
|---|---|---|
| **[electron-vite](https://electron-vite.org/)** patterns | MIT | Build — not visual |
| **[custom-electron-titlebar](https://github.com/AlexTorresSk/custom-electron-titlebar)** | MIT | Titlebar if redesign leaves OS chrome |
| OS traffic lights / `titleBarOverlay` | — | Prefer native Electron APIs over custom packs |

---

## 10. Suggested redesign shortlists (when owner opens the gate)

### Path A — “Reskin Craft, keep architecture” (**recommended default**)

1. Keep **Radix + Tailwind + CVA** (or migrate primitives → **Base UI** carefully).  
2. Adopt **shadcn/ui** (or Origin-style registries) as **owned** component source under `packages/ui`.  
3. Keep **TipTap** + modular block work from `markdown-document-surface.md`.  
4. Layout: deepen `react-resizable-panels`; Dockview only if IDE docking is a real requirement.  
5. Chat: optional **assistant-ui** / shadcn AI blocks **inside** Craft session UI.

### Path B — “New design system library”

1. **Mantine** *or* **HeroUI** *or* **Chakra** as full library.  
2. Higher rewrite cost; must still host inside Craft shell routes (no second app).  
3. TipTap can stay; avoid Lexical unless explicit decision.

### Path C — “Lobe-adjacent visual language” (**explicit Lead decision required**)

1. Evaluate **`@lobehub/ui` (MIT)** + Craft host theming — **not** Lobe product monorepo.  
2. **Do not** default to **`@lobehub/editor`**; 文稿 stays TipTap unless abandoning B1 plan.  
3. Antd gravity often comes with Lobe-style stacks — watch bundle weight on Electron.

### Path D — “Block-document product”

1. Keep Craft chrome.  
2. Evaluate **BlockNote** (TipTap/MPL) for modular blocks vs in-house B1 drag.  
3. Still M05 file authority + M03 actions.

---

## 11. Explicit non-candidates for redesign base

| Item | Why |
|---|---|
| LobeHub / lobe-chat **product** monorepo | Community License; competing shell |
| cherry-studio / warp / zed product UX as base | D50/D52; no adapt path as shell |
| AGPL canvas products as shell | License + product gravity |
| Remotion as UI kit | Wrong layer + license |
| Copying closed SaaS pixels as design system | Compliant reference loop only |

---

## 12. Promotion checklist (before any package becomes default)

1. License + transitive licenses OK for commercial desktop distribution.  
2. Bundle size / Electron cold-start measured.  
3. a11y keyboard path for primary loops.  
4. Does **not** force second session/permission/timeline.  
5. Document editor decision: TipTap stay vs replace (written decision).  
6. Update: this catalog “Promoted” subsection, `REFERENCE-PROJECT-POLICY`, DECISIONS, D52 interpretation if shell changes.  
7. Owner approval for “大改造” scope (what chrome is allowed to change).

### Promoted (none yet for redesign)

| Package | Decision | Date |
|---|---|---|
| — | No redesign package promoted; D52 Craft stack remains baseline | 2026-07-10 |

---

## 13. Local checkout policy

| Action | Rule |
|---|---|
| Default | **No** bulk clone of kits into `源码参考` |
| Spike | Optional thin clone or `npm pack` for 1–2 shortlisted kits only |
| After spike | Absorb findings into SPEC/DESIGN notes; delete clone if not green-lit |

See compliant reference loop in `REFERENCE-PROJECT-POLICY.md`.

---

## 14. Absorb / update log

| Date | Change |
|---|---|
| 2026-07-10 | Initial catalog: primitives, kits, layout, editor, AI chrome, icons; Craft baseline inventory; redesign shortlists A–D. |
| 2026-07-10 | Noted MIT `@lobehub/ui` / `@lobehub/editor` as package candidates only; product monorepo retired. |
