# Reference audit library

Reference projects are evidence sources, not automatic dependencies. The cross-domain fact table is
[`REFERENCE-REGISTRY.md`](REFERENCE-REGISTRY.md); a project enters a module packet only after
source/product comparison, fixed-commit review, license review and a local surpass test. A
product-only reference may inform behavior but never authorizes code copying.
The highest-risk source-level findings are recorded in
[`ADMISSION-V2-AUDIT.md`](ADMISSION-V2-AUDIT.md); `pending` there means evidence exists but
admission has not been earned.
Machine-review attempts and validator failures are preserved in `GROK-RUN-LOG.md`.

Required record fields: repository and commit, license, exact files/symbols reviewed, mechanism
absorbed, Fleet seam, why we cannot trivially surpass it, rejected alternatives, and final status
(`FORMAL_REFERENCE`, `MODULE_REFERENCE`, `PRODUCT_REFERENCE`, `LOCAL_IMPROVEMENT`,
`EVIDENCE_ONLY`, or `REJECT`).

The complete recovered intake is grouped by system suite in
[`LEGACY-CANDIDATE-MAP.md`](LEGACY-CANDIDATE-MAP.md); the initial video candidates are enumerated
in [`video/00-CANDIDATE-INVENTORY.md`](video/00-CANDIDATE-INVENTORY.md). A candidate list is not a
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

Reference consumption is synchronized with the R0–R18 development order in
[`../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md).
Craft is checked first for every row. Pi is consumed only by TE1/R3 harness comparison;
OpenHands by R16/R18 executor closure; Hermes/OpenClaw by R14/R16. A retained checkout is a cache,
not permission to move its capability earlier or replace a Craft authority.
