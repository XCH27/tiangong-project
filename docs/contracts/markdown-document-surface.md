# Markdown Document Surface (Craft TipTap)

> **Class:** behaviour contract (text freeze for implementers; not a WAVE gate).  
> **Authority:** Lead. Aligns with D50–D52, HFL-005, M05 leases, M03 actions, Craft v0.11 TipTap stack.  
> **Updated:** 2026-07-10  
> **Source of value:** Owner intent for **Markdown 文稿 · 模块式拖拽**, plus black-box product behaviour study.  
> **External checkout:** **Not required.** Former product study target (LobeHub app) is **retired** after this absorb; do not re-clone for implementation.  
> **Note on packages:** `@lobehub/ui` and `@lobehub/editor` are **separate MIT repos** on GitHub; they are **not** green-light for Fleet (D52 Craft TipTap; no second editor stack). See `REFERENCE-PROJECT-POLICY` Retired rows.

## 1. Why this file exists

Fleet opens Markdown-oriented workspace files in the **Craft Agents TipTap/ProseMirror** editor on the
retained Craft shell (D52). Owner product bar for 文稿:

> Markdown documents are **reorderable modules/blocks** (drag blocks/sections), not only free-form text.

That bar is **Fleet/Craft behaviour**, not a license to import third-party editor packages or shells.

This contract freezes the **incremental** behaviour targets relative to the clean Craft baseline so
Workers do not need any external 文稿 product tree.

## 2. Craft baseline already owns (do not re-spec as “new product”)

On clean Craft v0.11 (and current `app/` TipTap surface), the following **already exist** and must be
**extended**, not replaced:

| Existing Craft capability | Implication |
|---|---|
| `TiptapMarkdownEditor` + Official/Legacy Markdown engines | Stay on TipTap/ProseMirror; no Lexical second stack |
| `TiptapSlashMenu` (headings, lists, code, mermaid, latex, …) | Extend slash items if needed; do not invent a parallel insert UX |
| Rich block NodeViews (image, mermaid, latex, …) with selective drag | Keep; gap is **top-level prose modules**, not only special nodes |
| Bubble menus / hover actions / code-block views | Optimize under D52; not a second chrome product |
| Workspace file open/save through normal file paths | Persistence authority remains **M05 + filesystem**, not an editor-private DB |

## 3. Absorbed behaviour targets (must implement on Craft)

Only the following deltas are product requirements for the Markdown document surface.  
They are **independent reimplementation** targets.

### B1 — Modular block reorder (owner primary)

| Field | Rule |
|---|---|
| What | User can drag **top-level document blocks** to reorder (paragraph, heading, list, task list, code fence, horizontal rule, and existing rich blocks). |
| How it feels | Block handle (or equivalent affordance), clear drop indicator between blocks, whole module moves as one unit. |
| After drop | Exported Markdown order matches visual order; one undo step restores prior order. |
| Not | Free-drag of prose onto the **spatial canvas** as layout objects (M07 Space mode is not a prose free-canvas). |
| Not | A second “block canvas” app outside Craft main stage. |

**Craft gap today:** selective drag exists on some rich NodeViews; **prose top-level modular reorder** is the missing product loop for 文稿.

### B2 — Slash and blocks stay one model

| Field | Rule |
|---|---|
| What | Blocks inserted via slash are the same units that can be reordered (B1). |
| How | Extend Craft `TiptapSlashMenu` / TipTap commands only. |
| Not | A second insert palette owned by a third-party editor package. |

### B3 — Agent mutation of open Markdown (when the tool surface ships)

When Agents edit workspace Markdown (same loop as humans: M03 → permission → M05 lease → write):

| Field | Rule |
|---|---|
| Prefer | Structured ops on **stable block identity** while the editor session is live: `insert` / `update` / `remove` / `move` (move ≡ reorder). |
| Also | Whole-file Markdown replace remains valid for simple tools, but must still go through M03/M05 and conflict rules. |
| Identity | Block ids are **editor-session or document-session stable** for the open surface. Round-trip strategy into plain `.md` on disk is a later freeze (HTML comment, attributes, or editor sidecar)—do not invent a second content store. |
| Not | A parallel “page agent runtime” or second document database. |
| Not | LiteXML or any third-party wire format as a Fleet protocol requirement. |

### B4 — Single mutation gate

| Field | Rule |
|---|---|
| What | Human typing, drag-reorder, slash insert, and Agent block ops that change bytes all end in the **same** persistence path: dirty state → (optional autosave) → M05 lease-aware write → evidence/timeline as required by M00/M03. |
| Bridge | If an “open editor instance” registry is used so tools can target the focused doc, it is a **thin bridge** only—no second authority for content. |
| Not | Editor-local save that bypasses leases or silent LWW. |

### B5 — Dirty, leave guard, conflict draft

| Field | Rule |
|---|---|
| Dirty | Content change marks dirty; successful save clears dirty. |
| Leave | Unsaved leave (close surface / switch task when policy requires) warns the user. |
| Conflict | On M05 lease/revision conflict, **do not discard** the user’s in-editor draft; surface conflict and allow copy/retry/reread (align M05 § lease conflict UX). |
| Not | Collaborative multi-user heartbeat lock as a W1/W2 prerequisite (local-first; leases already cover write coordination). |

### B6 — Title / body when promoted

| Field | Rule |
|---|---|
| Files | On-disk Markdown may include a leading `#` title in body (normal Markdown). |
| Library / Artifact | When promoted, **display title** may live in metadata; do not invent a second body store. Prefer one content authority (file or native owner) + M05 envelope. |

### B7 — Agent edit scroll stability

| Field | Rule |
|---|---|
| What | Batch programmatic edits should not silently jump the viewport to top when the user was not scrolling. |
| How | Preserve scroll position across non-user-driven doc replaces when max scroll still allows it. |

### B8 — Chrome density (secondary)

| Field | Rule |
|---|---|
| What | 文稿 chrome stays on Craft shell (header/breadcrumb if needed, inspector for ArtifactRef). |
| Not | Shipping a third-party page shell (copilot column layout clone, brand chrome, component library). |
| Copilot | Page-side chat is optional later via **existing** session/workbench patterns—not a mandatory Lobe-style right rail. |

## 4. Explicit non-goals (from retired black-box study)

Do **not** carry these into Fleet:

| Non-goal | Reason |
|---|---|
| `@lobehub/editor` / Lexical as product editor (even though package is MIT) | Second editor stack vs Craft TipTap (D52); Promotion not granted |
| `@lobehub/ui` as shell/component system (MIT) | Replaces Craft chrome; D52 |
| Copying **product** monorepo (`lobehub/lobehub`) source | Community License derivative restrictions |
| LiteXML / LITEXML_* command surface as Fleet protocol | Craft TipTap ops + Markdown bytes |
| Copying third-party PageEditor layout, styles, assets, prompts | Black-box forbid; D50/D52 |
| Second document editor product beside Craft TipTap surface | FORBIDDEN second systems |
| Free-drag prose layout on M07 canvas as substitute for block reorder | Wrong plane (ADR-0033) |
| Full multi-tenant document lock product for W1/W2 | M05 leases suffice for local coordination |

## 5. Ownership

| Concern | Owner |
|---|---|
| File bytes, leases, ArtifactRef, Library | M05 |
| Action/permission/timeline for writes and Agent tools | M00 / M03 |
| Hosting the editor surface in Craft shell | M16 + Craft baseline UI (D52 simplify/optimize) |
| TipTap block model, slash, drag, editor bridge | Craft UI package paths under ownership matrix (not a new module number) |
| Spatial placement of document **cards** | M07 projection only |

## 6. Acceptance checklist (when 文稿 ships as a product loop)

1. Drag block A between B and C → Markdown export order matches; undo restores.  
2. Slash-inserted blocks are reorderable under B1.  
3. Unsaved leave warns; successful save clears dirty.  
4. Forced lease/revision conflict keeps local draft visible.  
5. If Agent block tools are in scope for that packet: update one block by id without rewriting unrelated blocks; ids of untouched blocks remain stable for the open session.  
6. No second shell, no second editor stack, no third-party component library import for this surface.

## 7. Absorb record

| Date | Action |
|---|---|
| 2026-07-10 | Owner HFL-005: Markdown 模块式拖拽 as behaviour target on Craft. |
| 2026-07-10 | Black-box study of external 文稿 product: only B1–B8 retained; stack/UI/license paths rejected. |
| 2026-07-10 | External checkout **retired** (`REFERENCE-PROJECT-POLICY` Retired table). Local `源码参考/software/lobehub` may be deleted. |

Implementation does not wait on re-cloning any retired reference.
