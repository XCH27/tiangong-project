# Reference audit library

Reference projects are evidence sources, not automatic dependencies. The cross-domain fact table is
[`REFERENCE-REGISTRY.md`](REFERENCE-REGISTRY.md); a project enters a module packet only after
source/product comparison, fixed-commit review, license review and a local surpass test. A
product-only reference may inform behavior but never authorizes code copying.
Retained findings carry their original source locks in that registry. The consuming suite owns
outstanding comparison and acceptance work; there is no separate historical audit or gap queue.
Execution attempts belong in thread/test evidence, not a second Markdown run journal.

Required record fields: repository and commit, license, exact files/symbols reviewed, mechanism
absorbed, Fleet seam, why we cannot trivially surpass it, rejected alternatives, and final status
(`FORMAL_REFERENCE`, `MODULE_REFERENCE`, `LOCAL_IMPROVEMENT`,
`EVIDENCE_ONLY`, or `REJECT`).

Candidates belong to a registered capability's source comparison. The video evidence targets are
enumerated in [`video/00-CANDIDATE-INVENTORY.md`](video/00-CANDIDATE-INVENTORY.md). A candidate list is not a
review result. If a row has no immutable commit and exact source paths in the registry, it must
remain `candidate` even when the product matrix mentions it.
Marketplace-specific product observations and Fleet design decisions are recorded in
[`marketplaces/00-MARKETPLACE-BENCHMARK.md`](marketplaces/00-MARKETPLACE-BENCHMARK.md).
Cross-tool context federation is benchmarked in
[`context/00-UNABYSS-BENCHMARK.md`](context/00-UNABYSS-BENCHMARK.md). The owner-curated
token-saving tool/paper inventory (with license gates and Fleet layer mapping) is
[`context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md`](context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md);
its design consumer is `../modules/suites/SYS-03-context-economy.md`.
The broader mainstream-product, paper and open-source review is in
[`context/01-MULTI-AGENT-CONTEXT-RESEARCH.md`](context/01-MULTI-AGENT-CONTEXT-RESEARCH.md); it is
an evidence packet, not a new context authority or capability ID.
The final harness diagnosis and remediation candidate — covering Databricks, Pi, Craft Agents,
OpenHands, Hermes and OpenClaw — is
[`context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md`](context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md). It does
not itself own a release contract. Its accepted direction is now promoted as Decision E13 and into
the roadmap, token-economy authority and affected specs; ordered product-code slices still obey those
canonical gates.
The complex-environment supplement for Hermes/OpenClaw is
[`context/04-GATEWAY-AGENT-COMPARISON.md`](context/04-GATEWAY-AGENT-COMPARISON.md); it remains
`EVIDENCE_ONLY` and cannot activate PTC, memory, compression or gateway work.

Other retained source notes have distinct consumers; their recorded revisions are historical
evidence and must be rechecked before implementation:

| Evidence | Current consumer / boundary |
|---|---|
| [Grok planning and execution](context/05-GROK-BUILD-HARNESS-RESEARCH.md) | R1 work-mode contract; automatic plan entry in a reference does not override Fleet's opt-in rule. |
| [Mode and permission comparison](context/06-MODE-SELECTION-COMPARISON.md) | R1 independent Plan and action permission; ZCode controls and Cindy model popup. Reasoning remains model-specific. |
| [xAI authentication](context/07-XAI-GROK-AUTHENTICATION.md) | Existing connection/credential authority; client registration and entitlement must be verified before an OAuth integration. |
| [Pi, Hermes and OpenClaw provider architecture](context/09-PI-HERMES-OPENCLAW-PROVIDER-ARCHITECTURE.md) | Existing runtime adapter; old SDK versions are source locks, not upgrade instructions. |

Subscription-allowance evidence is consolidated in the
[current quota comparison](REFERENCE-REGISTRY.md#subscription-allowance-comparison); its contract
lives in [SYS-03](../modules/suites/SYS-03-context-economy.md#subscription-allowance-acquisition-and-display).
It is separate from Session token accounting and API billing.

Reference consumption is synchronized with the R0–R18 development order in
[`../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md).
Craft is checked first for every row. Current product scope and release anchors come from PRODUCT,
the roadmap and packet index, not a historical reference queue. R16 is the bounded local-app Component; retained
OpenHands/Hermes/OpenClaw evidence does not authorize a general Core controller or second sandbox.
A retained checkout is a cache, not permission to activate a capability or replace an authority.

Per-project `FLEET-ADAPTATION.md` guides are generated from the
[current checkout/document intake](REFERENCE-REGISTRY.md#current-checkouts-and-development-document-intake)
and the canonical execution contracts. Each guide preserves the historical source-review revision,
links upstream authoring documents already present in the checkout, and names reuse limits.
Run `python3 scripts/reference-guides.py --write` at the Fleet root after updating those canonical
facts; `--check` validates HEAD/origin, documentation paths and generated content without fetching.
Reference refresh is not code admission, dependency installation or an application-baseline update.
