/**
 * Sanitize schema for the markdown pipeline (rehype-sanitize, applied after
 * rehype-raw so raw HTML in LLM output is cleaned before React renders it).
 *
 * Extends the GitHub-style defaultSchema with exactly what our pipeline emits:
 *
 * - KaTeX (rehype-katex runs before sanitize): a hidden MathML a11y tree
 *   (math/semantics/annotation/mrow/…) plus a visual tree of spans carrying
 *   classes, `aria-hidden`, and scoped inline layout styles. Style values are
 *   restricted to KaTeX's layout declarations so raw HTML cannot smuggle
 *   `position:fixed` overlays or `url()` loads through the span allowance.
 * - Collapsible sections (remarkCollapsibleSections): wrapper divs with
 *   `data-section-id` / `data-heading-level` and the `markdown-section` class.
 * - `file:` hrefs: kept on the hast node so the custom anchor component can
 *   route clicks to onFileClick. It still writes a separately sanitized DOM
 *   href via defaultUrlTransform, so nothing dangerous reaches the element.
 */

import { defaultSchema } from 'rehype-sanitize'
import type { Schema } from 'hast-util-sanitize'

const KATEX_STYLE_PATTERN =
  /^(?:(?:height|min-height|width|min-width|max-width|top|bottom|left|right|vertical-align|margin(?:-(?:left|right|top|bottom))?|padding(?:-(?:left|right|top|bottom))?|border-(?:top|bottom)-width|color|background-color|font-size|transform|visibility|display)\s*:\s*[-a-z0-9.#%,+ ]+;?\s*)+$/i

export const MARKDOWN_SANITIZE_SCHEMA: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    // KaTeX MathML a11y tree
    'math',
    'semantics',
    'annotation',
    'mrow',
    'mi',
    'mo',
    'mn',
    'mtext',
    'mspace',
    'msup',
    'msub',
    'msubsup',
    'mfrac',
    'msqrt',
    'mroot',
    'mover',
    'munder',
    'munderover',
    'mpadded',
    'mphantom',
    'menclose',
    'mstyle',
    'mtable',
    'mtr',
    'mtd',
    'merror',
  ],
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      'className',
      'data-section-id',
      'data-heading-level',
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      'className',
      'ariaHidden',
      ['style', KATEX_STYLE_PATTERN],
    ],
    annotation: ['encoding'],
    math: ['xmlns'],
    mi: ['mathvariant'],
    mo: ['stretchy', 'lspace', 'rspace', 'movablelimits', 'accent'],
    mstyle: ['displaystyle', 'scriptlevel', 'mathcolor', 'mathbackground'],
    mtable: ['columnalign', 'rowalign', 'columnspacing', 'rowspacing'],
    mtd: ['columnalign', 'rowalign', 'rowSpan', 'colSpan'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), 'file'],
  },
}
