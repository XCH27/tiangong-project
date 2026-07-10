# Review Consolidation — 2026-07-09

Raw GPT-5, Fable-5, Gemini 3.5 Flash, and Grok 4.5 review packages remain under the repository-root
`model-reviews/` folders. A prior deletion was premature and was restored. Review packages are
evidence inputs, not an alternate control plane, and one model must not delete or edit another
model's folder.

## Retained Findings

1. Preserve the product thesis and shared Session/Permission/Action/Timeline spine; do not build second stores or a new shell.
2. Use `WAVE-MODULE-MAP.md` as the single execution-state source; packets cannot grant writes to frozen contracts.
3. Keep core action IDs in their frozen two-segment form; reserve longer namespaces for plugins only.
4. Canonicalize AgentSeat, identity-tag projection, action/event vocabulary, and the L0–L3 naming boundary before parallel work.
5. Browser uses BrowserPane/WebContentsView and treats external sites as read/annotate/evidence only.
6. Canvas/jobs/media/web/deck remain downstream modular work; resource limits, state authority,
   capability/workflow/view contracts, and adapter spikes must be specified before implementation.
7. Avoid implicit Git rollback; use operation-level inverse/snapshot/atomic-write semantics.
8. Treat external research comparisons as nonbinding; current official Craft Agents baseline is v0.11.0 and the local base requires a controlled migration.

## Disposition

The raw review packages are retained and clearly nonbinding. Promoted conclusions live in the
Decision Ledger, architecture, contracts, Wave Map, readiness register, and module specs. Future
cleanup may archive duplicates only after a per-file value/replacement record and explicit owner
approval; deletion is not the default.
