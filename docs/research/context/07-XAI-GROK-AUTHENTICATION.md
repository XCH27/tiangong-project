# xAI / Grok Authentication and Subscription Access

Status: `EVIDENCE_ONLY`
Reviewed: 2026-07-28
Fleet capability classification: **EXTEND** the existing provider/backend and desktop OAuth seams.
This packet does not authorize a second credential store, provider authority, or settings home.

## Question and answer

Fleet can support a user's Grok subscription without asking for an xAI API key. xAI now explicitly
supports subscription-backed OAuth in third-party coding products: its Kilo Code announcement says
that SuperGrok or X Premium+ users can sign in with xAI Grok OAuth and use Grok without a separate
API key; it separately names a device-code route for VPS, SSH, Docker, and WSL environments
([xAI, 2026-05-27](https://x.ai/news/grok-kilocode)). xAI also advertises Grok Build to SuperGrok
and X Premium Plus subscribers ([xAI, 2026-05-25](https://x.ai/news/grok-build-cli)) and a
subscription connection in Warp ([xAI, 2026-06-15](https://x.ai/news/grok-warp)).

This does **not** make a consumer subscription interchangeable with xAI API credits. The official
API quickstart still creates an API key in the xAI Console and uses `XAI_API_KEY`
([xAI API quickstart](https://docs.x.ai/developers/quickstart)); management API keys belong to an
API team and carry endpoint/model ACLs
([xAI management authentication](https://docs.x.ai/developers/rest-api-reference/management/auth)).
Fleet must therefore expose two credential modes under one xAI connection:

1. **Grok subscription** — OAuth access and refresh tokens; entitlement and quota are decided by
   xAI at request time.
2. **xAI API** — an `XAI_API_KEY`/console key with API billing and team ACLs.

They may share an inference adapter, but must not share labels, billing claims, refresh behavior, or
secret shape.

## Sources reviewed

| Source | Fixed revision / authority | Exact evidence |
|---|---|---|
| Grok Build | `xai-org/grok-build` at `b41c75a578f98bddbd326ab02cd53618451d97ee`, Apache-2.0 | `crates/codegen/xai-grok-pager/docs/user-guide/02-authentication.md`; `xai-grok-shell/src/auth/oidc/`; `xai-grok-config-types/src/lib.rs` |
| OpenCode | `sst/opencode` at `40e4d730cac33cc9e76659ae7acb16b3a6132b83`, MIT | `packages/opencode/src/plugin/xai.ts`; `packages/opencode/src/auth/index.ts`; `packages/opencode/src/provider/provider.ts` |
| Hermes Agent | `NousResearch/hermes-agent` at `571aab64dca90d4fd8ab210f0ccf36615bda9bae`, MIT | `hermes_cli/auth.py`; `tools/xai_http.py`; `run_agent.py` |
| xAI product and API docs | primary, live on 2026-07-28 | linked inline and in [Primary sources](#primary-sources) |

The local checkouts are evidence caches. The linked commits are the review boundary; later upstream
behavior must be rechecked before implementation.

## Official xAI boundary

### Supported authentication lanes

Official Grok Build documents four lanes:

- default browser OAuth at `auth.x.ai`;
- device-code OAuth for headless or remote environments;
- `XAI_API_KEY` as the non-session fallback;
- enterprise OIDC or an external auth provider.

It writes interactive credentials to `~/.grok/auth.json` with owner-only permissions, refreshes
before expiry and on a 401, and gives an active session token precedence over `XAI_API_KEY`
([official authentication guide at the reviewed commit](https://github.com/xai-org/grok-build/blob/b41c75a578f98bddbd326ab02cd53618451d97ee/crates/codegen/xai-grok-pager/docs/user-guide/02-authentication.md)).
The current product overview likewise says the first launch opens a browser and documents
`XAI_API_KEY` for a non-browser environment
([Grok Build overview](https://docs.x.ai/build/overview)).

The official source implements OAuth as a native/public-client flow, not as web-cookie import.
Authorization Code uses PKCE; token refresh uses the stored refresh token. Device authorization is
an alternate transport for the same xAI account, not a second account or provider.

### Subscription entitlement is server-authoritative

xAI's public product wording has changed over time and differs by integration. The current first
party announcements name SuperGrok and X Premium+ for Kilo Code, and “Grok or X Premium” for Warp.
Fleet must not infer entitlement only from a locally selected plan name. After OAuth, it should:

- discover/list the models the credential can actually use;
- surface an entitlement or quota error without retrying it as an invalid-token loop;
- avoid promising that every xAI API endpoint is included;
- keep plan names descriptive, while treating xAI's response as authoritative.

## OpenCode implementation

OpenCode implements xAI as one provider with three connection methods:

- browser OAuth for a SuperGrok subscription;
- RFC 8628 device-code OAuth for headless/remote use;
- manual API key.

The implementation is in
[`packages/opencode/src/plugin/xai.ts`](https://github.com/sst/opencode/blob/40e4d730cac33cc9e76659ae7acb16b3a6132b83/packages/opencode/src/plugin/xai.ts):

- lines 10–39 define the xAI issuer endpoints, OAuth scopes, client ID, and exact loopback callback;
- lines 56–76 generate PKCE, state, and nonce material;
- lines 118–181 build the authorization request and exchange/refresh tokens;
- lines 198–285 implement device authorization, including `authorization_pending`, `slow_down`,
  denial, expiry, and a hard timeout;
- lines 304–449 own a single loopback callback listener and validate `state`;
- lines 458–546 single-flight refresh concurrent requests, persist a rotated token pair, and replace
  the SDK's placeholder bearer with the real OAuth bearer;
- lines 550–623 expose browser OAuth, remote OAuth, and API key as methods of the same xAI provider.

OpenCode stores both API and OAuth credentials in its existing auth service, rather than a
provider-specific file. Its auth schema and owner-only `0600` write are in
[`packages/opencode/src/auth/index.ts`](https://github.com/sst/opencode/blob/40e4d730cac33cc9e76659ae7acb16b3a6132b83/packages/opencode/src/auth/index.ts).
No xAI browser-cookie or Grok web-session extraction is used.

### Useful mechanism

- One provider and one credential authority with multiple sign-in methods.
- Browser PKCE plus device-code fallback.
- Proactive refresh plus one reactive retry on authentication failure.
- Single-flight refresh and persistence of the rotated refresh token.
- API key and OAuth are different credential variants.

### Mechanisms not safe to copy as-is

OpenCode reuses the Grok CLI OAuth client ID and an xAI-registered fixed loopback port. Its own
comments acknowledge that non-allowlisted clients are rejected. That is evidence that the protocol
works, not evidence that an unrelated Fleet-branded application may claim the same registered
client identity. The `plan=generic` and `referrer=opencode` query parameters are also
integration-specific and must not be copied into Fleet.

OpenCode's fetch override writes the OAuth bearer onto the outgoing request but does not visibly
enforce an xAI-host allowlist at that point. Fleet should keep its existing source-auth boundary and
bind an xAI OAuth bearer only to the canonical/approved xAI inference origin.

## Hermes Agent implementation

Hermes also uses OAuth and API keys, not cookies:

- `hermes_cli/auth.py` lines 110–120 define the `auth.x.ai` issuer, discovery document, device
  endpoint, client ID, scopes, and refresh skew;
- lines 200–205 register “xAI Grok OAuth (SuperGrok / Premium+)” separately from the direct xAI API
  key provider at lines 352–359;
- lines 3868 onward read, validate, refresh, and persist xAI OAuth state in Hermes' existing auth
  store;
- lines 7046–7195 perform device authorization and standards-aware polling;
- `tools/xai_http.py` lines 224–277 resolve OAuth first and then fall back to `XAI_API_KEY` for
  direct xAI HTTP tools;
- `run_agent.py` lines 2045 onward distinguish token-validation failures from subscription,
  permission, and exhausted-resource failures to prevent futile refresh loops.

Source:
[`hermes_cli/auth.py`](https://github.com/NousResearch/hermes-agent/blob/571aab64dca90d4fd8ab210f0ccf36615bda9bae/hermes_cli/auth.py),
[`tools/xai_http.py`](https://github.com/NousResearch/hermes-agent/blob/571aab64dca90d4fd8ab210f0ccf36615bda9bae/tools/xai_http.py), and
[`run_agent.py`](https://github.com/NousResearch/hermes-agent/blob/571aab64dca90d4fd8ab210f0ccf36615bda9bae/run_agent.py).

Hermes adds credential pools and profile/root token mirroring because its own product supports
multiple profiles. Fleet must not import that subsystem: Fleet already has one connection/settings
authority. The reusable lesson is narrower—rotating refresh tokens require an atomic update at the
single owning record, and concurrent refreshes must not replay an old token.

Some Hermes comments assert tier details that conflict with newer official xAI announcements. Those
comments are useful test/error-handling evidence, but xAI's current official entitlement statements
take precedence.

## Fleet admission decision

The relevant capability-map rows are the existing Claude/Pi backend seam (**REUSE**), desktop OAuth
callback (**REUSE**), and additional provider routing (**EXTEND**, API/OAuth lanes only). Admission:

| Candidate | Decision | Fleet seam / reason |
|---|---|---|
| xAI API-key connection | **REUSE / EXTEND** | Add xAI metadata to the existing model connection/provider route; preserve the current secret store and settings home. |
| xAI subscription OAuth | **EXTEND after owner/provider checkpoint** | Add an OAuth credential variant to the same xAI connection and existing desktop OAuth path. |
| Browser Authorization Code + PKCE | **REUSE / EXTEND** | Reuse Fleet's callback authority; validate state, PKCE, nonce/issuer where applicable, exact callback ownership, cancellation, and timeout. |
| Device Authorization Grant | **EXTEND** | Same connection and token record; use only when browser callback is unavailable or the user selects remote/headless sign-in. |
| Refresh and 401 recovery | **EXTEND** | One token-refresh manager, single-flight refresh, atomic rotated-pair persistence, at most one reactive retry. |
| Borrow Grok CLI's client ID and fixed port | **REJECT until xAI authorizes Fleet** | Registered client identity, redirect URI, branding, telemetry attribution, and production terms are provider-owned. |
| Copy `~/.grok/auth.json` or `~/.hermes/auth.json` | **REJECT** | Couples Fleet to another app's secret format and refresh ownership; risks invalidating rotating tokens. |
| Import Grok browser cookies/local storage | **REJECT** | No reviewed first-party, OpenCode, or Hermes implementation requires it; it bypasses the supported OAuth contract. |
| New xAI-specific credential/settings store | **REJECT** | Violates Fleet's one-settings/one-credential-authority boundary. |
| Hermes credential pool/profile mirror | **REJECT** | Solves a different product authority and would duplicate Fleet's connection model. |

## Required production contract

No production implementation should begin until the owner chooses the xAI client-registration
route. Registering/depending on an OAuth client is an external production dependency and therefore
an owner checkpoint.

After that checkpoint, the minimum correct slice is:

1. **One xAI connection record.** Persist `authKind: api_key | oauth`, never a second “Grok
   subscription provider.” Store access/refresh/expiry/account metadata through the existing secret
   authority.
2. **Two OAuth transports.** Desktop uses Authorization Code + PKCE. Remote/headless uses device
   authorization. Both write the same credential variant and share logout, refresh, error, and
   model-discovery behavior.
3. **Registered Fleet OAuth identity.** Use a Fleet client ID and Fleet-approved redirect URIs
   obtained from xAI. Do not ship OpenCode's or Grok CLI's identity by observation.
4. **Strict endpoint binding.** Resolve discovery only from the expected HTTPS issuer, validate
   returned endpoints, and attach the bearer only to approved `x.ai` API hosts (or an
   owner-configured enterprise issuer/proxy with an explicit trust record).
5. **Robust refresh.** Refresh before expiry; serialize refresh per connection; atomically persist
   rotated access and refresh tokens; retry one request after a 401; make invalid-grant require
   sign-in rather than loop.
6. **Truthful entitlement states.** Distinguish `reauth required`, `subscription required`,
   `quota exhausted`, `model unavailable`, `rate limited`, and network errors. Never report an
   entitlement failure as a bad password or API-credit shortage without evidence.
7. **Capability discovery.** Populate models and optional tools from the live credential's supported
   response. An API-key connection and a subscription connection may expose different models and
   limits even when they use the same base URL.
8. **No secret migration by default.** Do not read another application's auth file or browser
   profile. A future explicit import would require a separate security and token-ownership review.
9. **Verification below visual review.** Cover state/PKCE mismatch, callback timeout/port conflict,
   device pending/slow-down/denied/expired paths, simultaneous refresh, rotated-token write failure,
   one-time 401 recovery, endpoint exfiltration prevention, logout, and entitlement error mapping.

Until xAI supplies/approves the client identity, subscription OAuth is **not implemented**. The xAI
API-key lane can be independently `usable` if its existing backend path is wired and verified.

## Primary sources

- [xAI: Use Grok in Kilo Code](https://x.ai/news/grok-kilocode)
- [xAI: Introducing Grok Build](https://x.ai/news/grok-build-cli)
- [xAI: Use Grok in Warp](https://x.ai/news/grok-warp)
- [xAI: Grok Build overview](https://docs.x.ai/build/overview)
- [xAI: Enterprise deployments](https://docs.x.ai/build/enterprise)
- [xAI API quickstart](https://docs.x.ai/developers/quickstart)
- [xAI management API authentication](https://docs.x.ai/developers/rest-api-reference/management/auth)
- [xAI Grok plan comparison](https://x.ai/pricing)
- [X Help: X Premium](https://help.x.com/en/using-x/x-premium)
- [Official Grok Build authentication guide at the reviewed commit](https://github.com/xai-org/grok-build/blob/b41c75a578f98bddbd326ab02cd53618451d97ee/crates/codegen/xai-grok-pager/docs/user-guide/02-authentication.md)
