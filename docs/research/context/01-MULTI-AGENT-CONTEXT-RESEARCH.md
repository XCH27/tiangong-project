# Multi-Agent Context Sharing: Product, Paper, and OSS Evidence

> **Status:** design evidence, not implementation authority. Admission still requires a pinned revision,
> license review, concrete source symbols, a Fleet seam, and a local comparison under the reference
> registry. Canonical owners are the accepted specs for M10, C3, SYS-01, R6, and the existing Craft
> authorities.

## 1. Decision

Fleet's design already anticipates bounded handoff, ContextPack projection, preview, and sensitivity
scanning. Runtime support is not complete. Creating a `ContextBroker`, `ContextGrant`, global memory bus,
or another store would duplicate Craft Session, Sources, permission, provider adapters, usage, and
compaction.

Only three evidence-backed additions are retained:

1. **Selective projection:** derive a different bounded slice for each lane, project, purpose, budget,
   file scope, and sensitivity class.
2. **Auditable lifecycle:** every slice exposes provenance, version, freshness, expiry, and revocation;
   external agents can propose changes but cannot silently overwrite memory or source files.
3. **Measured compression:** judge refresh and summary policies by accepted outcomes, context precision,
   tokens, latency, stale events, and revocation delay.

MCP remains an external compatibility adapter, not Fleet's internal bus. Direct CLI, API, subscription,
and remote-agent adapters must preserve provider capabilities, budget, permission, and evidence metadata.

## 2. Product evidence

| Product | Useful mechanism | Fleet boundary |
|---|---|---|
| [Cursor Rules and Memories](https://docs.cursor.com/context/rules) | Project/user/path scopes; inspectable and removable memories | Scoped, previewable, revocable projections; no hidden provider memory |
| [Claude Code memory](https://docs.anthropic.com/en/docs/claude-code/memory) | Project, user, and local layers; discovery and inspection | Show the effective load scope; import through adapters rather than duplicate authority files |
| [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/cli-usage) | Resume, directory bounds, structured events, allow/deny controls | Preserve these facts in the provider adapter; Fleet permission remains authoritative |
| [Codex plugins](https://help.openai.com/en/articles/20001256-plugins-in-codex) | Packaged skills/apps/connectors and role boundaries | Display capability, data scope, side effects, permission, and uninstall path before admission |
| [Unabyss](https://unabyss.com/how-it-works) | Source structure, sensitivity, per-tool visibility, refresh, feedback | Comparison target only; reject a hosted universal profile and internal MCP bus |

## 3. Research evidence

| Paper | Transferable idea | Boundary |
|---|---|---|
| [MemGPT](https://arxiv.org/abs/2310.08560) | Budgeted paging and observable compaction | Does not define Fleet authorization or storage |
| [Generative Agents](https://arxiv.org/abs/2304.03442) | Preserve observations and make reflection reviewable | Reflection cannot write authoritative state directly |
| [A-MEM](https://arxiv.org/abs/2502.12110) | Provenance, tags, links, confidence, correction proposals | Autonomous history rewriting risks drift |
| [Agentic Memory](https://arxiv.org/abs/2601.01885) | Retain/correct/delete as explicit actions | A learned policy cannot replace local permission and audit |
| [LongMemEval](https://arxiv.org/abs/2410.10813) | Test extraction, multi-session reasoning, time, updates, abstention | Retrieval similarity is not a quality result |
| [Lost in the Middle](https://arxiv.org/abs/2307.03172) | Long context can hide centrally placed evidence | More tokens do not prove better sharing |

The combined result supports layered retrieval, explicit operations, visible omission, freshness, and
measurement. It does not support a universal global memory.

## 4. OSS candidates

| Project | Useful mechanism | Admission decision |
|---|---|---|
| [Letta](https://github.com/letta-ai/letta) | Tiered and tool-driven memory across CLI/API | Product evidence only; reject its server and second store |
| [Mem0](https://github.com/mem0ai/mem0) | Pinned `ddaa655edf41`; explicit add/search/update/delete plus tests/evaluation | `EVIDENCE_ONLY`; retain mechanism source, never its service or memory authority |
| [Graphiti](https://github.com/getzep/graphiti) | Temporal edges and historical state | Spike only if simple ContextSegment links fail a real task |
| [LangGraph](https://github.com/langchain-ai/langgraph) | Checkpoint, interrupt, resume, review nodes | Orchestration comparison only; do not replace Craft TaskRunner |
| [LlamaIndex](https://github.com/run-llama/llama_index) | Ingestion, chunking, retrieval evaluation | Research chunking only; no second file/artifact authority |
| [Continue](https://github.com/continuedev/continue) | IDE/CLI and context-provider adapters | Product comparison; no second settings authority |
| [agentmemory](https://github.com/jayzeng/agentmemory) | Local Markdown, Git-friendly sharing, search hooks | Adapter evidence only; lacks Fleet identity, sensitivity, approval, and tombstones |

Current checkout presence is recorded in the reference registry; this paper/product list does
not decide retention or authorize cloning. Popularity is not admission evidence. Each
candidate needs a pinned commit, license/dependency review,
specific source symbols, a local seam, the same-task benchmark, and proof that a smaller Craft extension
does not outperform the imported mechanism.

## 5. Conditional target shape

```text
Source adapters / Session evidence / Artifacts
                    ↓
ContextSegment (provenance, scope, sensitivity, freshness, budget)
                    ↓  preview + policy
ContextPack / TaskBrief (lane-specific projection)
                    ↓
CLI | API | subscription | remote-agent adapter
                    ↓
RunReport / ArtifactRef / UsageRecord / evidence event
                    ↓
scoped evidence → logged single-writer consolidation → new projection version; optional human curation
```

This is not a current interface contract. Session, Task, Timeline, permission, and UsageRecord each retain
one Craft-derived owner. TaskBrief/RunReport are bounded handoff; a future reviewed memory entry is
cross-run retention; ArtifactRef is delivery by reference; SessionEvent preserves raw evidence.

## 6. Required experiments before implementation

After R0, TE1, and real multi-lane callers exist:

1. Send one fixed task to two existing lanes with differently authorized projections; record projection
   version, input components, and accepted outcome.
2. Change a source and prove stale display, version advance after refresh, and honest last-known behavior
   offline.
3. Revoke a lane grant and prove future runs lose access while immutable prior evidence remains auditable.
4. Prove D5 scoped autonomous consolidation, source attribution, preserved pins and effective user correction/deletion; do not require per-entry approval.
5. Compare success, citation correctness, context precision/recall, tokens, latency, refresh failure,
   revocation latency, and disclosure violations.

First validate whether `sourceRevision/hash`, `observedAt`, `freshnessClass`, `omittedReason`,
`policyVersion`, and `providerProjectionId` are necessary in fixtures; do not call them current fields.
Reuse accepted SYS-03/R6 acceptance IDs. Do not create a new broker, grant store, memory store, tracker, or
registry ID from this research record.

## 7. Final disposition

- **Adopt:** layered context, explicit scoped projection, provenance, freshness, budget, proposal feedback,
  provider adapters, recovery, and audit.
- **Conditional:** background refresh, temporal graph retrieval, and automatic compaction after metrics and
  failure states exist.
- **Reject:** internal MCP bus, hidden global memory, unlogged or unscoped automatic write-back, hosted universal profile,
  and unpinned reference claims.
