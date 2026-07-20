# Craft Agents official documentation mirror

This directory is the local, auditable reference for upstream Craft Agents documentation. It is
reference material, not Fleet product authority: Fleet behavior is defined by current code and the
numbered documents under `docs/`.

## What is available locally

1. `online-current/` mirrors every page listed by the official
   `https://agents.craft.do/docs/llms.txt` index, including the OpenAPI specification, and preserves
   the official sitemap used to cross-check the index. These pages describe the current hosted
   product and may be newer than Fleet's pinned source baseline.
2. `legacy-unindexed/` preserves official pages that remain reachable but are no longer listed in the
   documentation index or sitemap. They are historical evidence, not current product authority.
3. `source-v0.11.1-document-files.txt` indexes the documentation, Agent instructions, development and
   contribution guides, README files, compliance notices,
   and release notes already present in the pinned upstream checkout at
   `源码参考/software/craft-agents-oss/`.
4. `SYNC-MANIFEST.txt` records the retrieval time, pinned source commit, file count, and SHA-256
   checksums for the online mirror.

Run `scripts/sync-craft-official-docs.sh` to refresh the hosted documentation. Review the resulting
diff before accepting it: hosted documentation is mutable and is not guaranteed to describe v0.11.1.

## How to use this during a feature change

For each coherent feature slice, compare all three authorities before editing:

1. the exact v0.11.1 implementation under `源码参考/software/craft-agents-oss/`;
2. its bundled/versioned documentation and release notes, using
   `source-v0.11.1-document-files.txt` to locate them;
3. the matching hosted page under `online-current/` for later behavior or deployment details.

Then classify the Fleet work as REUSE, EXTEND, or NEW and update Fleet's user-facing documentation in
the same slice when behavior or wording changes.

Use this compact record for the owner confirmation before a feature is edited; do not create a
permanent document for a small slice:

```text
Frontend: entry, interaction, visible states
Backend: existing authority and request → handler → state/persistence → visible result
Unchanged: adjacent behavior explicitly kept
Docs after implementation: exact user-facing/bundled doc
Evidence consulted: pinned code/doc + hosted clue when relevant
Classification: REUSE | EXTEND | NEW
```

If the hosted docs and v0.11.1 code disagree, record the difference and trust the code for current
behavior. If Fleet intentionally changes behavior, update the applicable bundled/user-facing docs;
do not edit this mirror to make upstream appear to agree.

## Craft-operated cloud dependencies found in the code

This is an inventory, not permission to remove a capability without tracing its complete data path.

| Capability | Current upstream dependency | Fleet treatment |
|---|---|---|
| Online session sharing | Upload/update/delete against `https://agents.craft.do/s/api`; persists `sharedId` and `sharedUrl` | Replace with local export and an optional user-controlled/self-hosted viewer. Until that loop exists, do not present official upload as a Fleet-native capability. |
| Upstream Craft updates | Official releases, release notes, source tags, manifests and binaries under `https://agents.craft.do/electron` | Keep an upstream-update channel that detects and explains new Craft versions so Fleet can selectively absorb fixes and features. Do not install the official binary over Fleet. |
| Fleet application updates | The inherited updater currently points at Craft's binary channel | Point binary installation to Fleet-controlled releases or a user-configured Fleet channel. Disable installation cleanly while no Fleet release channel exists. |
| Help/documentation links and Docs MCP | `https://agents.craft.do/docs` and `/docs/mcp` | Prefer this local mirror and bundled docs. A current online link may remain explicitly marked as external reference. |
| WebUI OAuth relay | Stable callback through `https://agents.craft.do/auth/callback` | Desktop should use the existing local callback path; remote WebUI needs a configurable self-hosted callback/relay. No hidden mandatory Craft relay. |
| Slack OAuth relay | `https://agents.craft.do/auth/slack/callback` | Replace with locally configured app credentials and callback where feasible, or make Slack connection explicitly optional and unavailable without configuration. |
| Craft Docs/MCP services | `mcp.craft.do`, `connect.craft.do`, and Craft source presets | Keep only as optional external connectors selected by the user; they must never be required for Fleet startup, projects, sessions, files, permissions, or remote access. |
| Branding, support and developer feedback wording | Craft names, domains and addresses | Replace with Fleet-local branding and local feedback storage or remove the submission entry until Fleet owns a destination. |

The non-cloud `craftagents://` deep-link scheme is local application routing, not an official-server
dependency. It should be renamed only as part of a deliberate compatibility migration.
