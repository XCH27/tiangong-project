# Token-saving candidate inventory (owner-curated, 2026-07-18)

> Owner-collected open-source projects and papers for token saving, with the owner's own
> corrections applied (claude-mem 87.7k★/AGPL-3.0 confirmed; headroom ~38k★; SuperClaude
> −30%~50% per official docs; CAT = academic paper; claude-mem reclassified to cross-session
> injection; claude-task-master = MIT + Commons Clause).
>
> **Status of every row: `candidate` or `EVIDENCE_ONLY` unless the admission ledger
> [`../REFERENCE-REGISTRY.md`](../REFERENCE-REGISTRY.md) says otherwise.** Star counts and effect
> percentages are self-reported/collected claims, re-verified at admission. Layer mapping refers to
> `../../modules/suites/SYS-03-context-economy.md` §3; integration tier refers to §4.

## Route A · Input physical compression

| Project | License | Mechanism | Claimed effect | Layer | Fleet tier |
|---|---|---|---|---|---|
| rtk (Apache-2.0, ~71.6k★) | ✅ permissive | CLI proxy rewriting terminal output: ANSI strip, log dedup, test-success folding, diff-noise removal | −60~90% shell output | L2 | **already core-fused** (`rtk-rewrite.ts`, optional binary + passthrough) — extend coverage |
| headroom (Apache-2.0, ~38k★) | ✅ permissive | API relay proxy: AST-prunes uncalled code, JSON key compression before send | −60~95% input | L2/L4 | **mechanism only** — relay-proxy product form rejected (P8/local-first); usage-normalization patterns feed the ledger |
| context-mode (ELv2, 19.1k★) | ⚠️ ELv2 license gate | MCP server: large tool outputs → local SQLite FTS5, replaced by short query IDs | ~−98% tool-output redundancy | L2 | mechanism reference for stale-output pointering; ELv2 forbids casual code reuse |
| LLMLingua-2 (MIT, 6.4k★, ACL'24) | ✅ | Token-importance classifier physically trims low-contribution tokens | 2–5x compression, ms latency | L4 | mechanism/local-model candidate; bulk reference material only, per-trace A/B gated |
| claw-compactor (MIT, 2.2k★) | ✅ | 14-stage AST-aware reversible pipeline: comments, unused imports, test noise | −60~80% code/text | L2/L4 | mechanism candidate; reversibility aligns with §5 guardrail 4 |

## Route B · Output-side rules

| Project | License | Mechanism | Claimed effect | Layer | Fleet tier |
|---|---|---|---|---|---|
| caveman (MIT, ~88k★) | ✅ | Hook-injected minimal-grammar rules: no modifiers, forced short forms | −65% avg output | L5 | **rejected as default** (human-facing quality is product value); informs opt-in `terse` profile for machine steps |
| ponytail (MIT, 85.4k★) | ✅ | "Lazy developer" ladder: reuse → native lib → generate last | −22% tokens, −54% code | L5 | Craft-first already supplies reuse-first development guidance; any product-prompt wording change waits for the post-baseline profile slice |
| SuperClaude_Framework (MIT, 23.6k★) | ✅ | Compressed slash commands + minimal personas + UltraCompressedMode | −30~50% (official docs) | L5 | ≈ existing Skills/loadouts; no new mechanism to import |
| claude-token-efficient (MIT, 5.6k★) | ✅ | Minimal CLAUDE.md ruleset; no post-success explanations | −20~30% reply text | L5 | informs terse profile wording |

## Route C · Session governance

| Project | License | Mechanism | Claimed effect | Layer | Fleet tier |
|---|---|---|---|---|---|
| planning-with-files (MIT, 25.4k★) | ✅ | Disk-persisted plan/findings/progress files free active memory; `/clear`-safe | breaks long-session accumulation | L0/L3 | ≈ TaskContract + evidence pointers; pattern already core design |
| claude-task-master (MIT + Commons Clause, 27.9k★) | ⚠️ Commons Clause | PRD → atomic sub-tasks, each in fresh minimal context | 5–10k vs 80k per task | L0 | **the route-C evidence for C3/R6**; mechanism only, no code import (license gate) |
| 📄 Context-as-Tool (arXiv:2512.22087) | N/A paper | Context management as a callable tool; structured workspace (stable semantics / condensed long-term / high-fidelity short-term) | proactive compaction | L3 | **design source for the compaction session tool** |

## Route C-2 · Cross-session compression + injection

| Project | License | Mechanism | Claimed effect | Layer | Fleet tier |
|---|---|---|---|---|---|
| claude-mem (AGPL-3.0, 87.7k★) | 🚫 AGPL gate | Hooks capture session traces → AI-compressed summaries in SQLite → Chroma hybrid retrieval injects relevant fragments into new sessions | −90~95% active context (self-reported) | L6 | **product form rejected** (auto-memory violates D5; AGPL). Retrieval-injection *mechanism* informs R9 reviewed-experience injection |

## Route D · Repo packing and on-demand retrieval

| Project | License | Mechanism | Claimed effect | Layer | Fleet tier |
|---|---|---|---|---|---|
| repomix (MIT, 26k★) | ✅ | Compact multi-file packing replaces exploratory read_file walks | fewer tool calls | L2 | **optional connector** (Sources/MCP), on-demand |
| codegraph (MIT, 59k★) | ✅ | tree-sitter symbol graph in SQLite; returns only affected symbol ranges | replaces recursive reads | L2/D | **optional connector**; later candidate behind the Code-intelligence CONDITIONAL row |
| context7 (MIT, 59.3k★) | ✅ | On-demand version-specific docs retrieval via MCP | replaces pasted READMEs | L2/D | **optional connector** (MCP), already compatible |

## Route E · Cache alignment and semantic interception

| Project | License | Mechanism | Claimed effect | Layer | Fleet tier |
|---|---|---|---|---|---|
| DeepSeek-Reasonix (MIT, 27.1k★) | ✅ | Three-zone prompt architecture (immutable prefix / append log / scratch) for byte-stable prefixes | 90%+ prefix cache hits, −90% prefill | L1 | **mechanism adopted** into L1 cache-alignment engineering (already SYS-01/03 reference) |
| GPTCache (MIT, 8.1k★) | ✅ | Vector semantic cache returns stored responses above similarity threshold | 100% on hit | — | **rejected for agent lanes** (silent semantic substitution); per-connector idempotent-lookup use only ever opt-in |

## Owner's recommended-stack table — Fleet mapping

| Owner's pick | Fleet disposition |
|---|---|
| ① rtk | already fused; extend coverage (L2) |
| ② caveman | replaced by opt-in terse profiles (L5) — default quality preserved |
| ③ claude-task-master | superseded by C3/R6 TaskBrief envelopes (L0) — same evidence, governed form |
| ④ claude-mem | superseded by R9 reviewed-experience injection (L6) — governed, license-clean |
| ⑤ GPTCache | not adopted for agent lanes; provider prompt caching via L1 delivers the safe version of this win |
