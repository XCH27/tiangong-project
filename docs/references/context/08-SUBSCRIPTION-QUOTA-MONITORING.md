# Subscription quota monitoring references

This note records source-level findings for subscription quota monitoring. It does not make the
reference projects an authority in Fleet: any admitted mechanism must feed Fleet's existing
credential, provider, settings, and usage authorities.

## cockpit-tools

Reviewed source:

- Repository: `jlcodes99/cockpit-tools`
- Local checkout: `源码参考/software/cockpit-tools`
- Commit: `923cc6c45b8dbfe743ea2e04be33d2fe4fbf5654`
- Review date: 2026-07-29

### What it actually monitors

cockpit-tools keeps **subscription allowance** separate from per-request token accounting and API-key
billing. Its account records persist a normalized quota snapshot, the last successful/attempted
refresh time, and a structured or textual refresh error. The raw provider response is also retained
for forward-compatible inspection. This is the correct boundary for Fleet: subscription windows are
provider entitlements, not context-window tokens and not an inferred cost ledger.

#### Claude subscription

- Credentials come from a Claude Code OAuth credential snapshot. Expired access tokens are refreshed
  with the refresh token at `https://platform.claude.com/v1/oauth/token`; requests identify the
  official client and use PKCE/OAuth scopes defined alongside the account flow
  (`src-tauri/src/modules/claude_account.rs`, constants `CLAUDE_OAUTH_TOKEN_URL`,
  `CLAUDE_OAUTH_CLIENT_ID`, `CLAUDE_OAUTH_SCOPES`, functions `refresh_oauth_credentials`,
  `refresh_account_quota`).
- Allowance is requested from `GET https://api.anthropic.com/api/oauth/usage` with
  `Authorization: Bearer …` and `anthropic-beta: oauth-2025-04-20`
  (`CLAUDE_OAUTH_USAGE_URL`, `request_usage`).
- `usage_to_quota` maps the provider response into five-hour, seven-day, optional model-specific
  seven-day, and optional extra-usage windows. It preserves reset timestamps, extra-credit
  used/limit values, and the raw payload (`src-tauri/src/modules/claude_account.rs`;
  `src-tauri/src/models/claude.rs`, `ClaudeQuota`).
- API-key and desktop-gateway accounts are explicitly rejected from the subscription quota path;
  their usage belongs to the provider console/API billing path
  (`refresh_account_quota`, `unsupported_auth_mode`). This distinction should be preserved.
- The UI builds provider rows from the normalized quota and shows percentage, progress bar, and reset
  time. It does not silently show zero when no quota is available; it renders an empty/error state
  (`src/pages/ClaudeAccountsPage.tsx`, `buildClaudeQuotaSummaryItems`, `renderQuotaSummary`).

#### Codex subscription

- The quota request uses the managed account's OAuth access token and, when available, the
  `ChatGPT-Account-Id` header (`crates/cockpit-core/src/modules/codex_quota.rs`, `fetch_quota`;
  the active Tauri tree contains the corresponding implementation in
  `src-tauri/src/modules/codex_quota.rs`).
- It calls `GET https://chatgpt.com/backend-api/wham/usage`. The response's `rate_limit.primary_window`
  and `secondary_window` become the short and weekly windows; `used_percent` is normalized to
  remaining percentage and reset time accepts either absolute `reset_at` or relative
  `reset_after_seconds` (`UsageResponse`, `parse_quota_from_usage`,
  `normalize_remaining_percentage`, `normalize_reset_time`).
- Expired managed credentials are refreshed through the existing Codex account authority before
  querying. Results update the existing account's quota, plan type, error, and `usage_updated_at`;
  bulk refresh is bounded to five concurrent accounts and respects account/group refresh policy
  (`src-tauri/src/modules/codex_quota.rs`, `refresh_account_quota_once`,
  `refresh_quotas_for_account_ids_with_options`, `refresh_all_quotas`).
- Non-success responses retain request metadata and a provider error code where possible, rather
  than presenting a fabricated allowance (`crates/cockpit-core/src/modules/codex_quota.rs`,
  `extract_detail_code_from_body`, `write_quota_error`).

#### Grok subscription

- OAuth credentials are adopted only after matching the same account across the internal store,
  managed Grok home, and official `~/.grok/auth.json`. Token refresh is serialized per account and
  across processes; rotated refresh tokens are re-adopted before retrying
  (`src-tauri/src/modules/grok_account.rs`, `collect_live_credential_candidates`,
  `pick_best_live_credential`, `refresh_credentials`, `token_lock_for`,
  `acquire_token_refresh_file_lock`).
- It composes the quota from several xAI/Grok endpoints:
  - `https://cli-chat-proxy.grok.com/v1/billing?format=credits`
  - `https://cli-chat-proxy.grok.com/v1/user?include=subscription`
  - `https://grok.com/rest/subscriptions`
  - `https://grok.com/rest/tasks/usage`
  (`BILLING_URL`, `CLI_USER_URL`, `SUBSCRIPTIONS_URL`, `TASK_USAGE_URL`,
  `query_quota`).
- `quota_from_payload` normalizes billing period, weekly used/total/percentage, on-demand cap and
  spend, prepaid balance, task limits, subscription tier/status, and per-product usage. It retains
  the raw billing, subscription, user, and task-usage payloads
  (`src-tauri/src/modules/grok_account.rs`, `quota_from_payload`;
  `src-tauri/src/models/grok.rs`, `GrokQuota` and `GrokAccount`).
- Transport failures are retried up to three times with linear backoff; an HTTP 401 triggers at most
  one forced credential refresh and quota retry. Multi-account refresh is bounded to three
  concurrent accounts. Failed quota refreshes preserve the last successful quota and record a
  timestamped error instead of blanking the UI (`send_with_transport_retry`,
  `should_retry_quota_after_unauthorized`, `refresh_account_inner`,
  `refresh_all_accounts`).

### Refresh and cache projection

- Platform refresh intervals are settings, not component-local timers. Claude and Grok default to
  ten minutes and use `-1` as disabled (`src-tauri/src/modules/config.rs`,
  `default_claude_auto_refresh`, `default_grok_auto_refresh`, `UserConfig` fields).
- `src/hooks/useAutoRefresh.ts` routes scheduled and current-account refreshes through the same
  provider service commands used by manual refresh. Tauri commands refresh the tray after account
  state changes (`src-tauri/src/commands/claude.rs`, `refresh_claude_quota`,
  `refresh_all_claude_quotas`).
- A useful admission principle is **stale-while-error**: retain the last known snapshot, display its
  update time, and expose the latest refresh error. A failed request must never be converted to
  “0% remaining” or “100% remaining”.

### Recommended Fleet admission

Classify this capability as **EXTEND** under the existing “Usage and context accounting” capability
row. Admit the data-flow shape, not a second quota subsystem:

1. The existing provider credential owns authentication and refresh.
2. A provider adapter returns a typed subscription snapshot with `provider`, `account`, `plan`,
   `windows[]`, `updatedAt`, `source`, and optional raw/diagnostic data.
3. The existing settings authority owns refresh policy.
4. The existing Token-ring/details surface projects both context usage and, only for a subscription
   credential with a supported adapter, a separately labelled “Plan usage” section.
5. Unsupported, stale, refreshing, auth-expired, rate-limited, and offline states remain explicit.
6. API-key spend and subscription allowance must not share percentages or reset semantics.

Do not copy cockpit-tools' account manager or timers into Fleet. Fleet needs one credential path and
one provider/account state path; quota adapters should be attached to those existing authorities.

### Caveats

- The Claude OAuth usage endpoint is provider-owned but its beta contract can change. The Codex
  `chatgpt.com/backend-api/wham/usage` and Grok CLI/Grok web endpoints are service-internal surfaces,
  not stable public SDK contracts. Each adapter needs feature detection, raw-payload preservation,
  conservative parsing, and an explicit unavailable state.
- Do not log tokens or full response bodies. cockpit-tools generally stores raw payloads locally,
  but Fleet should store only what its privacy and retention contract permits.
- cockpit-tools is licensed **CC BY-NC-SA 4.0**, with a separate commercial-license offer
  (`README.en.md`, “License” section). Fleet's Apache-2.0/commercial product fork must not copy its
  implementation code or UI verbatim without owner/legal approval. The independently described
  protocol observations and architecture pattern may inform a clean implementation.

## cc-switch

Reviewed source:

- Repository: `farion1231/cc-switch`
- Local checkout: `源码参考/software/cc-switch`
- Commit: `30409878bdbdf1c7091c559d6afc367a052da39c`
- Review date: 2026-07-29
- License: MIT. Substantial copied code still requires the copyright and license notice.

### Normalized contract and provider adapters

`src-tauri/src/services/subscription.rs` defines one provider-neutral result:
`SubscriptionQuota { tool, credential_status, success, tiers, extra_usage, error, queried_at }`.
Each `QuotaTier` contains a provider/window name, used percentage, reset time, and optional USD
values. This is a useful narrow adapter boundary, although Fleet should use its existing provider
and credential types rather than copying cc-switch's `tool` discriminator.

- **Claude:** reads the Claude Code credential from macOS Keychain service
  `Claude Code-credentials`, then falls back to `~/.claude/.credentials.json`. It requests
  `GET https://api.anthropic.com/api/oauth/usage` with the OAuth bearer and
  `anthropic-beta: oauth-2025-04-20`. It recognizes five-hour, seven-day, model-specific weekly,
  unknown object-shaped windows, and `extra_usage`. This path does not own login or refresh.
- **Codex / ChatGPT:** reads Keychain service `Codex Auth`, then the normal Codex auth file. It
  accepts only `auth_mode == "chatgpt"`, requests
  `GET https://chatgpt.com/backend-api/wham/usage`, and sends `ChatGPT-Account-Id` when available.
  Primary and secondary rate-limit windows are normalized by their window length. A separate
  cc-switch-managed OAuth command reuses the same query through its existing account manager.
- **Gemini:** reads Keychain service `gemini-cli-oauth` or `~/.gemini/oauth_creds.json`, refreshes
  expired access tokens through Google's OAuth endpoint, then calls the Cloud Code Assist internal
  `loadCodeAssist` and `retrieveUserQuota` endpoints. Buckets are grouped into Pro, Flash, and
  Flash Lite using the lowest remaining fraction. The refreshed access token appears query-local
  and is not persisted, so repeated polls may repeat refresh work.
- **Grok / SuperGrok:** reads `~/.grok/auth.json`, preferring the `https://auth.x.ai::` OIDC entry
  over the legacy sign-in session. It posts an empty gRPC-web frame to
  `https://grok.com/grok_api_v2.GrokBuildBilling/GetGrokCreditsConfig`. Because no public protobuf
  schema is available, it heuristically scans nested wire fields for a used percentage and reset
  timestamp, then infers weekly/monthly naming from reset distance. It exposes one approximate
  window, not exact dollar totals. Managed xAI OAuth accounts reuse this adapter.

### Cache, refresh, and error semantics

- Every provider request has a 15-second timeout. Transport and response-body interruptions reject
  the command; authentication, non-success HTTP status, and parse failures become explicit result
  states. A 401/403 is credential-expired, never zero allowance.
- `src-tauri/src/commands/subscription.rs` writes only returned snapshots to the process-local usage
  cache and emits `usage-cache-updated`. A rejected transport call does not overwrite the last
  snapshot.
- `src/hooks/useUsageCacheBridge.ts` writes that event into React Query, preventing the Rust cache
  and renderer cache from behaving as competing authorities.
- `src/lib/query/subscription.ts` uses account-scoped query keys, optional polling, focus refresh,
  one retry, and a five-minute default stale interval.
- `src/lib/query/queries.ts` keeps the last successful value for at most ten minutes only for
  rejected transport, HTTP 5xx, or 429 failures. Authentication and other deterministic failures
  invalidate it immediately.
- The expanded UI shows queried time, manual refresh, percentages, reset countdowns, progress bars,
  and optional extra-use spend. Its fixed `TIER_I18N_KEYS` filter hides unknown future windows; Fleet
  should render unknown provider windows generically instead.

### What Fleet should and should not admit

Admit:

1. One typed subscription-quota adapter contract behind the existing credential/account authority.
2. Provider/account-scoped cache keys and one backend-to-renderer projection event.
3. Opt-in refresh policy owned by settings, manual refresh, a last-updated/stale marker, and bounded
   stale-while-transient-error behavior.
4. Immediate invalidation for authentication failures, and explicit unavailable/unsupported states.
5. A separate “Plan usage limits” section in the existing context/usage inspector.

Do not admit:

- A second provider-card quota store or a second credential reader when Fleet already owns the
  connected account.
- Fixed frontend whitelists that hide new quota windows.
- Grok plan names, reset classes, or exact totals inferred beyond what the response proves.
- Local Token-ring percentages as a substitute for provider allowance.
- cc-switch's simple one-retry policy without `Retry-After`, request budgeting, and bounded
  exponential backoff.

### Reliability and contract caveats

The Anthropic OAuth usage endpoint is provider-owned but beta. The ChatGPT `wham/usage`, Gemini
Cloud Code Assist, and Grok gRPC-web endpoints are service-internal, not stable public SDK
contracts. They require feature flags, conservative field detection, privacy-safe diagnostics,
schema-drift fixtures, and graceful degradation. Grok's schema-free protobuf scan is the weakest
adapter and must be labelled best-effort rather than “official exact quota.”

## Comparative conclusion

Both projects confirm the same product model:

- **Context usage** answers how much of the current model context Fleet assembled.
- **API accounting** answers tokens and billed cost returned per request.
- **Subscription quota** answers provider entitlement windows and reset times.

They may share one inspector, but they must remain distinct typed projections. cockpit-tools has the
stronger multi-account refresh and credential-recovery machinery, while cc-switch has the cleaner
provider-neutral quota result and stale-while-error projection. Fleet should implement the latter
shape through its existing provider/account authority and borrow the former's bounded refresh
discipline. Neither reference justifies another account store, another settings home, or fabricated
quota values.
