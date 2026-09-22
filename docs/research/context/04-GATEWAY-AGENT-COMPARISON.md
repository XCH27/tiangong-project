# Gateway Agents in Complex Environments: OpenClaw and Hermes

> **Status:** source evidence, not authority. Reviewed pinned checkouts:
> `源码参考/software/openclaw/` (MIT, TypeScript) and
> `源码参考/software/hermes-agent/` (MIT, Python). Admission still follows the reference registry. This
> record supplements the harness diagnosis with evidence from persistent messaging, heartbeat, cron,
> cross-device, and mixed-executor environments.

Current qualification: provider versions, prompt byte/tool counts and source mechanisms below
are measurements at the recorded review boundary. Current app pins Pi 0.85.1 on Craft v0.13.4;
remeasure before implementation. Current OpenHands is a different Agent Canvas tree, so old
Python-executor evidence cannot describe its current HEAD. A general Core controller and a second sandbox remain
excluded; R16 now has the bounded local-app Component contract in SYS-02; these observations authorize no new runtime or environment capability.

## 1. Combined verdict

Complex products are not solved by prompt reduction alone. OpenClaw's own context examples show a large
fixed prompt and tool surface. Both projects instead make cache boundaries explicit, prune according to
cache behavior, expose context size to users, move meta-work off the main lane, and filter or defer tools.

For Fleet: remove task-irrelevant prompt/schema, keep unavoidable stable bytes cache-stable, and keep
governance complexity in the deterministic Craft-derived kernel. Programmatic Tool Calling (PTC) is a
high-leverage future candidate, not current scope.

## 2. OpenClaw mechanisms

OpenClaw uses the same Pi family (`@earendil-works/pi-tui` 0.80.3; the reviewed Fleet snapshot used Pi SDK 0.80.6) and adds a
product-specific gateway and context layer.

| Mechanism | Evidence and transfer |
|---|---|
| Structured prompt assembly | Named stable and dynamic sections; provider overlays replace bounded sections instead of forking the harness |
| Explicit cache boundary | Stable project context precedes volatile messaging, heartbeat, and runtime data; live time is obtained by a tool |
| Prompt modes | Subagents use a `minimal` mode; `none` retains identity only |
| Cache-TTL-aware pruning | Prune tool results after cache expiry, preserve recent turns and bootstrap reads, and reset TTL only after a real change |
| Compaction hygiene | Preserve tool-call/result pairs, recognize provider overflow, use cheaper summary models when configured, and audit summary quality |
| Disk-first memory | Curated memory is injected with visible limits; working memory is indexed and fetched on demand |
| Context visibility | `/context list`, detail, map, usage, and status explain file, tool, and Skill cost |
| Prompt snapshots | Committed snapshots plus CI drift checks make stable-prefix change observable |
| Scheduling discipline | Prefer cron and push completion over sleep/poll loops; bind heartbeat defaults to provider billing behavior |
| Device governance | Effective capabilities, expiring grants, command policy, and frame/display checks precede execution |

Do not import its Gateway, Session database, routing, memory authority, or defaults. Its mechanisms are
references for extending Craft's existing owners.

## 3. Hermes mechanisms

| Mechanism | Evidence and transfer |
|---|---|
| Pluggable `ContextEngine` | A bounded lifecycle decides when/how to compress and which retrieval tools are visible |
| Auxiliary-model meta-work | Compression and curation can run away from the main session and preserve its prompt cache |
| PTC | Model-written code invokes tools through RPC; intermediate results stay outside model context and only stdout returns |
| Session split on compaction | Compression rotates persisted session state and notifies memory providers |
| Reviewed learning loop | Skills can be proposed, refined, pinned, archived, and searched; automatic processes do not need to delete history |
| Backend abstraction | Local, Docker, SSH, Singularity, Modal, and Daytona executors isolate environment differences |
| Capability probing | Toolsets and `check_fn` remove unavailable capabilities before exposure |

Hermes is a mechanism reference because its Python runtime, memory, and compaction authorities must not
replace Fleet's Craft-derived TypeScript spine.

## 4. Shared pattern

1. **Wide product, narrow call, stable prefix.** The product may support many environments while each call
   sees only the effective capability set.
2. **Context management is a named component.** It is not scattered conditional prompt text.
3. **Large state is disk-first and fetched by reference.** Injected curated state is bounded and visibly
   truncated.
4. **Meta-work leaves the main lane.** Summary, curation, and consolidation use auxiliary work without
   damaging the primary cache.
5. **Scheduling avoids paid waiting.** Cron and push events replace polling.
6. **Provider adaptation is cache-safe overlay, not a second harness.**
7. **Context cost is a product surface.** Users and tests can attribute bytes/tokens to inputs.

## 5. Fleet implications in roadmap order

- **TE1:** explain system, tools, files, Skills/Sources, media, history, and governance contributions. A
  byte-observation prompt snapshot plus CI drift check is a valid candidate; a treemap is not required.
- **Post-baseline prompt/tool slice:** structure named stable/dynamic sections before reduction, compare a
  minimal profile to current-full, and keep provider overlays cache-safe.
- **Token-economy evaluation:** test TTL-aware pruning as a candidate only after provider cache behavior is
  measured; do not copy fixed thresholds.
- **R4 and later:** consider PTC only after caller-aware governed actions exist. Script/tool RPC must use
  the same policy and evidence path, initially for deterministic pipelines with measurable context savings.
- **Future automation:** bind heartbeat cadence to billing behavior and require push completion rather than
  polling.
- **R9:** background consolidation runs autonomously with human-readable logs; curation
  (pin/correct/delete) is optional and the D5 secrecy/scope/provenance floors are enforced.

OpenClaw may qualify for licensed local rework after symbol-level admission. Hermes remains pattern-level
evidence unless a separately reviewed TypeScript implementation is justified.

## 6. Source navigation

- OpenClaw: `docs/concepts/{system-prompt,context,compaction,session-pruning,memory,dreaming}.md`,
  `src/context-engine/`, `src/agents/system-prompt*.ts`.
- Hermes: `agent/{context_engine,conversation_compression,curator,turn_finalizer}.py`,
  `tools/code_execution_tool.py`, and its README.
- External: [OpenClaw repository](https://github.com/openclaw/openclaw),
  [OpenClaw docs](https://docs.openclaw.ai/),
  [Hermes repository](https://github.com/NousResearch/hermes-agent), and
  [Hermes docs](https://hermes-agent.nousresearch.com/docs/).
