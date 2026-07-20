# Context-projection candidate benchmark — Unabyss

Audit date: 2026-07-17. Source: [Unabyss how it works](https://unabyss.com/how-it-works). This is
product-behavior evidence, not source-code evidence or permission to copy a hosted architecture.
The target appears only as an R9/R17 design candidate in M10 Context Pack/Review and C3 bounded
context handoff. It is not present runtime authority. This note is comparison evidence, not a new
module, implementation order, or permission to bypass Craft's current context paths.

## Observed mechanism

Unabyss presents a continuously running context layer: connect multiple sources such as Gmail,
Notion, Calendar, GitHub and Linear; extract and structure information into a profile; classify by
topic, source and sensitivity; control what each AI tool can see; distribute authorized slices over
MCP; and feed work performed in AI tools back into the context so it stays current. The page claims
this is two-way and background-running, but its implementation, freshness guarantees and conflict
resolution are not public source evidence.

## Fleet translation — Craft paths first, R9/R17 projection conditional

| Unabyss behavior | Fleet design | Boundary |
|---|---|---|
| Connected sources | `ExternalSourceRef` + existing Craft Sources/Browser/Workspace adapters | source connectors ingest observations; they do not become memory authority |
| Structured profile | versioned `ContextItem` projections with source, scope, sensitivity, confidence and expiry | not a hidden persona prompt; every item must be inspectable and deletable |
| Per-tool visibility | R9/R17 caller/policy projection candidate scoped by ActorRef, tool, project, source/file, purpose and expiry | extend Craft's permission path only after a real caller proves the missing scope; MCP cannot widen grants |
| MCP distribution | optional compatibility adapter for external tools | MCP is transport/executor, not the internal authority; Fleet's internal Agents use the broker directly |
| Continuous refresh | cursor/checkpointed ingestion jobs with freshness and failure state | no claim of real-time until measured; offline mode uses last-known snapshot visibly |
| Two-way feedback | tool result/evidence events propose new ContextItems or memory changes | never silently rewrite durable memory or raw history |
| “One source of truth” | a possible versioned projection over Craft-owned Session/source/artifact facts | the projection is not a new store; separate provider memories remain external and are never merged blindly |

## Why Fleet is different

Fleet currently inherits Craft's Session, source, provider, permission and tool paths. Future CLI,
API/subscription and remote lanes must extend those paths rather than route every internal request
through MCP. If a measured need later justifies a centralized projection, its target path is:

```text
Source adapters / session evidence / artifacts
              ↓
   optional ContextPack / ContextSegment projection
  (scope, freshness, sensitivity,
   token budget, provider capabilities)
              ↓
Provider adapters: CLI | API | subscription | remote
              ↓
        Agent run + evidence event
              ↓
  feedback proposal / memory review
```

MCP remains useful at the edge: exposing an approved context view to an external editor or importing
an MCP result as evidence. It is not the internal bus, memory store, permission engine or run
authority.

## What Fleet can do better

1. Local-first storage and explicit source-by-source grants instead of requiring a hosted context
   service.
2. Provenance and confidence on every item, with preview-before-share and deletion that removes the
   projection while preserving immutable raw evidence rules.
3. If two real consumers prove the seam, one common projection for Fleet, CLI, browser, remote Agent
   and creative modules, avoiding MCP as the only integration path.
4. Measured freshness, token cost, answer quality and stale-context incidents rather than a generic
   “always current” claim.
5. Conflict-aware write-back: external tool output becomes a proposal/event, never an automatic
   overwrite of a source document, task or memory.

## Absorption decision

| Observation | Useful to Fleet? | Decision |
|---|---|---|
| Multiple sources feed one structured context | Yes | retain as R9/R17 requirements for a measured projection; do not claim an existing ContextPack runtime |
| Per-tool and per-file visibility | Yes, directly relevant to multi-Agent lanes | first test whether Craft's current permission/source boundaries can be extended without a new grant authority |
| Continuous background refresh | Conditionally | research only until checkpoint/freshness/cost/privacy behavior is measured |
| Two-way feedback | Yes, but dangerous | absorb as evidence-backed proposal events, never silent memory writes |
| MCP as universal distribution bus | No for Fleet internals | reject as the internal architecture; keep only as an optional external adapter |
| Hosted universal profile | No | reject; Fleet is local-first and provider-neutral |
| “Never stale” product claim | Not evidence | reject the claim until Fleet has freshness metrics and recovery states |

The only approved absorption from this product reference is the problem decomposition and the
source/grant/freshness requirements. No Unabyss implementation, schema or hosted dependency is being
adopted.

## Future comparison protocol — not an executable slice

After R0, TE1, and a real second consumer expose a gap in Craft's current source/session projection,
an accepted SYS-03 or R6 spec may compare current Craft behavior with a source-linked projection:
route scoped slices to two existing lanes, revoke access through the one Craft permission path, and
verify freshness and omission state. MCP may be tested only as an optional external read-only
adapter. This research file does not authorize building ContextPack, a grant store, a hosted
profile, or automatic write-back.

## Admission status

`PRODUCT_REFERENCE` only. No source checkout, license review or code import is implied. A formal
reference decision requires a reproducible same-task comparison against a Fleet local adapter.
