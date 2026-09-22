# Pi, Hermes, and OpenClaw provider architecture

Status: **EVIDENCE_ONLY**

This note retains provider-mechanism findings at the source locks below. Current observation on
2026-09-21: Fleet/Craft v0.13.4 pins `@earendil-works/pi-ai` and `pi-coding-agent` **0.85.1**.
`models-pi.ts` and `llm-connections.ts` still import the compatibility catalog. The earlier
0.80.6→0.82.1 upgrade recommendation is obsolete; inspect the installed 0.85.1 adapter and current
provider gap before recommending another upgrade. No dependency update is authorized by this note.

## Source lock

| Source | Local checkout | Commit | License |
|---|---|---|---|
| [Craft Agents](https://github.com/craft-ai-agents/craft-agents-oss) | official current `HEAD` checked in a temporary clone | `a60ebc1a5a7cb0a6af7a77d5eed0512c5fc07658` (`0.11.2`) | Apache-2.0 |
| [earendil-works/pi](https://github.com/earendil-works/pi) | `源码参考/software/pi-mono` | `a470b121bf683b4c2b9fc0b3a7c807de7e0cfe9c` | MIT |
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | `源码参考/software/hermes-agent` | `7e67f64fcee9340f40a1c6f912fc650aa4984510` | MIT |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | `源码参考/software/openclaw` | `3cb7f6330c76c385070a4b6f6c2981163c28384b` | MIT |

At the recorded review, the Pi source declared 0.82.1 and the reviewed Craft 0.11.2 pinned 0.80.6.
Those numbers are historical source locks, not today's dependency baseline. The current registry
records refreshed checkouts separately. Source findings below apply to their recorded revisions;
revalidate relevant exports, authentication and usage semantics against the installed package.

## How Fleet embeds Pi

Fleet does not copy Pi source into its application kernel. It consumes version-pinned npm
packages and runs a Fleet-owned subprocess adapter:

- `app/packages/pi-agent-server/src/index.ts` wraps `@earendil-works/pi-coding-agent`.
- `app/packages/shared/src/config/models-pi.ts` projects Pi model metadata.
- `app/packages/server-core/src/handlers/rpc/llm-connections.ts` uses Pi catalog and OAuth
  helpers behind Fleet RPC.
- `app/package.json` and `app/bun.lock` are the update boundary.

This boundary is directionally correct: Pi supplies inference/provider mechanics while Fleet
continues to own settings, credentials, sessions, permissions, and usage projection. Pi does
not update automatically. Fleet must deliberately bump the pinned packages and verify its
adapter whenever provider authentication, model capability metadata, transport behavior, or
security fixes are needed.

Fleet currently depends on Pi's deprecated compatibility catalog
(`@earendil-works/pi-ai/compat` `getProviders()` / `getModels()`). Current Pi instead centers
the `Models` collection, `Provider.refreshModels()`, and an application-supplied
`CredentialStore`. A Pi update should therefore be treated as an adapter migration, not only
as changing two version strings.

## Current Pi findings

Relevant files:

- `packages/ai/src/models.ts`
- `packages/ai/src/auth/types.ts`
- `packages/ai/src/types.ts`
- `packages/ai/src/compat.ts`
- `packages/ai/src/providers/anthropic.ts`
- `packages/ai/src/providers/openai-codex.ts`
- `packages/ai/src/providers/xai.ts`
- `packages/ai/src/providers/kimi-coding.ts`

Current Pi provides:

1. Provider-owned static metadata, live model refresh, request streaming, filtering, and
   provider-specific authentication declarations.
2. `ApiKeyCredential | OAuthCredential`, with serialized refresh/write behavior supplied
   through a `CredentialStore`.
3. Model capabilities including context size, cost, reasoning support, and
   `thinkingLevelMap`, so unsupported thinking controls can be hidden and supported levels
   can map to provider/model-specific values.
4. Both API-key and subscription paths for Anthropic, Kimi Coding, and xAI; OpenAI Codex is
   OAuth-based. The xAI provider explicitly exposes **“xAI (Grok/X subscription)”** and
   **“Sign in with SuperGrok or X Premium”**.

Therefore Fleet should not independently recreate Grok subscription OAuth before evaluating
the current Pi provider. The old Fleet pin does not expose the current xAI subscription
mechanism. OAuth client registration, upstream terms, and production credentials remain an
owner checkpoint even when the implementation is MIT-licensed.

## Hermes findings

Relevant files:

- `providers/base.py`
- `providers/README.md`
- `plugins/model-providers/README.md`
- `hermes_cli/auth.py`
- `hermes_cli/models.py`
- `hermes_cli/inventory.py`
- `agent/usage_pricing.py`
- `run_agent.py`

Hermes's reusable idea is a declarative `ProviderProfile`: identity, display metadata,
authentication kind, environment keys, endpoint, model discovery, fallback models, vision,
headers, token limits, and request hooks live in one provider declaration. That declaration
automatically feeds configuration, authentication, diagnostics, model inventory, runtime,
and transport. Provider plugins can add or override profiles.

Hermes supports API keys and several distinct subscription mechanisms, including OpenAI
Codex, xAI OAuth, MiniMax OAuth, Qwen OAuth, OpenCode Go, Copilot, AWS, and Vertex. Its model
inventory deliberately separates subscription identities from direct API identities.
Runtime code distinguishes authentication failure, entitlement failure, and exhausted quota;
for xAI it explains that an OAuth token may be valid while the subscription, model
entitlement, or quota is unavailable.

Fleet should admit the declarative metadata and automatic adapter-registration pattern.
Fleet should not admit Hermes's configuration/auth files as another credential authority,
nor its user-plugin last-writer-wins override policy without Fleet validation and ownership.

## OpenClaw findings

Relevant files:

- `packages/model-catalog-core/src/model-catalog-types.ts`
- `packages/model-catalog-core/src/model-catalog-normalize.ts`
- `packages/llm-core/src/types.ts`
- `src/plugins/model-catalog-registration.ts`
- `src/plugins/provider-thinking.ts`
- `src/agents/auth-profiles/types.ts`
- `src/agents/auth-profiles/`
- `src/infra/provider-usage.types.ts`
- `src/infra/provider-usage.fetch.ts`
- `src/infra/provider-usage.auth.ts`
- `src/plugin-sdk/provider-usage.ts`

OpenClaw now has its own reusable AI/model packages rather than merely exposing a thin Pi
wrapper. Its strongest mechanisms for Fleet are:

1. A normalized plugin model catalog with stable provider/model references, remote overlays,
   capability metadata, visibility rules, and provider-specific model-id normalization.
2. Model-level `thinkingLevelMap` where missing levels use provider defaults and `null`
   explicitly marks an unsupported level.
3. Typed auth profiles for API keys, static tokens, and refreshable OAuth, plus non-secret
   profile state for order, last-good selection, cooldown, rate limits, billing failures,
   subscription blocks, and model-scoped failures.
4. Provider usage adapters that normalize quota windows, resets, plan/account identity,
   balances, spend/budget, daily cost history, model token breakdown, and billing categories.
   Current built-ins include Claude, Codex, DeepSeek, Gemini, MiniMax, and Z.ai; plugins can
   contribute more.

The useful boundary is the normalized contract, not OpenClaw's persistence. Fleet must project
these concepts into its existing connected-account and usage-ledger authorities. Copying
OpenClaw's auth-profile database or provider configuration wholesale would violate the
single-authority rule.

## Admission decision

| Capability | Decision | Fleet boundary |
|---|---|---|
| Pi inference and coding-agent runtime | **REUSE / UPDATE** | Keep the subprocess adapter; retain installed 0.85.1 until a concrete compatibility/security/provider gap justifies an update. |
| Dynamic provider/model catalog | **EXTEND** | Replace deprecated compat reads with a Fleet adapter over current Pi `Models`, enriched by a normalized catalog contract inspired by OpenClaw. |
| Provider declarations | **EXTEND** | Admit Hermes-style declarative metadata and auto-registration, but register into Fleet RPC/settings rather than a second registry UI or store. |
| API key and OAuth credentials | **REUSE / EXTEND** | Fleet connected accounts remain authoritative; expose credential variants through adapters implementing Pi's store interface. |
| Unsupported API providers | **NEW ADAPTER** | Add a provider plugin/adapter only after checking current Pi; declare endpoint, auth, discovery, capability, and usage behavior in one manifest. |
| Subscription providers | **NEW ADAPTER OR PI UPDATE** | Treat subscription auth as a credential variant, not as a new provider settings authority; preserve direct-API and subscription identities when entitlements differ. |
| Thinking/fast-mode UI | **EXTEND** | Drive visibility and choices entirely from model capabilities; no fixed global list and no control for unsupported models. |
| Allowance/quota monitoring | **EXTEND** | Add provider-specific read-only usage adapters projected into Fleet's usage ledger. Authentication success is not quota evidence. |
| Profile rotation/cooldown | **CONDITIONAL EXTEND** | OpenClaw's failure taxonomy is useful, but routing state must remain inside Fleet's existing connection authority. |

## Recommended update policy

Fleet should track Pi releases, but it should not blindly follow every upstream commit:

1. Record the currently published Pi package version and release commit.
2. Review provider/auth/type changes and the Fleet adapter diff.
3. Update all Pi packages as one compatible set.
4. Verify model discovery, API-key auth, each adopted OAuth flow, thinking-level negotiation,
   streaming usage, tool calls, cancellation, and subprocess recovery.
5. Keep a rollback lockfile and do not use an unpublished research checkout in production.

For an API or membership that Pi still does not support, implement one provider adapter with
four facets: authentication, model discovery/catalog, runtime transport/capabilities, and
usage/entitlement. Register all four through the existing Fleet authorities. Do not add
provider-specific secrets to UI state, do not infer quota from context tokens, and do not
present estimated allowance as provider-reported allowance.

## Upstream roles and ownership

Fleet must not treat Craft, Pi, OpenCode, Hermes, and OpenClaw as five product upstreams that
all require continuous synchronization. They have different roles:

| Source | Role for Fleet | Update obligation |
|---|---|---|
| Craft | Visual language and agent/runtime base; PRODUCT owns Fleet concepts | Periodic pinned comparison and bounded best-of admission; never a wholesale merge. |
| Pi | Embedded inference/runtime dependency behind the Fleet subprocess adapter | Exact version lock; upgrade for security, provider breakage, or admitted capability after compatibility review. |
| OpenCode | Desktop UX and provider/model/usage mechanism reference | Admit a bounded pattern or licensed implementation, attribute it, then Fleet owns the admitted code. |
| Hermes | Provider declaration, discovery, and adapter-mechanism reference | Snapshot evidence only; no automatic synchronization. |
| OpenClaw | Model catalog, auth-failure, quota, billing, and provider-plugin mechanism reference | Snapshot evidence only; no automatic synchronization and no adoption of its control-plane authority. |

This changes the maintenance model from “follow several forks” to one product baseline, one
runtime dependency, and several evidence donors. Reference snapshots should record commit,
license, admitted mechanism, and rejection boundary. Once admitted, Fleet tests and owns the
implementation; a later donor release creates no automatic update requirement.

Model and provider freshness should also be separated from application releases. A normalized
Fleet catalog may refresh signed or provider-reported model metadata and entitlement data
without upgrading Craft, Pi, or the desktop application, while executable adapter code remains
versioned and reviewed.

## Fleet operates itself

Hermes and OpenClaw primarily expose tools that operate external services, channels, browsers,
and computers. Fleet has a stricter requirement: an agent must operate Fleet itself without
clicking Fleet's own UI and without creating an agent-only authority.

The correct boundary is a Fleet-owned typed domain-command plane:

1. Existing Session, Workspace, Task, Settings, Credential, Permission, and Usage services
   remain the only authorities.
2. Each supported self-operation is exposed once as a typed command/query with validation,
   permission classification, idempotency behavior, and a structured result.
3. Renderer actions, Agent tools, automations, CLI/API calls, and future management agents all
   call that same command. They do not mutate renderer state or private storage directly.
4. The existing permission broker authorizes commands that can change data or produce external
   effects.
5. Durable command receipts and resulting domain events project into the existing session
   timeline and task board; they do not form another event store.
6. Specific outside-tool operations use their authorized structured paths; general computer control is excluded. Fleet never uses screen coordinates
   to control its own first-party features.

Therefore Fleet is similar to Hermes/OpenClaw at the adapter edge, but different at the center:
their reusable contribution is provider and external-tool integration; Fleet's center is its
own domain-command registry projected through one authority.

## Current action boundary

The source comparisons do not establish that a Pi update is now required or sufficient. Keep one
provider/credential/usage authority, verify the current adapter against a concrete user-visible gap,
and route any new provider behavior through its owning post-baseline contract. No provider catalog,
quota adapter or self-operation command is reported implemented by this research note.
