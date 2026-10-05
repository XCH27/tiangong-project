# Scoped Codex native adapter source

This local integration applies to official Codex tag `rust-v0.156.1`, commit `b412ff32c417f855c2b2d1581b77058eed87c84b`.
It preserves the original auth, model loop and vendor continuation. It is not the default Fleet
executor: Pi Agent Core remains the generic default. Apply the patch only to a fresh checkout,
never to a retained reference or existing user CLI.

The scoped handshake advertises checked catalogue refresh; old scoped binaries fail discovery
with an update diagnosis instead of silently reporting cached success.
Explicit model discovery in a Host-scoped process awaits online refresh through the native model
manager, propagating fetch failures instead of publishing a warm-cache fallback. Ordinary unscoped
Codex behavior is preserved. The CLI still owns authentication, routing and cache storage.
Scoped model discovery returns the native manager's resolved context window for each advertised
exact model, including its native configuration limit. Missing capacity remains absent; there is
no name-based or generic fallback. This is executor capacity, not an output limit or a grant to a
model omitted from the account directory. Unscoped model/list stays unchanged.

The startup `--host-tools-json` ceiling reuses Codex ToolPolicy. Native user/project customizations
are excluded, plugin startup is skipped, and the scoped handshake echoes the exact restriction.
Host receipts and response usage continue through Fleet's existing writers. Cold resume renews
the ceiling and model-response observations; no canonical history or credential store is added.

The tag's Cargo.lock retained workspace package versions 0.0.0 while its manifest used 0.156.1.
The patch normalizes those workspace versions only; external package versions/checksums stay fixed.
SDK build and renderer acceptance remain separately verified in the owning engineering/module
contracts. This recipe is source recovery evidence, not a signed release or blanket platform claim.

Reconstructed source tree: `31d9773f1ae064e7743f398555a94e865247fbb5`.

From the Fleet root, `node scripts/build-codex-host.mjs` verifies this recipe and builds/stages the
optional matched executor. `FLEET_CODEX_SOURCE_DIR` may select a separate adaptation checkout;
an occupied or different checkout is refused. No installed user CLI or credential store is replaced.
