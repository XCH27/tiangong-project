# Changelog

Releases and major project changes. Normative documents state what is true now; the history of how
it became true lives here and in Git, not in "corrected on…" notes scattered through the docs.

## Unreleased

- Model connection setup now keeps the provider header and model section in one Settings panel
  before and after save. API, local and subscription forms share compact actions and spacing,
  while onboarding keeps its original layout. Known providers link directly to their official
  API key pages; a changed custom endpoint never inherits a provider's key link.
- Fully described, account-listed DeepSeek text models can now use Pi's existing native DeepSeek
  adapter before the installed model registry adds their IDs. Incomplete or media-output rows stay
  out of chat; a later account refresh removes withdrawn routes. DeepSeek's Off effort follows Pi's
  actual `thinking: disabled` request behavior, including the bundled models before a live refresh.
- Model/source selection now serializes with runtime refresh, retires old Pi credentials, and persists model, source and effort together while retaining the same Session history. Removed account models and deleted connections cannot silently run a fallback; empty catalogs no longer borrow Anthropic capabilities.
- Model Settings opens the provider catalog and credential form inside its detail panel; saving
  waits for catalog refresh and selects the saved connection directly. Canceled API validation
  cannot save or finish another form. The composer shares one source/account picker between
  desktop and narrow windows, with source filtering, cross-source search and consistent names;
  hidden models stay hidden and missing catalogs no longer borrow Anthropic models. Even
  the final API connection can be deleted after confirmation, clearing its stored key and fallback.
  DeepSeek's authenticated model list now refines context, output, image-input and reasoning
  levels on the existing Pi route, and an unsupported composer effort resolves to the account
  model's advertised default.
- Custom API connections now choose their actual request format in the same credential form:
  OpenAI Chat Completions, OpenAI Responses, Anthropic Messages or Google Generative AI. The
  selected format persists with the connection and uses Pi's matching direct adapter; native
  provider connections keep their provider-owned discovery and transport. Custom addresses read
  bounded model-ID candidates with matching auth headers and allow explicit import or manual entry;
  IDs alone do not become capability claims. Editing an unchanged provider route tests the model
  before saving; changing provider, endpoint or API format requires re-entering the key.
- Simplified the bounded Model Settings provider panel: the selected connection keeps its key,
  direct model list, refresh and test in one place, without the extra search/filter toolbar or
  speculative row capability badges. Model details now allow per-connection corrections to name,
  context, output limit, image input and reasoning levels; supported missing IDs can be added
  manually. Corrections survive catalog refresh. Edited API keys are tested once before saving using
  the existing connection validator. Multiple accounts of one provider retain separate credentials.
- Moved the existing release-notes reader from desktop and compact Craft menus beside the version in Settings → App → About, labelled Release Notes in all supported UI languages. Its unread indicator follows the action; the next row has a stable Software Updates label while its button reflects the update state. Update checking and document contents are unchanged.
- Model Settings no longer shows a workspace model override, a repeated connection-model picker,
  or a global thinking default. New conversations use the selected connection's model fallback
  and save their effective model and connection; the existing composer owns each conversation's
  model and effort. Legacy workspace and global effort values remain on disk for compatibility
  but do not steer new conversations.

### 2026-09-24 — account-scoped API model discovery

- Model Settings distinguishes conversation models from authenticated or documented media-only
  image, video and audio rows. The latter remain read-only until a media executor and entitlement
  check exist; unknown capability is not guessed.
- OpenAI Platform API-key connections now classify account-visible image, video and audio model
  families from the same authenticated models response. Audio rows distinguish speech generation,
  transcription and realtime modes. Media rows remain read-only; account listing alone does not
  establish generation access or wire a Fleet media executor.
- The composer now presents model and model-supported thinking effort as adjacent controls,
  following ZCode's direct selection pattern with Craft's existing styling and Session callback.
  Duplicate effort entries were removed from the desktop model menu and compact model drawer.
- ChatGPT/Codex subscription connections now read account allowance windows through the selected
  OAuth credential without a second runtime. Settings shows main and additional buckets with
  reset times; missing data, authentication failures and rate limiting remain distinct. The
  private endpoint and account entitlement still require a live signed-in check.
- Model Settings now keeps multiple models under one connection: each catalog row controls picker
  visibility, while the connection default sits below the list. Hiding a model does not revoke it, reset a running Session, or erase
  the choice on catalog refresh.
- OpenAI and DeepSeek API-key connections now query their official model-list endpoints and replace
  stale legacy model tiers with the account-visible intersection that the installed Pi adapters can
  actually execute. The existing provider → saved → SDK fallback remains in place; unknown API IDs
  do not receive invented context, effort or media metadata, and custom endpoints are unchanged.
- OpenAI API-key setup now exposes that same account catalog before save, with one optional default
  model and the full model list synced to the connection afterward. It distinguishes bundled hints
  from an authenticated response rather than hiding the picker for OpenAI.
- Groq and Mistral API-key connections now use their authenticated provider model lists too. Only models
  with installed Pi execution routes appear; explicit inactive, archived and non-chat rows are
  excluded. Provider context, output and vision fields refine the model when present.
- Authenticated Groq, Mistral and Codex model limits now reach the existing Pi inference registry,
  instead of changing only the Settings catalog. Runtime refresh resets stale overrides while
  preserving Pi's provider wire, credentials and pricing policy. Native Pi catalog changes now
  trigger an idle Session refresh with the same model fields used at startup.
- ChatGPT/Codex OAuth connections now query the official account-scoped Codex model catalog through
  the stored ID-token account identity, merge its context/modality/reasoning metadata with Pi's
  executable adapter, and keep subscription rows free of API token prices. Unknown slugs remain
  unavailable until an installed route proves their transport and output limit; quota data stays
  under the runtime-owned allowance path.
- ChatGPT runtime and catalog refresh now share connection-scoped token rotation. A temporary
  network failure no longer deletes the credential; only an explicit invalid grant does.
- Testing an existing Copilot, ChatGPT/Codex, OpenAI, DeepSeek, Groq or Mistral connection now
  checks its authenticated, read-only account model catalog. An invalid credential or unavailable
  selected model is reported, and a stale selection triggers a catalog refresh even when Test fails.
- During setup, DeepSeek, Groq and Mistral now use the entered key for the same authenticated model
  catalog as saved connections. Mistral's inherited `/v1` endpoint is treated as official for old
  connections and omitted as an override in new ones; edited custom hosts remain unqueried.
- Google AI Studio now uses its official paged model list during setup, refresh and connection
  validation. Only account-listed `generateContent` IDs with installed Pi routes are selectable;
  declared input/output limits reach the existing Pi runtime without replacing its effort mapping.

### 2026-09-24 — subscription image capability boundary

- Model Settings now recognizes the documented Codex image route beside an authenticated ChatGPT
  subscription connection, separately from Pi's chat models and xAI's live API-key media catalog.
  It labels account entitlement and allowance as unverified; Fleet image generation remains unwired.
- Restored the model connection panel's stable bounded height after the content-sized variant
  caused the panel to shrink when switching connections.
- Compared official Codex, Hermes, latest fetched Cindy and DeepSeek Harness provider adapters before
  settling the existing Pi/connection boundary. Also reviewed Grok Build and Kimi Code and added
  shallow MiMo Code, Gemini CLI and Qwen Code source checkouts for bounded model/adapter comparison.
  No existing reference checkout was repinned.

### 2026-09-22 — original-source reset, documentation restructure

- **`app/` restored to unmodified official Craft Agents v0.13.4** at the owner's direction
  (「二开文件直接删除，改成最正确的最新版Craft Agents」). Fleet's in-app gate scripts, `.husky` and the
  file-size baseline were removed with it; upstream delta is zero.
- **Workspace revision (Decision P6):** Workspaces stay visible and own their Conversations, Project
  memberships, Sources/MCPs, Skills and component overrides; the same folder may be opened in several
  Workspaces. This supersedes the 2026-07-20 Project = Workspace collapse.
- **Platform scope:** Windows, macOS and Linux desktop; a later Orca-like phone connector.
- **R1 shell/context slice authorized.** A first implementation was rejected — it changed areas
  outside the slice and did not follow Craft's colour/spacing or the Cindy/ZCode layout — and was
  reverted. The slice is re-planned in `TODO.md`.
- **Commit gate repaired.** Deleting `app/.husky/pre-commit` left `.githooks/pre-commit` exiting 127
  on every commit, so about a day of work sat uncommitted. Staged checks now live in
  `scripts/staged-checks.sh` at the repository root. Upstream's OSS `package.json` names 14 scripts
  it does not ship (`typecheck-staged.sh`, `release.ts`, `check-version.ts`, …).
- **Documentation restructured, then made module-first.** 61 files across eight directory levels
  became root files plus `docs/`. A first pass followed a conventional template and produced four
  1,000–1,500-line merged files with each module's detail still scattered across them. The second
  pass splits by job: six shared documents (`product`, `capabilities`, `decisions`, `architecture`,
  `engineering`, `references`) and one self-contained document per module in `docs/modules/`
  (R0/R1/R2 slices plus nine feature modules, which absorbed the orchestration design and the plugin
  registry). Each module opens with a card generated from the capability register; the gate fails
  on a stale card and on any non-ledger document over 700 lines. `AGENTS.md` routes by "before you
  touch X, read Y". Three 63-row capability tables were merged into one register.
- Preserved: `snapshot/codex-01a0c495-2026-09-22` (the uncommitted work before the checkpoint).

### 2026-09-21 — rebuild from upstream v0.13.4

- `app/` replaced with upstream Craft Agents **v0.13.4** (`5a510cf1d`; ten stale files corrected in
  `bc7eb0eb7`). v0.13.4 brings agent steering and mid-stream queueing, context-window usage and the
  composer viewport rewrite as upstream code.
- The previous Fleet tree (147 files modified from upstream, 85 added) is preserved at
  `snapshot/pre-rebuild-2026-09-21` (`7a8f6d5fa`) as a reference list, not a branch to merge.
- **Anti-recurrence gates added:** `scripts/check-upstream-delta.py` (every difference from the pin
  must be declared) and `scripts/check-orphaned-components.py` (a component upstream mounts and we
  do not has lost its home).
- Plugin/Skill architecture decided (P11): one adapter for Claude/Codex/Cursor/Agent-Plugins bundles;
  a catalog is data, not a service. Identity is borrowed, never issued (P4: GitHub device flow).
- All 66 reference checkouts refreshed; ZCode added.

## History before the rebuild

The project restarted three times before 2026-09-21. Each collapse had the same shape: a large,
undeclared, rewrite-shaped delta against Craft; documentation drifting from code; functions lost with
the pages that carried them. That pattern is why the delta and orphan gates exist.

| Date | Event |
|---|---|
| 2026-06-16 | Fleet baseline from craft-agents-oss `a512da7` (`2e930d55b`) |
| 2026-06-20 | Reset #1: clean Craft base and documents (`c8df222db`) |
| 2026-07-11 | Planning documents reset to a code-grounded set (`b9fea6150`); Craft v0.11.1 baseline verified (`c7fd6dea0`) |
| 2026-07-20 | Owner direction: every plan is a Craft second-development plan; collapse redundant surfaces (OV-007, OV-008) |
| 2026-08 | No commits. `源码参考/` became a symlink on 08-08 while 73 files stayed in the Git index; Git does not traverse symlinks, so they read as deleted. The rolling pin sat at v0.12.0 for three weeks from 08-17. Fixed 09-09 (`c487815ec`) |
| 2026-09-09 | Pre-R0 audit snapshot (`backup/pre-r0-audit-2026-09-09`, `92fbc2e97`) |
| 2026-09-11 | Rebase to Craft v0.13.3. The ExpertKit-as-label, delegation, memory, artifact-history, CLI-adapter and workbench modules were discarded |
| 2026-09-20 | Upstream v0.13.4 identified; commit gates made to survive a fresh clone (`scripts/init.sh`) |

## Recoverable references

| Ref | Contains |
|---|---|
| `snapshot/pre-rebuild-2026-09-21` | The complete Fleet tree before the v0.13.4 rebuild |
| `snapshot/codex-01a0c495-2026-09-22` | Uncommitted documentation work of 2026-09-21/22 |
| `archive/stash-2026-07-31-unlanded` | 43 files of work stashed on 2026-07-31 and never landed; predates the v0.13.3 rebase — review hunk by hunk, never merge |
| `archive/musing-dubinsky-2026-09-20` | A removed worktree's final state |
| `backup/pre-r0-audit-2026-09-09`, `backup/pre-r0-audit` | Dirty-tree snapshots before the R0 audit |
