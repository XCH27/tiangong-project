# References — implementation evidence and comparisons

Reference projects are evidence, not dependencies. On the retained branch Craft is the current
implementation comparison; it has no automatic preference in the OV-025 baseline reassessment. A
project enters a module only after source comparison, a fixed-commit review, a licence review
and a local surpass test. A product-only reference informs behaviour and never authorizes copying
code. Each record carries: repository and commit, licence, exact files and symbols, mechanism
absorbed, Fleet seam, why it cannot be trivially surpassed, rejected alternatives, and a status —
`FORMAL_REFERENCE`, `MODULE_REFERENCE`, `LOCAL_IMPROVEMENT`, `EVIDENCE_ONLY` or `REJECT`.

Raw research notes live in [`research/`](research/) and have these consumers:

| Evidence | Consumer and boundary |
|---|---|
| [Grok planning and execution](research/context/05-GROK-BUILD-HARNESS-RESEARCH.md) | R1 work-mode contract; a reference's automatic plan entry does not override Fleet's opt-in rule |
| [Mode and permission comparison](research/context/06-MODE-SELECTION-COMPARISON.md) | R1 Plan and action permission; ZCode controls and Cindy model popup |
| [xAI authentication](research/context/07-XAI-GROK-AUTHENTICATION.md) | Existing connection authority; client registration must be verified before an OAuth integration |
| [Pi, Hermes and OpenClaw provider architecture](research/context/09-PI-HERMES-OPENCLAW-PROVIDER-ARCHITECTURE.md) | Existing runtime adapter; SDK versions are source locks, not upgrade instructions |
| [Context-economy observations](#retained-context-economy-observations), [multi-agent context research](research/context/01-MULTI-AGENT-CONTEXT-RESEARCH.md), [token-saving inventory](research/context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md) | [SYS-03](modules/context.md); source/product evidence only; current policy is not defined here |
| [Canvas product reverse analysis](research/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md) | [SYS-05](modules/canvas.md) |
| [Video candidates](research/video/00-CANDIDATE-INVENTORY.md) | [SYS-06](modules/media.md) |
| [MiniMax hub plugin stack](research/plugins/00-MINIMAX-HUB-PLUGIN-STACK.md) | [marketplace](modules/marketplace.md#plugin-skill-and-marketplace-design) |

## Latest upstream source snapshots

The complete public-reference inventory was refreshed from official refs on 2026-10-05:
154 requested repository URLs resolve to 152 canonical upstreams. Default-branch source and 115
GitHub-marked published-tag sources are available as frozen, complete worktrees. Original
checkouts, required Craft/ZCode pins and local source changes are preserved. `源码参考/latest/`
provides the current entry, including `software/`, `plugins/` and `github/<owner>/<repo>` links.
The derived full source/verification index is `源码参考/meta/current-upstream.json`.

The default-branch SHA below is the current source-intake lock. Published tags may name a
particular component or an alpha version; their full labels are retained. Numeric maximum alone
cannot determine the current product line: Cindy reset its version, and Qwen/ACP/Context7/xyflow/
DeepAgents publish separate components. OpenCode v2.0.23 and Flowgram v1.0.15 currently have tags
without matching GitHub releases; both source snapshots are retained with that narrower label.
Additional matched component copies include DeepAgents 1.14.1, Context7 MCP 4.1.1 and React Flow
12.12.0. Actual feature comparisons and installed Fleet dependencies keep their own source locks.
All 70 public code-submodule occurrences are checked out at their parent pins and verified. Private BrowserOS internal docs,
Blender binary toolchain caches and large Git LFS payloads are excluded from source-only intake. No dependency installation, hook execution or product
cutover is implied by source availability. Historical reviewed file/line records below retain
that evidence level until their complete feature chains are rechecked.

| Upstream | Default source SHA (branch) | Current source | Published tag source | Canonical origin / archived |
|---|---|---|---|---|
| [Open-Dev-Society/OpenStock](https://github.com/Open-Dev-Society/OpenStock) | `e109f188480b7e5f4a8349dde582aeea45875071` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/Open-Dev-Society--OpenStock--e109f188480b>) | No GitHub latest release | [origin](https://github.com/Open-Dev-Society/OpenStock) / no |
| [TencentCloud/Octop](https://github.com/TencentCloud/Octop) | `eb28011249c02cafd389b2d424294c6c1b9cf422` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/TencentCloud--Octop--eb28011249c0>) | [v1.0.2b6](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/TencentCloud--Octop--eb28011249c0>) · `eb28011249c02cafd389b2d424294c6c1b9cf422` | [origin](https://github.com/TencentCloud/Octop) / no |
| [0xsline/OpenChatCut](https://github.com/0xsline/OpenChatCut) | `f6f6fefc4f3b586259f8f1ea5b2e5643ebb6e062` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/0xsline--OpenChatCut--f6f6fefc4f3b>) | [v0.2.15](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/0xsline--OpenChatCut--bb2a4f7e1bb5>) · `bb2a4f7e1bb587aa55f3816583ec180d58eb1432` | [origin](https://github.com/0xsline/OpenChatCut) / no |
| [aaif-goose/goose](https://github.com/aaif-goose/goose) | `fb7d185b0581e8a64d2ea3404dcfdd32a0aea782` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/aaif-goose--goose--fb7d185b0581>) | [v1.53.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/aaif-goose--goose--76da81cb964b>) · `76da81cb964b21cd096db739302329b40c2998b8` | [origin](https://github.com/aaif-goose/goose) / no |
| [agentclientprotocol/agent-client-protocol](https://github.com/agentclientprotocol/agent-client-protocol) | `302e6f7cd6131bf28d006f32a4aabdfa18c86da7` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/agentclientprotocol--agent-client-protocol--302e6f7cd613>) | [schema-v1.24.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/agentclientprotocol--agent-client-protocol--1761180eeddf>) · `1761180eeddf0828d4ecc367106a632c61be06d9` | [origin](https://github.com/agentclientprotocol/agent-client-protocol) / no |
| [agentskills/agentskills](https://github.com/agentskills/agentskills) | `69ef37e9424c0a7ea9dd2293b559e43ec8176379` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/agentskills--agentskills--69ef37e9424c>) | No GitHub latest release | [origin](https://github.com/agentskills/agentskills) / no |
| [anomalyco/opencode](https://github.com/anomalyco/opencode) | `907b3bc518fa48e90e8ec24dd327d13eee71c36c` (`dev`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/anomalyco--opencode--907b3bc518fa>) | [v1.18.34](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/anomalyco--opencode--aec0b9a6d889>) · `aec0b9a6d8898f68f923aaf08b7306d931fd9d76` | [origin](https://github.com/anomalyco/opencode) / no |
| [Augani/openreel-video](https://github.com/Augani/openreel-video) | `c9340465e5d37e684cc25bdbe746c4ccd45e165c` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/Augani--openreel-video--c9340465e5d3>) | [v1.0.0-alpha.17](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/Augani--openreel-video--f818d429d61b>) · `f818d429d61bd8a6657ae1bd494eda99269649ad` | [origin](https://github.com/Augani/openreel-video) / no |
| [badlogic/pi-mono](https://github.com/badlogic/pi-mono) | `b9ab918c626ad3dd5edb58de037540f9467def88` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/earendil-works--pi--b9ab918c626a>) | [v1.0.3](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/earendil-works--pi--d78dc83d6332>) · `d78dc83d633229d12f8b79631384c4c2717c399f` | [origin](https://github.com/earendil-works/pi) / no |
| [bokuweb/react-rnd](https://github.com/bokuweb/react-rnd) | `fec7303134ab0f0bbe83fdf975ddc15c340f7e5d` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/bokuweb--react-rnd--fec7303134ab>) | [10.5.3](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/bokuweb--react-rnd--fec7303134ab>) · `fec7303134ab0f0bbe83fdf975ddc15c340f7e5d` | [origin](https://github.com/bokuweb/react-rnd) / no |
| [browser-use/browser-harness](https://github.com/browser-use/browser-harness) | `afbcc381b963040c19627d788e40c7e7663171ee` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/browser-use--browser-harness--afbcc381b963>) | [v0.1.13](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/browser-use--browser-harness--c24e5072ee66>) · `c24e5072ee66f8499bacd663f4f4bcb089bc4492` | [origin](https://github.com/browser-use/browser-harness) / no |
| [browser-use/browser-use](https://github.com/browser-use/browser-use) | `7be96ed8bafa8dfe1eef228b59cf5c884b8b2431` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/browser-use--browser-use--7be96ed8bafa>) | [0.13.10](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/browser-use--browser-use--5c892e013a73>) · `5c892e013a73e6622e6f50336e1eb0aa2c4405f2` | [origin](https://github.com/browser-use/browser-use) / no |
| [bvaughn/react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) | `8c0573b7938b50c868ae837813fda8945e36b596` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/bvaughn--react-resizable-panels--8c0573b7938b>) | [4.14.2](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/bvaughn--react-resizable-panels--8c0573b7938b>) · `8c0573b7938b50c868ae837813fda8945e36b596` | [origin](https://github.com/bvaughn/react-resizable-panels) / no |
| [bytedance/flowgram.ai](https://github.com/bytedance/flowgram.ai) | `7a309c4694a89fa0398aa8d78e63ee33e72c5054` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/bytedance--flowgram.ai--7a309c4694a8>) | [v1.0.14](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/bytedance--flowgram.ai--56b191dad5a5>) · `56b191dad5a59e037d62816e8a3d85d6e9b59b59` | [origin](https://github.com/bytedance/flowgram.ai) / no |
| [calesthio/OpenMontage](https://github.com/calesthio/OpenMontage) | `9327439db69021ab4b0e2776729bf3b58fdb5a87` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/calesthio--OpenMontage--9327439db690>) | No GitHub latest release | [origin](https://github.com/calesthio/OpenMontage) / no |
| [Cerebras/cerebras-cloud-sdk-node](https://github.com/Cerebras/cerebras-cloud-sdk-node) | `eb228a80a5a8a61bf0fae561845a15e3b8617a55` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/Cerebras--cerebras-cloud-sdk-node--eb228a80a5a8>) | No GitHub latest release | [origin](https://github.com/Cerebras/cerebras-cloud-sdk-node) / no |
| [CherryHQ/cherry-studio](https://github.com/CherryHQ/cherry-studio) | `50d69b685697a8c3a634bc8b4f19ce3978768423` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/CherryHQ--cherry-studio--50d69b685697>) | [v2.1.4](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/CherryHQ--cherry-studio--072aab935a03>) · `072aab935a0340b3e5f288b8328f3aaae24c918d` | [origin](https://github.com/CherryHQ/cherry-studio) / no |
| [chuspeeism/dashi-taskboard](https://github.com/chuspeeism/dashi-taskboard) | `6a79ef522238ff11681cb85a9d803d19442a3d00` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/chuspeeism--dashi-taskboard--6a79ef522238>) | [v1.1.26](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/chuspeeism--dashi-taskboard--6a79ef522238>) · `6a79ef522238ff11681cb85a9d803d19442a3d00` | [origin](https://github.com/chuspeeism/dashi-taskboard) / no |
| [craft-ai-agents/craft-agents-oss](https://github.com/craft-ai-agents/craft-agents-oss) | `73bd9c2a3573158bea880984eb8d5fdb41e0cac2` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--73bd9c2a3573>) | [v0.14.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--73bd9c2a3573>) · `73bd9c2a3573158bea880984eb8d5fdb41e0cac2` | [origin](https://github.com/craft-ai-agents/craft-agents-oss) / no |
| [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | `5badb15009ae1756c3afe0ae0cef1faafc290ccc` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/deepseek-ai--deepseek-harness--5badb15009ae>) | No GitHub latest release | [origin](https://github.com/deepseek-ai/deepseek-harness) / no |
| [drona23/claude-token-efficient](https://github.com/drona23/claude-token-efficient) | `0d30a6db75af983b8ababf585f28faefdfc87895` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/drona23--claude-token-efficient--0d30a6db75af>) | No GitHub latest release | [origin](https://github.com/drona23/claude-token-efficient) / no |
| [earendil-works/pi](https://github.com/earendil-works/pi) | `b9ab918c626ad3dd5edb58de037540f9467def88` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/earendil-works--pi--b9ab918c626a>) | [v1.0.3](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/earendil-works--pi--d78dc83d6332>) · `d78dc83d633229d12f8b79631384c4c2717c399f` | [origin](https://github.com/earendil-works/pi) / no |
| [egoist/waku](https://github.com/egoist/waku) | `10bcd728c9b2f07d664cfece3c8c870d3418ddd2` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/egoist--waku--10bcd728c9b2>) | [v0.1.20](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/egoist--waku--10bcd728c9b2>) · `10bcd728c9b2f07d664cfece3c8c870d3418ddd2` | [origin](https://github.com/egoist/waku) / no |
| [elidickinson/pi-claude-bridge](https://github.com/elidickinson/pi-claude-bridge) | `5fb69c49e1548add3686dfeecd1a040001622e6d` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/elidickinson--pi-claude-bridge--5fb69c49e154>) | No GitHub latest release | [origin](https://github.com/elidickinson/pi-claude-bridge) / no |
| [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) | `c0c98d367c55296bfe69e65680625b6db437af02` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/eyaltoledano--claude-task-master--c0c98d367c55>) | [task-master-ai@0.43.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/eyaltoledano--claude-task-master--1c7365cab1f1>) · `1c7365cab1f1d8ee5b0ecc2292a9ba9cf5efea2e` | [origin](https://github.com/eyaltoledano/claude-task-master) / no |
| [farion1231/cc-switch](https://github.com/farion1231/cc-switch) | `5c573f19fd812aef0d2af9dccf8c43b0fe9fec57` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/farion1231--cc-switch--5c573f19fd81>) | [v3.20.4](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/farion1231--cc-switch--43e1d99084ed>) · `43e1d99084ed9b2f5dc252fd35c5adaf29d6876e` | [origin](https://github.com/farion1231/cc-switch) / no |
| [frostime/pi-usage-analytics](https://github.com/frostime/pi-usage-analytics) | `812dd26b80190b19de8243ca2728f20d2ad9b23d` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/frostime--pi-usage-analytics--812dd26b8019>) | No GitHub latest release | [origin](https://github.com/frostime/pi-usage-analytics) / no |
| [genspark-ai/genoffice](https://github.com/genspark-ai/genoffice) | `e4be545a881eed5b700d5da997aae26e8e24fc82` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/genspark-ai--genoffice--e4be545a881e>) | [v0.11.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/genspark-ai--genoffice--21111196b40a>) · `21111196b40a01e70760602729fbac16f1b86008` | [origin](https://github.com/genspark-ai/genoffice) / no |
| [getagentseal/codeburn](https://github.com/getagentseal/codeburn) | `2f2a14fb709e588990bcce510ddc0759e459ac79` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/getagentseal--codeburn--2f2a14fb709e>) | [mac-v0.9.25](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/getagentseal--codeburn--d71c62de2e7f>) · `d71c62de2e7f0d30c56932b10763a78431976766` | [origin](https://github.com/getagentseal/codeburn) / no |
| [getpaseo/paseo](https://github.com/getpaseo/paseo) | `da9fae172da1804fdcfb1ae9c139c191d50b01de` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/getpaseo--paseo--da9fae172da1>) | [v0.10.3](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/getpaseo--paseo--b4af508e2a9e>) · `b4af508e2a9e5a34a8b0ffb8dfaff6fd679da6c7` | [origin](https://github.com/getpaseo/paseo) / no |
| [github/spec-kit](https://github.com/github/spec-kit) | `ae5ade7234be5cb1d975f736c4e06dd46d1326d6` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/github--spec-kit--ae5ade7234be>) | [v1.1.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/github--spec-kit--f1d3a4f8337e>) · `f1d3a4f8337ebbd3ae22760a9c12e3352b93a175` | [origin](https://github.com/github/spec-kit) / no |
| [google-antigravity/antigravity-sdk-python](https://github.com/google-antigravity/antigravity-sdk-python) | `12f9a4c3becf487302dc799b0f59054f01f3ddb9` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/google-antigravity--antigravity-sdk-python--12f9a4c3becf>) | No GitHub latest release | [origin](https://github.com/google-antigravity/antigravity-sdk-python) / no |
| [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) | `fb972b2f87fe7d5b06d37eac711490162d98de2c` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/google-gemini--gemini-cli--fb972b2f87fe>) | [v0.62.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/google-gemini--gemini-cli--b460678f3db5>) · `b460678f3db508407554afd604cc9d6635becb2a` | [origin](https://github.com/google-gemini/gemini-cli) / no |
| [HarnessRouter/harnessrouter](https://github.com/HarnessRouter/harnessrouter) | `6e05aef5dc2bb25faf202130398e1509a880e166` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/HarnessRouter--harnessrouter--6e05aef5dc2b>) | [v0.29.3](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/HarnessRouter--harnessrouter--6e05aef5dc2b>) · `6e05aef5dc2bb25faf202130398e1509a880e166` | [origin](https://github.com/HarnessRouter/harnessrouter) / no |
| [herdrdev/herdr](https://github.com/herdrdev/herdr) | `e35f3937b0efe40ec0dab675709c68e1d8e8c9e6` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/herdrdev--herdr--e35f3937b0ef>) | [v0.9.3](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/herdrdev--herdr--7b116c05bfda>) · `7b116c05bfda646af39d2524c54e70c751f57ee8` | [origin](https://github.com/herdrdev/herdr) / no |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | `184d2546e0abcf32e55905e7233de6436d0b2966` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/heygen-com--hyperframes--184d2546e0ab>) | [v0.8.128](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/heygen-com--hyperframes--967752e9e00e>) · `967752e9e00eaa96f8d56aaae6c4c013b1837246` | [origin](https://github.com/heygen-com/hyperframes) / no |
| [iamaamir/system-one](https://github.com/iamaamir/system-one) | `d58104b676ead7ab5fe3fb502af0df5fcc980a5f` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/iamaamir--system-one--d58104b676ea>) | [pi-system-one@1.1.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/iamaamir--system-one--201b754dadfd>) · `201b754dadfd6d3925dd6886cd20d3c233f43712` | [origin](https://github.com/iamaamir/system-one) / no |
| [iOfficeAI/AionCore](https://github.com/iOfficeAI/AionCore) | `4a707fc3d3cd1f06a86004745e2c1bbf08b16068` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/iOfficeAI--AionCore--4a707fc3d3cd>) | [v0.2.2](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/iOfficeAI--AionCore--47e66d0d1511>) · `47e66d0d151123e973b3fd1e77afcb5671b3f8c5` | [origin](https://github.com/iOfficeAI/AionCore) / no |
| [iOfficeAI/AionUi](https://github.com/iOfficeAI/AionUi) | `6744099b279b991c17e31c243f0920477bd31cb6` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/iOfficeAI--AionUi--6744099b279b>) | [v2.2.2](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/iOfficeAI--AionUi--6744099b279b>) · `6744099b279b991c17e31c243f0920477bd31cb6` | [origin](https://github.com/iOfficeAI/AionUi) / no |
| [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) | `33b51db6ceb5d0c91dc9c22404abcabacc8603b0` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/jarrodwatts--claude-hud--33b51db6ceb5>) | [v0.10.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/jarrodwatts--claude-hud--75683c6de1ac>) · `75683c6de1ac07f6bbef00d739001679dba0740c` | [origin](https://github.com/jarrodwatts/claude-hud) / no |
| [jayzeng/agentmemory](https://github.com/jayzeng/agentmemory) | `a6c256bf3eb0ef63c6bab78f528136a882d45f10` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/jayzeng--agentmemory--a6c256bf3eb0>) | No GitHub latest release | [origin](https://github.com/jayzeng/agentmemory) / no |
| [jlcodes99/cockpit-tools](https://github.com/jlcodes99/cockpit-tools) | `2d0f13f9e2b1c7a2b30bab08b3805829808aa85f` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/jlcodes99--cockpit-tools--2d0f13f9e2b1>) | [v1.3.65](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/jlcodes99--cockpit-tools--0b6514b40880>) · `0b6514b40880efdfd7752ebd5113c6811bafe721` | [origin](https://github.com/jlcodes99/cockpit-tools) / no |
| [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | `6571943370f7c9d4de1946481177ee7b306cd8e8` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/JuliusBrussee--caveman--6571943370f7>) | [v3.1.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/JuliusBrussee--caveman--8af1f1b9b134>) · `8af1f1b9b1346bca0722a1556f119b4e6675cc96` | [origin](https://github.com/JuliusBrussee/caveman) / no |
| [klingai-dev/pi-plugin](https://github.com/klingai-dev/pi-plugin) | `8cfa106dd0868c3a51fe376d67fec175a60a5da5` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/klingai-dev--pi-plugin--8cfa106dd086>) | No GitHub latest release | [origin](https://github.com/klingai-dev/pi-plugin) / no |
| [KunAgent/Kun](https://github.com/KunAgent/Kun) | `ebce7f6cd94fc2882009fcf8169d7a59f5f5c289` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/KunAgent--Kun--ebce7f6cd94f>) | [v0.3.12](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/KunAgent--Kun--ebce7f6cd94f>) · `ebce7f6cd94fc2882009fcf8169d7a59f5f5c289` | [origin](https://github.com/KunAgent/Kun) / no |
| [langchain-ai/deepagentsjs](https://github.com/langchain-ai/deepagentsjs) | `279ad29632a9ceabba343f607cbc9d8a753181ee` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/langchain-ai--deepagentsjs--279ad29632a9>) | [deepagents-acp@0.1.33](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/langchain-ai--deepagentsjs--9a64a1751ca4>) · `9a64a1751ca4d5aba003e5c15f972b183202238f`; [deepagents@1.14.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/langchain-ai--deepagentsjs--9a64a1751ca4>) · `9a64a1751ca4d5aba003e5c15f972b183202238f` | [origin](https://github.com/langchain-ai/deepagentsjs) / no |
| [legions-developer/evilcharts](https://github.com/legions-developer/evilcharts) | `ecbd6a5db7b25f9a7e070c02b2ef728c378eeb5c` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/legions-developer--evilcharts--ecbd6a5db7b2>) | No GitHub latest release | [origin](https://github.com/legions-developer/evilcharts) / no |
| [letta-ai/letta](https://github.com/letta-ai/letta) | `5bcdd177d70fa2b31a754cfcd801e77b2e1ab16a` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/letta-ai--letta--5bcdd177d70f>) | [0.16.8](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/letta-ai--letta--1131535716e8>) · `1131535716e8a31c9a437f8695e25ac98f203a24` | [origin](https://github.com/letta-ai/letta) / no |
| [lincolnwan/Planning-with-files-copilot-agent](https://github.com/lincolnwan/Planning-with-files-copilot-agent) | `2bcc24bcc8362ed4ff47f2ee0fc8346bcc1b98e2` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/lincolnwan--Planning-with-files-copilot-agent--2bcc24bcc836>) | No GitHub latest release | [origin](https://github.com/lincolnwan/Planning-with-files-copilot-agent) / no |
| [makecindy/cindy](https://github.com/makecindy/cindy) | `cd3921a43c8877c2513f8750538e6747b42ef04b` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/makecindy--cindy--cd3921a43c88>) | [v0.1.97](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/makecindy--cindy--88e224475a61>) · `88e224475a6183f7b31218a7499be956a4bf2667` | [origin](https://github.com/makecindy/cindy) / no |
| [makecindy/cindy-official-plugins](https://github.com/makecindy/cindy-official-plugins) | `7f22c956b2dd4c29d03d44d4eba3953f94e15632` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/makecindy--cindy-official-plugins--7f22c956b2dd>) | No GitHub latest release | [origin](https://github.com/makecindy/cindy-official-plugins) / no |
| [mathuo/dockview](https://github.com/mathuo/dockview) | `c70b2096076cd155ed83c5c992bb80d561283133` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/dockview--dockview--c70b2096076c>) | [v8.4.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/dockview--dockview--590640b22421>) · `590640b22421488cb72189b1fbd97996a7bd6709` | [origin](https://github.com/dockview/dockview) / no |
| [mem0ai/mem0](https://github.com/mem0ai/mem0) | `abb81c88e1f738a8117d8293530fbc31a5ef8fd9` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/mem0ai--mem0--abb81c88e1f7>) | [ts-v3.3.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/mem0ai--mem0--94c3fe9f238f>) · `94c3fe9f238f3dbf29c9ce98643bd71eb13077cd` | [origin](https://github.com/mem0ai/mem0) / no |
| [microsoft/LLMLingua](https://github.com/microsoft/LLMLingua) | `5a4c78ae18ab17a98cf997e8259354e546081d64` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/microsoft--LLMLingua--5a4c78ae18ab>) | [v0.2.2](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/microsoft--LLMLingua--a411a3fa61df>) · `a411a3fa61df74411157b2512b592d5357bd8f17` | [origin](https://github.com/microsoft/LLMLingua) / no |
| [microsoft/markitdown](https://github.com/microsoft/markitdown) | `4cc9fa17653d695d64fb9eee5b33d4de55ff84e8` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/microsoft--markitdown--4cc9fa17653d>) | [v0.1.8](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/microsoft--markitdown--b8f79c57ebc0>) · `b8f79c57ebc0044be41323d89b2a45d3fda8460e` | [origin](https://github.com/microsoft/markitdown) / no |
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | `f183dad4a52965583e3cc1d59b88cdc279e2e57d` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/microsoft--playwright-mcp--f183dad4a529>) | [v0.0.83](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/microsoft--playwright-mcp--f183dad4a529>) · `f183dad4a52965583e3cc1d59b88cdc279e2e57d` | [origin](https://github.com/microsoft/playwright-mcp) / no |
| [microsoft/qlib](https://github.com/microsoft/qlib) | `be725493eb1a6bbb42bf11b37aa7669f59610ff1` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/microsoft--qlib--be725493eb1a>) | [v0.9.7](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/microsoft--qlib--da920b7f954f>) · `da920b7f954f48ab1bb64117c976710de198373e` | [origin](https://github.com/microsoft/qlib) / no |
| [microsoft/RD-Agent](https://github.com/microsoft/RD-Agent) | `484776c211e4fbbeef03e0ec00d6bbee7362a4f4` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/microsoft--RD-Agent--484776c211e4>) | [v1.0.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/microsoft--RD-Agent--484776c211e4>) · `484776c211e4fbbeef03e0ec00d6bbee7362a4f4` | [origin](https://github.com/microsoft/RD-Agent) / no |
| [MiniMax-AI/minimax-code](https://github.com/MiniMax-AI/minimax-code) | `185277170817c50e9dd5339c2893e850d610fa1e` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/MiniMax-AI--minimax-code--185277170817>) | [v0.6.2](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/MiniMax-AI--minimax-code--564e9166d81f>) · `564e9166d81f87b0b767b005e4779d4697b512be` | [origin](https://github.com/MiniMax-AI/minimax-code) / no |
| [modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps) | `82221c0c8ce7661efa6771c9d461511b1650495f` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/modelcontextprotocol--ext-apps--82221c0c8ce7>) | [v2.0.3](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/modelcontextprotocol--ext-apps--82221c0c8ce7>) · `82221c0c8ce7661efa6771c9d461511b1650495f` | [origin](https://github.com/modelcontextprotocol/ext-apps) / no |
| [modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry) | `bf4e88cbe8d1a635c06144ccea1d24cb52fa6186` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/modelcontextprotocol--registry--bf4e88cbe8d1>) | [v1.8.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/modelcontextprotocol--registry--f52dc8525a44>) · `f52dc8525a441a3abf5fedc9912152d95af5aab1` | [origin](https://github.com/modelcontextprotocol/registry) / no |
| [monotykamary/pi-better-openai](https://github.com/monotykamary/pi-better-openai) | `b772608b4079592a3535e1c1e6222600787d31d6` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/monotykamary--pi-better-openai--b772608b4079>) | No GitHub latest release | [origin](https://github.com/monotykamary/pi-better-openai) / no |
| [MoonshotAI/kimi-code](https://github.com/MoonshotAI/kimi-code) | `21406fb4c805cc8c715e6d1f16ad3fb5f25f4fe3` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/MoonshotAI--kimi-code--21406fb4c805>) | [@moonshot-ai/kimi-code@2.1.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/MoonshotAI--kimi-code--f67e6398fb32>) · `f67e6398fb3210ad8ace970e2dfd5bcc984ed61f` | [origin](https://github.com/MoonshotAI/kimi-code) / no |
| [multica-ai/multica](https://github.com/multica-ai/multica) | `b4ca5b4a23e68b26292a680dca7689a952bb1cd5` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/multica-ai--multica--b4ca5b4a23e6>) | [v0.6.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/multica-ai--multica--2ea01ae4ef55>) · `2ea01ae4ef55de4310b99af192d2dbd367832883` | [origin](https://github.com/multica-ai/multica) / no |
| [NandhaKishorM/laya](https://github.com/NandhaKishorM/laya) | `8a6e1328cce2460a0e5aa348ad465bb1b5821cd2` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/NandhaKishorM--laya--8a6e1328cce2>) | [v0.3.27](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/NandhaKishorM--laya--b09832bdd381>) · `b09832bdd3819e375fe8b0d26dbd7a8f75c4f0bd` | [origin](https://github.com/NandhaKishorM/laya) / no |
| [nexu-io/html-anything](https://github.com/nexu-io/html-anything) | `553ed98c283f9c0f489902d035416a972d6a9699` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/nexu-io--html-anything--553ed98c283f>) | No GitHub latest release | [origin](https://github.com/nexu-io/html-anything) / no |
| [nexu-io/open-design](https://github.com/nexu-io/open-design) | `53231d40b778d88eba23f35547bf99485d3ae9fc` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/nexu-io--open-design--53231d40b778>) | [open-design-v0.24.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/nexu-io--open-design--89e64d813bb1>) · `89e64d813bb1c7a11519b3f668f011f7017637d7` | [origin](https://github.com/nexu-io/open-design) / no |
| [nicobailon/pi-web-access](https://github.com/nicobailon/pi-web-access) | `d9624588de4a92af1e73be731a462c9bdcfeb96d` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/nicobailon--pi-web-access--d9624588de4a>) | [v0.36.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/nicobailon--pi-web-access--d9624588de4a>) · `d9624588de4a92af1e73be731a462c9bdcfeb96d` | [origin](https://github.com/nicobailon/pi-web-access) / no |
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | `e1fdf003a668f97bf5a53d7675c1e70b1dcfec34` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/NousResearch--hermes-agent--e1fdf003a668>) | [v2026.9.24](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/NousResearch--hermes-agent--f97608f178d1>) · `f97608f178d1ffeca59860195ab7da295f7c8e5f` | [origin](https://github.com/NousResearch/hermes-agent) / no |
| [NousResearch/hermes-plugin-claude-subscription-directsdk](https://github.com/NousResearch/hermes-plugin-claude-subscription-directsdk) | `31b591fd04737a7807183f3d7f3d389b19f94687` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/NousResearch--hermes-plugin-claude-subscription-directsdk--31b591fd0473>) | No GitHub latest release | [origin](https://github.com/NousResearch/hermes-plugin-claude-subscription-directsdk) / no |
| [NVlabs/SoL-Pi](https://github.com/NVlabs/SoL-Pi) | `e1a586af0ad8956f42ae5b26bba20e48fbf30e00` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/NVlabs--SoL-Pi--e1a586af0ad8>) | No GitHub latest release | [origin](https://github.com/NVlabs/SoL-Pi) / no |
| [omnigent-ai/omnigent](https://github.com/omnigent-ai/omnigent) | `27f9bf1c18c049d21582166d8354285564b81a33` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/omnigent-ai--omnigent--27f9bf1c18c0>) | [v0.16.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/omnigent-ai--omnigent--82a74473ee4c>) · `82a74473ee4c01163c4269f4296b10a158f0e47e` | [origin](https://github.com/omnigent-ai/omnigent) / no |
| [open-compress/claw-compactor](https://github.com/open-compress/claw-compactor) | `c1b936d40b1145c7a257bd6e34a17994f467495f` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/open-compress--claw-compactor--c1b936d40b11>) | [v7.1.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/open-compress--claw-compactor--cd04c12a0cff>) · `cd04c12a0cff6806993a457b6e98ded7b80fee0c` | [origin](https://github.com/open-compress/claw-compactor) / no |
| [openai/codex](https://github.com/openai/codex) | `7f892275e31002f0422477c6219189284560e689` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/openai--codex--7f892275e310>) | [rust-v0.160.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/openai--codex--a956835d0207>) · `a956835d020762cb2b570053af06f643a11c0ecc` | [origin](https://github.com/openai/codex) / no |
| [openai/openai-agents-js](https://github.com/openai/openai-agents-js) | `96aa754b69282fef3bf8be2f15897985400ee0a6` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/openai--openai-agents-js--96aa754b6928>) | [v0.18.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/openai--openai-agents-js--71abeaad1aac>) · `71abeaad1aac7b984ba4839a6453b36d30b9ecfd` | [origin](https://github.com/openai/openai-agents-js) / no |
| [openchamber/openchamber](https://github.com/openchamber/openchamber) | `e302062e3be0686986594fddabdafd8a97c129e5` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/openchamber--openchamber--e302062e3be0>) | [v2.1.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/openchamber--openchamber--e302062e3be0>) · `e302062e3be0686986594fddabdafd8a97c129e5` | [origin](https://github.com/openchamber/openchamber) / no |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | `58962d7f6d6a7fedccaeb21ddded23fad4d2e9e6` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/openclaw--openclaw--58962d7f6d6a>) | [v2026.9.8](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/openclaw--openclaw--fc23bc864e45>) · `fc23bc864e4553c2d215e479eeec47b67a0bf943` | [origin](https://github.com/openclaw/openclaw) / no |
| [OpenCut-app/OpenCut](https://github.com/OpenCut-app/OpenCut) | `e668010778568641babef2cc40be4703ae6916d6` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/OpenCut-app--OpenCut--e66801077856>) | [v0.3.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/OpenCut-app--OpenCut--f4bd689f51cf>) · `f4bd689f51cf12a4dd0a32f602f761be314d9686` | [origin](https://github.com/OpenCut-app/OpenCut) / no |
| [opencut-app/opencut-classic](https://github.com/opencut-app/opencut-classic) | `cf5e79e919144200294fb9fed22a222592a0aeea` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/OpenCut-app--opencut-classic--cf5e79e91914>) | No GitHub latest release | [origin](https://github.com/OpenCut-app/opencut-classic) / yes |
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | `64f12b3a3294aa78e850c2b0ec32f6bef04ba5fd` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/OpenHands--OpenHands--64f12b3a3294>) | [v1.24.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/OpenHands--OpenHands--7dc6805406ea>) · `7dc6805406ea3c76cb4a3ce407c3c72d481b0ac6` | [origin](https://github.com/OpenHands/OpenHands) / no |
| [opensandbox-group/OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) | `c7dc78a4090e5de2b9119e9bd93952cae24f87bd` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/opensandbox-group--OpenSandbox--c7dc78a4090e>) | [release-1.1.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/opensandbox-group--OpenSandbox--b1a29cf93a82>) · `b1a29cf93a823a95913f7943010febb3f29de05c` | [origin](https://github.com/opensandbox-group/OpenSandbox) / no |
| [palmier-io/palmier-pro](https://github.com/palmier-io/palmier-pro) | `c948160b8fc304a3b2a86bf4492329cfedf0230f` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/palmier-io--palmier-pro--c948160b8fc3>) | [v0.11.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/palmier-io--palmier-pro--eeafde20086b>) · `eeafde20086b1dffb01ccb59da80e470abadeda8` | [origin](https://github.com/palmier-io/palmier-pro) / no |
| [penpot/penpot](https://github.com/penpot/penpot) | `7c039231f79022f26b252776817c41fa61476aa3` (`develop`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/penpot--penpot--7c039231f790>) | [2.18.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/penpot--penpot--423cb411324d>) · `423cb411324d8c0de39032b2244e1a3c96c23dba` | [origin](https://github.com/penpot/penpot) / no |
| [pungggi/pi-multimodal-proxy](https://github.com/pungggi/pi-multimodal-proxy) | `5cebdc7bc784d06212060d3f9fc6607ece360ea2` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/pungggi--pi-multimodal-proxy--5cebdc7bc784>) | No GitHub latest release | [origin](https://github.com/pungggi/pi-multimodal-proxy) / no |
| [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) | `f2e069061ab4bbf4bb146881c946fa3bd2e32d5e` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/QwenLM--qwen-code--f2e069061ab4>) | [sdk-typescript-v0.1.17](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/QwenLM--qwen-code--4f9326472bc9>) · `4f9326472bc967f3d5e970af1a0c0e1dad7642fe` | [origin](https://github.com/QwenLM/qwen-code) / no |
| [QwenLM/Qwen-Live-Harness](https://github.com/QwenLM/Qwen-Live-Harness) | `b6ce544ebbcd7417e37e0314ec946466c49c615c` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/QwenLM--Qwen-Live-Harness--b6ce544ebbcd>) | [qwen-live-harness-host-v1.0.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/QwenLM--Qwen-Live-Harness--f44729e44449>) · `f44729e444496cac78f12f5c3cad87257f0c93c7` | [origin](https://github.com/QwenLM/Qwen-Live-Harness) / no |
| [QwenLM/Qwen-MM-Plugins](https://github.com/QwenLM/Qwen-MM-Plugins) | `460212d47ee52dfd4ed58afb3c29b4c1d9febb6d` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/QwenLM--Qwen-MM-Plugins--460212d47ee5>) | No GitHub latest release | [origin](https://github.com/QwenLM/Qwen-MM-Plugins) / no |
| [ross-jill-ws/pi-codex-image-tool](https://github.com/ross-jill-ws/pi-codex-image-tool) | `ca7e6002a04226d82895e46e6ba6b32dc457336a` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/ross-jill-ws--pi-codex-image-tool--ca7e6002a042>) | No GitHub latest release | [origin](https://github.com/ross-jill-ws/pi-codex-image-tool) / no |
| [router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) | `a4acc9f752bd46571f737a10c04bf413656ab06b` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/router-for-me--CLIProxyAPI--a4acc9f752bd>) | [v8.0.15](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/router-for-me--CLIProxyAPI--a4acc9f752bd>) · `a4acc9f752bd46571f737a10c04bf413656ab06b` | [origin](https://github.com/router-for-me/CLIProxyAPI) / no |
| [seakee/CPA-Manager-Plus](https://github.com/seakee/CPA-Manager-Plus) | `fb3e8f501f47a29b0fa66a5bf31f0f36739750d3` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/seakee--CPA-Manager-Plus--fb3e8f501f47>) | [v1.14.3](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/seakee--CPA-Manager-Plus--fb3e8f501f47>) · `fb3e8f501f47a29b0fa66a5bf31f0f36739750d3` | [origin](https://github.com/seakee/CPA-Manager-Plus) / no |
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | `6b600cf1ff42f8a746747ea587e52af3ee224643` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/shadcn-ui--ui--6b600cf1ff42>) | [shadcn@4.21.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/shadcn-ui--ui--3502dbcde11d>) · `3502dbcde11d1eaf967a47ac375744dc336641f3` | [origin](https://github.com/shadcn-ui/ui) / no |
| [songquanpeng/one-api](https://github.com/songquanpeng/one-api) | `8df4a2670b98266bd287c698243fff327d9748cf` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/songquanpeng--one-api--8df4a2670b98>) | [v0.6.10](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/songquanpeng--one-api--3915ce9814b8>) · `3915ce9814b8261a1ab13ed93adec58b463cd75c` | [origin](https://github.com/songquanpeng/one-api) / no |
| [stablyai/orca](https://github.com/stablyai/orca) | `40f9e7a3fcd089cf8a2a05125785fbfe6fbbe7f2` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/stablyai--orca--40f9e7a3fcd0>) | [v1.4.220](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/stablyai--orca--a7927b28ce45>) · `a7927b28ce45cbb044add478d957abe36c99ccd8` | [origin](https://github.com/stablyai/orca) / no |
| [starc007/ui-components](https://github.com/starc007/ui-components) | `6863023f14e2b07976288039673058631fcc73ca` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/starc007--ui-components--6863023f14e2>) | [v0.2.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/starc007--ui-components--b2c4e4b6b3f6>) · `b2c4e4b6b3f6f640223c3c208719b1b2a9c899a2` | [origin](https://github.com/starc007/ui-components) / no |
| [steipete/CodexBar](https://github.com/steipete/CodexBar) | `14567f0b6711ef38741cadd7ff20ef76a2053af2` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/steipete--CodexBar--14567f0b6711>) | [v0.72.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/steipete--CodexBar--cfee869f3181>) · `cfee869f3181379dd074adb9feeb5f19a994356a` | [origin](https://github.com/steipete/CodexBar) / no |
| [SuperClaude-Org/SuperClaude_Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework) | `fe68862c8ed9e2afb8120c2d9e27d0c3a7ce73a2` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/SuperClaude-Org--SuperClaude_Framework--fe68862c8ed9>) | [v4.3.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/SuperClaude-Org--SuperClaude_Framework--af3a965da2ec>) · `af3a965da2ec4f481fe1a1a459899cf3f811894a` | [origin](https://github.com/SuperClaude-Org/SuperClaude_Framework) / no |
| [sylearn/AIUsage](https://github.com/sylearn/AIUsage) | `7935fe0feac7bb8a30b4ba86f52e1e15f3f4cf90` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/sylearn--AIUsage--7935fe0feac7>) | [v0.15.22](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/sylearn--AIUsage--1eb685747349>) · `1eb68574734903a024e31866ed7484e4a0cb9e98` | [origin](https://github.com/sylearn/AIUsage) / no |
| [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents) | `1394a3f72aa4393e1a98f51b382434c4b4c2d972` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/TauricResearch--TradingAgents--1394a3f72aa4>) | [v0.6.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/TauricResearch--TradingAgents--1394a3f72aa4>) · `1394a3f72aa4393e1a98f51b382434c4b4c2d972` | [origin](https://github.com/TauricResearch/TradingAgents) / no |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | `3b3baaa55ebb017109e2774b0c2ec06d1dd83a5c` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/thedotmack--claude-mem--3b3baaa55ebb>) | [v13.31.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/thedotmack--claude-mem--a1a1f0ab0067>) · `a1a1f0ab006750998f7ca9207144a95f62216500` | [origin](https://github.com/thedotmack/claude-mem) / no |
| [tldraw/tldraw](https://github.com/tldraw/tldraw) | `db1c86ea7857483c47aa333cf4e92abf455a67cf` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/tldraw--tldraw--db1c86ea7857>) | [v5.5.2](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/tldraw--tldraw--be4d5b30cbf8>) · `be4d5b30cbf896c92436d634e59843a920705cef` | [origin](https://github.com/tldraw/tldraw) / no |
| [togethercomputer/together-py](https://github.com/togethercomputer/together-py) | `81048943603fab8810955372f34b9fb5c5322cb3` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/togethercomputer--together-py--81048943603f>) | [v2.39.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/togethercomputer--together-py--fd3c079e8678>) · `fd3c079e8678b5ffa590c75976bc9d9dca1f35f4` | [origin](https://github.com/togethercomputer/together-py) / no |
| [typesafe-ai/typesafe-sdk-js](https://github.com/typesafe-ai/typesafe-sdk-js) | `66880ccded6cb642dc1809620c2b108c33730214` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/typesafe-ai--typesafe-sdk-js--66880ccded6c>) | [v0.6.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/typesafe-ai--typesafe-sdk-js--66880ccded6c>) · `66880ccded6cb642dc1809620c2b108c33730214` | [origin](https://github.com/typesafe-ai/typesafe-sdk-js) / no |
| [upstash/context7](https://github.com/upstash/context7) | `680841e13d43a94dfcf1b9102ee59d0977415931` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/upstash--context7--680841e13d43>) | [@upstash/context7-opencode@0.2.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/upstash--context7--e75ddde7a3aa>) · `e75ddde7a3aaa79927f8ed4e4d0fba1d8bb6c81a`; [@upstash/context7-mcp@4.1.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/upstash--context7--b653c3a07d79>) · `b653c3a07d7936bdc4c23fc1c88903120e0ece77` | [origin](https://github.com/upstash/context7) / no |
| [xai-org/grok-build](https://github.com/xai-org/grok-build) | `2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/xai-org--grok-build--2bdd1d6a6369>) | No GitHub latest release | [origin](https://github.com/xai-org/grok-build) / no |
| [XiaomiMiMo/MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code) | `6babeb0b98f9b4818bddf04a4331edfee04dbf85` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/XiaomiMiMo--MiMo-Code--6babeb0b98f9>) | [v0.1.15](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/XiaomiMiMo--MiMo-Code--14dfe68a1c12>) · `14dfe68a1c121f859544ba810b3c308e8501bfb2` | [origin](https://github.com/XiaomiMiMo/MiMo-Code) / no |
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | `3d35b57317576b0916c0bfeaaedd573aaacc2839` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/xyflow--xyflow--3d35b5731757>) | [@xyflow/svelte@1.7.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/xyflow--xyflow--3d35b5731757>) · `3d35b57317576b0916c0bfeaaedd573aaacc2839`; [@xyflow/react@12.12.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/xyflow--xyflow--3d35b5731757>) · `3d35b57317576b0916c0bfeaaedd573aaacc2839` | [origin](https://github.com/xyflow/xyflow) / no |
| [yamadashy/repomix](https://github.com/yamadashy/repomix) | `8d6429121e98ed178e4d3a975c2bdbbecc958c4a` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/yamadashy--repomix--8d6429121e98>) | [v1.18.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/yamadashy--repomix--80b4280a9196>) · `80b4280a9196feace092fc672dfe2b5fac62ef08` | [origin](https://github.com/yamadashy/repomix) / no |
| [zai-org/ZCode](https://github.com/zai-org/ZCode) | `29628c9acdb81b703bbd4080c207a0e7ce5e276e` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/zai-org--ZCode--29628c9acdb8>) | [v3.14.3](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/zai-org--ZCode--29628c9acdb8>) · `29628c9acdb81b703bbd4080c207a0e7ce5e276e` | [origin](https://github.com/zai-org/ZCode) / no |
| [zhongerxin/Cowart](https://github.com/zhongerxin/Cowart) | `cdeb595cc006bc820b7393a3487aaeefa52c7638` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/zhongerxin--Cowart--cdeb595cc006>) | No GitHub latest release | [origin](https://github.com/zhongerxin/Cowart) / no |
| [zilliztech/GPTCache](https://github.com/zilliztech/GPTCache) | `a74ac654473f7bf4109118e8576945161616e17a` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/zilliztech--GPTCache--a74ac654473f>) | [0.1.44](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/zilliztech--GPTCache--bae7ffeef774>) · `bae7ffeef774e762d9d4e60fce70be00011188a6` | [origin](https://github.com/zilliztech/GPTCache) / no |
| [ZSeven-W/openpencil](https://github.com/ZSeven-W/openpencil) | `3e55570d20bd4be891700789146e7c43c9c1c3b1` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/ZSeven-W--openpencil--3e55570d20bd>) | No GitHub latest release | [origin](https://github.com/ZSeven-W/openpencil) / no |
| [adobe/react-spectrum](https://github.com/adobe/react-spectrum) | `99e610236887da619ad9d54a1cd87983166c043d` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/adobe--react-spectrum--99e610236887>) | [react-aria-components@1.21.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/adobe--react-spectrum--f56660b234bd>) · `f56660b234bd588751c9f35b85d6fe6e17e45ccf` | [origin](https://github.com/adobe/react-spectrum) / no |
| [ant-design/ant-design](https://github.com/ant-design/ant-design) | `2d2d49cb6378b6b41c40cd331f63139017ced6e0` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/ant-design--ant-design--2d2d49cb6378>) | [6.6.5](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/ant-design--ant-design--4a39f54842ea>) · `4a39f54842eade4e565ab336ef6097cd7e723cdd` | [origin](https://github.com/ant-design/ant-design) / no |
| [blender/blender](https://github.com/blender/blender) | `e4bea5df73c1fc1c253d63edbc01ba4c2c64843d` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/blender--blender--e4bea5df73c1>) | No GitHub latest release | [origin](https://github.com/blender/blender) / no |
| [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | `b2f522c8ba0fd2e00a679159b4aa5243de5f1b78` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/ChromeDevTools--chrome-devtools-mcp--b2f522c8ba0f>) | [chrome-devtools-mcp-v1.10.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/ChromeDevTools--chrome-devtools-mcp--e52c6b59b476>) · `e52c6b59b476c5e04d8dd9fd4bd017ba3b3d65df` | [origin](https://github.com/ChromeDevTools/chrome-devtools-mcp) / no |
| [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | `ed10ac7dca7e40f3f4a31269b4bfba980d0db41e` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/excalidraw--excalidraw--ed10ac7dca7e>) | [v0.18.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/excalidraw--excalidraw--a2ec2889babf>) · `a2ec2889babf7d2295469c6d90ebe77fae57df84` | [origin](https://github.com/excalidraw/excalidraw) / no |
| [HarnessRouter/starter-kit](https://github.com/HarnessRouter/starter-kit) | `ca13b565b99354e67207c6fc0e49af0798eb1b0c` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/HarnessRouter--starter-kit--ca13b565b993>) | No GitHub latest release | [origin](https://github.com/HarnessRouter/starter-kit) / no |
| [langgenius/dify](https://github.com/langgenius/dify) | `54486a14c12b31127c971b731857f9f79d9cb40b` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/langgenius--dify--54486a14c12b>) | [1.17.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/langgenius--dify--8387590ace4a>) · `8387590ace4a094de812b7847fc6a4c3a27cd52b` | [origin](https://github.com/langgenius/dify) / no |
| [lobehub/lobe-editor](https://github.com/lobehub/lobe-editor) | `960884a715d0d7a0d8b194a568c6f3da2a1dd624` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/lobehub--lobe-editor--960884a715d0>) | [v4.29.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/lobehub--lobe-editor--960884a715d0>) · `960884a715d0d7a0d8b194a568c6f3da2a1dd624` | [origin](https://github.com/lobehub/lobe-editor) / no |
| [lucide-icons/lucide](https://github.com/lucide-icons/lucide) | `500620a2e8123f8d1db191538886dc0c223f69a9` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/lucide-icons--lucide--500620a2e812>) | [1.52.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/lucide-icons--lucide--500620a2e812>) · `500620a2e8123f8d1db191538886dc0c223f69a9` | [origin](https://github.com/lucide-icons/lucide) / no |
| [minbrowser/min](https://github.com/minbrowser/min) | `c92079cde045c38ab844e53501e9c5178d503a45` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/minbrowser--min--c92079cde045>) | [v1.35.7](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/minbrowser--min--c92079cde045>) · `c92079cde045c38ab844e53501e9c5178d503a45` | [origin](https://github.com/minbrowser/min) / no |
| [mui/base-ui](https://github.com/mui/base-ui) | `32600859aec46fd616e812dd6c750d619206e12f` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/mui--base-ui--32600859aec4>) | [v1.8.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/mui--base-ui--47b40521eab9>) · `47b40521eab921c2756bf9bdb0b0f07fbfdb8c8c` | [origin](https://github.com/mui/base-ui) / no |
| [Niall-Young/Canvasight](https://github.com/Niall-Young/Canvasight) | `f47e0bfe60a0ab990ca66be1102f351bf7774a6b` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/Niall-Young--Canvasight--f47e0bfe60a0>) | [v0.5.11](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/Niall-Young--Canvasight--a12d848812ab>) · `a12d848812abdde9f320b42d477e217bd65c02c9` | [origin](https://github.com/Niall-Young/Canvasight) / no |
| [openclaw/Peekaboo](https://github.com/openclaw/Peekaboo) | `2934c9a9b4a727c3ccde501a163993ce84ad8b8d` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/openclaw--Peekaboo--2934c9a9b4a7>) | [v4.8.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/openclaw--Peekaboo--4d43dc9d80cd>) · `4d43dc9d80cd2aa3787a27f54b76d692db1dcf8f` | [origin](https://github.com/openclaw/Peekaboo) / no |
| [SVG-Edit/svgedit](https://github.com/SVG-Edit/svgedit) | `c44f061d2f9a626d2771cc931298af5a45522d87` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/SVG-Edit--svgedit--c44f061d2f9a>) | [v.7.3.3](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/SVG-Edit--svgedit--2f9f6e2f7178>) · `2f9f6e2f717819ef92ac1a9b049005bd2ff4bdbb` | [origin](https://github.com/SVG-Edit/svgedit) / no |
| [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) | `526157cfd4ec64f45939f9ba0f10d5936aa7ac33` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/vercel-labs--agent-browser--526157cfd4ec>) | [v0.38.2](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/vercel-labs--agent-browser--39a74c70d775>) · `39a74c70d7759d5a6de7a22c04570bb626bbd081` | [origin](https://github.com/vercel-labs/agent-browser) / no |
| [aidenybai/react-grab](https://github.com/aidenybai/react-grab) | `ea4bbec9e80f4802e8ae19ad18431edb9ddbb670` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/aidenybai--react-grab--ea4bbec9e80f>) | [@react-grab/cli@0.2.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/aidenybai--react-grab--23bce0e56f28>) · `23bce0e56f2808902f1126ad581f6d8c3b5f639e` | [origin](https://github.com/aidenybai/react-grab) / no |
| [anthropics/claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) | `16cf0a783143406b1ad5c4a2b0dbf0af2be04b04` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/anthropics--claude-agent-sdk-typescript--16cf0a783143>) | [v0.3.289](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/anthropics--claude-agent-sdk-typescript--16cf0a783143>) · `16cf0a783143406b1ad5c4a2b0dbf0af2be04b04` | [origin](https://github.com/anthropics/claude-agent-sdk-typescript) / no |
| [browseros-ai/BrowserOS](https://github.com/browseros-ai/BrowserOS) | `0152e0a829b36921787196b66a13d1025bc850be` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/browseros-ai--BrowserOS--0152e0a829b3>) | [v0.50.5](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/browseros-ai--BrowserOS--96ff75aa8f3f>) · `96ff75aa8f3f023c526308df32cdd299331a3ec9` | [origin](https://github.com/browseros-ai/BrowserOS) / no |
| [CollaboraOnline/online](https://github.com/CollaboraOnline/online) | `f980fb2d9b702869516c5f323155cd4f273389a7` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/CollaboraOnline--online--f980fb2d9b70>) | [25.04.7-mobile](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/CollaboraOnline--online--673f94ffc1ed>) · `673f94ffc1ed291e9245ee0cbdea4f685a73c56e` | [origin](https://github.com/CollaboraOnline/online) / no |
| [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide) | `aaa07946b60797706c131ca50e50ca526a44b073` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/figma--mcp-server-guide--aaa07946b607>) | No GitHub latest release | [origin](https://github.com/figma/mcp-server-guide) / no |
| [KDE/kdenlive](https://github.com/KDE/kdenlive) | `86a5ffe2714695daefde30732feec44381689837` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/KDE--kdenlive--86a5ffe27146>) | No GitHub latest release | [origin](https://github.com/KDE/kdenlive) / no |
| [LibreChat-AI/LibreChat](https://github.com/LibreChat-AI/LibreChat) | `f10b1d91f1eee3a2c82d5247bf620351486b7c1b` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/LibreChat-AI--LibreChat--f10b1d91f1ee>) | No GitHub latest release | [origin](https://github.com/LibreChat-AI/LibreChat) / no |
| [lobehub/lobe-icons](https://github.com/lobehub/lobe-icons) | `82e641b4fece9d1028a127149af9ded00df5ac0c` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/lobehub--lobe-icons--82e641b4fece>) | [v5.23.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/lobehub--lobe-icons--82e641b4fece>) · `82e641b4fece9d1028a127149af9ded00df5ac0c` | [origin](https://github.com/lobehub/lobe-icons) / no |
| [lukilabs/craft-agents-oss](https://github.com/lukilabs/craft-agents-oss) | `73bd9c2a3573158bea880984eb8d5fdb41e0cac2` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--73bd9c2a3573>) | [v0.14.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--73bd9c2a3573>) · `73bd9c2a3573158bea880984eb8d5fdb41e0cac2` | [origin](https://github.com/craft-ai-agents/craft-agents-oss) / no |
| [mltframework/mlt](https://github.com/mltframework/mlt) | `11e84ecf42e1a7bc885953afa58ba35d228a76ad` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/mltframework--mlt--11e84ecf42e1>) | [v7.42.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/mltframework--mlt--11e84ecf42e1>) · `11e84ecf42e1a7bc885953afa58ba35d228a76ad` | [origin](https://github.com/mltframework/mlt) / no |
| [nanobrowser/nanobrowser](https://github.com/nanobrowser/nanobrowser) | `ad47282a17ecdfb894745af093e0f7332fc1f71a` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/nanobrowser--nanobrowser--ad47282a17ec>) | [v0.2.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/nanobrowser--nanobrowser--c1347a9124a9>) · `c1347a9124a965b67e826abe5bbe7b46b4f7ef3c` | [origin](https://github.com/nanobrowser/nanobrowser) / no |
| [olive-editor/olive](https://github.com/olive-editor/olive) | `7e0e94abf6610026aebb9ddce8564c39522fac6e` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/olive-editor--olive--7e0e94abf661>) | No GitHub latest release | [origin](https://github.com/olive-editor/olive) / no |
| [radix-ui/primitives](https://github.com/radix-ui/primitives) | `f7ecd5ab16f5e1e820eb5786a1419a98a2d594ae` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/radix-ui--primitives--f7ecd5ab16f5>) | No GitHub latest release | [origin](https://github.com/radix-ui/primitives) / no |
| [trailhq/Graft](https://github.com/trailhq/Graft) | `fe30ead39d5e6f0c921018d364da2bdbc9d4b3ad` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/trailhq--Graft--fe30ead39d5e>) | No GitHub latest release | [origin](https://github.com/trailhq/Graft) / no |
| [anomalyco/models.dev](https://github.com/anomalyco/models.dev) | `0b48d996ad66d910a01720679320f2f8a921ba7d` (`dev`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/anomalyco--models.dev--0b48d996ad66>) | No GitHub latest release | [origin](https://github.com/anomalyco/models.dev) / no |
| [benjitaylor/agentation](https://github.com/benjitaylor/agentation) | `0e3236eb1a0f5577852ab7bb5121f5dd46d42f1d` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/benjitaylor--agentation--0e3236eb1a0f>) | [v3.1.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/benjitaylor--agentation--c876f504232e>) · `c876f504232ed0dc14741b82b420b3d5c82cb30e` | [origin](https://github.com/benjitaylor/agentation) / no |
| [bytedance/UI-TARS-desktop](https://github.com/bytedance/UI-TARS-desktop) | `2ff41a9e515828c5bd5b276e493d73aa0bdf4a3a` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/bytedance--UI-TARS-desktop--2ff41a9e5158>) | [v0.3.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/bytedance--UI-TARS-desktop--54dc6f317986>) · `54dc6f3179869eaaf6e1472b89b6455aa288caff` | [origin](https://github.com/bytedance/UI-TARS-desktop) / no |
| [embedpdf/embed-pdf-viewer](https://github.com/embedpdf/embed-pdf-viewer) | `2516e2786ee894383220ecd436fbd248182ef444` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/embedpdf--embed-pdf-viewer--2516e2786ee8>) | [v2.15.1](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/embedpdf--embed-pdf-viewer--176ec6daac51>) · `176ec6daac51458c9e80733b9c92a66a3bc5e2d1` | [origin](https://github.com/embedpdf/embed-pdf-viewer) / no |
| [GraphiteEditor/Graphite](https://github.com/GraphiteEditor/Graphite) | `8f323f09bc7b47bc5edbf0d8ecaf5780a6399730` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/GraphiteEditor--Graphite--8f323f09bc7b>) | No GitHub latest release | [origin](https://github.com/GraphiteEditor/Graphite) / no |
| [KenneyNL/Adobe-Alternatives](https://github.com/KenneyNL/Adobe-Alternatives) | `93854d115d351231b461bc2064f87d52762f847a` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/KenneyNL--Adobe-Alternatives--93854d115d35>) | No GitHub latest release | [origin](https://github.com/KenneyNL/Adobe-Alternatives) / no |
| [LibreOffice/core](https://github.com/LibreOffice/core) | `dfbde789eeef41f8aee33de12b7b674a49760470` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/LibreOffice--core--dfbde789eeef>) | No GitHub latest release | [origin](https://github.com/LibreOffice/core) / no |
| [lobehub/lobehub](https://github.com/lobehub/lobehub) | `026e7afc519eb568850474a1060f33be7f83e5ba` (`canary`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/lobehub--lobehub--026e7afc519e>) | [v2.2.18](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/lobehub--lobehub--14dfc07b14ee>) · `14dfc07b14eee1984e52c195df9319636d6b167b` | [origin](https://github.com/lobehub/lobehub) / no |
| [mantinedev/mantine](https://github.com/mantinedev/mantine) | `910ba2e06eaa29ac904bcd0c16e9d688ea98e927` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/mantinedev--mantine--910ba2e06eaa>) | [9.7.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/mantinedev--mantine--910ba2e06eaa>) · `910ba2e06eaa29ac904bcd0c16e9d688ea98e927` | [origin](https://github.com/mantinedev/mantine) / no |
| [mltframework/shotcut](https://github.com/mltframework/shotcut) | `7cefca4da34529b0756cdec48354d88e73310dda` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/mltframework--shotcut--7cefca4da345>) | [v26.9.27](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/mltframework--shotcut--325c2cc6422d>) · `325c2cc6422d93567d4edb57f1fee401f73beea1` | [origin](https://github.com/mltframework/shotcut) / no |
| [NatronGitHub/Natron](https://github.com/NatronGitHub/Natron) | `3763d805d7d277d10af10025ae41af677682b3e6` (`RB-2.6`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/NatronGitHub--Natron--3763d805d7d2>) | [v2.5.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/NatronGitHub--Natron--53ee17e34438>) · `53ee17e34438005425230468916ff223cfd8a403` | [origin](https://github.com/NatronGitHub/Natron) / no |
| [ONLYOFFICE/DocumentServer](https://github.com/ONLYOFFICE/DocumentServer) | `f580eb58439432310943ece02c9730c6a21365e7` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/ONLYOFFICE--DocumentServer--f580eb584394>) | [v9.4.0](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/ONLYOFFICE--DocumentServer--fb73d33c85f5>) · `fb73d33c85f59d1a5d2e5a5ed05388ebc2418337` | [origin](https://github.com/ONLYOFFICE/DocumentServer) / no |
| [samuelmaddock/electron-browser-shell](https://github.com/samuelmaddock/electron-browser-shell) | `354b0b8192e8c2d960e50cf108b5dbbb70448fec` (`master`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/samuelmaddock--electron-browser-shell--354b0b8192e8>) | No GitHub latest release | [origin](https://github.com/samuelmaddock/electron-browser-shell) / no |
| [trycua/cua](https://github.com/trycua/cua) | `ed22ad958a5ab6d764c98261b24d65f80f3a6f95` (`main`) | [source](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/trycua--cua--ed22ad958a5a>) | [cua-spaces-v0.7.2](</Volumes/AIGC/天工参考/源码参考/software/intake/upstream/trycua--cua--1fe6ce53688c>) · `1fe6ce53688cbf951d3fa40eb7ac6efe305f3d85` | [origin](https://github.com/trycua/cua) / no |

## Typed decision model and quantitative research intake

Primary-only source inspection on immutable current copies, not a re-pin or whole-tree import.
Required Craft look/retained pins remain v0.10.5/v0.13.4. `git fetch` refreshed references; local
shared-clone attempts failed on promisor objects, so fresh official shallow copies were used.
The observed refs/commits below identify the reviewed source, not installed app/dependency upgrades.
Fresh copies live under `/Volumes/AIGC/天工参考/software/intake/`; prior source/data remain intact.

| Source lock | Inspected mechanism and exact entry | Fleet disposition |
|---|---|---|
| Craft **v0.14.0**, `73bd9c2a3573` | `shared/src/decisions/{settings,providers,resolve,client,records,usage}.ts`; `server-core/src/decisions/{decision-point,tool-callbacks,adaptive-thinking,large-results,automation-condition,guarded-mode}.ts`; `session-tools-core/src/handlers/decide.ts`; renderer `AiSettingsPage.tsx:1060,1472`; RPC `decisions.ts`. Settings/RPC/key resolution gate typed choice/score/noul, compact batch output and feature/outcome records. | Reuse optional per-purpose/consumer gating and outcome evaluation through Fleet owners. Do not import its credential namespace/log as another authority or turn on every automatic feature. Source tests below narrow its response/failure guarantees. |
| Pi **v1.0.1**, `a7229ddc2181` | `ai/src/types.ts:633,1151`, `api/{typesafe-system-one,system-one-shared,cloudflare-workers-ai-system-one,llama-cpp-classify}.ts`; `coding-agent/examples/extensions/jev-router.ts`; `ai/CHANGELOG.md`. Distinct chat/image/classifier catalogs and `classify`, native System One transport, bool/noul translation and priced reported usage already exist in the installed version. | Selected transport reuse; no new SDK/runtime. The coding-specific first-edit handoff is not Fleet's phase boundary. Fresh source includes Clef/Clef Flash and inline Anthropic tool changes; these are source facts, not accepted provider/task improvements. |
| TypeSafe JS SDK **v0.6.0**, `66880ccded6c` | `src/{client,types,questions,retry}.ts`: native `/v1/systemone`, ordered score criteria, overridable fetch/abort/timeout/retry. Default timeout 10s and two retries differ from a foreground advisory budget. | Protocol reference. Pi already implements this transport; adding the SDK would duplicate it. Preserve actual request deadlines/usage and independent model/account binding. |
| Laya **0.3.26 main**, `2e4d9c87e8b1` | `laya/{serve,router,agent,common,confidence}.py`: local Jev-compatible server, multilingual routing, model/head/state budgets, four-decimal probabilities and separate entropy/answer confidence. `common.py:669,689` explains why calibration depends on held-out data and option-count bucket. | Preferred local evaluation candidate, with an explicitly selected hosted Jev route as alternative. No weights/service/dependency were installed. Mac CPU latency, Chinese/domain quality and all model licences remain their own admission evidence. Do not call entropy confidence a success/return probability. |
| System One / Pi extension **core 0.2.1 main**, `d58104b676ea` | `system-one-core/src/{validation,providers/http}.ts` validates own labels, probability mass and rubric; `pi-system-one/src/{tool,render,extension}.ts` uses one batch tool with on-demand instructions. | Reuse strict validation/compact-result lessons, not another SDK plus permissive argument-alias framework or extension autoload. Its fixed mass tolerance must accommodate the actual backend's serialization. MIT package declaration; no production dependency added. |
| TradingAgents **v0.6.0**, `ff0d0b1b4d72` | `agents/post_screen.py` optional Jev relevance/stance filtering; `agents/{structured,managers/portfolio_manager,trader/trader}.py`; `graph/trading_graph.py:141`; `default_config.py`; `backtest.py:1`. Separate quick/deep providers, structured proposals, settings/portfolio-bound resume, dated independent decision evaluation. | Optional quantitative-suite comparison. Preserve original evidence on failed screening. Its 16-worker/three-attempt post requests finish in the background after first failure; do not copy cancellation/budget behavior. Its backtest is explicitly not a filled-order/cash-ledger simulator. |
| Qlib **v0.9.7**, `da920b7f954f`; RD-Agent **v1.0.0**, `484776c211e4` | Qlib `data/dataset/{handler,processor}.py`, `workflow/record_temp.py`; RD-Agent `app/qlib_rd_loop/factor.py`, `scenarios/qlib/{developer/factor_runner,experiment/workspace}.py`: factor/model experiment, train/valid/test ranges, controlled execution and actual backtest artifacts. | Quantitative data/experiment engines and patterns, not a Fleet host replacement or proof of a profitable strategy. No datasets, Docker/Conda runtime or live trades were run. Both source licences are MIT. |
| Cindy **v0.1.95**, `2a0ccfcd4ca6` | `main/utility-model/resolveAuxiliaryModelChain.ts:1,119`; `maker-core/src/session.ts:1658`; `agents/shared/auto-review-decision.ts`. User-selected chains/route snapshots and rechecked permission/plan generations; automatic review failure returns Ask. | Routing/revision and failure-attribution reference. This is a language-model utility/reviewer mechanism, not evidence of a native Jev/Laya classifier. Retain Fleet's permission owner. |
| OpenCode **v1.18.34**, `aec0b9a6d889`; Qwen Code **main 0.24.7**, `2c591ecc08a6` | OpenCode `agent/agent.ts:38,153` separates primary Plan/Build and child roles with explicit model/permissions. Qwen `permissions/{classifier,autoMode}.ts:1,827`, `subagents/{types,subagent-manager}.ts` uses two generated-JSON risk stages, hard-rule floors and unavailable/manual fallback; stage 1 actually reserves 256 output tokens. | Explicit phase/worker configuration and revision/permission lessons. A permission "classifier" may be a generative LLM, not System One. Do not import default permissive child modes or a two-stage token budget as a lightweight universal decision layer. Qwen's main lock is not a published stable-app claim. |
| Grok Build **main**, `2bdd1d6a6369` | Updated reference metadata confirms the existing source lock; no newer published release was returned by GitHub. Its existing explicit plan/execute research remains the source route. | No inferred release or new decision feature. Existing source remains retained. |

**Executable evidence.** The unchanged community System One core validation/client/mock suites pass
29 Node tests without installs/network. Exact Craft parser and extracted Guarded leaves are probed
in [the retained comparison](</Volumes/AIGC/天工参考/software/intake/decision-model-comparison/craft-probes.json>):
its parser accepts an inherited `toString` option, clamps out-of-range probability/confidence,
and accepts missing probability mass. Active Guarded checks preserve an existing allow after a
missing answer or thrown error; disabled checks instead resolve to Ask through `mode-manager.ts`.
This is deliberate source policy and leaf evidence, not a live whole-app vulnerability claim.
The `decide` tool caches a resolution for 1s, and its callback invokes `client.decide` without a
Stop signal; Fleet must retain dispatch/revocation and cancellation checks rather than copying it.

Installed Pi classifier response tests reproduced nine malformed-response successes before the
bounded patch. The candidate now rejects unoffered/inconsistent labels, invalid ranges/key sets,
probability mass and out-of-rubric scores while retaining reported billed usage. Four-decimal local
distributions and own prototype-like labels remain supported. The same guard covers Cloudflare's
completed-run envelope. Actual loopback HTTP proves bool/noul request mapping and abort without
retry; no hosted model inference, price/accuracy benchmark, local weights or user-data request ran.
The subsequent Host slice reuses those checks: `test:decision-host` exercises permission, admission,
actual SQLite/artifact receipts, replay fencing and bounded real Node HTTP with authored responses.
Renderer checks exercise opt-in classifier choices and defaults. No weights, paid hosted inference
or quantitative-suite quality is established; automatic consumers remain unfinished.
The [typed-decision contract](modules/model-decisions.md) owns selected integration and acceptance.

## Composer defaults and selector comparison

Owner OV-077 requests actual Cursor interaction and project/global default comparison. Installed
Cursor 3.23.12 was opened: its existing unsent draft and model/effort/Fast/context values were
preserved, and the parameter popup and searchable grouped model list were inspected without
sending. Immutable bundle `Resources/app/out/vs/workbench/workbench.glass.main.js` implements
`writeSurfaceModelConfig` through application-user persistent model configuration, while
`resetEmptyStateDraft` reloads that configuration plus per-model parameter preferences. Its
`createComposerImpl` additionally has a default-switch option. These facts do not prove that
Cursor's coordinator Projects are Fleet's folder Projects; their product meanings differ.

Installed Codex 26.928.31416 was inspected from its ASAR, not a live GUI interaction: the computer
control tool refused the Codex app. In `app-initial-8a7b00193cb6.js`, `H7r` reads new-thread model
configuration keyed by host/cwd and distinguishes current-conversation changes from default
writes. `L7r` chooses a saved model or catalog default and validates the saved effort against
advertised levels. The native update path calls `setDefaultModelConfig`, clears prewarmed threads
and retains a host/cwd override when the write reports `okOverridden`. Work additionally has its own
last-used-model source. This is evidence for explicit scopes and truthful startup defaults; it
does not establish the owner's tentative claim that every project always copies its last chat.
Ignored source copies and byte-lock observations remain under `.fleet/reviews/model-default-study`.

Original ZCode `composerRecent.ts`/`newTaskDraft.ts` already scope accepted submissions by workspace
identity, but an empty initialized mode can prevent a later connected model from being selected.
Cindy's `ChatInput.tsx` distinguishes explicit model choices (`markModelChoice`) from effort/Fast
preference changes and scopes remote-device writes. OpenChamber's `useConfigStore.ts` resolves
project defaults before profile/agent/server defaults and keeps a project's variant paired with
its model. Those are reference mechanisms, not dependencies or new Fleet preference authorities.
The primary rechecked current refs for this correction: Craft HEAD/tag remains `73bd9c2a3573`;
OpenCode tip is `907b3bc518fa` and Cindy tip `d2e3da04f295`. Separate immutable tip copies under
`software/intake/` preserve all pins. OpenCode `packages/app/src/context/local.tsx:152,158,164,180`
keeps configured → valid recent → provider/first-model fallback; that component is unchanged from
v1.18.34. Current Cindy `apps/mobile/src/session/newSession.ts:431,668,729` binds model/provider/
effort and device/Agent scope together, waits for a fresh catalog before source fallback, and its
new `modelReselection.ts` preserves a hidden saved choice for explicit replacement. Fleet reuses
its existing scoped recent/CAS mechanisms and retains established new-draft fallback; it never
repairs an admitted/historical selection silently. Original ZCode `newTaskDraft.ts:12` and
`composerRecent.ts:54,84` establish scoped accepted-submission memory; original `SettingsPageParts`
and `selectTriggerVariants` supply the reused card and form-input rules. No reference UI code or
second data owner is imported. OV-088 removes the duplicate Subagents link and distinguishes
recent/fixed/automatic behavior. Settings also opts out of the composer focus selector on close,
using the same Radix return-to-trigger branch as the original non-chat selectors. Page inheritance
is labelled automatic available-model selection; it does not claim to read a Renderer recent record.
The test boundary is the rebuilt Host, not a copied label.
The [Models contract](modules/models.md#new-conversation-model-defaults) owns the selected behavior
and actual local regressions; no Cursor/Codex proprietary code was imported.

The further source comparison separates **default model identity** from **model-specific parameters**:

| Source lock and actual path | Mechanism and Fleet disposition |
|---|---|
| OpenCode `f66b86ceec1a`, `packages/app/src/context/local.tsx:162-194,230-365`; `context/models.tsx:14-39,125-140`; `components/dialog-select-model.tsx:56-117` | Explicit Session/draft → agent pin → configured/recent/provider fallback; searchable connection groups; variants are remembered by exact provider/model. Its [official loading order](https://opencode.ai/docs/models/#loading-models) confirms configured before last-used, which differs from the owner's Project last-choice requirement. Keep Fleet's explicit scoped choice before Host fallback; absorb parameter identity and direct search, not global recent/favorite UI or a Manage Models link. |
| OpenChamber `1a566db6c292`, `packages/ui/src/stores/useConfigStore.ts:2954-3075` | Project default → application default → agent/server fallback; manual selections survive unrelated agent/mode changes. This supports distinct owners and preserving active input; it does not justify another Fleet default-model settings page. |
| Pi `2b0a123de983`, `packages/coding-agent/src/core/settings-manager.ts:737-760,809-835`; `core/agent-session.ts:2310-2328` | Model/provider defaults are paired; per-model thinking overrides use exact provider/model and are validated/clamped on switch. The [current settings reference](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/settings.md) also distinguishes project settings and per-model thinking. Absorb scoped parameter memory; do not copy Pi's medium default or thinking enum onto every vendor. |
| Cindy `a46bb58fc326`, `apps/desktop/src/renderer/components/new-chat/ChatInput.tsx:6368-6430,7667-7685` | `markModelChoice` distinguishes selecting a model from adjusting its effort/Fast; connection/model parameter writes and remote identity are separate. Editing an old conversation's parameters must not change another model's active new-chat choice. Its multiple native engines and preference stores are not imported. |
| Craft v0.13.4 `b2d6c8aabdfd`, `apps/electron/src/renderer/components/app-shell/input/CompactModelSelector.tsx:78-164` | Uses an effective connection and pairs the selected model with its connection; a single configured compatibility model can avoid redundant model choice. Retain exact connection identity. Its hard-coded fallback Anthropic models are not evidence for a different connected vendor. |

Fleet's former picker reset parameters on every different-model selection; real renderer tests
reproduced loss before sending, across reopen and after a late acceptance. Corrections reuse the
existing scoped composer preference key for exact connection/model parameters. A 500-model actual
renderer test also reproduced unbounded mounting; the existing TanStack virtualizer now bounds
large menus while retaining search, all keyboard destinations, item positions and original rows.
Small menus retain their original DOM and controls. These local tests do not prove live provider
execution or owner visual acceptance. The module owns the resulting contract, not this table.

### Grok subscription Fast pairing

The built review's same-account native directory contains `grok-4.7` and
`grok-4.7-build-fast`. Listing both did not wire the Fast control. Cindy's inspected
`apps/desktop/src/main/maker-host/model-fast-mode.ts` resolves `fastModelId` within the selected
connection, while `__tests__/xaiSyncImport.test.ts` rejects missing, stale and other-account
targets and keeps the 4.7 pair separate from 4.6. These are mechanism observations, not evidence
that its fallback-to-standard behavior or quoted Fast tariffs are appropriate for Fleet.
Ignored byte-lock observations remain in `.fleet/reviews/model-default-study`.

Grok Build `2bdd1d6a6369` `xai-grok-sampler/src/stream/responses.rs:803` leaves `service_tier`
unset; its source does not establish a generic Fast flag. The [official xAI Priority documentation](https://docs.x.ai/developers/advanced-api-usage/priority-processing)
defines a separate API operation and requires the response's served tier before premium billing.
Fleet absorbs the exact same-connection variant pairing, keeps the selected Fast ID in its existing
immutable input/account path, and retains the original API Priority gate. It does not convert
subscription Fast into API Priority or assume a universal quota or price multiplier.

## Commercial desktop references

The owner authorized copying the installed NewMax and Minara clients and their Downloads installers
to the AIGC volume, with disjoint offline workers while primary development continued. These are
`EVIDENCE_ONLY` commercial comparisons. Preserve their original notices and provenance; neither
bundled dependency notices nor formatted JavaScript establish permission to import product code.
Remote service clients do not reveal their hosted server implementation. No app launch, user-profile
or secret access, paid request or third-party mutation was part of these audits.

| Reference | Source identity and preserved evidence | Fleet consumer and limit |
|---|---|---|
| [NewMax reference index](/Volumes/AIGC/天工参考/commercial/NewMax/README.md) | Installed 1.1.18 is retained separately from installer 1.1.19. DMG SHA256 `dc723fd60f170a51917814c07c332e9a8e9cca409beee4e2df011ffd5400063e`; installer ASAR `42038c7a7a6991d013a1a0fe945b20d2cda69256e5dc9e12746176854bf4ee99`. Decoded main/preload/renderer reading aids retain original spans and warnings; exact synthetic leaf tests remain synthetic. | [Comparison and dispositions](/Volumes/AIGC/天工参考/commercial/NewMax/FLEET-COMPARISON.md): bounded capability search/invoke and packaged topic help inform Context; sender-bound app view/data plumbing informs Components. The broker exists in both versions. Capsule backend entry, manifest permissions and separate AI path do not prove a unified application-operation host; app deletion loses its data. Hosted services, native helper internals and live behavior remain unknown. |
| [Minara reference index](/Volumes/AIGC/天工参考/commercial/Minara/README.md) | Installed 1.2.1 build `36741430652.1`, claimed source commit `164e677a43f63bc03eafe95a94a3ad5460acd79a`. DMG SHA256 `01a9060fa1b135876cdb8fb6ff0351b908e6ef6a389a453bdcced55b613dad36`. Its separate app copy matches 12,837 file/symlink records; primary rechecked 2,089 exact gateway spans, 6,363 ASAR entries and 83 evidence anchors. Installer mounting failed, so full installer/app equivalence is unproved. | [Source audit and Fleet comparison](/Volumes/AIGC/天工参考/commercial/Minara/research/AUDIT.md): GUI leases retained until settlement inform Browser/remote operations; account-bound unknown-submission recovery informs Media; accepted-version preview/data contracts inform Components. Conditional sequential automations and Full permission defaults do not satisfy Fleet governance. Office XML edits are not a native human editor; finance behavior is not Fleet product intent. |

### Primary NewMax model-configuration comparison

The primary traced installer 1.1.19's `ModelSettingsTab`, `NewPresetConfigPanel`, imported
`ModelListEditor`, settings store, preload IPC and Main's provider/settings/OAuth services.
[Detailed path map](/Volumes/AIGC/天工参考/commercial/NewMax/FINDINGS.md#primary-model-configuration-implementation-trace),
[original-bundle anchors](/Volumes/AIGC/天工参考/commercial/NewMax/evidence/model-configuration-anchors.json)
and [exact leaf probes](/Volumes/AIGC/天工参考/commercial/NewMax/evidence/model-configuration-probes.json)
retain source identity and proof limits. The primary separately viewed installed **1.1.18**
Settings/Connections and a managed detail/action list without enabling anything or executing a
model/connector action; this is not 1.1.19 visual acceptance or server implementation evidence.

Useful mechanisms are same-slot configuration, preserving custom URLs when changing preset
formats, exact manual additions, distinct directory/capability tests, account-keyed catalog reads
and layered model/effort defaults. The inspected implementation also clears frontend test results
on sidebar selection, enables at most 20 IDs after a model-array update, falls back to the full
catalog if every ID matches a non-chat name pattern, and can acknowledge settings after failed
SQLite persistence. First-model success publishes provider activation before later reasoning
refresh, which can issue paid probes for unknown models. Fleet retains its original controls,
exact capability/credential scope, explicit paid tests, catalog membership without the 20-model UI cap and
commit-before-publish instead of importing those behaviors. Detailed consumers belong to
[Models](modules/models.md); optional capability search belongs to [Context](modules/context.md#optional-capability-discovery-boundary).

The primary also traced NewMax's vision-purpose settings: renderer `VisionFallbackPanel:254793`,
`decideVisionFallback:58546`, `applyVisionFallbackForSend:64715`, Main `decideVisionFallback:81922`
and `buildFallbackChain:81954`, settings store `setVisionFallback:3735`. Its model and enabled flag
are separate; confirmed text-only input can preselect the configured image backend. It can cascade
across providers (maximum three) and probe candidate vision with extra inference. Fleet reuses the
purpose/confirmed-input mechanism on the existing admitted image adapter, without automatic probes
or cross-account paid retries. `PlanExecModelPanel:255411` keeps planning/execution choices apart;
this is evidence, not proof that Fleet has wired two-stage switching. Existing child-agent model
settings remain the correct owner of child-agent defaults. Cindy `maker-core/src/session.ts:865`
places its bridge after accepted reservation and checks cancellation before primary dispatch;
its `desktop/src/main/vision-bridge/vision-channel.ts` shares routing/credentials but declares OAuth
limitations. Neither reference replaces Fleet's Host ownership or proves live capability.

### Media acquisition and recovery comparison

| Inspected implementation / contract | Mechanism and Fleet disposition |
|---|---|
| NewMax 1.1.19 reading aid `analysis/installer-1.1.19/main.js:80679` (`generateImageWithSettings`), `:80730` (`recoverImageWithSettings`), `:81727` (`generateVideo`) | Resolve the configured image provider/model and OAuth account separately; image recovery is specific to its gateway request API. Video retains a task ID in a blocking submit/poll loop without a persisted restart or abort contract. Reuse the selection lesson, not its gateway or unproved recovery guarantee. Generated reading-aid lines map to the preserved bundle; these are not recovered TypeScript. |
| Minara 1.2.1 `extracted/gateway-readable/media/state.js:20`, `media/manager.js:824`; canonical bundle anchors E61–E62 in `research/SOURCE-EVIDENCE.md` | Interrupted submission becomes unknown; resume rejects blind generation, requires the original account, queries known receipts and downloads missing output again. Fleet applies these failure principles to native Session artifacts and its existing ledger, without importing Minara's media database or Fal service. |
| Grok Build `2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8`, `xai-grok-tools/src/implementations/grok_build/{image_gen,image_edit,video_gen}/mod.rs`, `xai-grok-login/src/side_call_bearer.rs` (under `crates/codegen/`) | Per-request side-call bearer and issuer checks; image JSON versus video submit/poll/download are separate. Subscription transport requires its own existing-owner adapter; an xAI API adapter cannot borrow a Grok login or advertise membership access from chat readiness. |
| Official [xAI edits](https://docs.x.ai/developers/model-capabilities/images/editing), [multi-image edits](https://docs.x.ai/developers/model-capabilities/images/multi-image-editing), [video generation](https://docs.x.ai/developers/model-capabilities/video/generation), checked 2026-10-02 | Edits use JSON references, with up to five images; video uses a retained request ID and a temporary `vidgen.x.ai` MP4 URL. Fleet downloads without bearer headers or redirects, bounds bytes and retains the original credential reference. Stop means stop waiting, not provider cancellation/refund. |
| Official [OpenAI Images API](https://developers.openai.com/api/reference/resources/images/methods/generate), checked 2026-10-02 | Exact published GPT Image IDs plus authenticated `/models` membership establish API image classification. Unknown variants and retired DALL-E IDs receive no generated capability. GPT Image returns base64; generation omits legacy `response_format`, editing uses multipart. Returned model/cost absence stays unknown, with no invented zero invoice. |
| Official [Sign in with ChatGPT preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations), checked 2026-10-02; Codex `ext/image-generation/src/backend.rs` | Public plan Responses currently excludes hosted image generation. Codex's standalone Images client resolves its own active provider/authentication; the source does not establish standalone image permission for Fleet's newly issued public grant. Preserve protocol/audience separation and do not route that token through Cindy's legacy private Responses example. |

These comparisons establish client mechanisms and published contracts only. The candidate's
own fixture/build/visual evidence belongs in Engineering and its capability register; no paid
provider result or remote-server implementation was obtained by this review.

Antigravity's public Python SDK is retained at `/Volumes/AIGC/天工参考/software/antigravity-sdk-python`, commit
`12f9a4c3becf487302dc799b0f59054f01f3ddb9`, Apache-2.0. This is `EVIDENCE_ONLY` for
`connections/local/{local_connection_config,local_connection}.py`: the Gemini/Vertex endpoint and
tool/policy protocol are inspectable, but consumer-subscription authentication is not established.
The [Models contract](modules/models.md#model-connection-correction) owns the verified CLI observations
and unresolved integration boundary. No SDK dependency or replacement executor was admitted.

Per-project `FLEET-ADAPTATION.md` guides inside each reference checkout are generated from the
tables below and the modules' `Execution` sections. After changing either, run
`python3 scripts/reference-guides.py --write`; `--check` validates without fetching. Refreshing a
checkout is not code admission or a baseline update.

Current checkout observation: 2026-09-29. Historical findings below retain their original revisions and dates.

Current checkout/document intake and revision-locked mechanism observations are recorded separately below.
This registry owns source evidence and admission gaps; the consuming suite owns the required proof.
Superseded audit, intake and gap documents are removed after their active facts are absorbed here or
in that suite. Original source locks stay attached to retained findings; deleted reports remain in
ordinary Git history, with no archive copy or requirement for new agents to read them.

This is the canonical cross-check between the reference map, the local read-only checkouts and
the product matrix. A row in this file does **not** authorize importing code. Admission status is
independent from cache retention: most `REVIEWED-HEADS.tsv` entries still use the legacy two-column
format; their `pending` labels describe the older admission ledger, not the current review below. `plugins/xyflow`
has now completed a structured Grok source review but remains `INSUFFICIENT_COMPARISON`, not an
admitted reference. The local commit and license facts below were checked directly against the
checkout; they are not claims that the mechanism has passed product comparison.

## Whole-product baseline comparison

OV-025 reopens the complete baseline. This assessment uses the confirmed requirements in
[Product](product.md#baseline-reassessment); earlier rows that forbid another runtime describe
in-place ports into Craft, not a reason to exclude that software as a complete replacement.

**OV-027 selects ZCode as the product-base direction**, superseding the earlier Cindy-first
feasibility recommendation. Its existing execution/model boundaries are inspected
[below](#zcode-baseline-and-pi-integration); its native-suite gap remains to prove. Keep
OpenChamber and DeepSeek Harness as comparison evidence, not parallel production hosts. The
[reuse challenge](#requirements-and-reuse-challenge) adds portable UI/tools and document-centric
editing paths that need not inherit Cindy's private API or Session-bound artifact model. Prefer the
host requiring the fewest replacements of its core to finish the agreed work chain, not the most
features. ZCode is not yet an accepted Fleet build; product direction is distinct from runtime or data migration acceptance.

### Evidence level and revision boundary

Inspected local source locks: Craft `b2d6c8aabdfd` (v0.13.4), Cindy `d4489b81a34c`, ZCode
`29628c9acdb8` (3.14.3), OpenChamber `f9d212f38a90`, DeepSeek Harness `477b4f420553`, AionUi
`6744099b279b` with separately checked AionCore `153c6f5cd03d`. Paths below start at
`源码参考/software/<project>/`. Cindy's abbreviated `main/` and `renderer/` paths are under
`apps/desktop/src/`; ZCode's composer/Session paths are under `packages/ui/src/v4/`.
Full revisions remain in the inventory or Git checkouts.

Read-only upstream-head checks found ZCode, DeepSeek Harness and AionUi at the same revision;
Cindy's remote main was `4109c63decced95e567cc9c2db31a54d2b4a5d12` and OpenChamber's was
`60d836c4893b6b694610b5b0277be54111359428`. Those newer revisions were **not** inspected or applied.
Do not transfer the findings to them automatically. No reference was re-pinned. Official repository
and license pages were also consulted; local implementation claims use the locks above.

The six candidate roots have no `node_modules`; an installed `/Applications/ZCode.app` is present,
so missing checkout dependencies do not imply every candidate is unavailable. No candidate app, package installation, real-model
call, account login or cross-platform build ran in this assessment. Existing test files were read
for coverage and mocking boundaries, not reported as passing. The specified Claude history
`1fd52c4f-6d91-47a2-bd43-d489866d9224` was read for human-authored direction; pasted Agent reviews
were treated as claims to verify, not instructions or acceptance.

### Complete candidates, not a feature-count ranking

| Candidate | Relevant implementation inspected | Gap against Fleet and cost implication | Proposed role |
|---|---|---|---|
| **Cindy** · Apache-2.0 | `packages/plugin-protocol/src/manifest.ts:47` declares tool, panel, file, main-view, Skill and on-demand worker contracts. `apps/desktop/src/main/cindy-brain/ghostWorkdirPrefs.ts:1` persists directory exclusions and reloads external edits. `main/mcp-integrations/ghost.ts:1563,1872,2256` filters discovery and gates calls before dispatch. `renderer/cindy-brain/ghostPanelBody.tsx:24` mounts the sandboxed panel with crash/reload handling. | Closest source fit for a Project choosing native work suites, but not already Fleet. Directory preferences are owner-global exclusions, not portable Project configuration; bundled Skills can remain globally visible. Account-managed plugins and Device Link depend on Cindy services. Complete ZCode shell interaction and Craft visual/document adaptation still cost work. | Application-plugin and Pi integration reference; earlier first-candidate ranking superseded by OV-027. |
| **DeepSeek Harness** · MIT | `vendor/loader/src/config/entry.ts:73,134` controls subtree disable/disposal. `packages/preset/agent-preset-registry/src/mount.ts:258` mounts/audits isolated plugin trees; `session.ts:21` records preset selection in Session events. `packages/client/ui-slots/src/index.ts:112` defines UI slot scopes; `apps/desktop/README.md:5` describes the desktop host sharing the Web runtime. | Stronger general composition primitives; not proof of Fleet's Project suite semantics or artifact editing. `README.md` and `SAFETY.md` explicitly identify experimental developer-preview status and compatibility risk. Requires a broader product-shaping effort, provider/desktop verification and Craft surface ports. Cordis service isolation is not a security sandbox. | Modular-runtime alternative; do not embed it beside another candidate's kernel. |
| **ZCode** · Apache-2.0 | `packages/ui/src/v4/ConversationComposer.tsx`, `composer/V4ComposerToolbar.tsx` and `SessionPane.tsx:1395` join composer state to command acknowledgement; `SessionPane.tsx:2278` also has draft prewarming, so “draft means no backend record” would be an incorrect port. `packages/shared/src/plugin-types.ts:11` enumerates agent/command/skill/hook/MCP/LSP contributions. | Strongest direct match to the requested shell flow. That plugin inventory is not a native domain-panel runtime; replacing branding cannot supply document editing, per-Project suite lifecycle or human/Agent domain commands. Keep vendor-specific account/quota/marketing controls out of a shell port. | Selected product-base direction (OV-027); Fleet build and native-suite path remain unverified. |
| **OpenChamber** · MIT | `packages/sdk/src/manifest.ts:9,322` declares panels/backgrounds and local service surfaces; `src/host.ts:84` exposes host project/session/files operations. `packages/web/server/lib/guests/{service,grant-scope,persist}.js` owns lifecycle/grants. `packages/ui/src/components/github/GitHubAccountControl.tsx:43` uses OAuth/gh identities through runtime APIs. | It has real extension surfaces and must not be dismissed as “Git UI only.” Its Agent/session runtime remains OpenCode (`packages/web/server/index.js:54..102`). Guest `contributes.tools` describes existing tool output, not arbitrary new domain command registration; `service.provides` currently names browser. Project suite activation and shared domain tools need extra integration. | Strong challenger and Git/GitHub/reference SDK; not a second runtime to graft in. |
| **AionUi + AionCore** · Apache-2.0 | AionUi's `packages/desktop/src/renderer/pages/guid/hooks/useGuidSend.ts` reaches AionCore's Conversation service; AionCore's `crates/aionui-extension/src/types.rs:284` supports ACP/MCP, assistants, Skills, Web routes, settings and models. AionUi's `packages/desktop/src/renderer/hooks/system/useExtensionSettingsTabs.ts:46` subscribes to backend extension changes. | Broad general-assistant product, but the UI repository is not the entire runtime. `packages/shared-scripts/src/prepare-aioncore.js` prepares a separate native binary. Preserve the correct UI/backend pair: the inspected latest AionCore checkout is not automatically the binary/version AionUi releases. Domain-editor command sharing remains unproven. | General-workbench challenger; higher multi-language integration/build burden to establish. |
| **Craft Agents** · Apache-2.0 | `packages/session-tools-core/src/handlers/pages.ts:1` delegates Agent page actions to injected storage callbacks; chat, preview and Pages are valuable existing consumers. Current `docs/modules/components.md` records the absence of a suite resolver/native component lifecycle. | Continuing the current approach means replacing creation/navigation while building the central suite host and preserving Workspace compatibility. The current uncommitted diff spans 71 tracked files, with substantial `AppShell`/composer edits, without closing that central loop. Diff size alone is not the defect; missing core outcomes and owner rejection are. | Preserve valuable surfaces/data and compare a minimal correction; no longer the presumed whole baseline. |

### ZCode baseline and Pi integration

**Source locks:** ZCode `29628c9acdb8`, Cindy `d4489b81a34c`, Pi
`d6af72e1857c` (packages 0.87.1). Read-only review; no candidate build, paid request, dependency
installation or data migration was performed. The [official Pi repository](https://github.com/earendil-works/pi)
also distinguishes its model API, Agent loop and coding CLI. This is not evidence that every
provider, modality or account is supported by any one adapter.

| Question | Exact source evidence | Consequence for Fleet |
|---|---|---|
| Does ZCode need a new kernel to offer multiple protocols? | `zcode/packages/provider/src/config/provider-data-schema.ts:4` already declares Messages, Chat Completions and Responses; `:31,66` hold key-management URL, Base URL and headers. `model-config.ts` resolves model properties/options. | Rectify and neutralize the existing configuration-to-runtime path; do not rebuild these controls as a separate provider system. This is source support, not a real request/entitlement test. |
| What executes ZCode today? | `zcode/packages/services/src/zcode-agent/zcodeAgentProcessManager.ts:369,386` starts `app-server --stdio`; source is under `apps/zcode-cli/`. Its `packages/core/src/runtime/methods/{turn-loop,turn-model-step,model}.ts` executes turns; `packages/adapters/src/storage/session-store/sqlite-session-store.ts` persists Sessions. | This is a complete native executor, not Pi beneath a ZCode skin. Retain its lifecycle while establishing the base. |
| Is there a narrower model seam? | Under `zcode/apps/zcode-cli/`: `packages/adapters/src/model/model.ts:21` defines `ModelExecutor`; `runner.ts:138,258` constructs a model with an AI SDK executor; `runner-runtime.ts:1` imports AI SDK `generateText`/`streamText`. `packages/core/src/runtime/methods/model.ts:36,157` consumes the model contract. | A Pi model adapter can be compared without replacing Sessions, permissions or the Agent loop. It must preserve streaming/tool/reasoning events, usage, cancellation and per-attempt credential refresh. A small interface does not imply a trivial adapter. |
| How does Cindy use Pi? | `cindy/packages/maker-core/src/agents/pi/index.ts:4,2428` hosts `pi --mode rpc`; `translator.ts:640` maps its events. `cindy-bridge-source.ts:3992` gates tool calls, and `packages/maker-pi-manager/` owns remote Pi process management. Native-provider routing also exists; the introductory single-gateway comment is not the whole implementation. | Reuse bounded bridge mechanisms if replacing an executor; do not transplant Cindy's whole host or claim Pi supplies its permission/UI/remote stack. |
| Which Pi layer replaces what? | `pi-mono/packages/agent/src/agent.ts:114` exposes Agent options/hooks. `packages/coding-agent/docs/sdk.md:38,40,98` makes SessionManager authoritative for finalized context and supplies default storage/settings/tools; `:94` distinguishes `agent_settled` from `agent_end`. | `pi-ai` replaces model transport; `pi-agent-core` replaces the loop; full `pi-coding-agent` adds Session/compaction/extensions. These have different migration costs. Do not keep ZCode SQLite and Pi JSONL as competing histories. |
| Can Pi be the universal capability catalog? | `pi-mono/packages/ai/README.md:5` restricts its chat catalog to tool-calling models. `src/types.ts:535,1068` declares text/image chat content; `:421` includes cache usage. ZCode's model contract also validates PDF/video input. | Keep authenticated discovery, manual additions and capabilities in the existing host owner. Native files/audio/video/realtime may need operation-specific adapters; converting PDF to text is not native file support. Retain actual usage for the token ring; do not equate usage totals with current context occupancy. |
| Does Pi solve native work-suite hosting? | `pi-mono/README.md:42` explicitly lacks built-in filesystem/process/network/credential permissions. Its coding-agent extension/UI contract is not Cindy's domain-panel host. Current Craft already depends on all three Pi packages in `app/packages/shared/package.json:88`. | Kernel selection does not resolve Fleet's missing plugin surfaces or human/Agent shared operations. Keep that proof separate; existing Pi use did not prevent the rejected product outcome. |
| Is debranding just renaming UI? | ZCode's provider schema distinguishes `zhipu-account`, account entitlement, off-peak modes and vendor groups. `packages/provider-node/src/zcode-builtin-*`, `packages/services/src/coding-plan-subscription/` and CLI `official-coding-plan-gateway.ts` own further vendor behaviour. | Remove mandatory vendor/product coupling and review service endpoints; retain supported vendor access as an ordinary optional connection. Preserve license notices and explicitly migrate identifiers; do not globally replace strings or delete useful generic capabilities. |

**Historical intake options (not a veto on the full-SDK comparison below):**

1. **ZCode host + existing execution/model stack:** lowest integration cost and the first baseline
   proof. Multi-protocol support already exists; improve setup, model discovery and actual request
   binding before changing libraries. Do not claim it meets all Fleet requirements already.
2. **Same host/loop + `pi-ai` adapter:** a bounded comparison for a demonstrated provider gap.
   Recommended next experiment only where Pi improves real behaviour; it is not a full Pi kernel.
   Freeze one connection/model/protocol/effort selection per request, use one credential authority,
   and never silently execute both adapters or introduce a second catalog owner.
3. **ZCode host + Pi Agent runtime:** possible, but requires explicit mappings for tools/MCP,
   approval/refusal, cancellation/steering, compaction/replay, extensions, remote recovery and usage.
   SDK embedding avoids a CLI bridge but transfers more lifecycle work to Fleet; Cindy-style RPC
   reuses CLI behaviour but brings protocol and persistence mapping. Neither wins without proof.

Those were the earlier intake priorities. OV-067/068 require a kernel-first full-SDK comparison;
existing code or an extensible transport alone does not establish the best execution layer. Measure identical fixtures and a
separately authorized real task: route correctness, stream recovery, tool refusal, restart,
capability preservation and cache/usage accounting. Same SDK does not guarantee better model
performance or cache hits. This recommendation selects no new production dependency. Project
plugins, Craft-assisted operations and neutral model management remain requirements under OV-026/027.

### Hermes, OpenClaw and CC Switch

OV-029 requests comparison **and implementation**, following the selected ZCode direction.
The following local source locks were inspected without changing their pins. All three carry MIT
licenses; ZCode carries Apache-2.0. This slice borrows mechanisms, not their code or storage systems.

| Reference | Reviewed HEAD | Concrete evidence and landing decision |
|---|---|---|
| Hermes | `fae9e5677a3ef339ec582e967ee19cac13bf68af` | `agent/prompt_cache_scope.py` preserves logical cache identity across compression but separates forks/new conversations; explicit inherited scope is possible for cache-parity auxiliary calls. `prompt_cache_boundary.py` records the stable/volatile boundary at assembly time. `prompt_caching.py` applies request-local, route-specific cache markers. Reuse these rules at ZCode's context/request seam, not Hermes's Session DB or a text-marker heuristic. |
| Hermes | same | `agent/credential_pool_model_cooldowns.py` distinguishes model-scoped rate/entitlement cooldown from credential-wide failure. `provider_registry.py` uses scoped registrations with generation-aware restoration. Native Anthropic, Gemini, Codex Responses and other adapters coexist. These are evidence for scoped policy and extension lifecycle, not a reason to wrap every vendor in Chat Completions. Do not copy long fixed entitlement cooldowns as Fleet defaults. |
| OpenClaw | `cac0c021273af695cb257492b3c2b4b20075b665` | `src/plugins/provider-model-compat.ts` fills missing compatibility facts from provider request capabilities while keeping explicit overrides. It imports the workspace `@openclaw/ai`; this revision is **not simply an unchanged Pi adapter**. Separate discovery metadata from execution dependencies and scope facts to the actual route. |
| OpenClaw | same | `src/agents/model-extra-params.ts` separates typed thinking/fast controls from provider request parameters. `auth-profiles/order.ts` respects configured ordering, pinning and model cooldowns; an explicit empty order is meaningful. `auth-profiles/session-override.ts` preserves unavailable account selections and protects late commits by snapshot identity. Port the semantics through Fleet's chosen host owners, not its profile store and another Session layer. |
| CC Switch | `854c9f5fbf38edcb1ec940446ccf99d751b953fb` | `src-tauri/src/services/provider/live.rs` projects one provider into each tool's native config. `proxy/providers/adapter.rs` separates base URL, authentication, URL construction and optional transformations; `proxy/providers/mod.rs` distinguishes tool type from provider/auth type and defaults native-compatible routes to passthrough. Reuse explicit mappings and native-first transport. Model-ID translation is not capability, entitlement or harness-quality parity. |
| CC Switch | same | `src-tauri/src/services/proxy.rs:start_with_takeover` backs up configs, establishes the proxy, records takeover intent, writes live config and restores on failure; failed restoration keeps recovery evidence. This is a good future **external CLI integration** boundary. Fleet's in-process model requests do not need a localhost proxy or edits to other tools' configuration. Neither external takeover nor export is implemented here. |
| CC Switch | same | `src-tauri/src/proxy/thinking_optimizer.rs` can force adaptive effort to `max` or enable previously disabled thinking. Do **not** copy that policy: the user's selected effort and budget win. `cache_injector.rs` counts existing breakpoints, respects a limit and is opt-in; do not duplicate SDK markers or send Anthropic fields on all routes. `src/config/piThinkingProfiles.ts` distinguishes absence, `null` and `{}`; preserve explicit overrides and disabled options. |

**Synthesis:** keep ZCode's complete host and one execution loop. Its existing Provider instances
already carry access, endpoint and API format; its option-map/compiler and SDK adapters own request
encoding. Improve those owners instead of introducing a universal proxy, second model catalog or
second credential store. A brand/template supplies defaults, a connection identifies an account
and route, and model capabilities belong to that connection's model/protocol. One vendor may have
many connections and multiple supported protocols; API credentials never imply subscription login.
Pi remains a bounded adapter comparison for a demonstrated gap, not a prerequisite for these fixes.

**Cache and recovery admission:** stable tool/system prefixes, opaque thinking replay and supported
cache fields can be retained without changing user effort. Logical cache scope must survive compact
but isolate branches/accounts/routes; provider/model/policy changes must not reuse incompatible replay.
Actual cached-token usage, current context occupancy and cumulative billing are different quantities.
Auth rotation must distinguish bad credentials, model-only throttling, entitlement and transient
network failure; account/model changes cannot silently replay tools or migrate an in-flight turn.
Paid retention, larger reasoning budgets and cross-provider failover need explicit product semantics
and measurements. None is enabled merely under the name “optimization”.

**First implemented correction:** ZCode's `model-execution.ts:createProviderTransportFetch` wrapped
*all* connections in `official-coding-plan-gateway.ts`, which rewrites matching Z.ai/BigModel URLs
to the ZCode platform gateway. A user-owned API key was therefore insufficient to keep its selected
endpoint. The isolated Fleet candidate moves gateway selection to the already-frozen model binding:
only `zhipu-account` retains the platform route; both API-key access types use their configured URL.
The transport cache now contains network policy only. No schema, dependency, credential migration
or Agent loop changes. See [preparation and patch workflow](engineering.md#zcode-candidate).
The actual SDK request/response suite fails 9/11 checks on unchanged upstream and passes 11/11
with the correction, including streaming, two same-vendor keys, old/new bindings and all three API
formats. This is offline endpoint/credential evidence, not a live entitlement or cache-hit claim.

### Model service and credential comparison

OV-033 requests Cherry Studio and installed NewMax, including the Antigravity path. Evidence is
read-only source/package inspection and model-settings UI, not a live OAuth or inference test.
Cherry pin: `09d4ea5e2f6756a31377a388446d66253f87cd1b`. NewMax: installed macOS **1.1.18**, `/Applications/NewMax.app/Contents/Resources/app.asar`.
NewMax's obfuscated main bundle was inspected after restoring its string/property references;
`out/main/index.js` SHA-256 is `bf9646e514b21e3edff32e50ba2c0d9d7ea93ed7a46f2c670e961881d0270995`.
The inspected decoder is a pure string lookup; the application was not initialized for extraction.
Backend function traces and a synthetic selection probe establish the findings below, not a complete
security audit or live authorization proof. Its bundled implementation is inspection evidence,
not code admitted for copying. No account files, tokens or embedded OAuth secrets were imported.

| Concern | Traceable evidence | Fleet disposition |
|---|---|---|
| Provider selection | Cherry `ProviderSettingsPage.tsx` keys detail by provider and retains selection; ZCode `InlineEditableProviderCard.tsx` already owns the inline draft and connection form. | Keep ZCode's single provider owner and visual primitives; do not add a second settings route. Address and supported API format precede credentials. |
| Vendor vs. connection classification | Cindy `apps/desktop/src/renderer/components/settings/AddProviderWizard.tsx` begins with vendor search and a single vendor identity, then supported authentication/routes; Cherry `ProviderSettings/utils/providerApiOptions.ts` keeps dialect in connection settings. CC Switch `ProviderPresetSelector.tsx` also groups sponsored/partner presets, which is a different product concern. | Under OV-037, Subscription/API precedes the explicit vendor entry; service/plan, region and protocol are subsequent choices. OV-034 rejects the extra selection dialog. Installed NewMax keeps its connection form in the same content slot and exposes API formats as buttons; Fleet uses ZCode’s segmented-tab values, URL/key fields and existing authorization control in place. Vendor selection writes only a local draft. Preserve all 41 templates, independent account instances and custom providers; never merge identity by logo/name/URL. |
| Fetch and choose models | Cindy `apps/desktop/src/renderer/components/settings/UnifiedModelList.tsx:1078` puts search/refresh in the list; Cherry `ProviderSettings/ModelList/ModelListSyncContent.tsx` reconciles configured and available rows with inline selection. | OV-035 removes the dedicated fetch button/dialog. Candidate auto-loads only committed, credential-ready connections and automatically registers the complete discovered list through the existing owner, per the later owner correction. Search filters the single saved list; filtering disables reorder. Manual Add covers undiscovered IDs. Connection/account edits invalidate stale results; failed, partial or oversized discovery preserves saved models. Cindy `apps/desktop/src/main/maker-host/provider-model-fetch.ts:218-244,311` bounds model response bytes before parsing, including missing Content-Length. The candidate now applies an 8 MiB page and 20,000-entry cap rather than calling unbounded `response.json()`. The original ZCode Add opens one metadata dialog; Fleet’s lighter inline ID editor likewise admits one draft at a time, keeps explicit confirmation, and reports local save failure without exposing raw upstream text. No silent deletion or inferred entitlement. |
| Protocol defaults and overrides | Cherry `ProviderSettings/utils/providerApiOptions.ts:13` hides dialect settings for system providers; Pi `packages/ai/src/providers/{openai,anthropic}.ts` binds native APIs; OpenCode `packages/opencode/src/provider/provider.ts:208` selects Responses for OpenAI; Cindy `packages/model-providers/src/types.ts:170` carries explicit route/feature facts; OpenClaw `src/plugins/provider-model-compat.ts:71` preserves declared compatibility; CC Switch `src/config/piProviderPresets.ts:93` binds protocol, URL and model facts. | OV-035 and the later button correction: preset-owned default with directly visible, full-width format segments. NewMax `percentages-BXMCSKIN-B3EYv3z9.js:204922,205388` links declared preset URLs to format buttons and preserves custom URLs; ZCode `SettingsSegmentedTabs.tsx` supplies the visual tokens. [DeepSeek’s API reference](https://api-docs.deepseek.com/) explicitly pairs its Chat and Anthropic formats with distinct addresses. The candidate projects these routes from its existing template catalog; custom connections retain three explicit adapter formats. Candidate domain policy is shared with the host write boundary; legacy overrides remain, and no protocol probing or account/model fallback is added. The current three adapters do not imply Gemini-native coverage or universal lossless conversion. |
| Multiple API keys | NewMax renderer `percentages-BXMCSKIN-B3EYv3z9.js:203065` (`ApiKeyListEditor`); `settingsStore-DLnF3SYD.js:1691` (`normalizeProviderCredentialFields`) trims/deduplicates the array and retains a legacy primary key. The switch requires two distinct keys. | Candidate extends the existing API access schema with backup keys and a default-off switch. Primary-key compatibility, draft saving and Registry serialization share the existing provider owner; no second secret store. The original ZCode `ApiKeyInput.tsx` uses one inline field and blur/Enter saving; CC Switch hides the reveal action on empty input. Fleet keeps that first-key form, treats a second empty row as a cancellable draft, and exposes saved-key default/delete/switch only after two real keys. |
| Multiple subscription accounts | NewMax renderer account card around `percentages-BXMCSKIN-B3EYv3z9.js:205577`; OAuth stores expose status/list/start/cancel/setActive/removeAccount, then refresh models. | Separate account identity, credentials and entitlement from model identity. Persisted `connected` is not proof of current access. Switching/removing an account must invalidate in-flight catalog results and refresh bindings. CC Switch `CodexOAuthSection.tsx:480-545` places identity/badges left and account actions right; ZCode `StatusCards.tsx:70-110` uses the same information/action split. Fleet’s account row follows those slots with its own tier and allowance controls. |
| Backend settings consistency | Main `registerSettingsHandlers` serializes saves, checks `baseRevision`, computes a patch for legacy window snapshots, persists through `conversationStore.setSetting`, selectively synchronizes consumers and broadcasts a revision. Its persistence catch logs a SQLite failure while the operation can still return success. | Reuse revision checks and serial mutations through Fleet's existing owner; do not copy success-before-durable-save semantics or introduce NewMax's second gateway/proxy authority. |
| Backend account refresh and catalog | Main `OpenAIOAuthService` stores an account array and selected ID separately. `ensureFreshTokenForAccount` coalesces refresh by account; `listAvailableModels` captures the selected account before awaiting, coalesces its catalog request, caches successful results for six hours and retains a prior catalog on failure. | Account-bound coalescing and last-good data are valuable. Fleet must additionally reject stale connection revisions. This catalog TTL does not establish a six-hour quota cache or prove model entitlement. |
| Backend credential storage | Main `OpenAIOAuthService.getEncryptionKey/saveToDisk` uses AES-256-GCM and a separate 32-byte key file created with mode 0600 in the same user-data directory. Account metadata is projected separately from tokens. | Do not mistake local encryption with an adjacent key for OS-keychain protection. Retain Fleet's existing CredentialService boundary; do not read NewMax's actual account files. |
| Switch presentation and linked account state | NewMax `OpenAIOAuthPanel` at `percentages-BXMCSKIN-B3EYv3z9.js:205802`; ZCode `StatusCards.tsx:PlanStatusCardSurface`; Cindy `usage/codexAccountUsageRefresh.ts`; cc-switch `proxy/providers/copilot_auth.rs:fetch_usage_for_account` and `services/codex_oauth_models.rs` | Separate full-width switch panel with title/eligibility left and switch right. Candidate account allowance uses selected-credential WHAM/Copilot readers with post-response account/revision validation. A quota HTTP 403 has no proved authentication cause and remains an access-denied reading; Grok /settings enriches tier only and cannot overturn a successful credits response. Native app-server quota/model RPC is not available in the Pi runtime; bundled model catalogs remain explicitly labelled. Private endpoint support is not a live entitlement claim. |
| Failure recovery | Main `expandProviderKeyCandidates`, `recordProviderCredentialFailure`, `shouldProbePrimaryApiKey`, `classifyPreOutputRetry` distinguish preferred credentials, cooldown, cancellation and effective output. 401/403 stop primary probes; transient failures delay them. | Keep recovery within the exact service/model, default off. Provider error codes must distinguish invalid credentials, model entitlement, model throttling and policy errors; a bare 403 is insufficient. Stop automatic replay after any admitted output/tool action. |
| Counter-evidence | A synthetic probe of the actual `recordProviderCredentialFailure`, `recordProviderCredentialSuccess` and `expandProviderKeyCandidates` functions returns `[backup, primary]` after primary HTTP 401 and backup success, although the primary recovery record has `retryAt: null`. Failure tracking there is primary-only. Separately, image configuration calls `selectProviderApiKey`, which advances a round-robin cursor. | Priority demotion is not exclusion: a rejected key can re-enter after the backup fails. Fleet excludes unavailable identities and has one bounded attempt budget. Do not claim NewMax uses the same recovery policy for every modality. |
| Discovery, tests and allowance | Main `listProviderModels` builds format-specific catalog requests, validates response shape and returns metadata with `fetchedAt`. `runProviderTest` makes a model request. `getProviderBalance` and `fetchKimiUsage` use vendor-specific endpoints; no universal subscription-quota cache was established in these functions. | Keep catalog discovery separate from paid inference and quota acquisition. A format or model name alone cannot establish image/video/audio/tool capabilities. |

**Antigravity path:** renderer `ProviderOnboardingScreen-p5N8e6F4.js:8490–8630`
(`useAntigravityAuthStore`) calls `window.newmax.antigravityOAuth`, exposes account/tier/project/expiry
metadata and resynchronizes models after login, selection and removal. Main
`resolveAntigravityReadyCredentials` resolves the chosen account; `forwardAntigravity` requires its
access token and project ID, maps logical model/effort values, converts the Anthropic-shaped request
with `anthropicToAntigravity`, then forwards through a dedicated endpoint and response adapter.
`AntigravityCliTutorialCard` also offers official `agy` installation/login assistance; that is a
separate path, not evidence that every inference is executed by the official CLI. The installer and
login were not executed. This is a substantial account/catalog/protocol adapter, not an API URL preset.

The [current official terms](https://antigravity.google/terms) §6 explicitly restrict third-party
software using Antigravity OAuth; the page separately excludes specified enterprise arrangements.
The [official SDK overview](https://antigravity.google/docs/sdk/overview/) documents Gemini API-key
and enterprise/Google Cloud authentication. It is a Python Agent harness, not a neutral consumer
subscription transport. The [CLI authentication guide](https://antigravity.google/docs/cli/install/)
describes official-client login/keyring handling, not permission for a cloned desktop OAuth client.
Therefore NewMax's button does not establish a supported consumer integration for Fleet. Do not
copy a client identity, read another application's account store or label an unverified subscription
as supported. A supported vendor API and an explicitly selected external official harness are
different product choices; no second harness is admitted by this inspection.

**Landing boundary:** the isolated candidate extends `providerFacadeServices`,
`subscriptionConnections`, `CredentialService` and the request-auth seam. Address/format remain
above key/account rows; discovery automatically registers models in the single saved list. Manual
Add is its footer action and covers undiscovered IDs. Legacy single credentials remain readable.
Recovery keeps the exact service/model/protocol/endpoint, requires the user's switch, and accepts
only HTTP 401 or account-specific quota HTTP 429 before a success stream. It has ten distinct
identities and a two-minute admission limit; shared limits, policy/403, 5xx, network uncertainty and
streams do not rotate. Exhaustion also stops the outer workflow retry loop. API health remains in
the execution instance and is lost at process restart; subscription failure facts persist under
the existing encrypted account owner. Known reset/Retry-After windows are respected; unknown
temporary throttling has bounded backoff. No background inference probes are sent. Account
revisions reject stale results, and the existing file lock serializes refresh across hosts. Synthetic
transport/lifecycle cases cover these boundaries, not live exhaustion or a guarantee against account
suspension. See [engineering](engineering.md#zcode-candidate) for the candidate checks.

### Subscription admission evidence

The owner requests complete subscription access, not a count of provider presets. Track five
independent paths: authorization/renewal, account-bound model discovery, inference, allowance and
multi-account recovery. A template, OAuth login or meter alone proves none of the other paths.

| Provider family / source | Evidence and landing boundary |
|---|---|
| ChatGPT; GitHub Copilot | The candidate uses patched Pi AI 1.0.2 public ChatGPT and Copilot OAuth, registered through `bun-oauth` for the desktop bundle. Public ChatGPT uses Fleet registration, OIDC/JWKS account validation and public model/Responses routing; isolated minified/unminified tests use signed local identity fixtures. Earlier private Codex credentials retain refresh/read compatibility only. Prior region-policy HTTP 403 and OS-proxy investigation are historical transport evidence, not current public entitlement proof. |
| GLM, Kimi, MiniMax, Alibaba, MiMo, OpenCode Go | CC Switch `src/config/codingPlanProviders.ts` separates plan credentials from ordinary API credentials. Its substring-based host classification is not copied. Existing Fleet template metadata groups plan keys separately from OAuth accounts. Five additional regional routes cover MiniMax China/global, Kimi global and Alibaba Coding Plan China/global; saved provider instances remain untouched. Existing plan keys, API formats and same-model recovery keep their original owners. |
| Kimi Code | [Official integration guide](https://www.kimi.com/code/docs/en/) documents third-party membership keys and China/global coding endpoints. Native-client OAuth identities and user-agent spoofing are not required for that key route. The current `kimi-code` source also has a distinct managed OAuth account, native catalog and `/usages` allowance path; Fleet has not implemented it. An ordinary Moonshot API key is not evidence of Kimi membership access. |
| MiniMax; Alibaba | [MiniMax Token Plan](https://platform.minimax.io/subscribe/token-plan), [Alibaba regional Base URLs](https://help.aliyun.com/zh/model-studio/base-url) and [international Coding Plan](https://www.alibabacloud.com/help/tc/model-studio/coding-plan) distinguish plan/region routes. Hermes `plugins/model-providers/alibaba-coding-plan/__init__.py` confirms Coding Plan endpoints. Region and plan must survive retries; do not rewrite ordinary API connections or treat a key as an allowance response. |
| Claude | Cindy `apps/desktop/src/main/maker-host/claude-native-cli.ts` delegates login and status to native Claude Code; `packages/maker-core/src/agents/claude-code/index.ts` executes it and maps permission/events. [Official integration conditions](https://code.claude.com/docs/en/legal-and-compliance) allow end users to authenticate to the unmodified executable under the stated conditions, while forbidding a third-party clone of Claude account sign-in/token intermediation. [Current account-login guidance](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account) distinguishes native subscription usage from third-party usage credits. Orca `src/main/rate-limits/claude-oauth-usage-request.ts` calls a private usage endpoint with a Claude Code user agent; it is not a neutral membership inference transport. Do not advertise Pro/Max included usage through a generic API preset. |
| Gemini / Antigravity | Gemini CLI `docs/cli/acp-mode.md`, `packages/cli/src/acp/acpSessionManager.ts:164` and `acpSession.ts:781` expose native authentication/session/model/permission/cancel paths. Prefer that executor route for Google subscriptions; it is not implemented in Fleet. Orca `src/main/rate-limits/gemini-oauth-sources.ts` reads Gemini/OpenCode credential files, extracts CLI client credentials and calls private Code Assist endpoints. These are foreign-account management paths, not a Fleet-owned connection. Antigravity's official limitations and separate supported SDK route are recorded above; neither a Pi driver nor NewMax's button settles those boundaries. |
| Grok | Pi 0.87.1 supplies device OAuth but defaults to the ordinary API host. Official Grok Build `crates/codegen/xai-grok-login/src/manager/enrichment.rs`, `xai-grok-shell/src/remote/model_source/oai.rs` and `extensions/billing.rs:182` separately establish user identity, subscription models and `cli-chat-proxy.grok.com/v1/billing?format=credits`; its Imagine media bearer checks the OAuth issuer and API-key preference again per side call. The candidate binds chat/allowance to the existing encrypted account owner and Responses transport, with exact-account headers and reported credit/reset fields; its media adapter currently accepts only an xAI API key. Grok direct transport is not its full native harness. Offline coverage is not a successful live subscription login/inference/allowance claim. Cockpit remains comparison evidence; no account files were imported. |
| Qwen OAuth and plans | [Current Qwen authentication guide](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/auth/) records retirement of the old OAuth free tier. Coding Plan uses a fixed-fee subscription key on its China/international coding endpoints; Token Plan uses an API key on different regional endpoints and bills actual token use. Fleet has explicit templates for both and no obsolete OAuth preset. Patch 0053 moves the usage-billed Token Plan to API intake while leaving Coding Plan under subscriptions; neither category proves a quota or actual bill. |
| Official Codex banked resets | `software/codex` @ `67a709665`, `codex-rs/backend-client/src/client/rate_limit_resets.rs`, `types.rs:23`; `tui/src/chatwidget/usage.rs:218`. Separate read/detail/consume endpoints, selected credit, stable redemption identity and explicit confirmation. [Official account behavior](https://help.openai.com/en/articles/20001498-how-banked-codex-resets-work). | Fleet reuses its encrypted subscription owner and account lock; confirmed consumption invalidates cached quota. No automatic consumption, paid checkout or assertion of public/stable API availability. Real redemption is intentionally untested. |
| Cockpit quota request ownership | `software/cockpit-tools` @ `a24199f735051f13f6f1af6f63b1fd2562a62a84`, `src-tauri/src/modules/codex_quota_refresh_scheduler.rs:1` coalesces same-account refreshes and bounds concurrency; `codex_oauth.rs:926` preserves account egress and rejects silent direct fallback. | Fleet keeps one derived allowance cache per subscription owner; credential/account revisions isolate entries, duplicate refresh joins in flight, and old successful readings retain their timestamp on failure. Its existing host network correction owns login/refresh/usage egress. |
| Cindy OAuth extension metadata | `packages/model-providers/src/provider-oauth.ts` rejects overrides of client ID, scope, state, redirect and PKCE parameters. `types.ts` distinguishes native-client authentication from configurable OAuth. Extensibility must not permit a provider preset to override the host's authorization invariants. |

These references inform the existing connection owner; they do not admit a second Agent loop,
read other applications' live credentials, or certify private interfaces as official APIs.

### Official harnesses versus Pi

**OV-028 asks for vendor-harness comparison before kernel selection.** Inspect request and history
paths, not screenshots or model rankings. At the OV-028 review no checkout was updated, dependency
installed, official CLI launched or live credential used. OV-029's candidate work is documented above. These source
locks describe the mechanisms reviewed, not an assertion that they are current releases:

| Checkout under `源码参考/software/` | Reviewed HEAD |
|---|---|
| ZCode | `29628c9acdb81b703bbd4080c207a0e7ce5e276e` |
| pi-mono | `d6af72e1857cfb10b41d8ff8e69f0d72b4cf6d31` |
| deepseek-harness | `477b4f420553e8a52c2fbccc464d7561b239c443` |
| codex | `8b78f4796605bda8e31329537f5fef036e405e66` |
| kimi-code | `be7d5f5fea7800778e4660cd5f36780ba783bddd` |
| gemini-cli | `562f0361fe63952fcf2db793e3e9fc0ae69ec506` |
| grok-build | `f0e3be1100ef5252488e3be8bb0e91cf68d8c305` |

Paths below are relative to the named checkout. Pi request experiments use the **installed
`app/node_modules/@earendil-works/pi-ai` 0.87.1**, not a build of the reference tree. A model in
that catalog is a serializer fixture, not evidence of access, entitlement or server acceptance.

| Comparator and exact source | Mechanism worth retaining | What Pi covers / what remains outside it |
|---|---|---|
| **DeepSeek Harness:** `packages/llm/llm-deepseek/src/serialize.ts:55,70,146`; `replay.ts:27,38`; `packages/llm/llm-pi-ai/src/adapter.ts:318` | Native Messages serializes thinking signatures, Files image references and in-history system/tool changes. Replay metadata is versioned and model-scoped. Native and Pi adapters share one LLM seam; prepared calls freeze configuration. | Pi's DeepSeek Chat adapter already preserves `reasoning_content` and maps thinking/effort. That does not establish parity for native Files or another protocol. Reuse the adapter pattern without importing Cordis, its Session store or a second Agent loop. Native image `file_id` is not arbitrary document support. |
| **Codex:** `codex-rs/core/src/client.rs:315,345,969`; `codex-rs/models-manager/src/model_info.rs:46,105` | Native reasoning items survive replay; session cache keys and service tiers respect model/provider support. WebSocket continuation compares instructions, tools, reasoning and other request properties before delta reuse. Model instructions and supported tools are part of the harness. | Pi Responses preserves encrypted reasoning and session cache keys. Its captured request does not prove Codex's connection recovery, native tool policies or whole-loop behaviour. An OpenAI-compatible endpoint is not proof of those capabilities. Keep opaque replay and reconnect logic within the selected route. |
| **GLM / ZCode:** `apps/zcode-cli/packages/adapters/src/model/transform.ts:76,145`; `packages/provider/src/registry.ts:138`; [official preserved-thinking contract](https://docs.z.ai/guides/capabilities/thinking-mode) | ZCode already translates provider options and checks configured effort levels. Z.AI requires complete unmodified reasoning history for preserved thinking; defaults differ between Coding Plan and ordinary API endpoints. | Pi sends `clear_thinking:false` plus reasoning history. Do not write a duplicate optimization. The host still owns truthful effort choices and endpoint-specific capabilities; the GLM-5.3 fixture clamps unsupported `off` to enabled/low. Official documentation says GLM-5.3 thinking cannot be disabled. |
| **Gemini CLI:** `packages/core/src/core/geminiChat.ts:955,1260`; `packages/core/src/context/chatCompressionService.ts:48,128,352` | Preserve native part signatures; append retry information without rewriting the system prefix. Compression protects recent turns and retrieval tools and retains oversized output in files. | Pi preserves valid same-model function-call signatures and removes foreign-model signatures. CLI compression and raw-output recovery belong to the host context owner, not `pi-ai`. Its retrieval-tool names and numeric thresholds must be adapted and measured, not copied as universal policy. |
| **Kimi Code:** `packages/node-sdk/src/kimi-code-model-provider.ts:65`; `packages/kosong/src/providers/kimi.ts:504,597`; `packages/oauth/src/{managed-kimi-code,open-platform,managed-usage}.ts`; `packages/agent-core-v2/src/llm-adapter/model/catalog.ts` | Native managed Kimi OAuth and ordinary Moonshot API keys are mutually exclusive credential modes. Account-scoped `/models` declares protocol, thinking, tool use, image/video input and context; `/usages` has 5-hour, 7-day and monthly windows plus an optional booster wallet. The native request path also supports `thinking.keep`, session cache keys and endpoint-scoped media reuse. | Fleet's existing Kimi Code plan-key route is not its managed OAuth account or ordinary Moonshot API. Preserve the actual account/protocol/region and unknown allowance; do not copy its configuration store, default-model mutation or Agent loop. Fetched `395d537237d7` was inspected without moving the retained checkout. |
| **Grok Build:** `crates/codegen/xai-grok-login/src/{credential_provider,side_call_bearer}.rs`; `xai-grok-tools/src/implementations/grok_build/{media_bearer,image_gen,video_gen}/`; `xai-grok-shell/src/session/{usage_file.rs,acp_session_impl/side_call.rs}` | Chat requests refresh a wire-valid bearer before send; Imagine/voice side calls separately choose xAI-issued OAuth or a configured API key and refuse foreign issuers. Consumer tier gates and `GET /user?include=subscription` are distinct from API billing. Image generation is a tool; video start/poll/download is asynchronous at the provider; usage records model-scoped counters, reported USD and incomplete coverage. Auxiliary calls retain parent tools/effort/cache identity where supported. | Fleet's Grok OAuth conversation and xAI API media are separate current paths; a media catalog or chat token alone does not enable subscription Imagine. Reuse issuer-scoped credential checks and provider request shapes through the existing Provider/Job/Session owners. Do not copy Grok's blocking tool poll as Fleet's durable Job, private proxy headers, hidden automatic credential fallback or a second permission authority. No live Grok request was made. |
| **Qwen Code:** `packages/core/src/services/visionBridge/{vision-bridge-service,tool-result-vision-bridge}.ts`; `models/{modelRegistry,image-generation-capability}.ts`; `tools/image-gen.ts`; [current auth guide](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/auth/) | The retired Qwen OAuth free tier is still present in source but not a supported new login. Coding Plan uses a regional subscription key/endpoint; Token Plan is usage-based on different regional endpoints. Tool-result images are projected before the next model request; a separate vision model can caption them while the original result remains available. Image generation uses a separately configured API key and permission gate. | Fleet's templates distinguish the regional endpoints and patch 0053 puts the usage-billed Token Plan under API intake without changing its route. Fleet's final request projection already replaces unsupported tool media with an unavailable marker; actual tool-result captioning with explicit backend/usage and cold replay is `not implemented`. Do not copy Qwen's name-based vision guesses or silent full-turn model switch. Fetched `5ef79837be06` was not checked out. |
| **Qwen-MM-Plugins:** `src/capabilities/core/qwen_mm_plugins_core/readers/image.py`; `src/shared/native_mode.py`; `src/mcp_framework.py:190-240` | Its core reader returns resized MCP image blocks for a vision-capable main model. Text-only mode batches a separate VL caption request, then replaces the tool's images with ordered text or an unavailable marker. The global mode switch can send images to a paid endpoint and has no Fleet usage receipt. | Reuse media result/description ordering and failure semantics inside Fleet's one Session and consent path, not the plugin's hidden global switch or separate credential store. A local image-to-image-block transform does not give a text-only model vision by itself. |
| **Qwen-Live-Harness:** `packages/qwen-live-harness/src/realtime/{realtime-session,tool-confirmation}.ts`; `src/tools/{dispatcher,handles}.ts`; `src/config.ts` | Realtime Omni uses a region-bound DashScope API key over WebSocket, call epochs, bounded input/output and per-function receipts. Handler timeout reports that work may still finish instead of retrying; background ACP is optional. | This is not Qwen Coding Plan subscription access. Borrow the call/receipt/uncertain-effect semantics for a future Fleet voice adapter, retaining Fleet's one Session, permissions and durable Job. The current desktop host is macOS-only; no three-platform support follows from this checkout. |
| **Claude protocol:** [official cache/tool contract](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-use-with-prompt-caching); installed Pi `dist/api/anthropic-messages.js:791,1108,1177` | System/tools/history cache boundaries and opaque thinking signatures must survive correctly; dynamic tools and effort changes have provider-specific effects. | Pi already emits system/tool/tail cache markers and adaptive effort. This is protocol/SDK evidence, **not a full-source Claude Code audit** or an assertion of equal Claude Code performance. |
| **Pi Agent core:** `packages/agent/src/agent-loop.ts:174,301,389,516,722` | Steering/follow-up, context transforms, tool execution and pre-tool hooks are useful existing mechanisms. | `pi-agent-core` is a loop, not just transport. `pi-coding-agent` additionally owns compaction/session/extensions. Adopting either does not automatically import vendors' prompt/tool/continuation recipes and would require the migration proof described above. |

**Protocol distinction verified against official documentation:**
[DeepSeek Responses](https://api-docs.deepseek.com/guides/responses_api/) accepts the format but
ignores `prompt_cache_key`/`prompt_cache_retention`, has no `previous_response_id`, and does not
support OpenAI encrypted reasoning input. Its caching is automatic. An OpenAI optimization
cannot be enabled merely because a connection selects “Responses”.
[Gemini signatures](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures)
belong to response parts and must survive replay; they are not user-facing thinking text.

#### Reproducible offline request evidence

Run `bun scripts/probes/provider-harness-contracts.ts` from the repository root. The probe uses
synthetic keys and messages, intercepts Pi's actual `onPayload` callback and throws before sending;
an independent `fetch` guard rejects attempted egress. Result: **12 payload captures, six model
routes, zero fetch attempts, zero inference requests**. It checks:

- DeepSeek Chat high/max/off parameters and reasoning history; unsupported `medium` becomes `high`.
- GLM Chat `clear_thinking:false` and history; unsupported `off` becomes enabled/low.
- Claude adaptive effort, cache markers and opaque replay; an appended user turn leaves the
  system/tool request structures unchanged. This is not a server cache-hit measurement.
- OpenAI Responses encrypted reasoning, session cache key and stateless request fields.
- Gemini valid same-model tool signatures, and removal after changing the history's model identity.
- Kimi Coding's Messages/adaptive route; no inference about Moonshot Chat `thinking.keep`.
- Durable input-history immutability on every capture. Fixture signatures are synthetic; their
  preservation is verified, not their acceptance by a server.

This is a narrow executable comparison of **request construction** against the source contracts
above. It does not exercise native CLIs, provider responses, stream recovery, actual cache reads,
cost, quality or ZCode integration. Neither generic transport nor a vendor's complete harness is
declared the overall winner. The proposed landing boundary and next controlled comparison live in
[Context — First proof](modules/context.md#first-proof); kernel migration remains `not implemented`.

### Kernel choice against Fleet's complete product

OV-036 extends the comparison beyond connection setup. Source revisions above remain fixed;
additional inspected locks are Cindy `d4489b81a34cadee8842a356a2318fcc0c7a5404`, OpenClaw
`cac0c021273af695cb257492b3c2b4b20075b665`, Hermes `fae9e5677a3ef339ec582e967ee19cac13bf68af`
and OpenCode `adee738d1e4597a2d0d317ca61a1625eff289efa`. These are historical review locks;
the later owner-authorized refresh and new comparisons below do not retroactively update that evidence.

The decision uses four whole-workflow gates, not a model-count or plugin-count ranking: (1) one
durable Session/queue/event writer and one permission path; (2) exact model/account/usage routing;
(3) Project-scoped human/Agent operations with media artifacts and native page contributions;
(4) cancellation, restart and remote replay without rerunning effects. A candidate that supplies
only inference, an IPC protocol or terminal extensions cannot pass the complete host gate by itself.
Existing behavior is retained on a tie; a new loop must prove enough improvement to justify
replacing the same authority across all four gates. Source evidence does not establish model-quality
or token-efficiency superiority.

The code trace below names the actual writer and call site. “Chose” means the composition visible
in the locked source, not a maintainer's unstated motive. References with a business Session plus a
native SDK Session must bind both IDs and reconcile both lifecycles; a model SDK under a `Model`
interface has a different cost. The source-locked matrix distinguishes current implementations
from comments marking incomplete work.

| Project / source-locked execution choice | Submitted turn → model and tool path | State, authorization, extensions and integration cost |
|---|---|---|
| **ZCode** `29628c9acdb8`; candidate follows the same owner | V4 `handlers/session-flow.ts:184-285` admits `sendText` through `startPromptTurn`; `core/runtime/methods/turn.ts:95,633` runs `runRegularTurnLoop`; `turn-model.ts:14-33` binds the selected `Model.streamText` and per-attempt credentials; `tool/executor/call-runner.ts:65` executes tool calls. | `runtime/methods/events.ts:81-105` appends before live publication; `tool/executor/permission-flow.ts:175-225` routes approval through the existing broker. `bootstrap/app/create-app.ts:745` and V4 handlers' direct `record.app.runtime` calls show that a native executor cannot be dropped into the `Model` port or swapped through one interface. Plugin manifest `contracts/plugins/index.ts:97-154` covers Agent/command/Skill/hook/MCP, not a Fleet page. The candidate's first-party queue/account corrections reuse this path. |
| **Pi Agent core** `2b0a123de983` / installed `0.87.1` | `packages/agent/src/agent.ts:188,299-305,376-401` owns prompt, steering and follow-up; `agent-loop.ts:174-305,722` performs model and tool steps and calls optional `beforeToolCall`. The seven-case offline probe confirms denial and cancellation hooks, not Fleet integration. | Core messages/queues are in-process state; no Pi coding-agent `ExtensionAPI` or durable Session manager is loaded merely by importing it. A missing host callback lets a tool run. Replacing ZCode's loop means remapping durable queue, event sequence, compaction and permission results even though `pi-ai` already supplies model transport. |
| **Pi coding-agent** same pin | `packages/coding-agent/src/core/sdk.ts:175,437` creates an `AgentSession` around Pi Agent core and a `SessionManager`; `docs/sdk.md:38-84` states that manager owns finalized model context. `core/extensions/types.ts:1363` exposes `ExtensionAPI` tools/events/commands and terminal UI. Craft embeds this SDK in its own helper process; Cindy launches the standard Pi RPC CLI. Both use more than `pi-ai`. | Its native branch/compaction state can be private executor continuation beneath one Fleet Host. A competing outer Agent loop or two independently editable canonical transcripts would violate ownership; the native Session alone does not. Project extensions run with the Pi process's OS permissions ([Pi documentation](https://pi.dev/docs/latest/how-pi-works)); the stable extension UI is terminal-oriented. This does not automatically register Fleet native pages. |
| **Pi durable + Chord**, separate refreshed checkout `2532a0bef7f7` | `packages/durable/src/harness/harness.ts:174-185` admits a submission; `session/transaction.ts:187-205,343-358` commits entries/tasks/documents atomically; `harness/tool.ts:42-115` records the tool intent and replays only an explicitly safe call. New `test/harness-ownership.test.ts:115-600` checks child foreground/background cancellation and restart. `packages/chord/src/facets/host.ts:43-130` validates facet lifecycle and reverse disposal; the coding agent has a distinct `src/experimental/` Chord client/worker. | A leading substrate for Fleet's shared human/Agent data and durable Jobs, subject to the switching/recovery tests below; it is not a drop-in package. Durable calls its API experimental and does not yet read images (`packages/durable/README.md:1,131`); Chord offers multi-environment facets/replicated state but supplies no Fleet permission policy or finished page contract. An internal Fleet fork can own these gaps without keeping a second Session. |
| **Craft v0.13.4** `b2d6c8aabdfd` | `packages/shared/src/agent/backend/factory.ts:132-150,528-575` chooses `ClaudeAgent` or `PiAgent` from the LLM connection; `backend/types.ts:346` presents one `chat()` event stream. `pi-agent.ts:1-16,465-507` spawns a full Pi coding-agent subprocess; `server-core/src/sessions/SessionManager.ts:3518,6174-6220` builds the selected backend and consumes its chat stream. | The Craft business Session is separate from Pi/Claude native session state; `pi-agent.ts:1228-1390` routes tool checks back through Craft's PreToolUse path. This proves a multi-backend host can work, but selecting its host would reverse OV-027's product-base choice; merely copying its `PiAgent` would still require ZCode V4 event/permission mappings. |
| **Cindy** `374923c219ba` | `maker-core/src/maker.ts:714-730,1349` chooses a registered `agentKind` per business Session; `agents/index.ts:1-45` exposes Pi, Codex and Claude adapters. `agents/pi/index.ts:3751-3762` spawns `pi --mode rpc`; the Claude adapter uses the native Agent SDK, and Codex uses its native app-server. | Maker persists a business ID and native resume binding (`maker.ts:714-730`), handles invalid native resume, and translates permissions/events per backend. Its Pi adapter's launch, model mapping and cleanup occupy dedicated code, not a zero-cost SDK setting. Cindy's application-plugin host is a separate host facility; switching the default Agent loop alone would not bring that UI host to Fleet. |
| **OpenCode v2** `b471c2b44957` | `packages/core/src/session/execution/local.ts:12-38` coordinates one local drain; `runner/llm.ts:78-105` loads persisted history, resolves model/tools and streams the next call; `session/store.ts:27-64` reads SQLite history. `permission.ts:115-175` merges agent rules and saved project grants; `plugin/host.ts:20-74` exposes scoped transforms over Agent/SDK/catalog. | A complete alternative host with its own DB, permission and plugin services. The current `runner/llm.ts:47-78` explicitly lists incomplete V2 interruption/status, plugin-tool, progress and recovery work; do not infer parity from its API surface or treat the older V1 paths as current V2 proof. Importing it would replace ZCode's host rather than just its loop. |
| **OpenChamber** `60d836c489` | `packages/ui/src/lib/opencode/client.ts:1-35` wraps `@opencode/client` with runtime scoping and wire projection; `packages/web/server/index.js:1-55` starts/manages an OpenCode runtime and adds web endpoints. | Its `packages/sdk/src/manifest.ts:325-436` and `host.ts:84-163` define guest panels/actions/capabilities over **OpenCode's** Agent runtime. This is a useful Fleet UI-plugin/operation reference, not a separate Agent kernel. The server and UI still need a real OpenCode instance. |
| **Goose** `add40e76589b` | Desktop `ui/desktop/src/acp/mcp-apps.ts:1-105` calls the same Goose ACP backend; Rust `crates/goose/src/agents/agent.rs:2079-2115,2455-2495` owns replies, `session/session_manager.rs:455,1919-1965` writes SQLite messages, and `agents/state_machine/session.rs:30-105` applies effects. Its ACP provider `acp/provider.rs:799-806` delegates context and permissions to the complete external Agent. | Stronger desktop/CLI/native-executor evidence than a terminal-only SDK. MCP extensions and rendered MCP Apps are real, but `StandaloneAppView.tsx:57-113` opens a distinct ACP Session for a standalone App; that is not Fleet's shared human/Agent Project document authority. The inspected storage tracks Sessions/messages rather than atomic domain documents, media Jobs and tool-effect intent. Reuse ACP executor, permission-route and MCP App acceptance cases, not the whole Rust Host. |
| **AionCore** `153c6f5cd03d` | `crates/aionui-session/src/backend/mod.rs:81-155` defines `BackendConnection.open_session` and per-session `SessionBackend.dispatch → CommandReceipt`, `events()` and capability snapshot; implementations adapt Claude, Codex, Antigravity and ACP. `capability.rs:264-298` permits mid-turn delivery only for proven backends. | More than a thin connector: the shared orchestrator owns logical Session state while native executors own their processes. The source flags a concrete ACP pending-permission recovery gap in `backend/mod.rs:97-111`; current routing still uses a legacy ACP path. It is valuable for a future ZCode native-executor seam, but lifting its Rust orchestrator would replace the product's Session/protocol authority. |
| **Deep Agents JS** `9a64a1751ca4` | `libs/deepagents/src/agent.ts:180-235,303-405,450-533` composes LangChain `createAgent` with filesystem, subagents, Skill/memory and approval middleware. It passes a caller checkpointer/store; `backends/state.ts:1-51` keeps one file mode in graph state. | This is an embeddable graph executor, not a desktop host. The graph checkpoint, filesystem backend, todo and subagent state need explicit mapping to Fleet's Session/Project/Action owners. Human interrupt middleware exists, but it does not by itself provide Fleet's existing queue semantics or native page plugin lifecycle. |
| **OpenAI Agents JS** `fdaf0a66ca6e` | `packages/agents-core/src/run.ts:623-675` constructs `Runner` for tools, guardrails and handoffs; `memory/session.ts:27-99` lets callers supply history; `runState.ts` serializes approval/continuation, and `agents-extensions/src/ai-sdk/index.ts` adapts other model providers. | A legitimate embeddable alternative; its supplied Session interface avoids imposing a database, but the runner's item/approval state still needs lossless projection into ZCode's event and permission protocol. `run.ts:650-651` enables tracing and sensitive-data inclusion by default, requiring explicit Fleet policy. It is not Codex native execution or ChatGPT subscription access. |
| **DeepSeek Harness** `477b4f420553` | `packages/core/agent-loop/src/index.ts:331,369,652-715` registers the loop as `ctx.agents` factory; `agent.ts:305-408` logs turn/step/request facts; `tool-calls.ts:64-90,264-286` schedules parallel-safe calls and records call/result. Cordis scopes services and disposal through `ctx.effect`. | Plugin-first composition genuinely separates loop, storage, LLM and tools, which informs Fleet's future suite activation. Adopting Cordis as root would replace one authority with a new runtime composition tree. Its root `README.md:11-13` labels the project developer-preview; source composition is not a same-workflow migration proof. |
| **Codex** `67a709665ac7` | Rust Core snapshots per-turn model/environment and permission profile in `codex-rs/core/src/session/turn_context.rs:305,539-565,749-790`; tool handlers use those permissions; `app-server-protocol/src/protocol/v2/{thread,turn}.rs` exposes separate thread/turn commands and events. | A complete native executor with its own sandbox, Session and OpenAI-specific model/account route. The app-server is an appropriate optional-executor boundary, not a replacement for Fleet's general API-key loop or an embeddable model port. It must own its internal tool loop once selected. |
| **Kimi Code** `be7d5f5fea78` | `agent-core-v2/src/agent/loop/loopService.ts:1-105` binds a turn machine; `loop/machine/engine.ts:1-110` coordinates model and tool events. `permissionGate/permissionGateService.ts:19-95` adjudicates at tool execution; `llm-adapter/model/model-auth.ts:28-72` refuses simultaneous OAuth and API-key credentials. | Not merely a Kimi HTTP wrapper: it has scoped DI, event state and its own tool policy. `agent/plugin/agentPluginService.ts:35-60` defers a changed plugin prompt/tool snapshot to `/new` or `/reload`. Native Kimi auth and Session state cannot be copied into Fleet's generic key form without a second owner; model/effort and policy mechanisms remain useful. |
| **MiniMax Code** `d8a32b6bc3b4` | TUI `runtime/adapter.ts:110-131` consumes `CliService`; `local-runtime-v2/src/runtime.ts:299` creates it from V2 services; `service/turn-system/agent-host/native-production-dependencies.ts:125-174` composes the host and `@mavis/agent-runtime`; `agent-core/src/pi-turn-runner/pi-turn-runner.ts:154-217` runs the vendored Pi Agent. | A serious complete-host comparator: V2 owns SQLite Session, committed history, queue leases, permission gate and plugin publication. MiniApp manifests bind a client surface and a supervised process/MCP endpoint (`plugin/package/miniapp/validation.ts:32-49`, `plugin/runtime/miniapp/publication.ts:36-110`). The published repo covers TUI/exec/ACP; its desktop source is absent, so a native Fleet panel cannot be transplanted. Its vendored Pi Agent is `0.79.1`, not the refreshed durable/Chord engine; inspected writers remain Session/queue-specific, so generic shared Project documents and crash-safe media effects still need a separate proof. MiniMax OAuth/Token Plan is its own credential authority, not Fleet subscription access. |
| **Qwen Code** `88d881491b32` | `packages/core/src/core/client.ts:408,3055` owns the LLM streaming/retry loop; `coreToolScheduler.ts:3414-3445` settles tool calls. `permissionFlow.ts:1-28,60-110` factors the intrinsic tool permission and rule override shared by CLI and ACP, with approval-mode handling in the callers. `omni/tool-result-media.ts:80-110` normalizes media after tools. | Better reusable permission-layer and multimodal-input mechanisms than a generic name-based capability guess. It is another complete Session/tool/permission owner; adapting its bounded media pipeline is smaller than replacing ZCode with a Qwen-centered CLI. |
| **Grok Build** `f0e3be1100ef` | `xai-grok-pager/src/agent_runtime.rs:1-44` selects the Shell implementation; the real Agent resides under `xai-grok-shell/src/agent/mvp_agent/`. `xai-grok-workspace/src/permission/gate_preflight.rs:28-68` combines policy as deny > ask > allow. `xai-grok-shell/src/session/persistence.rs:1-15,1552-1576` has durable append/fsync barriers. | The source also offers configurable Chat/Responses model backends (`agent/config.rs:3766-3785`): calling it Grok-only transport was too coarse. Its account/remote-service and Rust Session architecture are still not a general Fleet replacement. Copy scoped model/permission/media receipts where useful; do not infer consumer-subscription entitlement from a custom API backend. |
| **Hermes / OpenClaw** locked details above | Hermes `agent/conversation_loop.py` runs its own Python loop; DirectSDK routes native Claude as a model client with replay and an admission relay. OpenClaw `extensions/{anthropic,google}/cli-backend.ts` distinguishes CLI model backends from its ACP runtime/gateway. | These show two different integration choices, not a universal native bridge. DirectSDK's replay/policy machinery and OpenClaw's gateway/channel owners would duplicate Fleet state if wholesale imported; neither source proves that Fleet may reuse another app's subscription token. |
| **Claude / Cursor (closed kernels)** official docs | [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview) runs the complete Claude Code binary with native tools, permissions and Session; [Cursor docs](https://cursor.com/docs) document behavior but expose no inspected embeddable Agent-loop implementation. | Claude is an optional full-executor candidate under its authorization terms; Cursor is UX/workflow evidence only. Neither supports a code-level transplant of its private internal kernel. |
| **CC Switch / Cockpit / CLIProxyAPI / HarnessRouter** locked details below | The first three select credentials, quotas or upstream HTTP protocols. HarnessRouter routes complete external harness tasks and normalizes receipts. | These are valuable at connection or external-executor seams, not alternatives to Fleet's default in-process Agent loop. Their own daemon/state/permission services are not imported. |

The 2026-09-29 refresh also checked changed kernel-path code, rather than treating the older
source locks as current. Cindy now passes Session identity into its Pi vision/companion launch
(`agents/pi/index.ts:5114,5148,5231`), still through its native adapter. Kimi now injects hook
parts into a prompt while filtering them from the displayed text
(`loopService.ts:594-605,1216`); Qwen restores memory bodies and invalidates delivery state when
history is replaced (`client.ts:1093-1098,1179-1186`). These changes reinforce that prompt and
Session state live in each complete harness. DeepSeek now records pending tool results on a failed
step (`agent.ts:331-356`), a recovery mechanism worth testing rather than importing its root.
Grok moved managed permission preflight into `xai-grok-permission-rules/src/gate_preflight.rs:27-96`;
it distinguishes rule-matched Ask from analysis-failure Ask instead of treating all prompts alike.
OpenClaw added a `subscription-auth` CLI dispatch gated on an owning transcript and a nonempty,
named tool allowlist (`embedded-agent-runner/cli-backend-dispatch.ts:36-74,85-94`), not a general
subscription-to-API bridge. Hermes still drives turns in its Python
`agent/conversation_loop.py`; the refreshed loop now rebuilds and re-pins a changed desktop/TUI
toolset with its system prompt (`conversation_loop.py:719-809`), explicitly breaking cache once
instead of silently retaining disabled tools. OpenCode V2's current `session/runner/llm.ts:47-78`
still lists interruption/status, plugin-tool and recovery work as incomplete; its named
session/runner/permission source files did not change at the refreshed HEAD. Codex's inspected
turn-context change only renamed a persistent execution feature predicate
(`turn_context.rs:956`); AionCore's backend/capability paths were unchanged. These checks support
the authority analysis below; they are not a full review of every refreshed commit.

**Implementation conclusion (OV-066, extended by OV-069):** evolve the selected ZCode Host
and add complete native executor adapters; its current default execution lane uses a Pi AgentSession loop with Host-owned requests/tools. Human/Agent feature
operations remain on the same domain owners. This closes the whole-Host selection for development;
Pi durable/Chord and the other compared Hosts remain mechanism evidence, not concurrent replacement
projects. The probes below support particular invariants, not a universal quality/cost ranking.
The selected route and reopening conditions are in [OV-066](decisions.md#ov-066--close-foundation-choices-and-deliver-in-dependency-order-2026-09-29).

| Whole-product route | Long-term capability and counter-evidence | Recommendation |
|---|---|---|
| Extend ZCode `AgentRuntime` and its existing workflow engine | Queue, billing, context and a journaled dynamic-workflow engine already exist. V4 calls `record.app.runtime` directly. Completed workflow effects replay from the journal, but an interrupted `world.run` with no recorded result is dispatched again. | **Selected development route.** Extend its existing owners and extract the complete-executor seam. Paid media needs receipt reconciliation; page/domain operations and native adapter parity remain delivery acceptance, not another base-selection gate. |
| Adopt full Pi coding-agent | Mature community extensions and model/tool loop; `SessionManager` owns a separate JSONL tree, and stable extension UI is terminal-oriented. A plugin executes with the Pi process's permissions. | A viable complete executor under a single Fleet Host, as Craft/Cindy demonstrate. Bind native continuation explicitly and replace the selected execution lane instead of running a second outer tool loop. The full-SDK/provider probe below removes the earlier categorical exclusion. |
| Build a Fleet kernel from zero | Could fit every domain exactly, but would reimplement atomic transcript/document/task commits, crash-safe tool intent, forks, ownership and replicated facet lifecycle already exercised in Pi's open MIT code. | Not selected. Build Fleet-specific operations on existing owners; no demonstrated requirement needs a blank-sheet executor or universal replacement store. |
| Fleet-owned Pi durable/Chord foundation | `pi-durable` `2532a0bef7f7` atomically commits entries/tasks/docs within its store, records tool intent and tracks child ownership. Chord supplies facets and replicated state. Raw config writes can change the model between tool rounds of one submitted input, and queued inputs do not capture their route. | **Not selected as the replacement.** Reuse a specific proven recovery/composition mechanism if a real consumer needs it. At this tested lock, whole-workbench fit, input binding and native page/editor behavior remain unproved; fixture benefits do not settle a whole-Host migration. |
| Adopt MiniMax Code V2 wholesale | It demonstrates a real in-process SQLite host, turn/history/queue ownership, permission gate and supervised MiniApp process publication above a vendored Pi loop. Its official source has no desktop implementation; account and managed-tool services are MiniMax-specific, while generic Project documents/Jobs are not established by the inspected Session/queue writers. | Extract the committed-history, queue-lease and MiniApp publication acceptance cases. Replacing Fleet's Host with its product stack would still require a new desktop suite/data/credential boundary and would not remove the need for a durable domain Job engine. |
| Adopt Goose Rust core wholesale | One open-source desktop/CLI/ACP loop with SQLite Session records, MCP tools/Apps and external complete ACP Agents. Its standalone App launches another ACP Session, while Project domain objects and media effect-intent transactions are outside the inspected Session schema. | Use its complete-executor and MCP App wiring as acceptance fixtures; a Fleet replacement still needs the shared Project operation and durable Job owner, plus data migration from ZCode. |

The source-level negative test matters: `pi-durable/test/harness-tools.test.ts:132` deliberately
shows that disabling an advertised tool after model preparation does not cancel that in-flight
call. Fleet must recheck Project grant, resource revision and permission **at execution**, even if
its tool registry or plugin facet has already changed. Its built-in `beforeTool` hook is a seam, not
an authorization system. The offline
[`fleet-kernel-shared-operation.mjs`](../scripts/probes/fleet-kernel-shared-operation.mjs)
probe runs one shared human/Agent document mutation, rejects a stale version, persists and revokes
a simple grant after the model reply but before tool execution, rejects another Project's missing
tool and restores the record and grant from SQLite. It also interrupts a fake media Job after its
external receipt, reopens SQLite, reconciles that receipt without another call, and disposes a
Chord-backed Project projection service. It makes zero network requests. This is a
candidate-substrate test: its one Boolean grant is not Fleet's full permission policy, the media
receipt is a fake, the facet is a backend service rather than a renderer, and there is no paid
inference or cross-platform release proof. The refreshed source's 125 focused ownership/recovery tests and
189 document/tool/SQLite/facet tests pass; overlapping test files are not additive coverage.

A follow-up fetch observed Pi HEAD `1b347794e2a630e4359f2584f4eea388145d0ddf` on 2026-09-29.
Its only diff from the tested `2532a0bef7f7` is `packages/durable/test/harness-ownership.test.ts`
(206 additions, 3 removals); runtime sources and the experimental-API notice are unchanged.
The proof checkout was not re-pinned, and the counts above are not claimed for the added cases.
The [Agent Skills specification](https://agentskills.io/specification) and official
[MCP Apps repository](https://github.com/modelcontextprotocol/ext-apps) were also checked for
OV-066's contribution boundary: portable instructions and tool UIs do not provide Fleet's installer,
native-document ownership or persistent page lifecycle.

The selected Fleet Host coordinates admission and receipts; existing domain owners retain their
data, including native editors' save and undo. Human controls and Agent tools submit the same typed
operation with resource version and caller identity. Transactions are local to each store; native
file and remote-effect partial outcomes require reconciliation. Authorization is checked before
admission and again at execution. Chord facets can register backend, renderer and remote services, but a
Fleet manifest grants no OS access by itself. The host must supply package identity, scoped grants,
view slots, signed/reviewed assets, revocation, failure and recovery. Media bytes live in an
artifact store referenced by a transaction, while deferred image/video generation has a durable
request/receipt/unknown-outcome state rather than a blind retry. This deliberately has one Session
and one permission authority; Chord is service composition, not a parallel store.

Complete official agents remain optional **whole executors** behind a capability-negotiated
`ExecutorPort` patterned after AionCore's receipt/event separation. The host stores an opaque native
continuation binding and projects its ordered events, but never runs an outer Pi/Fleet tool loop over
native Codex or Claude. An executor without enforceable approval, resume or usage reports declares
that limit. Current ZCode V4 handlers directly call `record.app.runtime`
(`bootstrap/.../handlers/session-flow.ts:184-285`, `queue.ts:185`, `fork-edit-retry.ts:104`), so
an executor adapter and versioned data cutover are real migration work, not a provider setting.
Retain the ZCode shell and existing data writers while mapping these calls through the Host
executor boundary. Adding a native adapter does not by itself authorize replacing Session storage
or importing credentials; those changes retain their applicable checkpoint.

**Why this does not settle the UI plugin host:** ZCode's
`apps/zcode-cli/packages/contracts/src/plugins/index.ts:149` covers Agent/command/Skill/hook/MCP,
not a general Fleet page/right-panel contribution. Stable Pi `ExtensionAPI` supplies terminal UI;
Chord's newer presentation facets are still under `coding-agent/src/experimental/`. Cindy's
OpenDesign package and OpenChamber's guest SDK remain concrete UI contribution references. Fleet
must finish its own manifest, shared design system, scoped domain operation bridge and renderer
isolation over the existing Host services; importing a composition package alone does not do it.

Delivery acceptance follows [TODO](../TODO.md#delivery-order): OV-067 puts kernel admission,
persistence, permissions/recovery and native adapters before page operations and document packages. Preserve existing
Session/Provider/artifact writers and user data; a later replacement would require its own copied-data
replay and rollback proof. Source reconstruction is not a live-data migration. The ZCode candidate
remains `wired but not visually checked`; native executor adapters and the page-operation bridge
remain `not implemented`. No matched live quality/cost result is claimed.

**Executable evidence:** `bun scripts/probes/agent-kernel-contracts.ts` runs seven scenarios on installed
Pi 0.87.1 with a scripted model and blocked fetch: default execution without host policy; pre-tool
denial; unregistered-tool rejection; concurrent human-edit rejection by a shared revision-checked
operation; cooperative tool cancellation/idle; image-result replay without re-executing completed
tools; steering before follow-up. Zero network attempts. The first case is deliberate counter-evidence:
a Pi hook is not a ready-made Fleet permission system. In-memory restored history is not a crash-durable
storage proof; no native CLI inference, sandbox, complete Fleet migration or model-quality claim follows.

The corresponding Fleet proof must add the full Project policy, UI registration and real media
artifacts, then verify the same workflow against a copied ZCode Session. The current candidate
remains the baseline; source suites and synthetic models do not establish live inference quality.

### Switching executors and downstream development

The owner's follow-up reopens the earlier categorical kernel claim: a user-selectable execution
mode must be evaluated as part of the architecture. Three routes were compared: one embedded
loop for everything; several whole product kernels with independent state; and one Fleet Host
with several capability-checked executors. The third is the recommendation. The two selectable
operations have different semantics: model/account selection within one executor and handoff
between complete executors. Neither is an in-flight pointer swap.

| Current source | Executed or traced boundary | Consequence for Fleet |
|---|---|---|
| Cindy `a46bb58fc3`, `apps/desktop/src/main/maker-ipc/sessionAgentSwitchHandler.ts:510-645,875-950`, `agentHandoff.ts:73-90,434`, `maker-orchestration/rewind.ts:227` | Choice is staged until send; the old native Session is parked and switching back resumes it plus a delta memo. A fresh target receives a bounded textual handoff. Cross-engine rewind is rejected. DB route commit precedes boundary insertion, and a failed boundary insertion degrades to RAM handoff. | Adopt deferred choice and explicit handoff semantics. Make the route binding and durable handoff receipt one Host transaction; do not copy the process-crash gap. Preserve artifacts independently and never claim that text transfer preserves thinking signatures, cache or image bytes. |
| Craft latest `3eac37be5e`, `server-core/src/sessions/runtime-config.ts:46-99`, `SessionManager.ts:3221-3266` | Credential/provider identity changes require backend recreation; runtime refresh waits until the active turn is idle. | Account switching must rebind credentials and native continuation, not merely change a model label or quota card. |
| AionCore `ea24f50af2`, `aionui-session/src/{backend/mod.rs:78-150,capability.rs:74-115}` | `dispatch` returns an admission receipt separately from ordered turn events. Queue, steer, mode effective time, media input, approvals and context query are distinct capabilities. 609 library tests passed using its native-wire fakes/reducer tests. | A common adapter method cannot promise equal behavior. Keep request accepted, turn running, permission waiting and completed separate; gate each control on the actual adapter and current connection. This does not verify live vendor authentication. |
| Goose `add40e7658`, `crates/goose/src/acp/{handoff.rs:18-105,provider.rs:799-806,1042-1098}` | The complete ACP Agent owns its context and tools. Handoff uses a bounded text memo. A first prompt rejected for certain context errors can retry without the memo; cancelled/refused handoff may be sent again. | Use complete-executor dispatch, but do not silently drop required context to make a request succeed. Preserve a receipt for what context was accepted; a rejected handoff should offer a visible new branch or retry. |
| Pi durable `2532a0bef7`, `harness/generation.ts:104-140`, `harness/harness.ts:242` | The actual runtime was exercised with two scripted providers. `setModel` during a tool made the same input's next model request use B; a paused input submitted on A also used B after config changed. Waiting for idle kept the first input on A. | Fleet must persist a complete execution binding on each admitted input and use it for the whole run/retries. Pi's request checkpoint is narrower than Fleet's user-turn boundary. |
| Original ZCode `29628c9acd`, `dynamic-workflow/src/engine/{engine-world.ts:42-75,engine.ts:332-345}`, `adapters/.../dwf-journal.ts:95-110` | Three source-backed replay tests: completed world effects are cached; changed scripts cannot resume; a running world effect with no result is dispatched again. Candidate package source was byte-compared with the original before execution, using the candidate's installed TypeScript 5.9.3. | Corrects the earlier overly broad lack-of-durability claim. Journal replay is valuable, but unknown paid effects need receipt lookup or human reconciliation before retry. |

**New reproducible checks:** `node --test scripts/probes/executor-switching.mjs` passes 3
upstream-Pi behavior cases. `node 源码参考/software/pi-mono-latest/node_modules/vitest/vitest.mjs
run --config scripts/probes/cindy-handoff.config.mjs` passes the 70 unmodified Cindy handoff tests
and 3 added boundary cases: long-history loss, no transfer of thinking/image bytes, and delta
handoff's dependence on a valid parked native Session. `bun test
scripts/probes/zcode-workflow-replay.test.ts` passes the 3 original-engine observations.
`cargo +1.97.0 test -p aionui-session --lib --locked` in AionCore passes 609 tests. The first
offline build could not resolve an uncached locked Git dependency; the successful build fetched
development dependencies in the reference checkout without adding a Fleet production dependency.

`node scripts/probes/durable-process-recovery.mjs` additionally kills a real child process with
SIGKILL after a fake external effect but before Host result commit, then opens the actual Pi SQLite
store in two new processes. A queryable receipt completes without another effect; an unqueryable
receipt stays `needs-reconciliation`, also without another effect. This proof relies on the
adapter's explicit local fake receipt lookup; Pi cannot confer exactly-once semantics on an
arbitrary remote API. No real model, subscription or paid media request was sent.

Earlier inspected native binaries reported Codex `0.156.1` and Claude Code `2.1.281`; AionCore's
verified descriptors name `0.151.0` and `2.1.274`. The installed Codex binary successfully exported
its current experimental JSON schema without inference. `node scripts/probes/native-protocol-surface.mjs`
checks provider/thread scope, subsequent-turn model/policy changes, steering with `expectedTurnId`,
and tool/approval correlation. The [official App Server contract](https://learn.chatgpt.com/docs/app-server)
and generated schema separate thread configuration, turn identity, steering and approvals. Aion's
test result therefore validates its adapter fixtures, not blanket compatibility with the user's
newer binaries. Ship version/capability negotiation and integration tests, not only a name match.

The resulting switching contract is in [Agent core](modules/agent-core.md#kernel-target-under-ov-036);
the feature-by-feature implementation impact is in [Architecture](architecture.md#executor-choice-and-feature-development).
Model quality, task success, actual cache savings and provider latency remain unmeasured. Those
need fixed real tasks and authorized inference on the same accounts; passing offline contract
tests cannot rank their intelligence or establish a universal winning engine.

**Whole-product evidence limit:** the existing product contract already requires shared live
native artifacts, human/Agent editing, save/undo/reopen, Project-scoped page contributions and
contextual feature operations. The probes above do not execute those loops: the shared-operation
probe edits a JSON record, its media receipt is fake, and its facet is a backend service. These results
do not establish a universal whole-workbench winner. OV-066 selects the existing Host for development.
This is a limit of the comparison, not a new requirement
or an instruction to invent a universal document store. Start from the existing ZCode settings
service and the [already-defined page-operation proof](modules/components.md#context-menu-assistance-source-backed-landing-boundary),
then the [native-format proof](modules/canvas.md#native-document-editing-info-05--create-16-r10).
Cindy/DeepSeek composition, GenOffice operations and Craft contextual interaction must be assessed
at those actual callers; a coding benchmark or pure SDK test cannot substitute for them.

### DeepSeek Harness desktop source comparison

Owner requested the open-source implementation, rather than a screen-only review. The official
repository and local reference both resolve to `639ed015397290b3745d163aafe02ffee4aa3f84`
(`0.2.0-rc.2`); the read-only upstream HEAD check on 2026-09-30 matched. No reference was re-pinned.
This is source/mechanism evidence, not Fleet integration or permission to replace its Host.

| Source at that pin | Implementation finding | Fleet consequence |
|---|---|---|
| `apps/desktop/src/main.ts:662,683`; `host-process.ts:146`; `backend-controller.ts:82`; `paths.ts:19` | Electron serves bundled Web assets through its app scheme and forwards application operations to one authenticated Host child. Startup/stop are generation-owned; Desktop has its own reserved profile. | Reuse failure/cleanup and boundary tests over the existing supervised Fleet CLI; avoid a second backend per feature page. Desktop packaging is separate from Agent-loop choice. |
| `packages/core/agent-loop/src/agent.ts:31,331,436,534`; `packages/llm/llm-pi-ai/package.json` | Its own queued-turn driver derives requests from Session history, calls the LLM seam and executes tools. The Pi package here is `pi-ai@^0.87.1`, not full pi-coding-agent. | Do not describe this desktop release as another full-Pi Host or reopen the current executor choice from screenshots. Compare concrete queue/recovery gaps, not dependency names or an unmeasured quality ranking. |
| `packages/client/ui-model-selection/src/client/{directory.ts:91,155,ModelSelect.tsx:100}` | Composer and `/model` share one per-Session directory. Host reasoning metadata supplies the default; generation guards reject stale settlements and unavailable saved identities remain distinct from routability. | Preserve one selection owner and default-effort resolver. Borrow focus/search and state cases; its two-level menu and combined model/effort caption are not automatic replacements for the owner's simpler ZCode controls. |
| `packages/client/ui-settings-models/src/client/{operations.ts:86,ProviderEditor.tsx:121,295,302,store.ts:277}`; `packages/settings/settings/src/index.ts:367` | Settings use versioned path edits over a redacted namespace; credential storage is separate. Provider readiness is active registration plus credential presence, not a successful inference probe. Settings and credential Apply are two writes. | The contextual Agent operation should call the existing narrow version-checked Fleet writer and receive a non-secret snapshot. Do not treat a key-state dot as model availability or copy the two-write failure boundary without reconciliation. Keep original key Enter/blur interaction. |
| `packages/client/ui-chat/src/client/presentation-policy.ts:24`; `ui-settings-account/src/client/onboarding-state.ts:113,158` | Office/development onboarding saves process/usage presentation and Developer-tools visibility. Shared policy resolves detail levels; it does not select another execution engine or establish a Project suite loadout. | Default density and progressive detail are useful. Hiding coding controls is insufficient for Fleet's Project-scoped tool/Skill/native-page activation requirement. Do not import its onboarding/account dependency. |
| `packages/interaction/{tool-ask-user/src/timed.ts:36,user-questions/src/timed-wait.ts:12}`; `packages/client/ui-user-questions/src/client/{draft-store.ts:43,question-reply.ts:134}` | Opt-in timed questions preserve pending versus skipped, expire the foreground wait without cancelling the Turn, retain per-request answer drafts and identify late replies. An open answer UI claims the wait. The tool explicitly denies treating timeout as permission. | A bounded reference for the unfinished asynchronous question/reply workflow. Preserve explicit approval for dependent operations and use Fleet's existing question/Session owners; no shadow chat or guessed answer. |
| `packages/skill/skill-office/src/index.ts:13,65`; `packages/client/ui-sidebar-documentpreview/src/client/{office/OfficeBody.tsx:73,excel/excel.tsx:64}` | Office authoring uses bundled DOCX/PPTX/XLSX Skills and a supplied standalone Node/LibreOffice Kit. Office preview converts to PDF; Excel uses FortuneSheet with `allowEdit=false` and `forceCalculation=false`. | Useful creation/check/conversion mechanisms, not proof of a native shared human/Agent Office editor. Retain Fleet's real edit/undo/save/export/reopen acceptance and per-component licence review. |
| `packages/client/ui-settings-models/src/client/{ModelRow.tsx:79,ModelListEditor.tsx:5,116}`; `packages/client/ui-slots/README.md` | Model rows remove entries, an empty override inherits the built-in catalog, and capacity placeholders are route-level constants. Slot declarations bind rendering to scope and disposal, but also introduce a substantial framework. | Preserve Fleet's enabled switches, explicit catalog membership and unknown-capacity evidence. Borrow scoped lifecycle invariants without copying the empty-list fallback, arbitrary constants or the full Slot/Cordis implementation. |

Executed [bounded source probe](../scripts/probes/deepseek-desktop-source.mjs) directly against this
checkout: original fuzzy ranking, presentation policy, unattended timed wait and answer-UI claim all
passed. Four mechanisms, zero provider calls and zero user-state writes; the probe does not validate
the complete Desktop Host, React pages, model quality, subscription entitlement or native Office editing.
Use the [engineering probe entry](engineering.md#test-map-where-verification-lives) for the command. These findings
inform the existing [page-operation](modules/components.md#context-menu-assistance-source-backed-landing-boundary),
[context](modules/context.md) and [document](modules/canvas.md) contracts; their capability status is unchanged.

### Full Pi SDK and provider extensibility reassessment

The owner asks whether Cindy/Craft's full Pi composition is a better default and whether missing
built-in vendors block it (OV-068). Three different packages must stay distinct: `pi-ai` supplies
model transport, `pi-coding-agent` supplies AgentSession/context/tools/extensions, and the newer
`pi-durable`/Chord experiments supply a different persistence/composition substrate. A limitation
of durable is not evidence against the full coding-agent SDK.

| Inspected implementation | Actual mechanism and Fleet consequence |
|---|---|
| Craft v0.13.4 `b2d6c8aabdfd` | `packages/shared/src/agent/pi-agent.ts:446–507` starts its helper process. `packages/pi-agent-server/src/index.ts:487` registers custom endpoint models; `:623–652,739` supplies wrapped `customTools`, an explicit name allowlist and `createAgentSession`; `:660` isolates the Agent directory and `:669` binds native Pi sessions to one Craft session. `pi-agent.ts:1221` sends tool authorization through Craft's existing checks. This is a full SDK in a supervised process, not just a transport or a second application. |
| Cindy `a46bb58fc3263f1a3dde04cf9470ed9b0379c82c` | `packages/maker-core/src/agents/pi/index.ts:2325–2377` projects each native connection to its own provider definition and `:3752` launches `pi --mode rpc` with controlled resources and a permission bridge. `cindy-bridge-source.ts:3997` intercepts `tool_call`. `native-provider-adapter-source.ts:24–59` keeps the upstream protocol serializer while mapping independent connection identity and auth. Its fallback capability/window values are not verified provider facts and must not be copied into Fleet's UI. |
| Pi reference 0.99.1 `2532a0bef7f7` | `packages/coding-agent/docs/custom-provider.md:7–15,21–29,97–133` distinguishes static compatible endpoints, dynamic discovery, OAuth and custom streams. `docs/sdk.md:26–43,96–110` assigns finalized context to SessionManager and accepts host-selected settings/resources/tools. Native continuation is valid beneath one logical Host session, provided admission, mutation and recovery have one owner per entity. |
| Current Fleet candidate | `packages/provider/src/config/provider-data-schema.ts:5–9` exposes only three ordinary API dialects. Missing native protocol coverage can therefore be a Fleet adapter/configuration gap even when Pi itself has the serializer. Catalog membership, protocol support, account entitlement and media execution are separate checks. |

Executed [full SDK probe](../scripts/probes/pi-sdk-provider-boundary.mjs): installed SDK 0.87.1
and reference source 0.99.1 each performed seven scripted model requests with zero network calls.
Both registered an unlisted model/custom wire API under two independently authenticated synthetic
connections, ran a Host-owned non-coding feature tool with an explicit allowlist, rejected Host
permission denial and stale domain revisions, and restored native tool outcomes and the selected
connection after SessionManager reopen. The fixture domain operation is not Fleet's real page
bridge; this proves SDK feasibility, not live OAuth, model quality, media or migration parity.

Counter-evidence is retained: in both versions, an injected `appendModelChange` failure makes
`session.setModel()` reject **after** changing `agent.state.model`. The Host must reconcile or
retire that executor before another input; a bare SDK switch cannot replace Fleet's commit and
input-binding contract. Provider registration alone also supplies no subscription allowance,
Job receipt or UI contribution. These are integration requirements, not reasons to dismiss Pi.

OV-069 executes that proposal in the isolated candidate: full SDK 0.99.1 inside the existing
supervised CLI process, explicit Host tool wrappers/resources and existing credential/model ports.
`pi-turn.ts` drives the native AgentSession; physical requests use the Host context/compiler and
transport. One admitted tool batch is committed once; SDK siblings consume its cached results.
SDK state is private and in-memory per input, while Host SQLite preserves canonical history.
Native SDK compaction, global/project extension discovery and native page UI are not enabled.
The integration retains commit-before-publish and fixes unsent Session config writes that exposed
a foreign-key error. Actual staged-binary tests verify streaming, one real Read, renderer events
and process restart using a loopback provider. This is real local execution with fake inference,
not live vendor behavior, model-quality improvement, paid billing or full native-CLI parity.

Missing-provider handling follows the [official custom-provider documentation](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/custom-provider.md):
compatible API → configure a provider/model; special auth/discovery → Provider extension; unsupported
wire → custom stream preserving tools/cancellation/usage. Native CLI-only capabilities use a full
native executor. Images/video require their own verified operation/entitlement and durable result
path; a chat model's name or protocol does not grant those capabilities.

### Token efficiency evidence and Pi extension boundary

The owner's remembered vendor study is consistent with Databricks' July 8, 2026
[internal coding benchmark](https://www.databricks.com/blog/benchmarking-coding-agents-databricks-multi-million-line-codebase).
Matched models and thinking levels incurred more than a twofold task-cost difference in some
harness pairs with comparable quality, and the authors report approximately one-third as much
context per request for Pi. It covers their internal code tasks, not every framework or Fleet's
document/media workflows. The article does not publish the task count, full traces or a universal
winner. Its dollar-per-task examples must not be mixed with unmatched harness/model points.

The September 17 [SoL-Pi paper](https://arxiv.org/html/2609.20519v1) and
[official NVIDIA source](https://github.com/NVlabs/SoL-Pi) provide another bounded result. On
EdgeBench with GPT-5.6 Sol, base Pi averages 44.833 score; the four-mechanism Efficiency setting
scores 42.003 with 49.0% less recorded token traffic and 33.2% lower estimated API cost. Its
separate Performance setting scores 47.208 with 6.1% less traffic. These are different settings,
not simultaneous maxima. In the paper's 63 CPU-only Terminal-Bench 4 tasks, Pi and native Codex
solve 18 each while SoL-Pi solves 15. Treat the lower-cost quality tradeoff explicitly.

The study evaluates a coding harness, not `pi-ai` transport or the new experimental `pi-durable`
and Chord packages. Fleet now hosts Pi AgentSession beneath ZCode's context/tool/permission
owners (OV-069); it does not inherit these savings. Pi's extension API supports tool registration, effective
loadout selection, context projection and lifecycle hooks; Skills expose metadata before their
full body is read (`coding-agent/docs/{extensions,skills}.md`). That makes Pi a strong customizable
execution-layer candidate. It does not establish the strongest complete desktop/plugin/data Host.

SoL-Pi source `1559b5cb12c7` was cloned and inspected, not installed. Four mechanisms are opt-in:
fused edit+validation, archived large observations with exact recall, quote-verified diagnostic
reduction, and economical compaction. `src/sol-pi/extensions/observation-pack/index.ts:137` changes
provider projection while preserving stored history. The reducer's exact-quote checks verify
quotes, not completeness of the selected evidence. `action-fusion/then-run.ts:111` directly calls
the built-in Bash definition: a Fleet adaptation must still apply its command policy to that
nested effect. `online-context-compact` uses a configured cache write/read ratio that remains
fixed after model changes; it is neither automatic vendor pricing nor total-cost accounting.
The package's documented compatibility is Pi coding-agent 0.85.1/0.84.2, not Fleet's 0.87.1
transport seam or the 0.99.1 durable candidate. Its repository tests and claimed savings were not
reproduced in Fleet in this source-only intake.

Fleet's evaluation target is minimum cost per **accepted complete outcome**, subject to no
material quality regression. Count retries, helper models, compaction, handoff, input/output and
cache classes; separately report successful-task ratio, evidence loss, false completion and
wall time. A richer deterministic Host should expose only the currently useful tools and context
to the model. Registered plugins do not all need to become prompt schemas. Benchmark shorter
projections against the unchanged task and verifier; fewer tokens alone cannot establish better
attention or task performance. Start with source-backed output shaping and selective loadouts;
do not enable an entire optimization stack solely from a paper's headline.

### Retained context-economy observations

The superseded context diagnosis recorded **31,561 characters / 31,713 UTF-8 bytes** in a full
Craft prompt and **26 session-tool definitions / 27,288 serialized bytes**. These are historical
byte inventories, not tokens, not the current ZCode request and not complete SDK/Source/Skill
accounting. Its source locks were Craft `4289b1609732`, Pi `13437ca828894f43`, OpenHands
`613406ca2bca`, Hermes `2ea39daeb1f6`, OpenClaw `9f5609382b54`. Reproduce from that source before
comparing; current commands and metrics are owned by Engineering and Context.

Historical gateway research identified stable/dynamic prompt sections, cache-TTL-aware output
pruning, bounded auxiliary summaries, explicit context visibility and named toolsets. Navigation
at that review was OpenClaw `docs/concepts/{system-prompt,context,compaction,session-pruning,memory,dreaming}.md`
and `src/{context-engine,agents/system-prompt*.ts}`; Hermes
`agent/{context_engine,conversation_compression,curator,turn_finalizer}.py` and
`tools/code_execution_tool.py`. Those are mechanism leads requiring current-source verification,
not admission of a Gateway, memory store, fixed prompt budget or automatic routing.

[Unabyss](https://unabyss.com/how-it-works) was a product-only comparison for connected source
context, per-tool visibility, sensitivity and refresh/write-back. Its implementation, conflict
handling and freshness guarantees were not inspected. The useful requirement is scoped,
source-attributed, revocable retrieval; no hosted universal profile or internal MCP bus is selected.
The distinct multi-agent papers and provider implementation notes remain in the routed research
set. Product contracts and the active order are not repeated in these evidence records.

Other source leads retained from those notes (not refreshed experimental results):
[OpenHands SDK paper](https://arxiv.org/abs/2511.03690),
[condenser guide](https://docs.openhands.dev/sdk/guides/context-condenser),
[SWE-agent](https://arxiv.org/abs/2405.15793), [Agentless](https://arxiv.org/abs/2407.01489),
[HarnessBench](https://arxiv.org/abs/2605.27922),
[Don't Break the Cache](https://arxiv.org/abs/2601.06007),
[historical Craft origin](https://github.com/lukilabs/craft-agents-oss),
[Hermes docs](https://hermes-agent.nousresearch.com/docs/),
[OpenClaw docs](https://docs.openclaw.ai/). Current source claims require the lock and code review
specified elsewhere in this registry; these links are not dependency or architecture approvals.

### Additional kernel and protocol comparisons

The owner requested current sources and challenged the completeness of the recommendation. The
following are bounded source inspections at the exact current locks, not an equal-task runtime
benchmark. No claim that all 80 reference checkouts have been deeply audited is made.

| Source / revision | Concrete mechanism inspected | Fleet consequence |
|---|---|---|
| Deep Agents JS `9a64a1751ca4d5aba003e5c15f972b183202238f` | `libs/deepagents/src/agent.ts:180,450,510,533` composes filesystem, subagents, summarization, model-specific profiles and optional human-in-the-loop middleware into LangChain `createAgent`, passing a caller checkpointer/store. `backends/state.ts:1,51` stores files in graph state; filesystem backends are separate. | A serious general-workbench executor comparator, especially for interruption/checkpointing. It does not require another Fleet database by definition, but checkpoint, file, todo and subagent state must map into existing owners. More integration overlap than bare Pi; do not dismiss it as coding-only or assume graph checkpoints solve exactly-once external effects. |
| OpenAI Agents JS `fdaf0a66ca6e9d89498909ad7cf64745630e8afb` | `packages/agents-core/src/memory/session.ts:27` exposes a caller-provided Session interface; `runState.ts:3153,3180,3203,3488` supports approve/reject and serialized continuation. `packages/agents-extensions/src/ai-sdk/index.ts` adapts other model providers. `run.ts:650` defaults tracing on and sensitive-data inclusion on. | Another embeddable executor comparator, not restricted to OpenAI models and not a Codex/ChatGPT subscription bridge. Fleet must project its existing store, disable external tracing by default, and test replay/stream/provider fidelity. No production dependency admitted. |
| DeepSeek Harness `477b4f4205` | `docs/architecture.md` and `packages/core/agent-loop/README.md` describe plugin-composed loop, durable Session projections, scoped tools and prepared model calls; developer-preview warning remains in README. | Strong composition reference for suites. Replacing Fleet with its Cordis composition root would also replace authority boundaries; E14/H41 remain in force. Modularity does not require importing its whole kernel. |
| ACP `15219ed70b6cfc19a0951b2a7e9272ed1d23640f` | `README.md` distinguishes stable wire protocol **1** from schema package versions; `docs/protocol/v1/tool-calls.mdx:135,193` specifies permission requests and cancellation outcomes. V2 material also exists but is not the stable baseline. | Prefer negotiated capabilities for interactive native-agent adapters over invented uniform support. ACP is an executor communication protocol, not an executor, plugin UI host or proof every CLI enforces Fleet permissions. |
| MCP Apps `82221c0c8ce7661efa6771c9d461511b1650495f` | `src/app-bridge.ts:127,190,503` maps tool UI resources, requested iframe permissions and host tool handlers; `src/styles.ts:77` propagates host CSS variables; `src/spec.types.ts:340` carries theme/display context. | Useful portable embedded-tool UI boundary. Host code still owns CSP/permission enforcement and Fleet's page/right-panel registration. Theme variables alone do not enforce the design language; native contribution SDK and shared operations remain necessary. License transition distinguishes Apache/MIT code from CC-BY documentation. |
| Current Craft `53393340aa3616db78fb5e19abd6bb528a2a4b3c` | `packages/shared/src/agent/backend/{index,types}.ts` retains distinct Claude/Pi backends, callbacks and branch-readiness contracts. | New separate comparison checkout; neither Craft pin nor `app/` moved. Reinforces learning the existing backend boundary before inventing a second one; no new full-host adoption decision. |

At the earlier source lock, Cindy `374923c219ba` was traced through
`model-plane/modelPlanePolicy.ts` and `model-discovery/anthropic.ts:700`: subscription catalog
membership comes from account/native results, while auth-generation and probe identity prevent a
late result from a logged-out/replaced account populating the current catalog. Gemini CLI
`2fe7c2d3f065` / change `361b0bbc` resolves the resumed identity before config initialization and
adds filename collision coverage. Pi `2b0a123de983` has no runtime change under `packages/agent`
versus `d6af72e1857c`; the AI change there is a test fixture, not new kernel proof. OpenClaw's
current `docs/gateway/cli-backends.md:17` still distinguishes fallback CLI backends from ACP.
These narrow checks do not revalidate every changed module or the earlier installed-Pi tests.

**Change-control gate:** this best-first target changes a Session/permission authority and would
add a maintained internal fork. The owner's approval is the final checkpoint after an isolated
schema, migration and acceptance result is reviewable. Before that, no production cutover or new
dependency is authorized. A later target change needs the same Project document/media/native
executor fixture, not an argument from ecosystem size or migration cost.

### CLIProxyAPI — provider gateway comparison

The owner-supplied [CLIProxyAPI repository](https://github.com/router-for-me/CLIProxyAPI) was already
present and is now at `ef9e71201e0ca72b03a540d9b6e0862f8c053347` (MIT). It is valuable at the
provider/credential/protocol layer; its `ProviderExecutor` means an upstream request executor,
not a complete Agent that owns tool execution, approvals and conversation continuation.

| Inspected source | Useful mechanism | Required adaptation / limit |
|---|---|---|
| `sdk/cliproxy/auth/selector.go:27,68,90`; `conductor_refresh.go:489,536`; selector/cooldown tests | Stable credential identity, availability/cooldown, refresh coordination, session-affinity and retry selection. | Extend Fleet's current credential owner. Default-off failover remains same provider, endpoint/service and exact model; no round-robin-by-default, automatic model change or replay after visible output/tool effects. |
| `sdk/translator/registry.go:14,106`; `internal/runtime/executor/claude_executor_execute.go:20,80,296` | Separate request/stream/non-stream protocol translation and provider execution. The Claude path performs an HTTP Messages request, not an official Claude tool loop. | Prefer native provider formats; reuse bounded mappings/fixtures where needed. Never call converted schemas or copied client headers official-harness parity. The missing-translator pass-through is not Fleet capability detection. |
| `sdk/pluginapi/types.go:1553,1605,1654`; `internal/api/handlers/management/plugin_quota.go:60,132`; `helps/codex_quota.go:16` | Account-scoped quota providers normalize plan, windows and reset times; Codex observations can come from HTTP/WebSocket signals. Unsupported quota returns an explicit error. | Keep quota separate from context-token usage. Preserve account, source, observation time and unknown/stale state; do not interpret an absent numeric field as exhausted or unlimited. The interface does not prove every listed subscription has a working quota implementation. |
| `sdk/cliproxy/service_models.go:74–171` | Per-credential registration, plugin overrides and provider-specific model catalogs. | Several paths still use static plan/model lists. They are not proof of current account entitlement; prefer actual account catalogs as in Cindy, enriching returned entries without inventing access. |
| `config.example.yaml:210–287`; `internal/auth/claude/anthropic_auth.go:24` | Source exposes OAuth/refresh routes, model switching, request cloaking and separate proxy configuration. | Do not import identity disguise, system-prompt replacement or third-party consumer-login assumptions. The example also permits quota-triggered preview-model/project switches that conflict with OV-033. API compatibility does not establish authorized subscription use or native capabilities. |

Recommended landing: extract independently useful mechanisms into Fleet's existing providers;
an already user-managed proxy can remain an explicit external endpoint. Bundling a Go service,
its account store, management surface and scheduler would introduce a second provider authority,
additional process/port/update duties and hidden routing. That whole-service integration is not selected.
CLIProxyAPI complements Pi's model adapters and HarnessRouter's complete-executor comparison;
neither proxy replaces the other layer. Media API passthrough also does not supply Fleet's durable
media-job, artifact, preview or permission lifecycle.

Verification here is source/diff inspection only: no `go` executable was available on PATH,
so its Go tests were not run. `go.mod` requires Go 1.26 / module v7, while `docs/sdk-advanced.md`
still contains v6 / Go 1.24 examples; copying those examples without checking code would be wrong.
No proxy was started, account token read, OAuth session initiated or production dependency added.

### HarnessRouter — executor infrastructure comparison

Owner-supplied [repository](https://github.com/HarnessRouter/harnessrouter), inspected at
`5f82db1d1f13ea25b8ed0893c38b5b7d2e3e57e3` in a temporary read-only source checkout. Existing
reference pins, production dependencies and the running candidate were not changed. UHP is a
versioned **draft**, currently `2026-09-12`; its Responses-shaped endpoint runs a complete task.

| Exact source at this revision | Evidence / adaptation decision |
|---|---|
| `runner/server.py:1387,1735,1844,2422,4637,6352` | Separate builders/normalizers for Claude, Codex, Pi, Gemini and other harnesses; `Auth` describes API keys and cloud credentials. Gemini explicitly rejects missing `api_key`. No provider subscription-login lifecycle was found in the inspected gateway/runner. Running an official CLI does not establish ChatGPT/Claude/Gemini consumer subscription support. |
| `runner/server.py:1797,1866,2472,4669,6680`; `docs/self-hosting-guide.md:984` | Claude skips interactive permissions, Codex uses `approvalPolicy: never` with full sandbox access, Gemini uses `yolo`, Pi uses `--approve`. CE relies on per-session OS users inside a shared Linux container; hosted deployment may use isolated session sandboxes. These choices serve autonomous jobs; copying their flags into Fleet's local project would discard its approval contract. |
| `protocol/versions/2026-09-12/tasks.md:113`; `lifecycle.md:90`; `streaming.md:134` | Request `tools` are reserved/ignored and reported as such; tool events describe server-executed work, with no client `function_call_output` return path. There is no normative approval-response/steering/fork protocol in this version. Reconnect can read the persisted response; SSE replay is optional. UHP conformance does not prove interactive Fleet parity. A separately governed MCP bridge could expose host operations; observing an event alone cannot approve a pending side effect. |
| `runner/server.py:333,1916,6463,7849`; `gateway/app.py:5390,6780` | Resume identities, missing-history reporting, process-group cancellation plus Linux `/proc` straggler cleanup, and served-model reporting are reusable mechanisms. A missing native history may start fresh with a visible note; unavailable models may execute the configured default and report substitution. Fleet must instead require explicit recovery/model changes, retain exact-provider/model switching, and port process cleanup per OS. Do not modify native histories merely to make a resume appear successful. |
| `gateway/backing.py:107,192,299`; `runner/server.py:7496`; `protocol/versions/2026-09-12/plugins.md:15` | CE owns records, blobs, secrets, per-session workspaces and checkpoints. UHP plugins package Skills/MCP, not Fleet page/right-toolbar contributions. Do not import the CE control store beside Fleet's Session store or equate session workspaces with shared Project folders. A remote executor may retain private continuation state, with an explicit host binding and artifact transfer contract. |
| `gateway/media_plane.py:1,476,712`; `gateway/app.py:11271,11494,11865,12338` | Agent MCP tools and editor routes share capability adapters, durable generation jobs, media bytes and revisioned scene edits; keys resolve server-side. This directly informs the requested text-agent + image/video/audio cooperation. Adapt the common operation/job/artifact mechanism, not its provider catalog or automatic cross-model/provider candidate walk. Media routing requires an explicit authorized model/budget policy. |

**Reuse decision:** prioritize event/error normalization, declared execution capabilities, native
continuation diagnostics and cancellation tests as source mechanisms. Compare a UHP client as an
optional remote executor after admission/ownership is mapped. Keep embedded Pi as the local default
candidate and native interactive transports where their approval/resume features are needed; neither
choice is promoted by this review. No Docker runtime, HarnessRouter account or hosted service is
required merely to learn from or adapt the Apache-2.0 Community Edition code.

**License boundary:** CE `LICENSE`/`NOTICE` cover that repository; native CLIs retain their own terms.
The linked Starter Kits are a different repository: inspected license at
[`d3d4f5a60e1df33f66894b69cabf938c059023da`](https://github.com/HarnessRouter/starter-kit/blob/d3d4f5a60e1df33f66894b69cabf938c059023da/kits/LICENSE.md)
restricts redistribution and requires separate commercial coverage. Do not bulk-import its slide,
sheet or video kit assets as if covered by CE's Apache license. No kit source was imported.

**Verification:** Python 3.12, isolated temporary dependencies; upstream
`runner/tests/test_{pi_normalize,claude_error_filter,codex_reasoning_strip}.py`: **37 passed**.
A Python audit hook blocked socket connections and subprocess creation; zero attempts occurred.
The cases exercise command/config construction, event/error mapping and fixture-only history handling.
They do not prove live model quality, subscription login, container isolation, process cancellation,
media generation or Fleet integration. HarnessRouter integration remains `not implemented`.

### Cindy OpenDesign application plugin

**OV-026 names this implementation as the desired kind of reuse.** Read-only source inspection of
[Cindy's official plugins repository](https://github.com/makecindy/cindy-official-plugins/tree/8cc054b938d0acf49c63639caa38cd9ebc6990b5/opendesign-trial)
at `8cc054b938d0acf49c63639caa38cd9ebc6990b5` found `opendesign-trial` version **0.4.25**,
minimum Cindy **0.1.83**. This is a separate repository from the Cindy host, not a missing directory
in the local host checkout. Selected text sources were read from that immutable revision; no
package, model call, candidate application or browser test was run, and no reference pin changed.

Paths in this table are relative to `opendesign-trial/` in that repository:

| Source evidence | What it establishes / Fleet consequence |
|---|---|
| `UPSTREAM.json:1` | Names `nexu-io/open-design` at `eca7c7ab989852fb586384e19bcb6a6f2d7321f4` (web package v0.22.1), Apache-2.0; the retained SketchEditor is from `38bdb59d868831c5c98602da9522acc84cabd97e` (v0.1.0). Records deliberate patches; not wholesale current OpenDesign. |
| `ghost.json:1` | Native package with session context, tools, cards, preview permission and resident JSON-RPC Node worker. No `mainView`/general toolbar declaration; this example alone does not prove every desired Fleet entry slot. |
| `source/build/FullStudio.tsx:4,215,236`; `source/build/build.mjs:1` | Imports and bundles real upstream FileViewer and SketchEditor; hooks comments, manual saves and drawing feedback to the adapter. Supports substantial domain-application reuse without reproducing its whole shell. |
| `main.js:97,135,256` | Card identity is bound to a draft and Session; click calls `cindy.preview`. Tools read/update the same draft; explicit feedback uses `cindy.agent.run(mode:continue)` against the owning Session. No new model credentials/executor. Host receipt must match that Session; unknown outcomes are not retried as success. |
| `node/server.cjs:127,242,415` | UI routes and Agent draft writes reach the same serialized, revision-checked HTML writer with backups and atomic rename. Local Node routes replace original daemon routes. Storage is useful domain ownership, not a duplicate Session system. |
| `main.js:135`; `node/server.cjs:432,452` | Requires local writable context, creates a subdirectory and persists a fixed Session binding. Remote support and Project documents shared across conversations require deliberate adaptation. |
| `main.js:77`; `source/build/studio.css:1` | Cards/editor chrome still contain hardcoded color/type/radius choices. This package proves integration structure, not compliance with Fleet's common design system. |
| `README.md:1`; `.tests/opendesign/session.cjs:18,83` | README explicitly limits this to component integration, hiding unsupported cloud sharing/collaboration/version browsing. Session tests mock host/model dispatch. README also records an unresolved WebRTC boundary; do not infer full network isolation from iframe/CSP. Its reported upstream device acceptance is not Fleet acceptance. |

**Recommendation:** exercise this existing package before creating a substitute plugin framework.
Keep useful domain UI/engine/data formats, adapt host operations and apply Fleet's common chrome.
Do not copy its limitations as product requirements. The [application-plugin contract](modules/components.md#adapting-an-independent-application--cindy-opendesign-evidence)
and [Board plugin](modules/components.md#board-plugin--craft-and-dashi) apply the mechanism to Fleet.
This strengthens Cindy's candidacy; it does not establish the complete baseline proof.

### Findings that prevent a false-positive Cindy selection

- **Source chain exists, full outcome not yet proven.** The official OpenDesign package above
  provides a concrete editor/Agent integration. `ghost.ts` routes Agent calls through
  `getGhostPipeDispatcher().callGhostTool`; `ghostPreload.ts` gives the main plugin logic a host pipe,
  while panel pages have no privileged preload bridge. That is an integration seam, not proof every plugin uses one undoable domain
  operation. The first suite must prove the human and Agent operate the same document/version.
- **Project exclusion is not a complete suite policy.** `ghostWorkdirPrefs.ts` stores exclusions
  in userData and normalizes paths as strings. It does not include host identity in the key.
  Identical paths on different remote hosts need explicit comparison. The `skill` contract in
  `plugin-protocol/src/manifest.ts:69` says links in the shared Skill root remain visible across
  projects until global disable/uninstall. Do not advertise project isolation without fixing and
  testing that path as well as tool/panel visibility.
- **Local mode and vendor services are distinct.** `README.md:115` offers Skip Sign-In for local
  agents; `main/cindy-brain/index.ts:930` gates account-managed built-ins on cloud capabilities.
  `main/device-link/ipc.ts:106` requires an account. Keep local suite loading; do not relabel Cindy's
  cloud-dependent distribution, account plugins or remote pairing as Fleet-owned features.
- **Tests are narrower than product acceptance.** `main/mcp-integrations/__tests__/ghostWorkdirGate.test.ts`
  uses real temporary preference storage but mocks heavy runtime dependencies and dispatch.
  Its directory-denial cases are useful regression inputs, not evidence of a running isolated suite.
- **License scope is per artifact.** Root Apache/MIT labels are initial source facts, not clearance
  for every bundled CLI, binary, model or domain editor. No dependency or package is admitted here.

### Broader comparable-software screening

This is deliberately a separate evidence tier. These checks widen the search beyond the named UI
references; they are not full application audits or categorical claims that a product cannot work.

| Product family / lock | Source or official material checked | Selection consequence |
|---|---|---|
| **Omnigent** `ae8a850fb614` · Apache-2.0 | `omnigent/extensions/api.py:17` and `web/src/extensions/services/registry.ts:3` expose navigation, project and cached Session methods. `docs/extending/extension_manifest.md` explicitly reserves commands/activation metadata without V1 execution. | Multi-harness coordination is relevant, but the inspected extension contract is not yet the native-suite operation/lifecycle Fleet needs. |
| **Cherry Studio** `09d4ea5e2f67` · AGPL-3.0 text | `src/main/data/services/AgentWorkspaceService.ts:38` and the Agent session services implement folder-backed work. `package.json` includes several Agent runtimes, including a DeepSeek bridge. | Do not classify it as just a model chat client. Model/catalog and artifact flows deserve module comparison; adding another multi-runtime product and its distribution obligations is not presently a cheaper whole-base proof. Runtime evaluation remains open. |
| **OpenHands Agent Canvas** `7dc6805406ea` · MIT | `src/api/canvas-extensions-service.ts:53` requires an appropriate Agent Server; cloud or missing APIs are explicitly unsupported. Its extension testing guide distinguishes mocks from server behaviour. | Useful backend capability detection and developer workflow reference. Frontend extension demos do not prove the local native-suite loop; a compatible backend must be assessed with it. |
| **Open Design / Cowart / GenOffice** | Open Design `1b47e60bd466`; Cowart `43fc8882daf2`; GenOffice `480548fd55f1`. The [reuse challenge](#requirements-and-reuse-challenge) traces UI resources, persistence and live-document tools beyond manifest screening. | Domain surface candidates, not complete workbench substitutes. Their interfaces can improve the plugin strategy before a base is selected. |
| **OpenClaw / Hermes** | Local OpenClaw `cac0c021273a` gateway/plugin layout; Hermes `fae9e5677a3e` runtime/toolset and existing reference evidence. | Useful messaging, memory and harness comparisons. This pass did not establish a matching native document workbench; do not choose a complete base from their gateway/learning feature lists. |
| **Herdr / Waku / Multica / Kun** | Local entry manifests/README/license screening only (`21d0ce60`, `5454cd4`, `12f8f3f31`, `e67f656b`). | Terminal/remote orchestration, native coding desktop and agent-board approaches expand interaction references; they are not deep-source finalists from this pass. Kun's Noncommercial license requires a separate distribution decision before code adoption. |
| **LibreChat** | [Official repository](https://github.com/LibreChat-AI/LibreChat), [deployment source](https://github.com/LibreChat-AI/LibreChat/blob/main/docker-compose.yml). | Agent/MCP/artifact features are relevant; the inspected default deployment brings server/database services. Native desktop Project-suite behaviour is unproven, so it is a module/product reference rather than the first base candidate. |
| **LobeHub** | [Official repository](https://github.com/lobehub/lobehub), [license](https://github.com/lobehub/lobehub/blob/canary/LICENSE), root package manifest. | Broad agent operations warrant comparison; do not assume permissive commercial derivative distribution from its Apache ancestry. This pass has not verified its local suite lifecycle. |
| **Dify / Open WebUI** | [Dify deployment](https://github.com/langgenius/dify/blob/main/docker/docker-compose.yaml), [Dify license](https://github.com/langgenius/dify/blob/main/LICENSE), [Open WebUI license](https://docs.openwebui.com/license/). | Workflow/server and model-client patterns are relevant mechanisms; complete-base reuse would introduce a different deployment model and requires license/branding review. No framework was added and neither was rejected merely for looking different. |

### Requirements and reuse challenge

The owner asked whether the proposal is actually best, what is insufficiently understood, and
where a different approach is better. This is an adversarial source review, **not runtime or owner
acceptance**. The six host traces above and the bounded mechanisms below were inspected; other
inventory rows retain their narrower evidence levels. Reading an inventory is not reviewing every
repository. No reference pin, application code, dependency or real profile changed in this review.

Paths are relative to `源码参考/software/<project>/` unless marked `app/`. Additional locks:
Cowart `43fc8882daf2`, GenOffice `480548fd55f1`, Orca `800993938104`, Penpot `9d08e26cb3d0`.

| Assumption challenged | Source evidence | Better direction / remaining limit |
|---|---|---|
| Cindy's OpenDesign example determines the entire base and plugin API | Its `ghost.json`/`main.js` bind one local draft to one Session and open a preview, as traced above. OpenChamber has a separate real guest SDK; ZCode has the desired whole composer flow. | OV-027 chooses the ZCode direction; Cindy remains plugin evidence. Compare total integration cost for a finished work chain, including model route, project scoping and failure recovery. |
| Every document should belong to a conversation | GenOffice `apps/shell/src/main/mcp/open-documents-bridge.ts:60,84,113` resolves user-opened tabs by id/path, operates on their live editor and delegates saving to each native writer. `tools/open-documents-tools.ts:42,169` includes unsaved content; its close operation explicitly writes over the file. | Prefer Project/document identity independent of chat. An Agent must see unsaved user edits, use the editor's operation path and preserve its undo. Do not copy GenOffice's overwrite semantics without Fleet's stale-file/permission checks. PDF save is explicitly unsupported by this bridge; no blanket Office/PDF fidelity claim. |
| All plugin UI needs a new Fleet-only message protocol | Cowart `mcp/lib/widget-resource.mjs:1,25` uses `@modelcontextprotocol/ext-apps/server`; `mcp/server.mjs:1045,1079` links a UI resource to tools. Its bridge applies host theme variables; `:1220,1282` exposes project canvas read/save tools. The official [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview) defines UI resources and bidirectional host/tool messaging. | Compare MCP tools/resources + MCP Apps for portable interactive content, with the selected host's small adapter for persistent pages, right tools, settings and lifecycle. MCP Apps alone is not a package installer, native worker sandbox, Project policy or durable panel host; client support varies. No dependency/schema is admitted. |
| A shared save tool makes concurrent editing correct | Cowart `mcp/lib/canvas-storage.mjs:480,661` atomically replaces individual files and blocks unacknowledged image loss, but the inspected save signature has no expected revision. | Atomic rename prevents partial bytes, not stale-snapshot overwrite. Reuse the bridge separately from persistence; prove concurrent human/Agent writes and recovery with the selected native editor. Do not claim a whole-application concurrency audit from this function. |
| One authority forbids plugin databases and undo stacks | Dashi's versioned issue API and native editor operation/history paths own different entities from host Sessions. Penpot `frontend/src/app/main/data/workspace/undo.cljs` maintains editor transactions/history. | Retain mature domain stores and undo. Prevent two writers/stores for the **same** logical record; do not replace every imported database with Craft JSON or every editor history with conversation events. Old P11/D2 and product wording have been qualified accordingly. |
| A manifest and subprocess make Agent-created plugins fully isolated | Cindy `packages/plugin-protocol/src/manifest.ts:258` explicitly states Node workers have OS-user privileges; `apps/desktop/src/main/cindy-brain/nodeRuntimeWorkerProcess.ts:19` confirms process isolation is not an OS sandbox. `nodeRuntimeBroker.ts:514` starts an Electron utility process. | Separate host API grants from local code execution. Preserve supported UI isolation, disclose native execution and verify platform boundaries before admission. Do not inherit unrestricted workers as a silent default, or invent a second sandbox platform without a concrete proof. |
| Remote execution can be bolted on solely at the end | Orca `src/shared/protocol-version.ts:1` defines compatible client/server ranges and capabilities; `src/cli/runtime/remote-runtime-compat-gate.ts:38,74` performs a status preflight and rejects incompatible peers. Cindy's directory exclusions key paths without host identity. | Keep host identity in Project/file/execution scope from the first proof; remote UI can follow. Equal path strings on two machines are not one Project, and a local UI must not resolve a remote plugin's file on the client. Do not import Orca's full cloud/relay stack. |
| The existing model correction already satisfies protocol selection | Fleet `app/apps/electron/src/renderer/components/apisetup/ApiKeyInput.tsx:577` offers a Select only for `custom`; native presets receive a read-only format. `submit-helpers.ts:60` only builds the selectable custom route for that flow. | This is a confirmed owner requirement gap, not a new design question. Supported native-vendor protocols must be represented consistently through setup, discovery, credentials and execution. “Every format on every vendor” is not the requirement. |
| All automation work is a chat task DAG | Fleet `app/packages/server-core/src/tasks/TaskRunner.ts:1` executes task.yaml DAGs through Agent Sessions; domain export/render jobs have different cancellation, retry and output semantics. | Keep the host scheduler/Agent run and plugin domain jobs distinguishable. Invoke a domain operation through its declared adapter; do not start an LLM merely to run a deterministic export or import several scheduling authorities. Runtime proof remains open. |

**Three development routes, with different costs:**

1. **Adapt a complete host** (ZCode direction under OV-027): reuse working lifecycle,
   then replace whole interactions and add domain packages. Recommended first test because a
   working product exists to compare against. Reject if Fleet's central loop requires replacing
   the candidate's Session, permission and extension core together.
2. **Build on a framework** (DeepSeek Harness, or the official [Theia AI framework](https://theia-ide.org/docs/theia_ai/)):
   broader contribution/Agent APIs, but Fleet must assemble and support more product behaviour.
   Theia was documentation-screened only, not cloned/built; DeepSeek explicitly calls itself an
   experimental developer preview. Neither is selected merely for architectural elegance.
3. **Continue the current Craft reconstruction:** preserves present conversation/Pages mechanisms,
   but still requires the central suite host and a broad shell replacement. Owner rejection and
   those missing outcomes make this a recovery/comparison path, not the default next investment.

**Recommendation:** retain one working host and native domain engines; keep portable tools/UI where
they genuinely reduce coupling. This is not “copy the best screen from each app” and not a new
universal kernel. A package's domain model, commands, serialization and recovery travel together;
accounts, host navigation and duplicate Agent loops do not. A UI kit helps Agent authors produce
consistent ordinary controls, but theme injection alone cannot guarantee complex editors comply.

**Open product choices:** first daily-use work chain; acceptable first-release adaptation depth
inside professional editors; optional-plugin defaults for folderless work. The first two were
asked explicitly. These are distinct from unanswered engineering questions: exact native-editor
fidelity, cross-platform packaging, plugin isolation, remote execution and vendor/cache behaviour
must be established by inspection and execution, not questions asking the owner to design them.
Do not interpret no answer as an approval or silently substitute a convenient Notes demo.

### Keep, replace and prove

**Current candidate deviation audit.** The owner rejects another visual-only pass:
「你明明能看源码为什么总看前端」 and asks what the software actually needs, where the
implementation diverges and which alternatives improve it. The following traces inspect the
working `.fleet/zcode` candidate, not just its reference pin. They do not establish live acceptance.
Cindy and Cherry evidence uses the refreshed checkouts recorded in the inventory below; earlier
review locks elsewhere remain historical evidence.

| Required outcome | Actual source path / deviation | Correction to evaluate as one complete interaction |
|---|---|---|
| One comprehensible connection lifecycle | Candidate `ModelProviderSection.tsx` now only coordinates saved connections and template creation. `ProviderTemplateSetup.tsx` and `InlineEditableProviderCard.tsx` share validation and explicitly commit through ProviderSettingsService; idle/blur/cleanup saves and commercial hooks are removed. New/edit rendering is still split. | Keep stable IDs and the working connection until an explicit replacement commits. Further consolidate the new/edit presentation where the same service supports it; prove live authorization and conversation execution separately from local save/reopen tests. |
| Vendor, service, account and model mean different things | `providerTemplateCatalog.ts` groups templates by vendor, but saved navigation projects individual connection records as “custom providers”. Subscription creation persists a provider before mounting authorization; the resulting record is not proof of login. | Vendor is the navigation group; API/plan/native-subscription is the connection inside it; keys/accounts belong to that connection. Preserve separate endpoint and credential identities even when grouped visually. Inline connection choices must be driven by actually supported routes. No new secret store or silent account-to-API fallback. |
| A model list reflects the connection and the supported operation | `modelDiscovery.ts` shares an OpenAI-shaped `/models` reader plus an Anthropic path and DeepSeek exception; it deliberately returns no inferred capability metadata. `ModelDiscoverySection.tsx` mixes saved rows and discovered rows with different add/enable actions. | Give provider adapters an explicit catalog operation, account/revision provenance and an honest unavailable/error state. One visible list and one meaning for enabling a model; preserve manual entries and last successful data. List membership, entitlement and successful inference stay distinct facts. |
| Official execution quality, not just subscription tokens | `adapters/src/model/pi-subscription.ts` wraps Pi model providers below the `Model.generateText/streamText` contract; ZCode `core/src/runtime/agent-runtime.ts` still owns the tool loop. The adapter explicitly rejects provider-native tools and structured output. | Retain the proven host lifecycle while evaluating a complete executor boundary. An official native Agent runs as a whole executor; a direct model API runs under the general executor. Do not put an already-running native Agent beneath another tool loop or describe Pi transport as a completed Pi kernel migration. |
| Installing an application plugin adds usable UI and Agent operations | Candidate `packages/shared/src/plugin-types.ts` only declares agent/command/skill/hook/MCP/LSP contributions; `workspaceSidePane.ts` models built-in panes. Cindy OpenDesign `ghost.json`, `main.js` and its worker demonstrate tools, revision-checked document updates and a preview opened in the owning Session. | Extend the existing package/host seam with the smallest page/right-tool contribution needed by a real suite. Human controls and Agent tools use the same domain operations. Preserve editor data/undo; replace the imported app's competing account, model and Session shell. Project exclusion must remove tools and UI together. Cindy's Session-owned preview is evidence, not the complete Fleet Project-suite contract. |
| Craft-style contextual Agent configuration | Craft `EditPopover.tsx:122,684,957` supplies per-feature edit configuration, target file/context and the ordinary create/send path. Candidate `WorkspaceHelpMenuButton.tsx` and the packaged guide provide documentation; no equivalent feature-bound execution bridge was found in the inspected settings path. | Restore a page-local small conversation supplied with target, documentation, redacted current configuration and supported operations. Commit through the feature owner and refresh its original view. Documentation and a global conversation shortcut do not substitute for this path. |
| Image/video/audio models can be used by a working Agent | Candidate's inspected model contract is text generation/streaming. Cindy `cindy-media/providerMediaRuntime.ts` and `invocationService.ts` separately resolve media capabilities, prepare requests, execute and persist results. | Reuse connection credentials/catalog facts, but expose generation as a governed domain operation/job. The conversation Agent invokes it; the real output is saved and previewed/edited by the enabled suite. Do not expose a discovered image-output ID as a chat model merely because it appears in `/models`. |
| Failures have actionable product states | The inspected review host logged `write EPIPE` and exited; the remaining renderer showed an empty loading model panel. `useProviderSettingsServiceView` waits for `getView()` without a local terminal deadline. | Diagnose process/transport failure separately from layout. An unavailable host must produce a recoverable error, and remote catalog/allowance failure must not blank already-saved local settings. This observation is not a claim that the hook caused the host crash. |

**Landing recommendation:** one ZCode workbench and durable Session/Project/permission owner;
provider connection adapters, complete Agent executors and application plugins have different jobs.
These are boundaries over existing owners, not three new registries or permission systems. Pi,
CLIProxyAPI and HarnessRouter do not by themselves implement the application-plugin host. Keep the
model adapter improvements that preserve credential scope, cancellation and replay, and remove
superseded interaction paths only with a named replacement and a passing end-to-end path.

For the model surface, the source-backed proposal is a stable vendor list and a single detail/editor
slot: connection method inline → endpoint where applicable → credentials/accounts → connection
validation → automatically maintained model list. New and existing connections use the same editor.
Presets select their supported protocol; custom/advanced supported overrides expand inline. The
same-provider/same-model recovery switch remains default-off and does not inherit NewMax's model
priority/fallback policy. Subscription allowance belongs to the account, not the context ring.
This proposal still requires implementation and owner acceptance; no catalog count is a success criterion.

Keep the requirements, real user data and source provenance; retain Craft's contextual Agent help,
conversation interactions, Board links and useful document/Pages capabilities. **Do not carry the accumulated Fleet
patch wholesale to a new base.** Re-evaluate each valuable mechanism against the selected host's
native facility. Replace redundant creation/navigation as one complete shell interaction. Import
domain rendering/storage/commands through that host's extension seam, without an embedded second
SessionManager. A right panel alone is not a native editor; a Skill bundle alone is not a suite.

The next discriminating proof is [Engineering's common scenario](engineering.md#baseline-selection-and-development-method):
local startup, two folders, an optional application plugin, human/Agent edits to the same data,
permission refusal, project exclusion, disable/re-enable and restart. It must also expose the
model/protocol path and actual context usage. **Do not select by screenshot similarity, number of
checkouts, test count or hypothetical ease of changing fonts.** Stop a candidate when the proof
requires rewriting its core; present that evidence and the next candidate, not another hybrid.

## Owner-controlled retention

Owner direction, 2026-09-14: inventory existing source clones before looking for replacements, and
discuss exclusions with the owner before acting. A general cleanup request does not authorize
deleting, relocating, archiving, re-pinning or dropping a project from this reference set. Proposals
must name exact paths, local changes, comparative evidence, remaining reference value and recovery.
`REJECT` for code admission is not permission to discard source evidence. Matching HEADs, an old
version, no production import, or a license restriction alone do not establish disposable content.
Historical source-lock hashes must remain attached to the findings actually obtained from them;
new checkout observations do not retroactively revalidate those findings.

## Current on-disk inventory

**Pre-refresh Craft observation, 2026-09-21 takeover:** the rolling checkout is now clean at
`v0.13.4` (`b2d6c8aabdfdc96416eea9debd6756ae6d3c0db9`), origin
`https://github.com/craft-ai-agents/craft-agents-oss`. The look pin remains clean at `v0.10.5`
(`c9d9a26fbefa3a5165ee9aa50cb30c25466afd81`). No reference was moved in that initial observation; the later owner-authorized refresh is recorded below.
The earlier refresh observations below retain their dates and hashes; this observation supersedes
only their statement that the rolling Craft checkout was still on the old pin. Current app
comparison uses v0.13.4; v0.10.5 supplies look measurements, not a product shell to restore.


Read-only inventory rechecked on 2026-09-21, with owner-requested Cherry Studio intake on
2026-09-24: **46 Git checkouts in `software/`, 22 in `plugins/`**. These are 68 checkouts, not 68 distinct upstream products: the
two Craft pins have different comparison roles.
Cherry Studio was refreshed to `09d4ea5e2f6756a31377a388446d66253f87cd1b` on 2026-09-25.
Its AGPL-3.0 checkout remains evidence-only; the prior inspected model-sync paths below are
comparison material, never code to copy or import into Fleet.

An earlier owner-directed refresh advanced many checkouts. `meta/REVIEWED-HEADS.tsv` was not
advanced with them: fetching is not reviewing. The bounded review table records evidence
separately; earlier source locks remain historical. That review made no checkout/ref changes; the
subsequent authorized update is described in the current checkout table.
`hyperframes` has 35 pre-existing LFS fixture modifications; preserve them rather than resetting,
stashing or treating a dirty checkout as disposable.

Names below are the actual directory names, grouped only for navigation, not admission or pruning.
The reference root is `/Volumes/AIGC/天工参考/源码参考/` (workspace symlink `源码参考/`).

| Root / subject | Count | Existing directories |
|---|---|---|
| `software/` — agent clients and workbenches | 24 | `AionCore`, `AionUi`, `browser-harness`, `cherry-studio`, `cindy`, `codex`, `craft-agents-oss`, `craft-agents-oss-v0.10.5`, `deepseek-harness`, `grok-build`, `herdr`, `hermes-agent`, `kimi-code`, `Kun`, `multica`, `omnigent`, `openchamber`, `openclaw`, `opencode`, `OpenHands`, `orca`, `pi-mono`, `waku`, `ZCode` |
| `software/` — later official vendor harness intake | 3 | `MiMo-Code`, `gemini-cli`, `qwen-code` |
| `software/` — provider configuration tools | 3 | `CLIProxyAPI`, `cc-switch`, `cockpit-tools` |
| `software/` — quota and consumption accounting | 5 | `CodexBar`, `AIUsage`, `one-api`, `CPA-Manager-Plus`, `codeburn` |
| `software/` — shared UI primitives | 1 | `shadcn-ui` |
| `software/` — canvas, design and documents | 7 | `Cowart`, `genoffice`, `html-anything`, `open-design`, `openpencil`, `penpot`, `tldraw` |
| `software/` — video and media | 6 | `OpenChatCut`, `OpenMontage`, `opencut`, `opencut-classic`, `openreel-video`, `palmier-pro` |
| `software/` — browser, workflow, protocol and engineering | 6 | `browser-use`, `dashi-taskboard`, `flowgram.ai`, `mcp-registry`, `OpenSandbox`, `spec-kit` |
| `plugins/` — layout and interaction | 4 | `dockview`, `react-resizable-panels`, `react-rnd`, `xyflow` |
| `plugins/` — browser, document and media utilities | 4 | `context7`, `hyperframes`, `markitdown`, `playwright-mcp` |
| `plugins/` — skills, context, memory and agent tooling | 14 | `agentmemory`, `agentskills`, `caveman`, `claude-mem`, `claude-task-master`, `claude-token-efficient`, `claw-compactor`, `GPTCache`, `letta`, `LLMLingua`, `mem0`, `planning-with-files`, `repomix`, `SuperClaude_Framework` |

| `software/` — added kernel, protocol and current Craft comparisons | 7 | `harnessrouter`, `deepagentsjs`, `openai-agents-js`, `agent-client-protocol`, `craft-agents-oss-latest`, `minimax-code`, `goose` |
| `plugins/` — added protocol, application, native-provider and current media comparisons | 4 | `mcp-apps`, `cindy-official-plugins`, `hermes-plugin-claude-subscription-directsdk`, `hyperframes-latest` |

The original inventory and vendor-harness intake total 71 checkouts. Earlier Git inventory was 100
(72 software, 28 plugin checkouts); three additional plugin package directories are not Git
checkouts. The older 46/68, 49/71 and 60/26 counts are historical observations. Examples of later
vendor/UI references outside the generated-guide catalog and their retained heads are:
- `software/MiMo-Code`: `336aee0eb1a5a88efe637f60142303cc8e7555bf`.
- `software/gemini-cli`: `e6550609f655c993ed132966cabd8c5f59719f6a`.
- `software/qwen-code`: `b906f937ec041ca9124617bf86726de064bea967`.
- `software/cherry-studio`: `e22924df9838b722754c668f9ec4dcaf21af0491`.
These current revisions are checkout evidence, not a claim that all new behavior was reviewed.

At the source-inventory observation, all 45 software checkouts had no tracked or untracked changes
reported by Git. Of the 22 plugin checkouts, 21 reported none; **`hyperframes` has 35 tracked modifications** (34 test `compiled.html`
outputs and one `sample.mp4`). Their origin was not established and they must be preserved. Git
status does not compare ignored files, unpushed history, or directory contents byte-for-byte.

The later owner-requested documentation pass adds a generated `FLEET-ADAPTATION.md` to each of
those 67 checkout roots. HEAD, origin and pre-existing Git status were compared before/after;
only these guide files were added. They are regenerable local metadata, not upstream code edits,
new source reviews or changed reference-retention decisions.

`UI参考/` contains four non-Git reference collections: `doubao`, `trae-work`, `ui-designs`,
`ui-screenshots`. These are static kits, an existing HTML design and screenshots, not additional
source clones. `craft-docs/`, `meta/` and `scripts/` contain reference documents/metadata/utilities,
not additional top-level Git checkouts. Cowart and GenOffice are already present; their current
revisions are recorded in the review table below. No PanelUI checkout was found in the inventoried roots; it is a user-nominated
candidate, not an installed dependency or a replacement decision.

An earlier turn recorded four moved directories at `/tmp/fleet-old-refs.r97wge/`:
`hermes-agent-latest`, `openclaw-latest`, `pi-mono-latest`, and
`opencode.stale-20260727140104` (a non-Git partial source directory). An earlier observation found the three Git backups matched
the then-canonical HEADs with no tracked/untracked changes. That comparison predates later refreshes
and does not establish current equality, redundant content or redundant history. On this inspection,
that temporary root and the four original paths are absent; the cause and recovery location are
unverified. This pass removed none of them. Canonical checkouts are present in the inventory above.
The earlier retention decision remains unresolved; absence is not approval to exclude a reference.
`/tmp` is temporary storage, not a durable archival policy.

## Current checkouts and development-document intake

This table locks the preserved comparison checkouts. The [latest upstream entry](#latest-upstream-source-snapshots)
provides current default/published source without changing those baselines or historical reviews.

This table locks the preserved comparison checkouts. The [latest upstream entry](#latest-upstream-source-snapshots)
provides current default/published source without changing those baselines or historical reviews.

Owner-authorized refresh, 2026-09-21: **31 advanced, 35 already current, one fixed look pin**.
For 65 ordinary checkouts, latest means the fetched upstream default-branch HEAD; Craft rolling
means the latest stable release (`v0.13.4`). The separate `v0.10.5` look checkout fetched upstream
but intentionally retained its comparison tag. This does not update `app/` or select dependencies.
Only fast-forward merges were used for ordinary checkouts: no reset, stash, forced checkout,
submodule/dependency installation, upstream scripts or application execution. All 35 pre-existing
Hyperframes fixture modifications retained identical SHA-256 hashes. Their pre-refresh bytes and
manifest remain under `meta/recovery/hyperframes-local-before-refresh/` in the external root.

For a subsequent authorized refresh, inventory origin/default branch/HEAD and local changes first;
preserve changed bytes, fetch the named upstream target, then require a fast-forward. A divergent
branch or overlapping dirty change is a per-repository stop, never a reason to reset it. Keep Craft's
two distinct pin roles. Recheck local byte hashes after the update, record current checkout and
document observations here, and regenerate the guides. The external legacy
`scripts/update_repos.sh` uses forced checkout and hard reset; it is incompatible with this process
and was not executed. An updater script's presence is not authorization to discard local work.

The documentation column names **bounded sections inspected at the earlier source locks**, not a
claim to have re-reviewed each at the newer checkout SHA. Those tracked files remain offline in
each checkout; compare their current source before admitting behavior. The project guide links
them and the applicable Fleet execution contracts. Upstream instructions are reference data, not
permission to run installers, change Fleet policy, publish, or access credentials.

The 2026-09-27 owner-requested refresh checked the upstream default branch of all 71 existing
checkouts: **32 advanced, 36 were current, two Craft pins and one dirty Hyperframes checkout were
preserved**. Ordinary updates were fast-forwards; the clean detached Cindy checkout moved to the
fetched default HEAD. Every previously changed/untracked file retained identical bytes. Recovery
refs `refs/fleet/before-refresh/20260927T092852Z` and per-repository manifests are under external
`meta/recovery/source-refresh-20260927T092852Z/`; no hard reset, stash or upstream program ran.
Nine additional shallow source checkouts bring the total to **80 (54 software, 26 plugins)**.
The new Craft and Hyperframes companions provide current code without moving the protected originals.
Fresh Hyperframes reports 68 fixture modifications through Git's LFS filters; every reported file
was compared directly and is byte-identical to its HEAD blob. No LFS payloads were downloaded.
The seven new comparison projects and two companions are source references, not installed dependencies.
Historical mechanism-review locks and `meta/REVIEWED-HEADS.tsv` are not advanced by this refresh.

Keep three facts separate: current checkout SHA below; historical mechanism-review SHA in the
next table; and explicit new source corroboration in [refresh mechanisms](#refresh-mechanisms-and-counter-evidence).
Unchanged named source files do not prove unchanged callers, dependencies or behavior. New source
needs comparison at the consuming capability before implementation. Fetching never promotes admission.

The owner-requested 2026-09-29 refresh inventoried **97 Git checkouts** (70 software, 27 plugins).
At the inspected upstream snapshot, 91 clean ordinary checkouts were aligned with their fetched
default branch or latest companion; four proof baselines were deliberately retained: Craft v0.13.4,
Craft's v0.10.5 look pin, ZCode's comparison pin, and the older Pi model-adapter review pin. The
two older Hyperframes checkouts retained their tracked fixture changes; a clean
`plugins/hyperframes-current` checkout now provides current source. Clean
`craft-agents-oss-latest` and `pi-mono-latest` likewise provide current comparisons without moving
their pins. OpenClaw and tldraw had stale lock files only after no live Git process was found;
those locks were moved to `/tmp/fleet-stale-reference-locks-20260929`, not discarded. Hermes
fetched successfully after a transient remote 429; a later remote recheck timed out, so its
recorded SHA is the fetched snapshot, not a promise that the upstream will stop moving. No Fleet
production package, database or runtime was updated by refreshing reference sources.
The subsequently cloned official `MiniMax-AI/minimax-code` source brings the inventory to 98;
the official `aaif-goose/goose` checkout brings it to 99. Their source reviews are bounded to
the Host paths in the kernel comparison, not production imports.
The subsequent `NVlabs/SoL-Pi` source-only efficiency intake brings the inventory to 100.

| Checkout | Current SHA / refresh target | Previously inspected development docs | Fleet intake / limits |
|---|---|---|---|
| `plugins/GPTCache` | `a74ac654473f7bf4109118e8576945161616e17a` (main; current 2026-09-27) | `docs/contributing.md` | Contribution guide exposes cache/embedding/similarity seams. Reject automatic dependency installation and transparent caching of effectful turns; benchmark against Fleet originals. |
| `plugins/LLMLingua` | `5a4c78ae18ab17a98cf997e8259354e546081d64` (main; current 2026-09-27) | `README.md` | Usage examples require a compressor model/runtime and emit lossy text. Useful experiment setup only; no semantic-equivalence, token-price or production dependency claim. |
| `plugins/SuperClaude_Framework` | `fe68862c8ed9e2afb8120c2d9e27d0c3a7ce73a2` (detached; refreshed 2026-09-29) | `docs/developer-guide/technical-architecture.md` | Architecture describes Markdown context configuration; current source also has execution helpers. Treat document scope as partial, not proof the whole checkout is documentation-only; no second runtime. |
| `plugins/agentmemory` | `a6c256bf3eb0ef63c6bab78f528136a882d45f10` (detached; refreshed 2026-09-29) | `AGENTS.md` | Developer guide maps CLI and MCP to one shared core and uses temporary memory directories in tests. Keep shared-handler and scope fixtures; no private memory import or second consolidation writer. |
| `plugins/agentskills` | `69ef37e9424c0a7ea9dd2293b559e43ec8176379` (main; current 2026-09-27) | `CONTRIBUTING.md` | Contributor guide locates specification, validator and real compatibility proposals. Use parser fixtures and preserve/explain vendor metadata; instructions inside third-party Skills remain data. |
| `plugins/caveman` | `2fd153c67988e980fb0b2455c90832159a6a5a25` (main; current 2026-09-27) | `docs/technical/architecture.md` | Architecture distinguishes proxy, compression, retrieval and failure behavior. Keep recoverable originals/protected-span tests; BSL engine and telemetry/runtime defaults are not admitted. |
| `plugins/claude-mem` | `ade13f3067d3de486f41dbd8ed90ac5c854de718` (detached; refreshed 2026-09-29) | `docs/architecture-overview.md` | Architecture maps hooks to worker/session services and timeouts. Follow actual buffer durability and privacy behavior; hook success is not durable curated memory. |
| `plugins/claude-task-master` | `c0c98d367c55296bfe69e65680625b6db437af02` (main; current 2026-09-27) | `apps/extension/docs/extension-development-guide.md` | Development guide separates development dependencies from staged extension package. Compare package validation only; Commons Clause and second task authority remain blockers. |
| `plugins/claude-token-efficient` | `0d30a6db75af983b8ababf585f28faefdfc87895` (main; current 2026-09-27) | `CLAUDE.md` | Short contributor instructions supply no new runtime design. Existing controlled benchmark remains the useful reference; no new mechanism admitted merely to fill this table. |
| `plugins/claw-compactor` | `c1b936d40b1145c7a257bd6e34a17994f467495f` (main; current 2026-09-27) | `docs/architecture/stages.md` | Stage guide names immutable context, applicability and result metadata. Keep guarded transformations and original retrieval; stage ordering is not semantic preservation proof. |
| `plugins/context7` | `83e972e8b0fa2fb9dde78c451358d4209a9c0236` (detached; refreshed 2026-09-29) | `plugins/codex/context7/README.md` | Plugin README packages Skill plus remote MCP and requires login/new context. Useful distribution separation; remote documentation service is not an offline bundled-doc backend. |
| `plugins/dockview` | `838a7c5d7849f6b7ada7e9c1c76faeea52d2c3ad` (master; current 2026-09-27) | `AGENTS.md` | Developer guide distinguishes consumer React package from internal core and enterprise features. Use actual restore/dispose source and same-fixture comparison; DOM popouts do not prove native Electron integration. |
| `plugins/hyperframes` | `867787b2f935a03e84d485ff7319e01873598c14` (main; dirty checkout preserved 2026-09-27) | `docs/sdk/guides/canvas-integration.mdx` | Preview adapter separates draft/commit and detaches old composition subscriptions. Source/tests confirm the bounded mechanism; same-origin iframe, ignored hit-test time and missing-dispatch no-op are unsuitable Fleet defaults. |
| `plugins/letta` | `5bcdd177d70fa2b31a754cfcd801e77b2e1ab16a` (main; current 2026-09-27) | `CONTRIBUTING.md` | Contributing confirms retired V1 repository and points to letta-code; archive branch is historical. Latest default branch has no runtime to adapt; no silent replacement clone. |
| `plugins/markitdown` | `b8f79c57ebc0044be41323d89b2a45d3fda8460e` (main; current 2026-09-27) | `packages/markitdown-sample-plugin/README.md` | Sample converter declares interface version and explicit register_converters entry point. Useful extraction adapter example; latest Python/optional dependency bounds changed, and Markdown conversion is not Office editing. |
| `plugins/mem0` | `94c3fe9f238f3dbf29c9ce98643bd71eb13077cd` (main; current 2026-09-27) | `integrations/agent-plugin-core/README.md` | Shared plugin core generates thin per-host adapters with contract/conformance tests. Keep one owner across host adapters; telemetry, hosted memory and independent writers are not imported. |
| `plugins/planning-with-files` | `2bcc24bcc8362ed4ff47f2ee0fc8346bcc1b98e2` (main; current 2026-09-27) | `README.md` | Current package is Copilot Markdown agent/knowledge templates. No executable extension mechanism or license-file proof; do not copy its three-file planning workflow. |
| `plugins/playwright-mcp` | `f183dad4a52965583e3cc1d59b88cdc279e2e57d` (detached; refreshed 2026-09-29) | `src/README.md` | Source README points implementation to Playwright monorepo; local repo is a wrapper. Do not mistake wrapper documentation/tests for an inspected browser executor or grant. |
| `plugins/react-resizable-panels` | `8d30dadcf428b9c7aa8636e9a4b3820a75041cd7` (detached; refreshed 2026-09-29) | `CONTRIBUTING.md` | Contribution guide locates pnpm development/tests; no new host architecture follows from it. Compare constrained resize callbacks against Craft, not a docking replacement. |
| `plugins/react-rnd` | `fec7303134ab0f0bbe83fdf975ddc15c340f7e5d` (master; current 2026-09-27) | `README.md` | README provides controlled size/position and instance API plus isolated reproductions. Drag geometry alone does not supply docking, persistence, keyboard access or native-window lifecycle. |
| `plugins/repomix` | `0b3f82b401bbc520fd1aca67c06d24e40a868d3e` (detached; refreshed 2026-09-29) | `website/client/src/en/guide/claude-code-plugins.md` | Plugin guide separates MCP packing, commands and repository exploration. Use bounded selected-source packaging; plugin install is not consent for remote processors or all repository data. |
| `plugins/xyflow` | `3d35b57317576b0916c0bfeaaedd573aaacc2839` (main; current 2026-09-27) | `CONTRIBUTING.md` | Contribution map distinguishes React/Svelte/system and legacy v11. Use current ID-keyed graph change/observer mechanisms; no production-media renderer or workflow executor admission. |
| `software/AionCore` | `ea24f50af26977f38ebb3775816bbb1b7815a018` (detached; refreshed 2026-09-29) | `ARCHITECTURE.md` | Use repository/error-boundary diagrams to locate adapters. Rust server, JWT and database remain external mechanisms; do not transplant a backend authority. |
| `software/AionUi` | `6744099b279b991c17e31c243f0920477bd31cb6` (main; current 2026-09-27) | `docs/contributing/development.md`; `.claude/skills/architecture/references/process.md` | Development requires a separate AionCore binary; Electron source alone is not the complete runtime. Pure logic versus IO separation is useful; revalidate architecture notes against the current split. |
| `software/CLIProxyAPI` | `a270e7b9e57aaecd8f82555f44c2108518ad2330` (detached; refreshed 2026-09-29) | `docs/sdk-usage.md` | SDK embeds routing/authentication as a Go service. Management requires a configured secret and separate remote-access setting; do not introduce an account-pool proxy to obtain quota. |
| `software/Cowart` | `43fc8882daf2560c7e36fd34a95fe12c251493ac` (main; current 2026-09-27) | `README.en.md` | Portable plugin metadata and project-local canvas assets are useful handoff examples. Web login, GA4 and the tldraw editor license remain separate exclusions/conditions. |
| `software/Kun` | `ebce7f6cd94fc2882009fcf8169d7a59f5f5c289` (detached; refreshed 2026-09-29) | `docs/extensions/architecture.en.md` | Host-derived identity, lifecycle nonce and broker rechecks are design evidence. Noncommercial terms block copying; extension-owned threads cannot become another Fleet Session store. |
| `software/OpenChatCut` | `d1af1ade45521e8ed9a5be09e3acad823f269453` (detached; refreshed 2026-09-29) | `src/agent/skills/openchatcut-plugin-basics/SKILL.md` | Skill separates project/timeline targeting from tool schemas. Its current tools are direct calls, not MCP; use editing concepts only within the AGPL boundary. |
| `software/OpenHands` | `da8f701e0e8e9c25cf2a8065a0debd930107a765` (detached; refreshed 2026-09-29) | `specs/canvas-extensions.md`; `docs/CANVAS_EXTENSIONS_TESTING.md` | Extension contract distinguishes unsupported, unreachable and empty inventory. Testing guide uses MSW memory state and explicitly excludes backend install/persistence/authentication; never report that demo as an end-to-end extension host. |
| `software/OpenMontage` | `08e2151fa02de28a5d6a312b3d575692bf147ad7` (main; current 2026-09-27) | `docs/ARCHITECTURE.md` | Architecture documents agent-directed manifests and checkpointed tools, not a Python orchestrator. Keep offline deliverable checks; no imported pipeline authority or paid-provider defaults. |
| `software/OpenSandbox` | `3738975fc7b1da6875694f912b0422fe5d622064` (detached; refreshed 2026-09-29) | `docs/architecture/network/egress.md` | Egress document describes Linux DNS/network-namespace enforcement. Useful for diagnosing limits of browser URL checks; no second Fleet/macOS sandbox. |
| `software/ZCode` | `29628c9acdb81b703bbd4080c207a0e7ce5e276e` (main; current 2026-09-27) | `.agents/skills/architecture-governance/SKILL.md` | Bounded module context plus explicit owner, idempotency and stale-result rules aid handoff. Use existing Fleet contracts; do not copy its per-change document-generation policy. |
| `software/browser-harness` | `afbcc381b963040c19627d788e40c7e7663171ee` (main; current 2026-09-27) | `CONTRIBUTING.md` | Contributor guide distinguishes checkout launcher from installed command and locates domain skills. Keep private IPC evidence; no new browser ownership or automatic runtime installation. |
| `software/browser-use` | `4cbe921673b48a488f5415d9159249afd12a625b` (main; advanced 2026-09-27) | `BETA_AGENT_INTEGRATION_FEATURES.md` | Beta ledger describes an opt-in Rust SDK server while Python Agent stays separate. Protocol compatibility and claimed feature parity require their own proof; no wholesale agent runtime replacement. |
| `software/cc-switch` | `f678f7c539c90ed0e43872680b7f7162db5d0ef2` (detached; refreshed 2026-09-29) | `src/components/providers/forms/PiProviderForm.tsx`; `src/components/providers/forms/ClaudeFormFields.tsx`; `src-tauri/src/services/model_fetch.rs`; `docs/user-manual/en/2-providers/2.5-usage-query.md` | The Pi form separates upstream API format from model IDs; model fetch uses format-specific authentication headers and accepts `data` or `models` list shapes. Fleet borrows that request distinction for bounded, same-origin candidate discovery, while keeping manual import because `/models` does not prove chat capability. Its Claude/Codex forms can select additional upstream formats because the local proxy translates requests; Fleet does not copy that proxy or subscription rewriting. Usage query modes are not proof of a supported public allowance API. |
| `software/cindy` | `a46bb58fc3263f1a3dde04cf9470ed9b0379c82c` (detached; refreshed 2026-09-29) | `docs/dev-rules/architecture-invariants.md`; `docs/dev-rules/electron-security-and-process-boundaries.md` | Read current panelKind/layout ownership and Electron sender validation. Preserve unknown panels and distinguish applied from persisted; reject its corrupt-layout overwrite, fixed conversation width and user-global layout policy as Fleet defaults. |
| `software/cockpit-tools` | `4ea6a34df6aa3b2d494c3cca5983bd09a84a9e3a` (detached; refreshed 2026-09-29) | `CONTRIBUTING.md`; `docs/CODEX_API_SERVICE_HANDOFF.md` | Contributor guide identifies shared core/GUI/CLI and targeted checks. API Service handoff describes credential/config injection into a local gateway, not a supported quota API; keep the existing quota scheduler comparison and restricted-license boundary. |
| `software/codex` | `94d642d8b40e45e2e544770f0d1f28df9a717f06` (detached; refreshed 2026-09-29) | `codex-rs/app-server/README.md`; `codex-rs/ext/extension-api/notes.md` | App-server documents cancellation acknowledgement versus original completion and auth-generation fencing. Saved disabledPluginIds explicitly does not yet filter capabilities. Sparse quota updates are corroborated in protocol/v2/account.rs; extension notes alone are not an SDK contract. |
| `software/craft-agents-oss` | `b2d6c8aabdfdc96416eea9debd6756ae6d3c0db9` (detached; fixed baseline preserved 2026-09-27) | `CONTRIBUTING.md`; `apps/electron/README.md` | Use Electron build/transport/package entry guidance with current scripts as authority. Do not run upstream secret-sync, publishing or hosted-service setup; v0.13.4 remains the release comparison. |
| `software/craft-agents-oss-v0.10.5` | `c9d9a26fbefa3a5165ee9aa50cb30c25466afd81` (detached; fixed baseline preserved 2026-09-27) | `apps/electron/README.md` | Fixed visual comparison only. Keep this development guide with its original checkout; current implementation/build claims belong to the rolling release and app tree. |
| `software/dashi-taskboard` | `6a79ef522238ff11681cb85a9d803d19442a3d00` (detached; refreshed 2026-09-29) | `integrations/deepseek-harness/README.md` | Small host bundle locates an already-running runtime through launcher-owned metadata rather than a fixed port. No second Taskboard runtime or task store. |
| `software/deepseek-harness` | `639ed015397290b3745d163aafe02ffee4aa3f84` (detached; refreshed 2026-09-29) | `packages/extensions/cordis-host-runner/README.md` | Host guide names scope/disposal and immutable versions; definitions are RAM-only, node:vm is not a security boundary, async work escapes vmTimeoutMs and UI load receipt precedes render. Do not adopt those limitations silently. |
| `software/flowgram.ai` | `626818bfe123ee12429037001a2e295d6badc6f3` (detached; refreshed 2026-09-29) | `apps/docs/src/en/guide/advanced/custom-plugin.mdx` | Custom plugin guide gives lifecycle hooks and portable fixed/free-layout registration. Compare disposal concepts only; the IoC/editor container is not a small standalone executor. |
| `software/genoffice` | `324b0477ed014c92f2abea12a847e12ff06e3c35` (detached; refreshed 2026-09-29) | `apps/sheets/docs/architecture.md`; `packages/html2docx/ARCHITECTURE.md` | Sheets guide declares partial PoC state and package-preserving edits; current sidecar already exposes newer archive/recalculation operations, so its production-gap list is not current feature proof. HTML-to-DOCX intentionally rasterizes some decoration; measure editability separately. |
| `software/grok-build` | `2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8` (detached; refreshed 2026-09-29) | `crates/codegen/xai-grok-pager/docs/hooks-and-plugins.md` | Hook/plugin guide makes scope, version and error feedback inspectable. Shell hooks are executable effects, not approval grants; keep Fleet permissions and shared UI. |
| `software/Qwen-MM-Plugins` | `07736672525443c7f8a3f6405eed37d2236f023f` (main; owner-requested shallow clone) | `docs/en/local_development.md`; `docs/en/how_to_add_new_capability.md` | Capability guide separates Skill instructions, optional MCP tools and dependencies. Native image blocks require a vision-capable main model; text-only caption mode is a separate paid VL request, not a free conversion or host-level vision guarantee. |
| `software/Qwen-Live-Harness` | `b6ce544ebbcd7417e37e0314ec946466c49c615c` (main; owner-requested shallow clone) | `packages/qwen-live-harness/README.md`; `docs/configuration.md` | The daemon/Host split, per-call realtime receipts and API-key region choice are source evidence. Its macOS desktop and independent background/Memory stores do not satisfy Fleet's three-platform, one-Session contract. |
| `software/pi-multimodal-proxy` | `cdf53ccc21be534240e227a5fb85392cf42d774c` (main; owner-requested shallow clone) | `README.md`; `SECURITY-REVIEW.md` | Extension manifest and security review document Pi session/tool event hooks, scoped consent and bounded media access. Package-declared MIT lacks a root license text; the review is source evidence, not license or runtime admission. |
| `software/pi-claude-bridge` | `a78a2a5525e96318f8dba7f9fd32ce2191be0136` (main; source comparison) | `README.md`; `src/index.ts`; `LICENSE` | Pi extension bridges Claude Agent SDK queries, Pi tools through an MCP server and a rewritten Claude session transcript. MIT source is inspectable, but its Pi extension host, second session and permission mapping are not Fleet's existing runtime contract. |
| `software/pi-mono-latest` | `e792ba131ed0495f3ff58a0eb13f20540e344d5c` (detached; refreshed 2026-10-01) | `packages/durable/README.md`; `packages/chord/README.md`; `packages/coding-agent/src/experimental/client-tui.ts` | Durable Harness commits conversation/task/document changes; new ownership, compaction and overflow cases cover cancellation/restart. Chord hosts multi-environment facets. Durable remains experimental with no image reader; coding-agent presentation facets are under `experimental/`, not stable `ExtensionAPI`. The released Pi SDK is installed; experimental Durable/Chord do not replace Fleet ownership. |
| `software/herdr` | `da5881eaff77486d9e94677990b6e81769502f13` (detached; refreshed 2026-09-29) | `docs/next/website/src/content/docs/plugins.mdx` | Plugin guide explicitly treats commands as normal local code inheriting user environment and full CLI access. Context/logging are useful; this is not isolation or bounded Fleet authority. |
| `software/hermes-agent` | `7cadfaa668587a2be683c069373ca5ea3ca65fca` (detached; refreshed 2026-09-29) | `website/docs/developer-guide/desktop-plugin-sdk.md` | Desktop SDK documents one contribution registry, native UI kit and scoped disposers. Its renderer plugins have full app authority and default activation; desktop implementation is not present in this checkout. Documentation evidence only, no security-boundary or code-import claim. |
| `software/html-anything` | `553ed98c283f9c0f489902d035416a972d6a9699` (main; current 2026-09-27) | `CONTRIBUTING.md` | Contributor map separates Skills, argv/detection adapters and export adapters. Reuse a small adapter only after comparing Craft; examples do not justify another agent runner or UI language. |
| `software/kimi-code` | `f409caa21e71ce7beb158d29ffca1fed76216a64` (detached; refreshed 2026-09-29) | `docs/en/customization/plugins.md` | Plugin guide separates install/reload and describes macOS Accessibility/Screen Recording versus Windows foreground input. Useful platform acceptance cases; proprietary/distributed Computer Use helper implementation is not established by the guide. |
| `software/mcp-registry` | `bf4e88cbe8d1a635c06144ccea1d24cb52fa6186` (main; current 2026-09-27) | `docs/reference/api/extensions.md` | Namespaced experimental endpoints keep registry core minimal. Namespace/version metadata is useful; no Fleet-hosted registry requirement or execution grant. |
| `software/multica` | `e31da86c90794b5c488279a3ead13ac2f31ac269` (detached; refreshed 2026-09-29) | `apps/docs/content/docs/developers/architecture.mdx` | Architecture separates server data from client drafts/layout and explains task versus Run terminology. Keep this separation; hosted database/daemon and scheduler remain outside Fleet ownership. |
| `software/omnigent` | `61d96f74b540f3b31a147b74b12abe4ad8ead3e6` (detached; refreshed 2026-09-29) | `docs/extending/extension_manifest.md` | Immutable manifest declares independent API version, publisher-qualified IDs, collision rejection and verified bundle paths. Activation events/when/commands are reserved metadata in V1, not running features. |
| `software/open-design` | `5b19dfa4351b3eed33826ee72746a7c653c23a54` (detached; refreshed 2026-09-29) | `plugins/spec/AGENT-DEVELOPMENT.md` | Agent handoff separates portable SKILL.md from versioned host manifest and requires real preview output. A skipped/404 preview bake fails verification. Keep capability declaration and output fixtures, not another design authority. |
| `software/openchamber` | `1a566db6c2921cc8eaebaf4ed5665859cc11da3e` (detached; refreshed 2026-09-29) | `packages/extensions/DOCUMENTATION.md` | Built-in ownership guide uses ordinary public SDK, staged validation, host-bound provenance and disable-with-data-retention. Automatic built-in grants are rejected. Git PR source adds ancestry checking for reused branch names; see refresh mechanisms below. |
| `software/openclaw` | `4cd32ee5657b56fb54f1920040921b2532ab1c70` (detached; refreshed 2026-09-29) | `docs/plugins/architecture.md` | Architecture separates manifest discovery/diagnostics from activation and keeps metadata/provenance in one cache owner. Useful load sequencing; do not import the gateway, global runtime or trust defaults. |
| `software/opencode` | `f66b86ceec1a497417f750b88a06cf6923c5c75f` (detached; refreshed 2026-09-29) | `packages/plugin/src/v2/promise/README.md` | V2 Promise API documents awaited hook registration/disposal and per-domain reload. Compare lifecycle semantics; in-process transforms may mutate catalogs and are not a Fleet permission boundary. |
| `software/opencut` | `e668010778568641babef2cc40be4703ae6916d6` (main; current 2026-09-27) | `apps/desktop/README.md` | Desktop README explicitly says the GPUI app is an early window. Latest default branch still does not establish an editable/exportable timeline; retain classic as the mechanism candidate. |
| `software/opencut-classic` | `cf5e79e919144200294fb9fed22a222592a0aeea` (main; current 2026-09-27) | `.github/CONTRIBUTING.md` | Contributor guide identifies actual web/editor development and targeted checks. Upstream collaboration policy and Docker services are not Fleet build requirements; compare the existing command/export source. |
| `software/openpencil` | `3e55570d20bd4be891700789146e7c43c9c1c3b1` (main; current 2026-09-27) | `packages/op-web-sdk/README.md` | Web SDK is explicitly a read-only .op viewer with destroy cleanup. Full app editing is a different path; do not call viewer embedding native editing or Office/FIG fidelity. |
| `software/openreel-video` | `5f3c85e5fc223c86060bf4b12e1b4dec58e9b8a9` (main; current 2026-09-27) | `CONTRIBUTING.md`; `creating-views/README.md` | Contributor guide locates core engines versus web bridges. creating-views is an exported design prototype, not a production runtime contract; use the reviewed clock/export paths, not prototype instructions. |
| `software/orca` | `5c59a2dfec9c5f935a4a38e5fbb03324150f707c` (detached; refreshed 2026-09-29) | `docs/audits/plugin-worker-output-retention/README.md` | Worker-output audit traces retained string backing buffers through real parser/log ring and supplies reproduction commands. Bound bytes as well as line counts; audit measurements are upstream evidence, not Fleet measurements. |
| `software/palmier-pro` | `eeafde20086b1dffb01ccb59da80e470abadeda8` (main; advanced 2026-09-27) | `AGENTS.md` | Development notes distinguish packaged/test resource lookup and observable cancellation/failure. Reject its no-migration policy for Fleet data; Swift/macOS/binary license constraints remain. |
| `software/penpot` | `90ab142f003499afe383ebdd9e50ede6ac31843a` (detached; refreshed 2026-09-29) | `docs/technical-guide/developer/architecture/index.md` | Architecture explains shared frontend/backend data models and exporter boundaries. Use native API/schema mechanisms, not the hosted SPA/JVM database stack; changed token schema requires migration review. |
| `software/pi-mono` | `2b0a123de98318c2ff8069661721ce0c3794c34e` (main; advanced 2026-09-27) | `packages/coding-agent/docs/extensions.md` | Extension guide maps trust, lifecycle and session-entry persistence. Extensions execute with full system permissions; example stash checkpoints and arbitrary tool interception are not Fleet policy. |
| `software/spec-kit` | `2c0a57abe1e7383a864c7d5e4dfa2457d7537734` (detached; refreshed 2026-09-29) | `extensions/EXTENSION-DEVELOPMENT-GUIDE.md` | Extension guide separates schema version, package metadata, configuration and local tests. Keep requirement coverage ideas; no second planning/approval engine or extra per-task documents. |
| `software/tldraw` | `171ad467fb9224fb476bcd78d83ce7218a29d8aa` (detached; refreshed 2026-09-29) | `packages/state/ARCHITECTURE.md` | State architecture locates signals, atoms and transactions. Inspect leaf-package terms independently; state documentation does not license or select the editor SDK. |
| `software/waku` | `433ed580842e91d428e1759a2fc1e51f31ab3517` (detached; refreshed 2026-09-29) | `CONTRIBUTING.md` | Contributor guide gives GPUI/platform/CLI prerequisites. No independently better extension mechanism established in this doc pass; keep the earlier driver-control evidence and GPL boundary. |

| `software/harnessrouter` | `7d0fa14bf70e81a2226d232bc519e729d32793d3` (detached; refreshed 2026-09-29) | `README.md` | Task/session/artifact API is an execution boundary, not a local permission implementation. CE and separately licensed Starter Kits must remain distinct. |
| `software/deepagentsjs` | `9a64a1751ca4d5aba003e5c15f972b183202238f` (main; cloned 2026-09-27) | `README.md` | Compiled graph and caller checkpointer/backend seams are real; SDK peer dependencies and default tools introduce integration work, not an automatic better kernel. |
| `software/openai-agents-js` | `fdaf0a66ca6e9d89498909ad7cf64745630e8afb` (main; cloned 2026-09-27) | `README.md` | Embeddable provider-agnostic executor with model extension; source inspection does not establish Fleet multi-provider fidelity, recovery or native-harness parity. |
| `software/agent-client-protocol` | `9af0e9f748db9f4cc4c410a7b212ead4f98ae78c` (detached; refreshed 2026-09-29) | `docs/protocol/v1/tool-calls.mdx` | Protocol contracts do not ensure every CLI uses the permission callback or supports all optional methods. Keep Fleet host admission and durable identity. |
| `plugins/mcp-apps` | `82221c0c8ce7661efa6771c9d461511b1650495f` (main; cloned 2026-09-27) | `specification/2026-01-26/apps.mdx` | Resource permissions and CSP require host enforcement. Host style variables enable visual integration; Fleet entry registration/shared operations still need implementation. |
| `plugins/cindy-official-plugins` | `7f22c956b2dd4c29d03d44d4eba3953f94e15632` (detached; refreshed 2026-09-29) | `opendesign-trial/README.md` | Retained durable checkout replaces temporary-only evidence. Domain document operations and worker/preview lifecycle are useful; upstream and third-party licenses remain separate. |
| `plugins/hermes-plugin-claude-subscription-directsdk` | `ef73726cfaf2fa0ee041e55572f406e2c24fed83` (main; cloned 2026-09-27) | `README.md` | Current plugin still qualifies specific native versions and admission/replay behavior. Its live measurements are upstream evidence only; no Fleet login or runtime verification performed. |
| `software/craft-agents-oss-latest` | `73bd9c2a3573158bea880984eb8d5fdb41e0cac2` (detached; refreshed 2026-10-01) | `README.md` | Distinct Claude/Pi backends and branch-readiness contract corroborate earlier reference roles. No whole-product re-review or migration claim. |
| `plugins/hyperframes-latest` | `4984a268f760eed2997974245b52a59b8a037efa` (main; cloned 2026-09-27) | `docs/sdk/guides/canvas-integration.mdx` | Fresh clone has 68 LFS-filter status entries whose file bytes equal HEAD blobs. This is not 68 authored changes or evidence that render fixtures ran. |
| `plugins/hyperframes-current` | `3631ee3da0e7cd3ca7e3047dbb13a55c4f638276` (detached; refreshed 2026-09-29) | `docs/sdk/guides/canvas-integration.mdx` | A clean latest clone for comparison while both earlier Hyperframes directories retain tracked test artifacts. Its successful checkout does not establish that render tests or licensed codecs work. |
| `software/minimax-code` | `d8a32b6bc3b4f3ec9bc66a03fda9634810b00389` (detached; cloned 2026-09-29) | `docs/architecture.md`; `docs/open-source-status.md` | Official terminal/headless/ACP source. V2 owns SQLite Session, queue and history above a vendored Pi loop; MiniApp publication includes a supervised process and client surface. Desktop source is not published here, and no Fleet dependency or MiniMax login was added. |
| `software/goose` | `add40e76589bcb0bffd3a38c69a855d20806e568` (detached; cloned 2026-09-29) | `documentation/docs/goose-architecture/goose-architecture.md` | Official desktop/CLI/ACP source. Rust Agent owns the loop, SQLite stores Sessions, ACP delegates a complete external Agent and the desktop renders MCP Apps. A standalone App opens its own ACP Session; this is a UX/executor comparison, not Fleet's shared Project domain store. |
| `plugins/SoL-Pi` | `1559b5cb12c72da4a485bc50fe326586b216fb19` (main; cloned 2026-09-29) | `README.md`; `docs/compatibility.md`; `docs/configuration.md` | Standalone MIT Pi coding-agent extension with four opt-in mechanisms. Tested upstream against 0.85.1/0.84.2; not compatible merely because Fleet uses pi-ai. Static cache economics and nested command policy need adaptation; no runtime installation or savings claim. |

### Refresh mechanisms and counter-evidence

These mechanisms were corroborated at their then-current source locks. The 2026-09-25 rows name
their current lock explicitly; older rows require reinspection after this refresh. Tests were
**read**, not run against the reference applications. Production imports remain subject to the
existing comparison and dependency gate.

The earlier owner-authorized R1 source comparison adds these observations at its prior revisions;
historical mechanism observations later in this registry keep their original SHAs. R1 owns the
implementation contract, and these source observations do not establish Fleet implementation.

| Current source | Admitted behavior / Fleet owner | Excluded import |
|---|---|---|
| ZCode `packages/ui/src/v4/ConversationTimeline.tsx`, `SessionPane.tsx`, `ConversationComposer.tsx` | R1: responsive empty layout using the normal composer, with a context header above the editor; supported context actions share the add popup. | Brand art, second editor/controller, unwired Goal/Workflow/Plugin actions. |
| ZCode `packages/ui/src/v4/composer/V4ComposerModeControls.tsx`, `V4ComposerToolbar.tsx`, `composerSubmissionConfig.ts`; `packages/shared/src/execution-state.ts`; `apps/zcode-cli/packages/core/src/permission/service.ts` | R1: independent Plan checkbox and three permission radios; separate model/reasoning; validated submission snapshot; Plan constrains full access. Extend Craft's Session/permission/provider owners. | Automatic phase selection, four exclusive modes, a copied permission engine, silent Plan removal or full-access escalation. |
| Cindy `apps/desktop/src/renderer/components/new-chat/ModelSelector.tsx`, `UnifiedModelPanel.tsx`, `UnifiedModelRail.tsx`, `UnifiedModelRow.tsx`, `ModelSourceDetails.tsx`, `composerModelSelection.ts` | R1: top search, filter rail, grouped rows, configure footer, scoped account/usage display and coherent current/next-turn choice. | Theme values, payment flow, model/credential/usage stores, screenshot sample numbers, local quotas applied to remote accounts. |
| Cindy `apps/desktop/src/renderer/features/right-sidebar/RightSidebarShell.tsx`, `TabBar.tsx`, `registry.ts`, `store.ts`, `types.ts` | R1: Session-scoped tab lifecycle, registered bodies, add menu and unknown-kind recovery, implemented through Craft's existing panel/layout owner. | Global-only layout, fixed widths, Cindy database/RPC, browser engine replacement or new native docking framework. |
| ZCode `29628c9`: `packages/ui/src/settings/model-provider-section/ProviderFormControls.tsx#ModelRowInput`, `ProviderCardSections.tsx#ProviderModelsSection` | A model row keeps the ID, context badge and positive input-capability marker on one line, with test/edit/delete/enable controls at the end; detailed limits and reasoning configuration live behind Edit. | Fleet shows the official display name when provided, with exact ID in details and accessibility text. Keep Craft tokens and only evidence-backed capability markers; do not copy ZCode's separate provider settings authority. |
| Cindy `d4489b8`: `apps/desktop/src/renderer/features/cc-agent/CCAgentSessionView.tsx#ContextCapacityRing`; ZCode `29628c9`: `packages/ui/src/components/ai-elements/context.tsx#ContextIcon`; OpenCode `adee738`: `packages/app/src/components/session-context-usage.tsx#SessionContextUsage` | The ring is session context occupancy with a bounded arc and a truthful percentage/tooltip. Cindy couples manual compaction only to runtime support; ZCode suppresses invalid usage; OpenCode distinguishes usage from cost. | The existing Craft Session context snapshot supplies occupancy; hide stale/unknown readings, preserve over-limit text, and offer `/compact` only when the runtime declares it. Never substitute subscription quota or cumulative spend. |

| Mechanism / exact source | New observation | Fleet landing / rejecting condition |
|---|---|---|
| OpenChamber `packages/web/server/lib/github/pr-status.js#isHistoricalPrOfCheckout` (refresh diff) | A terminal PR matched by reused branch name is returned only when its head commit is an ancestor of checkout HEAD; failure to establish ancestry returns false. | EXEC-05 Git proof adds reused-name/fresh-worktree and unavailable/shallow-history fixtures. Unknown ancestry cannot mean ownership; active-PR matching still needs repository/fork identity. |
| Cindy `apps/desktop/src/main/layout/LayoutStore.ts#getLayout,setLayout,persist` | Writes return `{layout,persisted}` and validate input before mutation; read fallback immediately writes default layout over a corrupt file. | CORE-11 preserves separate in-memory/save results but must preserve corrupt bytes and explain recovery. Missing/unregistered panel IDs survive layout storage; no import of global-only placement or fixed widths. |
| GenOffice `apps/sheets/src/main/xlsx-sidecar-client.ts#close,recalcCells`; `native/xlsx-engine/src/archive.rs#save_archive` relative to `apps/sheets/` | Close cancels queued reads without dropping close/save effects. Save rejects source-equals-target and raw-copies unmodified ZIP entries, then syncs and reads back a manifest. It creates the destination directly; this function alone is not atomic replacement. Current recalculation method is newer than the architecture gap list. | INFO-05 proves immutable original, byte-preserved untouched entries, stale-base refusal, temporary-output validation and host-owned atomic publish. Formula support requires execution/fidelity fixtures, not a method name or architecture claim. |
| Hyperframes `packages/sdk/src/adapters/iframe.ts#commitPreview,attachSync`; adjacent `iframe.test.ts` and `iframe.sync.test.ts` | Draft commits dispatch one move; synchronous dispatch failure restores draft. Reattach removes previous patch subscription; iframe load resynchronizes overrides; script patches are filtered. Missing dispatch returns without saving; async durability is outside this adapter. | CREATE-07/CREATE-09 use one domain edit owner, explicit durable receipt and teardown tests. Keep untrusted preview isolation; no same-origin shortcut, fabricated time-accurate hit or saved-success on a no-op. |
| Codex `codex-rs/app-server-protocol/src/protocol/v2/account.rs#AccountRateLimitsUpdatedNotification,RateLimitSnapshot` | Rolling updates are sparse; merge supported values into an identity-matched snapshot or reread it. Missing account metadata does not erase known fields. `spend_control_reached: None` is explicitly unavailable, not false. | INTEL-04 preserves per-field presence, sample age and account/config generation. Account switch clears old identity; no zero/default quota or nullable field interpreted as unlimited. |
| Codex `codex-rs/app-server/README.md` — User verification cancellation / Thread plugin settings / Selected workspace routing | Cancel acknowledgement does not establish original operation completion; saved plugin selection explicitly does not yet filter tools; account notifications require current-state reread. These are protocol-document observations, not an end-to-end runtime test. | EXEC-15/ORCH-03 distinguish requested, acknowledged and effective state, discard late results and prove tool gating separately from preference persistence. |
| OpenPencil `packages/op-web-sdk/README.md`; OpenHands `docs/CANVAS_EXTENSIONS_TESTING.md`; Hermes `website/docs/developer-guide/desktop-plugin-sdk.md` | Respectively: read-only viewer; mocked backend; renderer extensions with full app authority. Hermes desktop runtime source was not found in this checkout. | CREATE-06/ORCH-03 cannot promote any of these into an editable document, durable install or isolated plugin claim. Keep documentation-only evidence labeled. |
| Penpot `common/src/app/common/files/changes.cljc` (refresh diff); MarkItDown `packages/markitdown/pyproject.toml` (refresh diff) | Token status changes from path sets to UUID theme/set IDs and adds token-source changes. MarkItDown now bounds Python below 3.15 and changes YouTube optional dependency constraints. | CREATE-06 needs versioned native-change migration; ingestion dependency closure must be rechecked. Historical file/line references remain at their original SHA. |
| Codex `codex-rs/core/src/agent/control.rs` (refresh diff) | Config snapshot now calls inspection and distinguishes Loaded versus Unloaded agents; CLI exec-server code moved into `codex-rs/cli/src/exec_server_command.rs`. | ORCH-07 must re-trace callers before adopting old line references. No claim of full review of the moved CLI or new inspection implementation. |

| `software/openstock` | `e109f188480b7e5f4a8349dde582aeea45875071` (detached; owner-requested intake 2026-10-05) | `README.md`; `MARKET_SUPPORT.md`; `LICENSE` | Market-observation plugin comparison only: external chart/data services, per-user watchlist, alert claim/delivery gap. Root AGPL limits direct code combination; no order/backtest engine or runtime acceptance inferred. |
| `software/octop` | `eb28011249c02cafd389b2d424294c6c1b9cf422` (detached; v1.0.2b6 intake 2026-10-05) | `docs/architecture.md`; `docs/acp.md`; `docs/octop-ui-payload-offload.md`; `LICENSE` | Host composition, shared runner settings, tool-result UI and model-payload separation. Actual Harness/Gateway/Memory/Browser internals live in separate packages; default trusted npx runners and same-realm UI are not Fleet security defaults. |

## Bounded source review — 2026-09-21

All **67 Git checkouts at the listed pre-refresh source locks** below were inspected for repository identity, current revision,
working-tree changes, license boundaries and at least one relevant implementation path where
source exists. The four non-Git UI collections remain visual references, not source audits.
This is **not a whole-repository audit**: unread modules, dependency closure, runtime behavior and
integration tests remain outside this pass. That bounded review did not change, fetch, install or run references. The later refresh did change
checkout HEADs; do not reinterpret the findings below at the new revisions.

`REUSE` is the existing Craft implementation; `LOOK` is the visual comparison pin. `C` means a
bounded code extraction or adaptation **candidate**, not drop-in compatibility,
dependency selection, admission, implementation or test acceptance. `M` means mechanism evidence
only; each row explains its integration or license boundary. Language/runtime fit is evaluated
per mechanism, not a blanket language ban under F3. `X` means the current
snapshot/runtime cannot supply the proposed Fleet capability. None of these marks changes product
capability status. Root licenses never extend automatically to enterprise, vendor or binary code.

Repository links identify observed origins; paths are relative to each checkout and name the
implementation read. SHA prefixes identify the original bounded source observation, not the current refreshed HEAD.
Resolve current HEAD and new documentation evidence through the table above.
Before implementation, compare the exact mechanism with current Craft/Fleet, prove the shared
authority/caller and failure path, and complete the existing admission requirements below.
Baseline R0/R1/R2 corrections remain first; read-only reference research opens no feature gate.

### Added kernel and protocol source locks

| Checkout / reviewed SHA / license | Source path or symbol read | Reuse boundary |
|---|---|---|
| [software/harnessrouter](https://github.com/HarnessRouter/harnessrouter.git) · `5f82db1d1f13` · Apache-2.0 CE; Starter Kits separate | `runner/server.py`; `protocol/versions/2026-09-12/tasks.md`; `gateway/media_plane.py` | **M** — Complete-executor and media-job reference; approval bypass and separate state prevent a drop-in host replacement. See [audit](#harnessrouter--executor-infrastructure-comparison). |
| [software/deepagentsjs](https://github.com/langchain-ai/deepagentsjs.git) · `9a64a1751ca4` · MIT | `libs/deepagents/src/agent.ts:180,450,510,533`; `libs/deepagents/src/backends/state.ts:51` | **M** — Compare general executor, profiles and checkpointer integration on existing host fixtures; no LangGraph store or production dependency selected. |
| [software/openai-agents-js](https://github.com/openai/openai-agents-js.git) · `fdaf0a66ca6e` · MIT | `packages/agents-core/src/memory/session.ts:27`; `packages/agents-core/src/runState.ts:3153,3203`; `packages/agents-core/src/run.ts:650` | **M** — Compare approvals, continuation and host Session adapter. Default tracing needs explicit local-first configuration. This is not a subscription or native Codex adapter. |
| [software/agent-client-protocol](https://github.com/agentclientprotocol/agent-client-protocol.git) · `15219ed70b6c` · Apache-2.0 | `README.md`; `docs/protocol/v1/tool-calls.mdx:135,193` | **M** — Negotiate native executor capabilities and permission/cancel messages. Stable protocol 1 must not be confused with draft v2 or schema crate versions. |
| [plugins/mcp-apps](https://github.com/modelcontextprotocol/ext-apps.git) · `82221c0c8ce7` · Apache-2.0/MIT transition; documentation CC-BY-4.0 | `src/app-bridge.ts:127,190,503`; `src/styles.ts:77`; `src/spec.types.ts:340` | **M** — Tool UI resources, theme and host bridge are reusable boundaries, not a complete Fleet page/plugin runtime or automatic sandbox. |
| [plugins/cindy-official-plugins](https://github.com/makecindy/cindy-official-plugins.git) · `8cc054b938d0` · Apache-2.0 root; plugin and upstream notices separate | `opendesign-trial/ghost.json`; `opendesign-trial/source/build/card-preview.cjs`; `opendesign-trial/node/worker.cjs` | **C** — Actual OpenDesign application-plugin packaging reference at the previously inspected revision; do not import workers, native binaries or independent authorities wholesale. |
| [plugins/hermes-plugin-claude-subscription-directsdk](https://github.com/NousResearch/hermes-plugin-claude-subscription-directsdk.git) · `ef73726cfaf2` · MIT | `directsdk.py`; `directsdk_setup.py`; `admission.py` | **M** — Experimental request-scoped native Claude client with native tools disabled. Not the preferred route for retaining the official complete tool loop. |
| [software/craft-agents-oss-latest](https://github.com/craft-ai-agents/craft-agents-oss.git) · `53393340aa36` · Apache-2.0 | `packages/shared/src/agent/backend/index.ts`; `packages/shared/src/agent/backend/types.ts` | **M** — Latest upstream companion, preserving both fixed Craft pins and app changes. Inspect backend/Agent interaction mechanisms, not a new product baseline. |
| [plugins/hyperframes-latest](https://github.com/heygen-com/hyperframes.git) · `4984a268f760` · Apache-2.0; binary/codec terms separate | `docs/sdk/guides/canvas-integration.mdx`; `LICENSE` | **M** — Latest source companion for the protected dirty checkout. Documentation intake only; current implementation not yet admitted. |
| [plugins/hyperframes-current](https://github.com/heygen-com/hyperframes.git) · `2eeaefb3e5c9` · Apache-2.0; binary/codec terms separate | `docs/sdk/guides/canvas-integration.mdx`; `LICENSE` | **M** — Clean current-source companion; verify changed render/preview callers before extracting anything. Preserves both dirty historical checkouts and does not add a Fleet renderer dependency. |
| [software/minimax-code](https://github.com/MiniMax-AI/minimax-code.git) · `d8a32b6bc3b4` · MIT; vendored dependencies retain their own licenses | `packages/local-runtime-v2/src/service/{turn-system/agent-host/native-production-dependencies.ts,session-system/owner.ts}`; `packages/agent-core/src/pi-turn-runner/pi-turn-runner.ts`; `packages/local-runtime-v2/src/service/plugin-system/plugin/runtime/miniapp/publication.ts` | **M** — Real V2 Host, queue/permission and supervised MiniApp comparison for [kernel choice](#kernel-choice-against-fleets-complete-product). Do not import MiniMax account state, desktop behavior that is absent from source, or its separate Session/queue store. |
| [software/goose](https://github.com/aaif-goose/goose.git) · `add40e76589b` · Apache-2.0 | `crates/goose/src/{agents/agent.rs,session/session_manager.rs,agents/state_machine/session.rs,acp/provider.rs}`; `ui/desktop/src/{acp/mcp-apps.ts,components/apps/StandaloneAppView.tsx}` | **M** — Compare complete ACP executor routing, SQLite Session/permission effects and desktop MCP Apps. Standalone App creates another ACP Session; do not import that as Fleet's shared Project document/Job owner. |
| [plugins/SoL-Pi](https://github.com/NVlabs/SoL-Pi.git) · `1559b5cb12c7` · MIT | `src/sol-pi/{index.ts,config.ts}`; `src/sol-pi/extensions/{observation-pack/index.ts,action-fusion/then-run.ts,evidence-preserving-reducer/receipt.ts,online-context-compact/economics.ts}` | **M** — [Efficiency evidence](#token-efficiency-evidence-and-pi-extension-boundary): preserve source observations and native policy, evaluate each mechanism separately, and account for auxiliary calls and cache rewrites. Full Pi hooks and Host context/policy mapping are required; OV-069 does not automatically enable this extension. |

### Product anchors

| Checkout / reviewed SHA / license | Source path or symbol read | Reuse boundary |
|---|---|---|
| [software/craft-agents-oss](https://github.com/craft-ai-agents/craft-agents-oss) · `b2d6c8aabdfd` · Apache-2.0 | `apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx`; `apps/electron/src/transport/routed-client.ts` | **REUSE** — Current Session/Task, provider, permission and panel-stack paths are the baseline. Remote routing is not proof of host-side grants; hosted services still need R0/R2 correction. |
| [software/craft-agents-oss-v0.10.5](https://github.com/craft-ai-agents/craft-agents-oss.git) · `c9d9a26fbefa` · Apache-2.0 | `apps/electron/src/renderer/components/workspace/AddWorkspace_RadioOption.tsx`; `apps/electron/src/renderer/components/app-shell/SessionMenuParts.tsx` | **LOOK** — Shared picker/menu primitives and visual measurements. No restoration of this older product shell or runtime. |
| [software/cindy](https://github.com/makecindy/cindy) · `00a5ad1a503c` · Apache-2.0 | `apps/desktop/src/renderer/features/right-sidebar/registry.ts`; `apps/desktop/src/main/maker-host/plugins/plugin-registry.ts` | **C** — Panel registration, collision checks, hydration/disposal and project-over-global overrides. Unknown plugin enablement defaults open; do not copy that or silent essential-toggle refusal. No second database or settings authority. |
| [software/openchamber](https://github.com/openchamber/openchamber) · `896776d81e13` · MIT | `packages/web/server/lib/github/pr-status.js`; `packages/web/server/lib/github/routes.js` | **C** — PR ownership from repository/source/tracking/fork identity; serialized Git refresh/mutation. Revalidate exact repository and stale authorization cache behavior; do not import the entire server. |
| [software/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) · `ddefc45fbc7f` · MIT first-party | `packages/extensions/cordis-host-runner/src/lifecycle.ts`; `packages/extensions/cordis-host-runner/src/guard.ts` | **M** — Await activation, diagnose missing services and dispose failed scopes. Re-specify over Fleet authorities; no Cordis root. Its slots can shadow shipped UI, which Fleet must prevent; VM is not an OS sandbox. |

### Agent runtimes and configuration

| Checkout / reviewed SHA / license | Source path or symbol read | Reuse boundary |
|---|---|---|
| [software/AionCore](https://github.com/iOfficeAI/AionCore.git) · `d4ce55eb7606` · Apache-2.0 | `crates/aionui-session/src/backend/mod.rs#SessionBackend`; `crates/aionui-session/src/capability.rs` | **M** — Separate command receipt from observed Session event; unsupported capabilities and external permissions fail closed. Rust actors and pending-approval recovery are not a Fleet runtime replacement. |
| [software/AionUi](https://github.com/iOfficeAI/AionUi.git) · `6744099b279b` · Apache-2.0 | `packages/desktop/src/index.ts:1-95`; `packages/desktop/src/renderer/hooks/agent/useAcpConfigOptions.ts:60-110,345-415` | **C** — [Three traced flows](#aionui-and-aioncore): shared creation, configuration evidence and turn cancellation. `Observed` can be an optimistic host value; it does not universally prove CLI echo or preference persistence. |
| [software/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI.git) · `a5ab69521f7b` · MIT | `cmd/server/main.go:1-125`; `sdk/cliproxy/auth/selector.go:1-175,614-671` | **M** — Stable credential identity and retry metadata. Extract mechanisms into existing owners; the complete Go gateway is not selected. See [current audit](#cliproxyapi--provider-gateway-comparison). |
| [software/codex](https://github.com/openai/codex) · `ebc05da3bdb7` · Apache-2.0 | `codex-rs/cli/src/main.rs:1171-1235`; `codex-rs/core/src/agent/control.rs:1-205` | **M** — Shared delegation-root budget and permit release on drop. Rust runtime/store stays outside Fleet; cancellation and resumed-tree coverage are not proven here. |
| [software/grok-build](https://github.com/xai-org/grok-build.git) · `4247f6616893` · Apache-2.0; vendored notices separate | `crates/codegen/xai-grok-pager-bin/src/main.rs:2025-2088`; `crates/codegen/xai-grok-workspace/src/permission/gate_preflight.rs:1-205` | **M** — Deny outranks ask, ask outranks allow; explicit ask cannot be waived by classification. Do not adopt another policy authority. |
| [software/Qwen-MM-Plugins](https://github.com/QwenLM/Qwen-MM-Plugins.git) · `07736672525443c7f8a3f6405eed37d2236f023f` · Apache-2.0 root; optional and vendored dependencies separate | `src/capabilities/core/qwen_mm_plugins_core/readers/image.py`; `src/shared/native_mode.py`; `src/mcp_framework.py:190-240` | **M** — MCP image blocks serve image-capable main models; text-only mode calls a separately configured VL endpoint for captions. Adapt the media-result projection and evidence contract, not its global environment switch, hidden paid side call or separate plugin credential store. |
| [software/Qwen-Live-Harness](https://github.com/QwenLM/Qwen-Live-Harness.git) · `b6ce544ebbcd7417e37e0314ec946466c49c615c` · Apache-2.0 root | `packages/qwen-live-harness/src/realtime/{realtime-session,tool-confirmation}.ts`; `src/tools/{dispatcher,handles}.ts` | **M** — Realtime audio/video uses a region-bound DashScope API key, call epochs, tool receipts and uncertain-timeout handling; ACP delegates optional background work. Reuse a bounded realtime adapter/receipt pattern, not its second Session, memory or permission authority. |
| [software/pi-multimodal-proxy](https://github.com/pungggi/pi-multimodal-proxy.git) · `cdf53ccc21be534240e227a5fb85392cf42d774c` · MIT declared in package.json; no root LICENSE text | `extensions/vision-proxy.ts:1930-2525`; `extensions/internal.ts`; `package.json` | **M** — Provider-scoped image egress consent, turn caps, tool-result captions, durable Pi session entries and fail-closed media descriptions. It requires `pi-coding-agent` extension events/session/UI and needs Host context/UI/permission mapping even with the OV-069 SDK; borrow bounded mechanisms through Fleet's Session/permission/usage owners, not its second config/consent store. |
| [software/pi-claude-bridge](https://github.com/elidickinson/pi-claude-bridge.git) · `a78a2a5525e96318f8dba7f9fd32ce2191be0136` · MIT | `src/index.ts:580,750-853,1943-2007`; `src/mcp-server.ts:59-85`; `package.json` | **M** — A Pi provider calls Claude Agent SDK with `tools: []`, remaps Pi tools through an MCP server and reconstructs/resumes Claude JSONL. Its package requires `pi-coding-agent`/TUI peers and would add a second Session/permission bridge to Fleet's ZCode host. Use its abort/resume/tool-result tests as comparison, not a direct installed provider or OAuth shortcut; prefer a separately scoped official CLI/ACP executor when that work is authorized. |
| [software/pi-mono-latest](https://github.com/earendil-works/pi.git) · `2532a0bef7f72f45828f190b0be6c38227bbd34d` · MIT | `packages/durable/src/{session/transaction,harness/tool,harness/scheduler}.ts`; `packages/durable/test/harness-ownership.test.ts`; `packages/chord/src/facets/host.ts`; `packages/coding-agent/src/experimental/{client-tui,session-worker}.ts` | **M** — Atomic entries/tasks/documents, safe/unsafe tool replay, child ownership and cross-process facet lifecycle are a viable substrate for a Fleet-owned kernel. The API remains experimental and lacks Fleet permission, image reader and native page contract; an internal fork plus same-workflow acceptance is proposed, not a drop-in package or installed runtime. |
| [software/herdr](https://github.com/herdrdev/herdr.git) · `5a6491422336` · Apache-2.0 | `src/main.rs:504-568`; `src/api/event_hub.rs:1-127` | **M** — Bounded sequence-numbered event ring reports lost/unavailable resume ranges. Rust supervisor and persistence are separate from Fleet Session state. |
| [software/hermes-agent](https://github.com/NousResearch/hermes-agent) · `db1f3f4564eb` · MIT | `hermes_cli/main.py:1-60,3512-3552`; `agent/interrupt_scope.py:1-73` | **M** — [Three traced flows](#hermes): turn cleanup, final-argument authorization and evidence/curated-memory separation. Automatic approval paths exist; file locks do not establish a single consolidation writer. |
| [software/kimi-code](https://github.com/MoonshotAI/kimi-code.git) · `6a214b85e53e` · MIT | `apps/kimi-code/src/main.ts:1-65`; `packages/acp-server/src/approval.ts:1-163` | **C** — Pure ACP approval mapping rejects unknown responses and distinguishes session scope. Current checkout is TypeScript, not the older Python tree; no second approval store. |
| [software/Kun](https://github.com/KunAgent/Kun.git) · `e67f656bca57` · PolyForm Noncommercial | `src/main/index.ts:1-45`; `kun/src/server/approval-consent.ts:1-92` | **M** — Single-use consent token binds request, expiry and replay checks. Design evidence only under Fleet's license boundary; no code import. |
| [software/multica](https://github.com/multica-ai/multica.git) · `f41fae6b08fb` · Custom Part I + Apache-2.0 Part II | `server/cmd/server/main.go:1-60,308-340`; `server/internal/daemon/reconcile.go:1-129` | **M** — [Three traced flows](#multica): task triggering, cancellation acknowledgement and human environment audit. Custom license conditions apply; default auto-approval and dropped report batches are counter-evidence. |
| [software/omnigent](https://github.com/omnigent-ai/omnigent.git) · `6fdcd17044c2` · Apache-2.0 | `omnigent/__main__.py:1-6`; `omnigent/harness_capabilities.py:1-160` | **M** — Omit permissive override to preserve native harness consent; unresolved ask denies. Python harness and sandbox plumbing are mechanism evidence only. |
| [software/openclaw](https://github.com/openclaw/openclaw.git) · `f7dae76bee98` · MIT | `src/entry.ts:1-75`; `src/infra/exec-approvals-effective.ts:1-125,351-446` | **C** — Effective policy intersects security and ask requirements, retaining provenance. Map into Fleet's existing permission path; do not import the agent runtime. |
| [software/opencode](https://github.com/anomalyco/opencode.git) · `70a24697ea00` · MIT | `packages/opencode/src/index.ts:1-65`; `packages/opencode/src/session/retry.ts:1-209` | **C** — [Three traced flows](#opencode): current core input idempotence, deny precedence and successful-summary projection. Keep legacy CLI evidence separate; pending approvals are not durable. Earlier Retry-After edge case remains uncorrected. |
| [software/OpenHands](https://github.com/OpenHands/OpenHands) · `15e686078812` · MIT | `bin/agent-canvas.mjs:1-105,122-173`; `src/index.ts` | **M** — Current tree is Agent Canvas: distinguish unknown host capability from unsupported and cache by host version. Its lexical prerelease comparison is not complete SemVer, and absent tool lists default available rather than denying permission; older Python-runtime claims do not apply. |
| [software/orca](https://github.com/stablyai/orca.git) · `a91ca8b19e6b` · MIT | `src/main/index.ts:1-60`; `src/shared/usage-percentage-display.ts:1-36` | **C** — [Three traced flows](#orca): runtime-scoped accounts, mutation fencing, durable cursor recovery and file-save receipts. Model options apply next turn; local path checks are not a sandbox. Invalid usage data must not become zero. |
| [software/pi-mono](https://github.com/badlogic/pi-mono) · `c7cdb460aa8a` · MIT | `packages/coding-agent/src/cli.ts:1-6`; `packages/agent/src/harness/compaction/compaction.ts:310-437` | **C** — Compaction cut points avoid orphaned tool results. Preserve the existing provider/SDK seam; do not build a second Session/history store. |
| [software/waku](https://github.com/egoist/waku.git) · `1135692b2909` · GPL-3.0-only | `Cargo.toml:1-45`; `src/main.rs:1-11` | **M** — Driver control distinguishes steering from configuration requiring restart. Rust implementation and unbounded control payload queue are not import candidates. |
| [software/ZCode](https://github.com/zai-org/ZCode.git) · `872ad960de7e` · Apache-2.0 | `apps/zcode-cli/packages/cli/src/main.ts:1-85`; `apps/zcode-cli/packages/adapters/src/plugins/marketplace.ts:1106-1187` | **C** — Staged inventory install/recovery, scoped UI result guards and command reconciliation. [Three traced flows](#zcode) distinguish inventory from activation, acknowledgement from execution, and safe credential recovery from unsafe cipher fallback. No runtime/dependency import. |
| [software/cc-switch](https://github.com/farion1231/cc-switch.git) · `8272707d5e2a` · MIT | `src-tauri/src/main.rs:1-35`; `src/config/piThinkingProfiles.ts:1-175,307-356` | **C** — Reasoning mapping distinguishes absent, null, string and explicit provider defaults. The [quota review](#cockpit-tools-and-cc-switch-acquisition-to-display-review) also inspects native Rust adapters and shared cache publication. Proxy/account rewriting is not admitted; language alone is not an exclusion. |
| [software/cockpit-tools](https://github.com/jlcodes99/cockpit-tools.git) · `dbe56a1edd07` · CC-BY-NC-SA-4.0 in Cargo metadata; no root LICENSE | `src-tauri/Cargo.toml:1-40`; `src-tauri/src/main.rs:1-6` | **M** — Named credential IDs and reference checks before deletion; [quota review](#cockpit-tools-and-cc-switch-acquisition-to-display-review) adds bounded refresh scheduling and display counter-evidence. Restricted license declarations remain; no code import or vendor-account automation. |
| [software/dashi-taskboard](https://github.com/chuspeeism/dashi-taskboard.git) · `1528a8eb3146` · Apache-2.0 | `cli/taskctl.mjs:1-60`; `server/database.mjs:2053-2145,2840-2883` | **M** — Optimistic version check and SQL transaction bind local activity updates. External Jira action precedes the local transaction, so this is not cross-system atomicity; no second Task store. |
| [software/OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) · `796b8fc9086c` · Apache-2.0 | `components/execd/main.go:1-60`; `components/execd/pkg/isolation/isolator.go:1-160` | **X** — Linux bwrap probe/diagnostic vocabulary only. This control plane/runtime does not fill a current Fleet/macOS gap and cannot become a second OS sandbox. |
| [software/spec-kit](https://github.com/github/spec-kit) · `d4229c071c7e` · MIT | `src/specify_cli/__init__.py:1-60,602-617`; `scripts/python/check_prerequisites.py:205-276` | **M** — Read-only requirement-ID coverage and ambiguity checks. Keep existing canonical specs; do not import a multi-document planning or approval engine. |

### Production surfaces and layout

| Checkout / reviewed SHA / license | Source path or symbol read | Reuse boundary |
|---|---|---|
| [software/Cowart](https://github.com/zhongerxin/Cowart.git) · `43fc8882daf2` · MIT app; tldraw dependency separate | `src/canvasSnapshot.js#export function sanitizeCanvasSnapshotForTldraw`; `src/App.jsx#function applyRemoteCanvasSnapshot` | **M** — Snapshot sanitation explains rejected records; local-user and remote changes have different save origins. No native Office round-trip proof; do not import its telemetry or canvas store. |
| [software/genoffice](https://github.com/genspark-ai/genoffice.git) · `84d5b8fb9349` · Apache-2.0 core; ee/ Enterprise excluded | `packages/pptx-ops/src/ops/executor.ts#runTxn`; `packages/xlsx-gateway/src/gateway/xlsx-package-io.ts#saveWorkbookViaSidecar` | **C** — PPTX transaction prevalidation/dry-run/undo and XLSX saves retaining untouched archive entries share real UI/agent callers. Seeded parts escape complete rollback; locked-file fallback is not universally atomic. Rust sidecar is mechanism evidence; no blanket Office-fidelity claim. |
| [software/html-anything](https://github.com/nexu-io/html-anything.git) · `553ed98c283f` · Apache-2.0 | `next/src/lib/export/markdown-roundtrip.ts#export function htmlToMarkdown`; `next/src/lib/history/db.ts#export async function putRun` | **C** — Bounded HTML extraction and IndexedDB version transaction helpers. Conversion is lossy; no native editor or second history authority. Do not copy same-origin script preview or CDN injection. |
| [software/open-design](https://github.com/nexu-io/open-design.git) · `894d55466b4a` · Apache-2.0 inspected code; templates vary | `apps/daemon/src/figma/figma-import.ts#export async function importFigmaFromBytes`; `apps/daemon/src/collab/workspace-resource-mutation.ts#function verifyWorkspaceRequestAuthorityForRequest` | **C** — [Three traced flows](#open-design): HTML edits/version provenance, restore and local authority. Shared storage is not a universal command; parent lineage is not atomic CAS; manual save drops a partial-success warning. No native FIG save claim. |
| [software/openpencil](https://github.com/ZSeven-W/openpencil.git) · `4fbe3a42899f` · MIT inspected Rust; vendor/prebuilt closure missing | `crates/op-figma/src/lib.rs#parse_fig_binary_with_images`; `crates/op-editor-core/src/edit_transaction.rs#rollback_local_edit` | **M** — [Three traced flows](#openpencil): shared EditorState, immutable save/acknowledgement and conflict recovery. Active collaboration rejects AI/MCP writes. Required submodules/prebuilt boundaries prevent drop-in admission. |
| [software/penpot](https://github.com/penpot/penpot) · `56bf0e3ebb1f` · MPL-2.0 | `frontend/src/app/main/data/workspace/undo.cljs#(defn start-undo-transaction`; `common/src/app/common/files/changes.cljc#(defn process-changes` | **M** — Undo transaction attribution and validated change interpreter. Clojure editor/runtime stays separate; source use would need its own license and integration decision. |
| [software/tldraw](https://github.com/tldraw/tldraw) · `2e0a94b508ac` · MIT store leaf; SDK has custom production license | `packages/store/src/lib/Store.ts#mergeRemoteChanges`; `templates/agent/client/agent/managers/AgentUserActionTracker.ts#startRecording` | **C/M** — MIT store has origin-scoped listeners, atomic remote changes and disposal; agent template captures human edit deltas. Leaf license does not cover the editor SDK or its telemetry. |
| [software/OpenChatCut](https://github.com/0xsline/OpenChatCut.git) · `45aa51df304e` · AGPL-3.0 | `src/editor/reducerHistory.ts#export function historyReduce`; `src/editor/storeCommands.ts#batch: (actions:` | **M** — [Three traced flows](#openchatcut): shared operations/drafts, preserved unreadable projects and actual export/delivery recovery. Current saves omit version comparison. AGPL mechanism reference; no direct code admission or second job authority. |
| [software/OpenMontage](https://github.com/calesthio/OpenMontage.git) · `08e2151fa02d` · AGPL-3.0 | `tools/publishers/export_bundle.py#class ExportBundle`; `lib/checkpoint.py#class CheckpointValidationError` | **M** — Offline deliverable manifest and stage-artifact checkpoint validation. Python/AGPL mechanisms only; exporting a bundle does not mean publishing it. |
| [software/opencut](https://github.com/OpenCut-app/OpenCut) · `400f097becba` · MIT | `apps/desktop/src/panels/timeline.rs#impl Render for Timeline`; `apps/desktop/src/shell.rs#pub(crate) fn new` | **X** — Current GPUI Rust timeline renders a placeholder. Stable panel entities are not a working media editor/exporter; inspect opencut-classic for those mechanisms. |
| [software/opencut-classic](https://github.com/opencut-app/opencut-classic) · `cf5e79e91914` · MIT | `apps/web/src/core/managers/commands.ts#CommandManager`; `apps/web/src/services/renderer/scene-exporter.ts#SceneExporter` | **C** — Command/selection-aware undo, track snapshots and frame-time export with cancellation. Integrate into one Fleet editor/job path; no blanket codec/fidelity acceptance. |
| [software/openreel-video](https://github.com/Augani/openreel-video.git) · `5f3c85e5fc22` · MIT source; FFmpeg/package terms separate | `apps/desktop/src/main/sidecar/export-job.ts#ExportJob.writeFrame`; `packages/core/src/playback/master-timeline-clock.ts#MasterTimelineClock` | **C** — Frame-write backpressure, process-error cleanup and AudioContext timeline clock. No new job authority; bundled codecs/binaries require separate validation. |
| [software/palmier-pro](https://github.com/palmier-io/palmier-pro.git) · `b4b1333f9404` · GPL-3.0 source; post-v0.7.6 binaries proprietary | `Sources/PalmierPro/Editor/EditorUndo.swift#func perform<T>`; `Sources/PalmierPro/Editor/RippleEngine.swift#static func computeRippleShiftsForRanges` | **M** — Lazy Swift undo groups and pure ripple range calculation. Mechanisms only; source license does not grant binary redistribution, and platform constraints remain. |
| [plugins/dockview](https://github.com/mathuo/dockview) · `3b519454178f` · MIT core/react; Enterprise commercial | `packages/dockview-core/src/dockview/dockviewComponent.ts#fromJSON`; `packages/dockview-react/src/dockview/dockview.tsx#DockviewReact` | **C** — Validate restored layout before clearing; dispose pending popouts, panels and React subscriptions. Candidate comparison only: DOM popouts do not prove Electron BrowserPane/native-window support. |
| [plugins/react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) · `a2796d7acac1` · MIT | `lib/global/utils/validatePanelGroupLayout.ts#export function validatePanelGroupLayout`; `lib/components/group/Group.tsx#const onLayoutChangeStable` | **C** — Redistribute constrained sizes and distinguish continuous/completed layout callbacks. Current Group/Panel API; resizing alone is not docking or a library selection. |
| [plugins/react-rnd](https://github.com/bokuweb/react-rnd) · `fec7303134ab` · MIT | `src/index.tsx#export class Rnd` | **C** — Controlled drag/resize with scale-aware bounds and stop callbacks. Floating geometry only; docking and keyboard accessibility are not established. |
| [plugins/xyflow](https://github.com/xyflow/xyflow) · `0a1f9575b256` · MIT | `packages/react/src/utils/changes.ts#function applyChanges`; `packages/react/src/container/NodeRenderer/useResizeObserver.ts#export function useResizeObserver` | **C** — Immutable ID-keyed node/edge change application and resize-observer cleanup. Graph view only, not a production-media engine or workflow executor. |
| [plugins/hyperframes](https://github.com/heygen-com/hyperframes.git) · `952e9228b5cd` · Apache-2.0 | `packages/producer/src/services/render/artifactTransaction.ts#ArtifactTransaction`; `packages/player/src/direct-timeline-clock.ts#DirectTimelineClock` | **C** — Stage, validate, back up and commit/rollback render artifacts; cancel timeline rAF cleanly. Preserve 35 existing fixture modifications; Puppeteer/FFmpeg resources and telemetry are not admitted. |
| [plugins/markitdown](https://github.com/microsoft/markitdown) · `945314a45ddb` · MIT | `packages/markitdown/src/markitdown/_markitdown.py#def _convert(`; `packages/markitdown/pyproject.toml#[project.optional-dependencies]` | **M** — Converter dispatch restores stream position and classifies unsupported/failed conversion. Python ingestion reference only; no editable Office fidelity or automatic optional-provider installation. |

### Browser, context and engineering utilities

| Checkout / reviewed SHA / license | Source path or symbol read | Reuse boundary |
|---|---|---|
| [software/browser-harness](https://github.com/browser-use/browser-harness.git) · `afbcc381b963` · MIT | `src/browser_harness/_ipc.py:connect/request/serve/cleanup_endpoint`; `src/browser_harness/daemon.py:get_ws_url/handle` | **M** — Private local IPC, authenticated Windows loopback and explicit permission-blocked browser discovery. Python mechanism only; CDP execution and platform lifecycle remain partly unread. |
| [software/browser-use](https://github.com/browser-use/browser-use) · `d8110c5ff87c` · MIT | `browser_use/browser/watchdogs/security_watchdog.py:SecurityWatchdog/on_NavigateToUrlEvent/on_NavigationCompleteEvent/on_TabCreatedEvent/_is_ip_address/_is_url_allowed` | **M** — Normalize URL/IP policy and handle redirect-created tabs. Python browser guard is not a network sandbox or complete navigation proof. |
| [software/flowgram.ai](https://github.com/bytedance/flowgram.ai) · `ba1a9630f802` · MIT | `packages/common/history/src/history/history-manager.ts:HistoryManager/registerHistoryService/_handleMerge/dispose`; `packages/client/fixed-layout-editor/__tests__/services/history-operation-service/transact.test.ts` | **M** — Group editor undo and dispose document-scoped history. Container-coupled models are not small extractable types; no workflow executor admission. |
| [software/mcp-registry](https://github.com/modelcontextprotocol/registry) · `d1dcaf3fb363` · MIT/Apache-2.0 transition; docs CC-BY-4.0 | `internal/api/handlers/v0/publish.go:RegisterPublishEndpoint`; `internal/service/registry_service.go:CreateServer/createServerInTransaction/recalculateLatest` | **M** — Authenticated publisher namespace and per-name transactional version update. Go registry evidence only; no requirement for a Fleet-hosted registry. |
| [plugins/GPTCache](https://github.com/zilliztech/GPTCache.git) · `c59fb3a6152a` · MIT | `gptcache/adapter/adapter.py:adapt`; `gptcache/core.py` | **M** — Measure semantic cache-hit thresholds. Similarity does not prove permission, freshness or safety for effectful turns; no transparent agent-turn cache. |
| [plugins/LLMLingua](https://github.com/microsoft/LLMLingua.git) · `5a4c78ae18ab` · MIT | `llmlingua/prompt_compressor.py:PromptCompressor/compress_prompt_llmlingua2/get_token_length` | **M** — Evaluate lossy compression with protected spans and retained originals. Python/model runtime is not a default dependency; hardcoded cost estimates and semantic equivalence are unverified. |
| [plugins/SuperClaude_Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework.git) · `2d0fda08f2ee` · MIT | `src/superclaude/execution/self_correction.py:SelfCorrectionEngine/detect_failure/analyze_root_cause/_categorize_failure/FailureEntry.from_dict` | **M** — Explicit failure evidence and regression heuristics. Python framework does not become Fleet execution or memory authority. |
| [plugins/agentmemory](https://github.com/jayzeng/agentmemory.git) · `b7029ee2141d` · MIT | `src/core.ts:redactSecrets/filterMemoryForContext/formatStoredEntry`; `src/mcp-server.ts:memoryContextTool` | **M** — Trust/lifecycle/expiry filtering at entry boundaries and shared CLI/MCP core. Regex redaction is partial and read-modify-write atomicity is unproven; no imported curated truth. |
| [plugins/agentskills](https://github.com/agentskills/agentskills) · `69ef37e9424c` · Apache-2.0 code; CC-BY-4.0 docs | `skills-ref/src/skills_ref/parser.py:find_skill_md/parse_frontmatter/read_properties`; `skills-ref/src/skills_ref/validator.py:ALLOWED_FIELDS/_validate_name/_validate_metadata_fields/validate_metadata` | **M** — Python frontmatter/name validation and fixtures inform Fleet's existing parser. Strict field allowlist must preserve accepted vendor fields; allowed tools never grant permission. |
| [plugins/caveman](https://github.com/JuliusBrussee/caveman.git) · `ae26f3a47755` · MIT adoption surface; BSL engine | `src/mcp-servers/caveman-shrink/compress.js:withProtectedSegments/PROTECTED_PATTERNS`; `LICENSING.md:per-directory scope` | **M** — Protected-span corruption regressions and evaluation design. Do not mistake adoption-layer MIT for compressor-engine permission. |
| [plugins/claude-mem](https://github.com/thedotmack/claude-mem.git) · `4e98d977cc6d` · Apache-2.0 current checkout | `src/services/worker/SessionMessageBuffer.ts:SessionMessageBuffer/enqueue/confirm/resetClaimed/clear`; `src/services/worker/SessionManager.ts:getMessageIterator/confirmClaimedMessages` | **M** — Per-session claim/confirm/reset working buffer. Current buffer is RAM, not the former SQLite/BullMQ queue; transcript replay is not verified, and missing privacy rows must not grant ingestion. |
| [plugins/claude-task-master](https://github.com/eyaltoledano/claude-task-master.git) · `c0c98d367c55` · MIT + Commons Clause | `packages/tm-core/src/modules/storage/adapters/file-storage/file-operations.ts:FileOperations/writeJson/modifyJson`; `scripts/modules/dependency-manager.js:addDependency/isCircularDependency` | **M** — Read-modify-write lock, atomic file replacement and cycle checks. Not plain MIT; no second task database or imported workflow authority. |
| [plugins/claude-token-efficient](https://github.com/drona23/claude-token-efficient.git) · `0d30a6db75af` · MIT | `benchmark/run.py:_invoke/run_one`; `benchmark/eval.py:markers/judge` | **M** — Controlled baseline/treatment prompt measurement. Benchmark scripts are not a runtime optimizer; no login, paid judge or benchmark was executed. |
| [plugins/claw-compactor](https://github.com/open-compress/claw-compactor.git) · `c1b936d40b11` · MIT | `scripts/lib/rewind/store.py:RewindStore/store/retrieve/search`; `scripts/lib/rewind/retriever.py:rewind_tool_def/handle_rewind` | **M** — Hash-indexed original retrieval with bounded LRU and monotonic expiry. Python RAM helper is not durable memory; Fleet must supply scope and permission boundaries. |
| [plugins/context7](https://github.com/upstash/context7.git) · `eb27b949fbc9` · MIT | `packages/sdk/src/client.ts:Context7/searchLibrary/getContext`; `packages/sdk/src/http/index.ts:HttpClient/fetchWithRetry/headersForToken` | **C** — Abort-aware GET retry, rate-limit metadata and typed failures. Compare existing Source HTTP client; service SDK is not an offline documentation backend. |
| [plugins/letta](https://github.com/letta-ai/letta.git) · `5bcdd177d70f` · Apache-2.0 metadata; runtime absent | `README.md` | **X** — Current HEAD has 12 documentation/policy/workflow files and points to letta-code. No current runtime mechanism was available to review; old runtime conclusions cannot be reused at this SHA. |
| [plugins/mem0](https://github.com/mem0ai/mem0) · `a39a802bbc93` · Apache-2.0 | `mem0/memory/main.py:_build_filters_and_metadata/Memory.add/_add_to_vector_store/_create_memory/_update_memory`; `mem0/memory/storage.py:add_history` | **M** — Scope-key anti-smuggling and immutable identity metadata. Vector mutation then SQLite history is not one atomic transaction; Python memory writer is not imported. |
| [plugins/planning-with-files](https://github.com/lincolnwan/Planning-with-files-copilot-agent.git) · `2bcc24bcc836` · README claims MIT; no LICENSE file | `copilot/.github/agents/planning-with-files.agent.md` | **X** — Current tree contains eight Markdown files. Durable evidence is a useful principle, but no executable mechanism; three-file planning and phase approval conflict with this repository's document contract. |
| [plugins/playwright-mcp](https://github.com/microsoft/playwright-mcp) · `f1257a5a67af` · Apache-2.0 | `index.js:createConnection export`; `cli.js:tools.decorateMCPCommand/libCli.decorateProgram` | **M** — Thin MCP wrapper and browser capability fixtures. Actual runtime is delegated to pinned playwright-core and was not inspected here; test-only unsafe tools are not permission grants. |
| [plugins/repomix](https://github.com/yamadashy/repomix) · `5edcc6dec613` · MIT | `src/cli/prompts/remoteConfigTrustStore.ts:sha256/isDirSafe/isStoreDirSafe/isRemoteConfigTrusted/markRemoteConfigTrusted` | **C** — Content-bound local consent cache and hostile temporary-directory checks. Digest omits sibling imports/processors; not a complete dependency trust or permission engine. |

### Selection against actual gaps

Owner clarification, 2026-09-21: absorb a reference only where it does the job better, in frontend
and backend work alike. A source review does not create a need or require an extraction. Compare the
same task against current Fleet/Craft, a small local correction and the owning software's existing
API/editor. Frontend evidence covers the real interaction, error/recovery states and native artifacts;
backend evidence covers actual admission, persistence, concurrency, cancellation and recovery.
Performance/resource claims need measurement, not code size or a demo. Include dependencies,
maintenance and migration cost. A win in one layer never admits the other layer automatically.

| Current need / inspected Fleet path | Comparison outcome | Execution anchor |
|---|---|---|
| Corrupt/unreadable credentials: `app/packages/shared/src/credentials/backends/secure-storage.ts:199` treats read failure as absence and deletes corrupt files | ZCode's preserve-and-report behavior is better on this specific failure. Correct the existing store; importing its credential system or cipher adds no demonstrated benefit. | Existing R0-C2 preservation criterion |
| Reconnect: `app/packages/server-core/src/transport/server.ts:476` replays retained sequence events; renderer `app/apps/electron/src/renderer/App.tsx:1093` refreshes after stale reconnect | Keep this existing path. Orca/OpenCode do not justify a new event store. Stable input identity after a lost acknowledgement is a separate, unverified gap requiring a same-task reproduction before changing admission. | R0 retained Session review |
| Cancel: renderer `app/apps/electron/src/renderer/event-processor/handlers/session.ts:339` clears busy state on interruption; backend termination has separate cleanup | Compare request, acknowledgement and actual termination against Orca. A narrow mismatch is worth verifying; there is no justification for another cancellation system or transplanted chat UI. | R0 retained Session review |
| Component/layout and domain editing | Source traces identify alternatives, not winners. Prove the concrete host/editor task and inspect native software facilities before selecting dependencies; the online comparison below does not authorize a replacement shell or editor. | Existing R18/domain contracts after baseline exit |

These are decisions about the scope of comparison, not another roadmap. Use
[`TODO.md`](../TODO.md#slice-procedure) for execution order. Keeping the current implementation, making a
smaller local fix, or declining an unnecessary wrapper are successful comparison outcomes. No new
runtime or editor dependency has passed a frontend/backend integration comparison in this review.

### Browser and interface development comparison

Checked 2026-09-21 against the current app, both Craft pins and the immutable sources below.
Local references were not changed. Online-only sources were read at fixed commits in temporary
storage, not added to the retained checkout set or installed. These are bounded source reviews,
not end-to-end product trials or dependency admissions. [SYS-04](modules/browser.md)
owns the recommended behavior and acceptance; the seven-field promotion gate still applies.

| Candidate / source lock / license | Inspected mechanism and counter-evidence | Recommendation against Fleet's current path |
|---|---|---|
| Craft v0.13.4 `b2d6c8aabdfdc96416eea9debd6756ae6d3c0db9`; Apache-2.0; retained `software/craft-agents-oss` | `apps/electron/src/main/{browser-pane-manager,browser-cdp}.ts`, renderer `BrowserToolbar`/`BrowserEmptyStateCard`, `packages/shared/src/agent/browser-tools.ts`; look pin v0.10.5 compared separately. Current app has native auxiliary windows and CDP actions, not integrated tabs, durable history or immediate user takeover. | **REUSE/EXTEND.** Keep the one manager. Installed Electron **39.2.7** types and [native API](https://www.electronjs.org/docs/latest/api/web-contents#contentsenabledeviceemulationparameters) already supply capture/inspection/device emulation. Native correction is the first alternative to a new runtime. |
| Cindy `00a5ad1a503c1082a5c86d296a6e67c3344aa575`; Apache-2.0; retained `software/cindy` | `apps/desktop/src/renderer/features/right-sidebar/lib/browserWebviewPool.ts:evictLRU`; `apps/desktop/src/main/rsb-browser-bridge/{registry,ipc}.ts`; `apps/desktop/src/preload/browserCommentPreload.ts:prepareScreenshot/commitPending/cancelPending`; `apps/desktop/src/main/mcp-integrations/browser-backend/rsb-webview-upload-policy.ts:resolveUploadFiles`. Early failure listeners, stale-release guards, pending annotation acknowledgements and realpath upload confinement. Pool capacity still wins over busy pins when all entries are pinned. | Primary lifecycle/annotation mechanism candidate. Adapt invariants to Craft's native views; do not replace them with a DOM webview pool. Upload path checks supplement, never replace, effect authorization; a filename denylist is not complete secret detection. |
| OpenChamber `896776d81e13c061b724be98c32b2df17e030806`; MIT; retained `software/openchamber` | `packages/ui/src/components/browser/BrowserPane.tsx`; `packages/ui/src/lib/browser/{viewport,history,annotationSession,controlClient}.ts`; `packages/ui/src/stores/useBrowserHistoryStore.ts`; `packages/ui/src/components/browser/useAnnotationAttach.ts`; `packages/web/server/lib/browser-control/{broker,provider}.js`. Real CSS viewport plus display scale, capture-to-draft flow and claim-before-execute. History is 50 deduplicated addresses per project/runtime, not visits or downloads. Broker abort settles the server request; the client `run` has no abort signal. Provider user-control lease is on the extension-provider path. | Primary browser UX/hand-off candidate. Keep a smaller local manager correction for single-client execution; do not transplant its SSE broker. Validate navigation/Session races and human takeover separately. Its viewport does not by itself emulate touch/UA/DPR. |
| [Min](https://github.com/minbrowser/min/tree/c92079cde045c38ab844e53501e9c5178d503a45) · Apache-2.0 (`LICENSE.txt`); online only | `js/places/{places,placesService,fullTextSearch}.js` indexes visited URLs/titles and optional text, excludes private pages and supports deletion; `main/download.js` + `js/downloadManager.js` keep live download maps and remove completed items. | Conditional history/search comparison if recent-address suggestions are insufficient. Its download bar does not solve persistent download history. Do not copy its full-text retention, tab/task system, header-rewriting exceptions or browser shell. |
| [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp/tree/d5b4daf511731bacd5e1d1c45254e7fced2c9a34) · Apache-2.0 (`LICENSE`); online only | `src/tools/emulation.ts:emulate`, `src/tools/pages.ts`, `tests/tools/emulation.test.ts`; viewport dimensions/DPR/mobile/touch/UA are distinct tool inputs. | Compare parameter/reset semantics, then implement through existing Electron/CDP. Adding an MCP process solely for emulation has no established benefit. |
| [agent-browser](https://github.com/vercel-labs/agent-browser/tree/b0f3962a131292805fe7c4e276e4bf7a50a4e876) · Apache-2.0 (`LICENSE`); online only | Current runtime is Rust: `cli/src/native/{actions,policy,tab_binding,browser}.rs`. Strict pinned-target recovery and sanitized persisted URLs avoid adopting another tab. `ActionPolicy::load_if_exists` discards load errors; the action path ignores reload errors. An empty allow-list plus default deny does not establish unconditional denial in the inspected checker. | Take target/freshness test ideas into Craft; **do not adopt its policy as Fleet's enforcement boundary**. Current source, not older Node/Playwright descriptions, controls this assessment. No daemon dependency is selected. |
| Browser Use `d8110c5ff87ccba887aaa726cdb780f2f84bef8d` (MIT), Browser Harness `afbcc381b963040c19627d788e40c7e7663171ee` (MIT), Playwright MCP `f1257a5a67aff872f947fae274759f7d54853862` (Apache-2.0); retained | Browser Use `browser_use/browser/watchdogs/security_watchdog.py` checks explicit navigation before dispatch but redirected/new-tab targets after events. Harness `src/browser_harness/{_ipc,daemon}.py` separates local IPC from CDP. Playwright MCP `index.js`/`cli.js` delegate to playwright-core `1.64.0-alpha-1789764292000`; that runtime was not audited. | Optional executor/failure-fixture references. None supplies the missing Fleet human annotation/history/control-ownership surface, and none justifies replacing the working native browser. |
| [BrowserOS](https://github.com/browseros-ai/BrowserOS/tree/510126b9d381a9032d76798ffdc24b999893daa9) · AGPL-3.0 (`LICENSE`); online only | `packages/browseros-agent/packages/browser-mcp/src/tools/history.ts` calls `History.getRecent`; `packages/browseros/chromium_patches/chrome/browser/devtools/protocol/history_handler.cc` implements the added Chromium domain. | Whole-fork route not selected. Its history tool requires its modified browser, not vanilla Electron/CDP. License/distribution and Chromium maintenance are separate admission questions. |
| [Nanobrowser](https://github.com/nanobrowser/nanobrowser/tree/24a14b76e14a9c30fd84878ca7985049d1e7d064) · Apache-2.0 (`LICENSE`); online only | `chrome-extension/src/background/agent/executor.ts` owns planner/navigator loops and checks pause around awaited navigation. That file alone does not prove cancellation inside a dispatched action; it also invokes analytics. | Extension-agent behavior comparison only. A second planner/runtime/history/telemetry stack does not close Fleet's existing manager gaps. |
| [React Grab](https://github.com/aidenybai/react-grab/tree/ea4bbec9e80f4802e8ae19ad18431edb9ddbb670) · MIT (`LICENSE`); online only | `packages/react-grab/src/core/context.ts` uses Bippy source/owner stacks, bounded source fetching, Fiber revision checks and list-item identity; `utils/create-component-name-for-element.ts` discards stale async resolution. | Source-location candidate for permitted development renderers. Compare a small build-time source hint before importing its Solid overlay/Bippy dependencies. Missing instrumentation/maps or a changed React version remains an explicit limitation. |
| [Agentation](https://github.com/benjitaylor/agentation/tree/687e0a73c02318610bffa650f97191d5b86614c8) · **PolyForm Shield**, root and package `LICENSE`; online only | `package/src/utils/{source-location,element-identification}.ts` identifies elements and attempts development Fiber source lookup. The checked license restricts competing uses. | Product-behavior comparison only; do not describe it as an unrestricted open-source dependency or import its code without resolving the distribution boundary. Cindy/OpenChamber plus a small native annotation adapter are the closer permissive alternatives. |

### Codex, Claude and Cursor product evidence

Additional browser-host source comparison for OV-076 uses disposable clones under
`.fleet/reviews/browser-study`; retained reference pins are unchanged:

| Source lock / license | Inspected implementation | Integration conclusion |
|---|---|---|
| Installed Codex desktop `26.928.31416` / build `12553`; `.vite/build/main-BbeJ4AAR.js` SHA-256 `1ff5a43bde26ea6c1b77dbcf782625c890e35a836d489163c19d5ba9942d68b4` | Local `app.asar` inspection: managed webview mount/adoption, a browser-native session mode, extension action/profile APIs, and scoped native-pipe Browser Use dispatch. Renderer `webview-89e4050745ef.js` SHA-256 `c91b29f09fcd8fc8163f99785920135bb6fedc84ae61e053356bd429a15ea62d`; inspection copies stay ignored. | Architecture evidence, not an admitted source dependency. [Exact trace and limits](modules/browser.md#installed-codex-desktop-comparison) distinguish custom Electron APIs, built-in browser extensions and the external Chrome connector. Native C++ source and arbitrary-extension execution are not established. |
| [electron-browser-shell](https://github.com/samuelmaddock/electron-browser-shell/tree/354b0b8192e8c2d960e50cf108b5dbbb70448fec) | `packages/electron-chrome-extensions/src/browser/{index,api/tabs,api/browser-action,api/context-menus,api/runtime}.ts` implements missing host APIs and native messaging. That bridge is GPL-3.0/separately licensed; `electron-chrome-web-store` is MIT. Its `installer.ts` parses IDs/key proofs then extracts the ZIP; inspected code did not show complete CRX signature verification. | Reference, not an admitted dependency. Tab/window creation must use Fleet's current browser owner; native messaging cannot inherit the app bridge. Store download is insufficient evidence of package integrity or actual compatibility. |
| [BrowserOS](https://github.com/browseros-ai/BrowserOS/tree/53c3799ce014e9fee05569802314a05d0bad3e40) · AGPL-3.0 | `packages/browseros/chromium_patches/chrome/browser/importer/{profile_writer,importer_list,in_process_importer_bridge}.cc` wires Chrome extension import through native ExtensionService/Registry and an active Chromium WebContents; `extensions/browser/crx_installer.cc` changes install task priority. ProfileWriter's helper uses a silent Store installer. | Native full-browser source comparison, not a drop-in Electron extension host. Separate distribution, profile, updater and control boundaries require explicit admission. Fleet must retain manifest/permission review instead of copying silent import. |

The actual installed Electron 41.0.3/Chromium 146 guest fixture and its API limits are owned by
[Browser](modules/browser.md#chrome-extension-compatibility). These temporary code locks supersede
neither retained pins nor the above historical source observations.

Official pages checked 2026-09-21. They describe supported behavior, not publicly inspectable
desktop internals; neither CLI source nor a published tool interface proves the closed UI's backend.

| Product | Relevant observed documentation | Fleet recommendation |
|---|---|---|
| [Codex browser](https://learn.chatgpt.com/docs/browser) | Shared preview, element/area comments, reversible style feedback, separate browser profile/history, site permissions and separately gated developer access. | Use comment → draft → source change → visual review as the annotation loop. Preserve target/profile identity; full CDP access is not an ordinary site grant. |
| [Codex Computer Use](https://learn.chatgpt.com/docs/computer-use) | An optional plugin; OS capture/accessibility permissions are distinct from per-app approval. macOS supports scoped background work; Windows uses foreground input. | Separate app target and control mode from browser tools, and retain user takeover. Its lock-screen and closed helper implementation are not proposed Fleet dependencies. |
| [Claude Desktop](https://code.claude.com/docs/en/desktop) and [Cowork Computer Use](https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork) | Development preview/element targeting/verification, per-Session context versus shared plan usage; app-specific consent and preference for faster structured integrations. Cowork documents background windows on supported macOS and distinguishes full-screen control. | Reuse an existing integration before GUI input; show target/control state and different quota scopes. No claim that Claude's private helper can be embedded or is open source. |
| [Cursor Design Mode](https://cursor.com/docs/agent/design-mode) | Multi-element selection combines DOM/component/style information with a frozen viewport image; feedback leads to code edits and hot reload. | Combine semantic identity with visual evidence, retaining one current task. Do not copy its parallel-agent behavior, assume production source maps, or infer general desktop control from this web-specific feature. |

### Local-app control comparison

**Later phone-connector scope (owner, 2026-09-22).** Desktop Fleet targets Windows/macOS/Linux;
a later Orca-like phone connector extends R14/EXEC-09. Bounded current Orca observation at
`5064469687b59ca5203276ee52db6ce38cac877a`: `src/preload/api/mobile-api.ts` declares pairing QR/URL,
device/runtime-grant revocation, direct endpoint and relay state;
`docs/reference/remote-wire-compatibility.md` documents capability negotiation and both directions
of host/client version skew. These paths justify the next pairing/revocation/protocol comparison,
not a completed implementation or network-security audit. The relay path means Orca is not evidence
that arbitrary networks work through infrastructure-free direct connection. Mobile framework,
push and transport admission remain unresolved under SYS-02; no external checkout was changed.

These answer the owner's specified-local-app development/office task. The proposed Component and
scope gate live in [SYS-02](modules/remote.md#local-app-computer-use-contract).
No helper was installed/launched and no user's app was controlled for this review.

| Candidate / lock / license | Source evidence | Selection limit |
|---|---|---|
| Orca `a91ca8b19e6b48b88f49c9bcf7e5941aedd2a1df`; MIT; retained `software/orca` | `src/main/computer/{computer-provider-lifecycle,desktop-script-request-queue,macos-native-provider-socket}.ts`; `native/computer-use-macos/Sources/OrcaComputerUseMacOSCore/{AgentSessionOwnership,KeyboardInputSafety,ComputerSnapshotCachePolicy}.swift`; adjacent queue/lifecycle/ownership tests. Native helper lifetime, authenticated connection ownership, bounded queue and focus checks. | Closest Electron/native-provider integration candidate. Queue expiry prevents later dispatch; it does not prove cancellation of an in-flight native effect. Two-minute cache retention is not proof that a target is still fresh. No wholesale port or cross-platform background guarantee. |
| [Peekaboo](https://github.com/openclaw/Peekaboo/tree/94c00517565aa9a9fffb113cc67651a266630b9b) · MIT (`LICENSE`); online only; steipete URL redirects to openclaw | `Core/PeekabooAutomationKit/Sources/PeekabooAutomationKit/Services/Observation/ObservationTargetResolver+WindowSelection.swift`; `Apps/CLI/Sources/PeekabooCLI/Commands/Shared/SnapshotMutationCoordinator.swift` and `Apps/CLI/Tests/CLIAutomationTests/SnapshotMutationCoordinatorTargetTests.swift`. Exact window/process-start identity, ambiguous-target refusal and mutation receipts preserving uncertain delivery. | Stronger bounded target/freshness/retry comparison. Missing snapshot ID bypasses that coordinator's lease, so Fleet's adapter must require observation for observed-element actions. External CLI reuse versus leaf extraction still needs signing/startup/size and same-app tests; do not import its agent runtime. |
| [UI-TARS Desktop](https://github.com/bytedance/UI-TARS-desktop/tree/c2ad42e3eb9b27830db41a3e6f51ca7179d9b168) · Apache-2.0 (`LICENSE`); online only | `multimodal/gui-agent/shared/src/base/operator.ts`, `agent-sdk/src/GUIAgent.ts`, `apps/ui-tars/src/main/agent/operator.ts`: screenshot/action operator abstraction and coordinate normalization; desktop operator uses native input/clipboard. | Useful executor interface comparison. Its inspected operator signature has no explicit cancellation signal; surrounding agent pause does not prove input interruption. Adding its GUI agent loop would duplicate Fleet's runtime. Native input dependency licenses/binaries require separate review. |
| [Cua](https://github.com/trycua/cua/tree/9bbfa7dd3e27ca7f1861ede70aaca390174493f9) · root MIT (`LICENSE.md`); online only | `libs/python/computer/computer/{computer.py,interface/base.py}` separates computer interface and VM providers, with an explicit host-server option; tracing/telemetry wrappers are also present. Review limited to this Python path, not the entire Rust driver/VM stack. | A VM-oriented alternative if isolation later becomes a requirement. Not a prerequisite for specified local apps; no VM service, cloud account or telemetry admission. Subpackage/binary licenses remain unreviewed. |

### Model access and catalog source comparison

#### Active ordinary-API contract comparison

Source intake preserves ZCode `29628c9`, OpenCode `f66b86ce` and Cindy `a46bb58f`. New immutable
copies are OpenCode v2.0.22 `527f0b931d1f9b3ebd34e106c51b31ce5db5b075`
(`software/intake/opencode-2.0.22-api-review`) and Cindy `79450f8f3f676690a4397102807e96c5d7f77a8d`
(`software/intake/cindy-api-79450f8-review`). OpenCode's complete provider→route/auth→protocol/frame→
runner/message→replay chain is the comparison; neither its Effect runtime nor its store is imported.
Cindy's `provider-model-fetch.ts` separates catalogue auth/URL from inference, and its native Google
metadata path supplies same-origin enrichment. All data remains in the original candidate Provider
record; explicit API capability corrections, disabled state and order retain their existing writers.

| Platform/contract | Inspected producer and consumers; candidate correction | Proof boundary |
|---|---|---|
| OpenRouter | [key-filtered directory](https://openrouter.ai/docs/api/api-reference/models/list-models-filtered-by-user-provider-preferences-privacy-settings-and-guardrails) uses Bearer and `models/user?output_modalities=all`, independent of Messages headers. [Reasoning declarations](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens) supply accepted/default efforts and mandatory reasoning; `default_enabled:false` preserves Auto without enabling an effort. Scoped membership excludes static template seeds in the resolver and writer; malformed IDs reject the whole result while explicit manual IDs survive. Factory→parser→Host reasoning part→SQLite→same-origin/model replay preserves signed/encrypted details through public SDK metadata extraction; no opaque content is shown as invented text. Messages, Chat and Responses use the original format selector; legacy `/api` normalizes only at the known wire boundary, with storage/proxies unchanged. | Public unauthenticated catalogue read (466 entries), atomic repository/permission fixtures and actual SDK/Host loopback; key-filtered live inference/entitlement remain separate. |
| Exact identity and negative tool support | Pi 1.0.1 `models.js` resolves exact provider/ID, while OpenCode v2.0.22 `models-dev.ts` supplies declared IDs/limits. Candidate named fact rules now carry exact published ID scopes, including preserved template aliases; pure wire transformations remain independent. Legacy broad regex and universal budgets supply no confirmed capacity. Main receipts carry explicit null into V4 to clear an old same-ID denominator while preserving historical usage/reopen; late-model and sidecar events cannot overwrite current capacity. Explicit tools:false drives original tool/prefix/Skill projection and effect fences, permitting ordinary text. | Real Registry/frozen model/Host/reopen regressions for four future/private suffixes, published IDs and explicit corrections; actual SDK JSON/SSE requests and effect rejection under all three API formats. No extra runtime catalogue or paid model probe. |
| Anthropic API | [Current model directory](https://platform.claude.com/docs/en/api/models/list) declares separate max_input_tokens/max_tokens, nested image_input/pdf_input/structured_outputs flags and effort grades. [Thinking/effort](https://platform.claude.com/docs/en/build-with-claude/effort) forbids disabled on Opus 5.5/Sonnet 5.5; thinking support alone cannot create that control. Discovery preserves negatives/unknowns and sends adaptive only when declared, with no invented enabled budget. | Actual Provider writer/reopen plus installed SDK request bodies on scripted transport, Auto versus advertised effort; no live Anthropic-key inference. |
| Google Gemini | [Compatibility](https://ai.google.dev/gemini-api/docs/openai) supplies eligible slugs; [native models](https://ai.google.dev/api/models) supply capacity with `x-goog-api-key`, same origin and one shared deadline. [Tool signatures](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures#signatures-for-openai-compatibility) are linked to their actual tool ID/index and assistant, preserved through the existing reasoning metadata seam, then replayed through SDK's fixed Google namespace. Foreign/proxy/model histories receive no such payload. | Native/compatible catalogue and installed SDK/Host/SQLite scripted transport, cold reopen and route mismatch; no live Google request. |
| Mistral / Groq | [Mistral models](https://docs.mistral.ai/api/endpoint/models) `max_context_length`, chat/function/vision capability booleans and archived state; [Groq models](https://console.groq.com/docs/api-reference) active state, context and output limits. The generic metadata projection now retains these fields and explicit structured-output support; non-chat rows cannot enter ordinary selection. | Real Provider writer/reopen with documented payload shapes; unknown metadata stays unknown. |
| Alibaba Model Studio | [Regional/plan endpoints](https://help.aliyun.com/en/model-studio/base-url) do not share keys. [Native models](https://help.aliyun.com/en/model-studio/list-models) use the committed origin's `/api/v1/models`, Bearer, page numbers/total, capability codes and nested modality/capacity fields. ASR retains explicit Audio→Text without entering the ordinary chat picker. Read the whole bounded result before publishing; do not rewrite the inference URL, region, Coding Plan or Token Plan route. | Regional workspace, pagination, failure rollback and plan exclusion fixtures; actual regional key/model access not inferred. |
| Z.ai / BigModel | [GLM-5.3](https://docs.z.ai/guides/llm/glm-5.3) is text-only, while [Flash/FlashX](https://docs.z.ai/guides/vlm/glm-5.3-flash) adds visual input. Retire endpoint-wide false vision/video claims and retain specific model evidence. [Coding endpoints](https://docs.z.ai/devpack/tool/others) add declared global Chat/Responses variants without changing saved Messages connections or mixing billing products. | Registry/context option fixtures and existing wire cases; capacity/vision recommendations are not subscriber entitlement. |
| DeepSeek | [Responses contract](https://api-docs.deepseek.com/guides/responses_api/) declares its same-service root, stateless history, functions, output budget and effort; it does not promise store/previous-response IDs, all OpenAI built-ins or summaries. The new protocol variant reuses the existing Responses adapter and full-history owner. | Protocol selection, credential preservation, SDK framing and existing response/history tests; live model access not claimed. |
| Together AI | Official Python SDK 2.39.0 `81048943603fab8810955372f34b9fb5c5322cb3` (`sdk/together-py-8104894-api-review`, Apache-2.0) `resources/models/models.py`, `types/{model_list_response,model_object}.py` and `_client.py` match the [array directory](https://docs.together.ai/reference/models). Its declared type separates Chat from image/video, embedding, rerank and other non-chat routes; old/current same-origin URLs remain intact. OpenCode `providers/togetherai.ts` keeps Chat as its language route. | Real Provider writer/reopen, both declared hosts, class/unknown-host and malformed-directory fixtures. Listing an image/video/audio ID does not implement its generation endpoint. |
| Kimi / Moonshot | [Platform models](https://platform.kimi.com/docs/api/list-models) use same-origin `/v1/models` and Bearer even for Messages inference. Preserve the configured regional inference root/key and explicit image/video booleans; a reasoning boolean supplies no effort tiers. OpenCode `providers/{moonshot,anthropic-compatible}.ts` and the common protocol/history chain are the comparison. | Real discovery/writer/reopen fixtures for each existing region; actual Host/Pi/SQLite JSON and streaming signed-thinking/tool continuation with one local effect, then cold reopen. Synthetic transport only. |
| SiliconFlow China | [Model queries](https://docs.siliconflow.cn/docs/api/models-get) separate full membership, Chat subtype and image/video types. All bounded reads finish before one publish; non-chat IDs stay visible without entering Chat, and names create no class evidence. [Native Chat fields](https://docs.siliconflow.cn/docs/api/chat-completions-post) drive thinking switches/efforts only for the three explicitly declared models and `max_tokens` for the known route. The [global example](https://www.siliconflow.com/blog/glm-4.7-now-on-siliconflow-advanced-coding-reasoning-tool-use-capabilities) also declares `max_tokens`; China class/effort assumptions are not extended to global discovery. | Full/class directory, conflicting/failing-read rollback, actual SDK body and provider-scope fixtures; Host/Pi/SQLite reasoning/tool replay passes JSON/stream/cold reopen. Private model permissions remain unproved. |
| Cerebras | [Official public directory](https://inference-docs.cerebras.ai/api-reference/models/public-models) and SDK 1.91.0 `eb228a80a5a8a61bf0fae561845a15e3b8617a55` (`sdk/cerebras-node-eb228a8-api-review`, immutable Git-object inspection) declare tools booleans, supported_features separate from sampling parameters, nested limits and text+vision. Explicit false survives; JSON mode does not imply Schema, and multimodal alone does not identify inputs. No extra public fetch is required. | Authenticated-directory-shaped fixtures through the original Provider writer/reopen; actual key/model access remains unproved. |
| MiniMax | The [Messages catalogue](https://platform.minimax.io/docs/api-reference/models/anthropic/list-models) publishes `x-api-key`, cursors and a `data` envelope. The existing route/parser already matches; no speculative directory fallback or credential change is added. Compare immutable OpenCode `providers/{minimax,anthropic-compatible}.ts` and adjacent protocol/message replay. | Current generic discovery/pagination plus actual Host/Pi/SQLite JSON/stream signed-thinking/tool continuation and cold reopen; no blocker reproduced in that bounded path. No paid inference claim. |
| MiMo | [Models](https://mimo.mi.com/docs/en-US/api/model/list-models) use same-origin `/v1/models` with `api-key` or Bearer, not the Messages directory. [ASR](https://mimo.mi.com/docs/en-US/api/audio/Speech-Recognition) requires one audio input and returns text: retain that input/output distinction and exclude audio-only models from ordinary Host dialogue. Known TTS IDs are not textual chat. Documented unsigned Messages thinking is preserved through the exact successful native JSON route, matching existing SSE serialization; SDK's internal empty string is not a cryptographic signature. | Real catalogue/reopen plus installed SDK→Host/Pi→SQLite JSON/SSE continuation/cold reopen, one effect/approval, three usage receipts; malformed reply/provider error/Stop have no effects or successful receipts. Other routes retain their sanitizer. Audio executors are not added. |
| OpenCode Go / Zen | [Go](https://opencode.ai/docs/go/#endpoints) and [Zen](https://opencode.ai/docs/zen/#endpoints) publish model-specific wire endpoints. Update route declarations with newly published IDs while preserving older records; require their key-scoped Bearer directory and selected-route membership before automatic publication. Immutable v2.0.22 `packages/console/app/src/routes/zen/v1/models.ts`, `packages/console/core/src/model.ts` and adjacent handler format filter enforce workspace/model/format selection; this is a directory boundary, not another execution owner. | Real key/protocol directory/reopen/empty/manual fixtures. Credential-free public requests returned 403 here; no live workspace entitlement claim. Manual early-model corrections remain possible; Google/System One rows do not enter these three ordinary formats. |
| NVIDIA hosted API | [Hosted Chat](https://docs.api.nvidia.com/nim/reference/llm-apis) and published embedding endpoints for [Nemotron](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-embed-1b-infer) and [VLM Embed](https://docs.api.nvidia.com/nim/reference/nvidia-llama-nemotron-embed-vl-1b-v2-infer) are distinct. Exclude only those exactly proved non-chat IDs, never model-name guesses. The unauthenticated hosted directory returned 81 IDs and only identity/owner fields; local NIM's additional protocols are not hosted endpoint evidence. | Public directory read and exact-ID writer/reopen fixtures. Remaining sparse rows and API-key model entitlement are unconfirmed; no blanket Chat capability or local-NIM protocol import. |
| Other declared API presets | Existing Anthropic/OpenAI/xAI retain their exact product/region/auth routes. The common API completion/error/Stop guard applies; variant and specialized native/media support still require their individual published contracts and real-path proof. | Existing scoped route/auth tests are not blanket vendor-feature parity or new protocol support. |

Installed ordinary API adapters now use AI SDK 7.0.127, OpenAI 4.0.83, Anthropic 4.0.71 and
compatible 3.0.62; published sources are retained in immutable `sdk/api-sdk-7.0.127-review`.
The official v6→v7 migration and actual providers were traced through request construction, V4
middleware, metadata, tools, failure, Stop and replay. Stable include/stream/context and image-file
projection retain Host ownership. Compatible now supplies video serialization, retiring that patch;
the Messages gateway video patch is ported to V4 bytes without claiming Anthropic API video support.
Only the SDK synthetic missing-finish EOF error waits for final usage. Other parser errors remain
immediate, abort the physical request before diagnostic awaits and retain their cause; malformed
SSE on a still-open real socket has no effect, retry or completed receipt. Messages require stop
reason; Responses require matching terminal status. Scoped reasoning/signatures and reported failed
usage survive actual SDK/Host/SQLite replay checks. The 204-case routing suite, staged CJS CLI and desktop
were exercised; no new runtime owner, credential store, telemetry integration or paid call was used.

#### Retained model-access source locks

The older source locks below compare retained Craft `LlmConnection`, backend drivers and
`ModelRefreshService`; they are not the active candidate's code map. The candidate uses ZCode's
existing Provider writer and Host/Pi request owner under [Models](modules/models.md). Source and
catalogue inspection establish neither private endpoint entitlement nor successful paid inference.

| Source lock and inspected code | Reusable mechanism; Fleet boundary |
|---|---|
| Craft `v0.13.4` (`b2d6c8a`), `packages/shared/src/agent/backend/internal/drivers/{anthropic,pi}.ts`, `packages/server-core/src/model-fetchers/index.ts` | Preserve the live driver → persisted connection models → offline seed chain. Extend this chain, rather than adding a model store. |
| Installed Pi `@earendil-works/pi-ai`, `dist/models.js:beginProviderRefresh/publishProviderModels/getSupportedThinkingLevels`, `dist/providers/xai.js` | Reuse the installed model/runtime catalog and its exact `thinkingLevelMap` semantics, last-good storage and generation-checked publication. Pi's xAI OAuth loader exists, but its embedded client/scope is not an official third-party registration grant and Craft currently converts most OAuth to API-key auth. |
| Official Codex `639d2478cc2e`, `codex-rs/codex-api/src/endpoint/models.rs`, `codex-rs/model-provider/src/models_endpoint.rs`, `codex-rs/protocol/src/openai_models.rs:ModelInfo` | The ChatGPT backend's `/models?client_version=...` response is account-scoped and carries display text, context, input modalities and supported reasoning levels. Codex obtains `chatgpt-account-id` from the stored ID-token claims, bounds the response before decoding and publishes only the current auth identity. Fleet reuses the existing Pi adapter for the wire route and keeps allowance/rate-limit data separate; unknown slugs are unavailable until an adapter proves their output limit and transport. |
| Codex `67a709665ac7`, `codex-rs/codex-api/src/endpoint/models.rs:360`, `core/src/session/turn_context.rs:640` | Native effort presets use the `effort` field; a nonempty list/default drives supported choices. Codex falls back to a model default when an old choice is invalid; an empty list by itself does not mean `off`. The isolated review profile held six old exact `off` snapshots over a newer account-discovered low→max catalog. A bounded repair removes only that exact legacy snapshot when its other observed fields match, preserving disabled/manual/edited rules. Account refresh then exposed the reported medium default in Settings, a new Composer choice and a reopened conversation without paid inference. |
| Codex fetched `c248f6d48b97` without moving the retained `67a709665ac7` checkout; `458f7046a` in `codex-rs/{model-provider/src/models_endpoint.rs,models-manager/src/manager.rs}` | An explicit provider catalog is authoritative: reject duplicate/blank model slugs, match exact IDs, and never fill failed/empty results with bundled models. `3226512d4` also makes the server's effective provider win over an implicit client default on thread history and fork. The ZCode candidate now rejects duplicate IDs in API pages, each xAI capability catalog, and the account-scoped Codex catalog before persisting a refresh. It still retains saved manual/edited rows and last-good settings on a failed refresh; that is its existing Provider owner, not a claim that stale rows are currently executable. Queue-time account binding and default-provider behavior still need their own end-to-end proof. |
| Same Codex fetch, `13f580ef0` in `codex-rs/ext/skills/src/{render_dedup.rs,render.rs}` | It deduplicates cloud/executor Skill listings before the description-token budget while retaining executor aliases. ZCode's current `adapters/src/skills/index.ts:71-91` deduplicates only by path, so same-named skills from separate roots can consume repeated prompt budget. Compare the final provider-visible request and accepted Skill resolution before adapting this mechanism; name-only dedup would erase legitimately distinct packages. |
| OpenCode `fe3f3a41f`, `packages/opencode/src/provider/provider.ts:fromModelsDevModel` | Separate provider route, model identity, modalities, token limits and request variants. `models.dev` is a useful offline metadata fallback, not proof of account entitlement or a substitute for the provider's live capabilities. |
| OpenClaw `b4f1fec13ae`, `src/gateway/server-methods/models.ts:models.list`, `src/agents/prepared-model-catalog-worker.ts` | Serve an auth-scoped, prepared catalog; reject superseded runtime generations. Do not import its gateway and account authorities into Craft. |
| ZCode `872ad96`, `packages/provider/src/account-provider-service.ts:AccountProviderService`, `packages/ui/src/hooks/useModelSelectionView.ts` | Publish one revisioned provider snapshot; retain the last good view on refresh failure and discard late account results. Do not copy ZCode's provider store. |
| Cindy `c5517717c`, `apps/desktop/src/main/maker-host/model-discovery/anthropic.ts:mapAnthropicHttpModels`, `apps/desktop/src/renderer/components/new-chat/UnifiedModelPanel.tsx` | Source-aware searchable model grouping, separate per-model effort/Fast controls and a real-session SDK discovery hook. Its HTTP fallback synthesizes unsupported effort tiers when metadata is absent; Fleet uses only explicit provider/SDK evidence. Keep Craft's visual tokens. |
| Cindy `apps/desktop/src/renderer/components/settings/{ProvidersSection,UnifiedModelList}.tsx`, `components/new-chat/ModelSelector.tsx`; OpenCode `packages/app/src/components/settings-v2/{providers,models}.tsx`, `pages/session/composer/prompt-model-selection.ts`; OpenChamber `packages/ui/src/components/chat/ModelControls.tsx` (comparison only); ZCode `packages/ui/src/v4/composer/useDraftConfigControl.ts` | Cindy's provider detail owns auth and the model catalog, with confirmed provider removal; OpenCode separates provider disconnect from model visibility and gives the composer a cross-provider model choice; OpenChamber preserves a per-Session override; ZCode seeds a new draft from catalog selection. Fleet uses the existing Craft composer/Session owner and retires the duplicated provider-model and workspace-override UI. |
| ZCode `packages/ui/src/v4/composer/{useDraftConfigControl,composerSubmissionConfig}.ts`, `settings/model-provider-section/ProviderModelSettingsGroups.tsx`; Pi `packages/coding-agent/src/core/sdk.ts:231-255`; Kimi Code `packages/agent-core-v2/src/human/llm/thinking.ts` | Effort is validated against the selected model and belongs to a draft or Session request. Pi also supports global and per-model effort preferences, but those add defaults the owner explicitly rejects for Fleet. Fleet removes its global/workspace default-effort controls, keeps the existing composer/session effort control, and reconciles an omitted choice to a supported built-in level. |
| Official Codex `639d2478cc2e`, `codex-rs/ext/image-generation/src/tool.rs:IMAGE_MODEL`, `codex-rs/codex-api/src/endpoint/images.rs` | The ChatGPT-authenticated Codex backend has native `images/generations` and `images/edits`; the request names `gpt-image-2`. This proves the route, not a particular account's image allowance or effective returned model. Reuse the transport only inside a future Fleet media Job, never by adding image IDs to Pi's chat model list. |
| Hermes `ab1f70f4b341`, `plugins/image_gen/openai-codex/__init__.py` | Its subscription image adapter uses those native endpoints and the Codex OAuth credential without an API key; it replaced a pinned-chat-model hosted image tool after that route failed. The provider notes that requested model/quality/size may not be honored, so preserve requested and reported values. Reuse a bounded adapter pattern, not Hermes's agent loop. |
| Cindy `c5517717cc8d` plus fetched `origin/main` `041cc3f13`, `apps/desktop/src/main/maker-host/active-catalog.ts:1809-1835`, `apps/desktop/src/main/cindy-brain/byokImageChannel.ts` | Subscription image generation is projected as one hosted capability separate from Platform API models. Latest BYOK image registration requires declared image models and live credentials and prunes removed accounts. Fleet adopts the account/capability distinction; Cindy's pinned chat-model image-tool transport and its media registry are not copied into Craft. The checkout was not moved. |
| DeepSeek Harness `ddefc45fbc7f`, `packages/llm/llm-deepseek/src/{common/model-info.ts,protocols/messages/serialize.ts,protocols/chat-completions/serialize.ts}`, `packages/llm/llm-pi-ai/src/{adapter,discovery}.ts`; installed Pi `dist/api/openai-completions.js:detectCompat/buildParams` | The first-party DeepSeek route handles Messages effort, image Files, replay and cache accounting that its generic Pi route does not; both routes share one harness LLM seam. Its Pi adapter freezes route configuration per call, and discovery distinguishes advisory SDK models from authenticated gateway results. The installed Pi Chat Completions route already sends DeepSeek `thinking` and `reasoning_effort` for supported levels; intercepted requests confirmed High, Max and Off, so no duplicate wire adapter is needed for those fields. Candidate provider-wire improvements only; Fleet retains Craft's Pi Session, credential and permission owners and will port a mechanism only after a failing fixture proves the installed Pi route lacks it. |
| Grok Build `4247f6616893`, Apache-2.0, `crates/codegen/xai-grok-shell/src/agent/{mvp_agent/reasoning_effort.rs,remote_config/manager/mod.rs}`, `crates/codegen/xai-grok-pager/src/acp/model_state.rs` | A per-model server catalog provides effort options, defaults and sometimes a distinct wire model ID for each effort; unsupported values are rejected at model switch. Candidate for account-scoped effort metadata and wire mapping, not a second Grok agent or permission engine. The retained checkout was already present. |
| Kimi Code `7ad0c46682ec`, MIT, `packages/oauth/src/refreshProviderModels.ts`, `packages/agent-core-v2/src/human/llm/thinking.ts`, `packages/kosong/src/providers/capability-registry.ts` | Credential conflicts fail closed during refresh; each model declares thinking levels and whether Off is valid. The legacy name-prefix capability registry still has an unknown result, so do not copy prefixes as entitlement or a complete modality classifier. Candidate for model-specific request validation within Pi, not Kimi's session/catalog authority. The retained checkout was already present. |
| Official Codex `codex-rs/tui/src/chatwidget/service_tiers.rs`; [ChatGPT Speed](https://learn.chatgpt.com/docs/agent-configuration/speed), [OpenAI API Fast](https://developers.openai.com/api/docs/guides/fast-mode), [Claude Fast](https://platform.claude.com/docs/en/build-with-claude/fast-mode), [xAI Priority](https://docs.x.ai/developers/advanced-api-usage/priority-processing), [Kimi HighSpeed](https://www.kimi.com/code/docs/en/kimi-code/models.html) | Codex toggles a model-supported service tier independently from reasoning effort. ChatGPT Fast is 2.5× total credits for GPT-5.5/5.6/6 where offered (the owner's “extra 1.5×”); API Priority uses model rates. Claude API Fast is a model-limited beta at 2× with cache invalidation on speed changes; xAI Priority is 2× only when served; Kimi HighSpeed is a distinct model ID/quota, not a generic toggle. Fleet's composer action follows evidenced speedMode and leaves unknown prices unspecified. |
| MiMo Code `37c3e1ef025c`, MIT, `packages/opencode/src/provider/{models-catalog.ts,capability-registry.ts}` | Its OpenCode-derived metadata cache has an authoritative entity set, last-good refresh and generation guard. Multimodal routing requires both the model's declared input capability and evidence that the selected adapter serializes that content; unknown fails closed. Candidate for media input checks and fixture design, not a second model catalog or agent loop. New owner-requested shallow checkout; no production import. |
| Gemini CLI `87de0b6369f0`, Apache-2.0, `packages/core/src/{availability/modelAvailabilityService.ts,routing/modelRouterService.ts}` | Quota/capacity failures make a model temporarily unavailable while routing retains a reason and bounded retry state. This is runtime health evidence, not an account allowance meter or permission to change the user's selected model silently. New owner-requested shallow checkout; no production import. |
| Qwen Code `d33cd4ddcb5c`, Apache-2.0, `packages/core/src/models/{modelRegistry.ts,image-generation-capability.ts}` | Provider protocol and model wire API are distinct; invalid combinations are rejected. Image generation is a declared capability, not inferred from every multimodal/chat model. The registry includes a separate base URL in identity to prevent same-name account collisions. Candidate for route-validation fixtures; do not copy its provider store. New owner-requested shallow checkout; no production import. |
| cc-switch `56df6513`, `src-tauri/src/services/subscription_grok.rs`; Cockpit Tools `d4f1dbf2`, `src-tauri/src/modules/grok_account.rs` | Their Grok meter reaches private billing endpoints, and cc-switch scans undocumented protobuf fields to infer windows. Borrow bounded refresh, account identity and last-good presentation ideas; do not present this transport as an official or stable subscription quota API. Cockpit Tools' CC-BY-NC-SA declaration also rules out a casual code import. |

Official account/model capability contracts take precedence over third-party guesses:
[Claude Models API](https://platform.claude.com/docs/en/api/models) exposes exact effort support,
adaptive-thinking type and input/output limits; [Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5)
rejects disabled thinking even though earlier Opus models accept it. [xAI language-model list](https://docs.x.ai/developers/rest-api-reference/inference/models)
is API-key scoped. Grok Build's [documented ACP interface](https://docs.x.ai/build/cli/headless-scripting)
is the supported local integration candidate for a logged-in subscription; it is a separate runtime
route from the xAI inference API key. Grok's [Settings → Usage](https://docs.x.ai/grok/faq)
is the documented allowance view while no stable public personal meter contract is verified.

The [OpenAI Models API](https://developers.openai.com/api/reference/resources/models) exposes
account-visible IDs without a complete effort/context/modality contract. The
[DeepSeek List Models API](https://api-docs.deepseek.com/api/list-models/) also exposes name,
context and output limits, modalities and supported/default effort levels for returned IDs.
[Google Models API](https://ai.google.dev/api/models)
lists native `models/*` resources, `generateContent` support, input/output limits and page tokens;
Cindy `apps/desktop/src/main/maker-host/provider-model-fetch.ts` confirms the official
`x-goog-api-key` header and native `/v1beta/models` route. The [Groq Models API](https://console.groq.com/docs/api-reference)
adds active state, context and output limits; the [Mistral Models API](https://docs.mistral.ai/api/endpoint/models)
adds chat/vision capability and context length. Fleet intersects all five with the
installed Pi adapter, discards explicit inactive/archived/non-chat rows, and never infers image,
video or subscription allowance from membership alone. Cindy's
`apps/desktop/src/main/maker-host/provider-model-fetch.ts` supplies the comparison for same-origin
endpoint selection, credential headers and bounded responses; Fleet keeps Craft's connection store.
For media classification, Cindy's
`apps/desktop/src/main/maker-host/model-discovery/openai-media.ts` and
`packages/model-providers/src/providerMediaModels.ts` separate account-visible
image/audio/video entries from chat routes. Fleet reuses the official OpenAI
`/v1/models` response in the existing Pi discovery call, classifies only
[documented model families](https://developers.openai.com/api/docs/models/all)
or explicit response modalities, and keeps those rows read-only until the
separate media executor exists. The [Models API](https://platform.openai.com/docs/api-reference/models/object?lang=curl)
itself returns basic IDs, not a complete per-model modality or allowance contract.

### Subscription allowance comparison

[SYS-03](modules/context.md#subscription-allowance-acquisition-and-display)
owns the data/display recommendation. No accounts were queried and no private tokens/caches were
read; this is interface/source evidence, not a successful authenticated Fleet integration.

| Source / lock | Mechanism checked | Recommended use / counter-evidence |
|---|---|---|
| Current app + locked Claude Agent SDK **0.3.258** | `app/package.json`, `app/bun.lock`, installed SDK `sdk.d.ts:Query/SDKRateLimitEvent/SDKControlGetUsageResponse` and `sdk.mjs` query body; `app/packages/shared/src/agent/backend/claude/event-adapter.ts:adapt` | **Native path first.** The SDK has events and an explicitly experimental structured usage query; Fleet currently does not adapt the event. Prefer this seam to a new OAuth scraper/PTY. Query support is version-gated and may disappear; no promise of complete idle-account data. |
| Cindy retained `software/cindy` | `packages/maker-core/src/agents/codex/index.ts:2783-2790` calls app-server `AccountRateLimitsRead`; `apps/desktop/src/main/usage/{codexAccountUsageRefresh,claudeSubscriptionUsage,xaiSubscriptionUsage,xaiSubscriptionUsageRefresh}.ts`; `apps/desktop/src/renderer/components/settings/useProviderSubscriptionCard.ts` | Cindy really reads Codex, Claude and xAI subscription allowance, with separate account-bound caches and provider cards. Codex also has a private WHAM fallback; Claude OAuth and xAI billing are private/undocumented. Its xAI cached-first read relies on credential-change invalidation, so Fleet must recheck identity on every publication rather than copy that cache path verbatim. Fleet's Pi Codex runtime has no app-server control method; the native Cindy call cannot simply be copied into it. |
| Codex retained `software/codex` at `ebc05da3bdb76f25861e7cb418bd06d28cadc609`; Apache-2.0, plus [official app-server protocol](https://learn.chatgpt.com/docs/app-server) | `codex-rs/app-server-protocol/src/protocol/v2/account.rs`; `codex-rs/app-server/tests/suite/v2/rate_limits_identity_tests.rs:identity_is_rechecked_after_backend_response`. Per-limit buckets, optional values, account identity and revalidation after response. | Prefer the owning runtime's read/notification interface. User/workspace switch invalidates publication; token refresh for the same identity need not. Do not hardcode two windows or replace missing fields with zero. |
| Orca `a91ca8b19e6b48b88f49c9bcf7e5941aedd2a1df`; MIT; retained | `src/main/rate-limits/{codex-rpc-rate-limit-probe,codex-rate-limit-window-mapper,claude-usage-refresh-plan,claude-oauth-usage-request}.ts`; `src/shared/usage-percentage-display.ts` | Useful timeout/cleanup, nullable parsing, source classification and consistent rounding. Its Codex probe reads the legacy bucket and its display helper maps nonfinite input to zero; do not copy those limits. Direct Claude OAuth usage calls/impersonated CLI user-agent are not Fleet's recommended acquisition path. |
| [software/CodexBar](https://github.com/steipete/CodexBar/tree/78ba5a1e65e6859da59a21b799df95ab91bc0b89) · MIT (`LICENSE`); cloned 2026-09-27 | `Sources/CodexBarCore/UsageFetcher.swift`, `Providers/Codex/{CodexProviderDescriptor,CodexRateWindowNormalizer}.swift`, `Providers/Claude/ClaudeProviderDescriptor.swift`; `Sources/CodexBar/{LastKnownUsagePresentation,UsageStore+AccountRefreshPolicy}.swift` | Good source/identity/freshness and account-scope comparison; rejects some CLI fallbacks that cannot carry the selected workspace. `docs/codex-oauth.md` and `CodexProviderDescriptor.swift:456,460,811` keep native credential refresh with its CLI owner and reuse the same account snapshot for quota/reset inventory. `LastKnownUsagePresentation.swift:3` dates cached readings; Fleet retains its existing encrypted credential owner and never refreshes another application’s auth file. Do not port all credential discovery or Swift UI. Its Codex visible-window projection can force short-window usage to 100 when weekly is exhausted; Fleet should show the blocking condition separately from reported percentages. |
| [Cursor usage](https://cursor.com/help/models-and-usage/usage-limits) and [Admin API](https://cursor.com/docs/account/teams/admin-api) | Dashboard reports plan pools, remaining allowance and overage; API is organization/admin scoped. | Show provider-native units and account scope. This review did not establish a supported personal-quota endpoint; an official dashboard link is the honest fallback. No private cookie/database scrape or automatic paid-overage activation. |

#### Cockpit Tools and cc-switch acquisition-to-display review

Owner-requested follow-up, checked 2026-09-21. Both already have clean source clones under
`software/`. In this pre-refresh quota review, Cockpit Tools was at `dbe56a1edd07ac9d794c72ea4e6a12d5a3d4eb16`, matching upstream
HEAD at that check. The retained cc-switch was `8272707d5e2a9be0cd487ff2d3658f0c58121548`; a separate
shallow clone at `/tmp/fleet-quota-source.1Lt3cK/cc-switch` obtained upstream
[`37d0476097754636493ce836faf1a60f2121e340`](https://github.com/farion1231/cc-switch/tree/37d0476097754636493ce836faf1a60f2121e340).
The eleven acquisition/cache/view files inspected below are byte-identical between those two
cc-switch revisions. Existing references were not moved or re-pinned; temporary storage is not a
new retained reference. cc-switch has a root MIT `LICENSE`; Cockpit Tools declares CC-BY-NC-SA-4.0
in `src-tauri/Cargo.toml:6` and `README.md:472`, with no root LICENSE. The latter is restricted source
evidence, not an unrestricted code dependency. No production import or account query was made.

| Mechanism / exact source | Finding | Fleet consequence |
|---|---|---|
| Cockpit Tools `a24199f73505`, `src-tauri/src/modules/codex_quota.rs:578–855`; `src/types/codex.ts:1115–1136` | Account-check selects an entitlement expiry; `/subscriptions?account_id=…` uses bearer auth plus browser User-Agent/Referer/route headers and may expose a different renewal time. Both metadata calls pass no ChatGPT-Account-Id header (`:692–735,778–798`); workspace binding comes from the query or exact account-check response. Pro→20X is a fallback display rule, not proven native capacity. | Independent Fleet adapter requires the exact workspace match, falls back directly to the same account's subscription query when account-check is denied, keeps expiry/renewal semantics, shares one bounded deadline and never guesses a multiplier. Live inspection returned HTTP 200 on both metadata routes for each saved account after the header correction; the rebuilt desktop showed distinct matching terms after refresh. No Cockpit credentials/cookies were imported or resets consumed. |
| Cockpit Tools `src-tauri/src/modules/codex_quota_refresh_scheduler.rs:115,200,302` and adjacent `_tests.rs` | Per-account request joining, bounded waiters/queues, separate manual/background lanes, generation checks, deadline/panic cleanup. Manual requests promote queued work; cancelling queued background work explicitly leaves already-running work alone. | Useful scheduler behavior to specify independently. Extend identity to connection/runtime/account/workspace/config revision; queue generations alone do not establish account-identity validation after a network response. Native input, token rotation and file writes are not undone by timing out a future. |
| Cockpit Tools `src-tauri/src/modules/codex_quota.rs:173,1003`; `src/types/codex.ts:1400,1426,1482`; `src/components/codex/CodexQuotaMiniRows.tsx` | Backend rejects an existing window's missing/out-of-range percentage and records window-presence flags. Frontend nevertheless maps nonfinite values to zero, overwrites the short-window remainder when weekly remainder is zero, and falls back to one primary row when both presence flags are false. Absent backend windows carry placeholder 100 values. Additional model windows and credit data are also available in `raw_data`. | Keep validation, actual window presence, model attribution and compact/detail separation. Reject synthetic readings: `(short=75, weekly=0)` must keep 75 with a separate block reason; two absent windows must not become a 100% bar. A meter and an ability-to-run decision are different projections. |
| Cockpit Tools `src-tauri/src/modules/cursor_account.rs:1187,1423,1642,1788`; `claude_account_desktop_auth.rs:3426,3463` | Cursor's path imports local client credentials and constructs a session Cookie for `/api/usage-summary`; Claude uses direct OAuth usage calls. Cursor preserves `usage_updated_at` on query failure while recording a separate error time; the inspected Claude OAuth branch updates `usage_updated_at` even on failure. | Technical acquisition exists, but this is not evidence of a supported public personal-quota API. Do not import client databases/cookies or independently rotate runtime tokens. Separate sample/attempt/error times consistently; the Cursor timestamp behavior is the better comparison here. |
| cc-switch `src-tauri/src/services/subscription.rs:116,354,411,714,748`; `services/balance.rs:26,287` | Native subscription and balance adapters exist alongside scripts. Subscription acquisition reads CLI credentials or managed OAuth and calls service endpoints. Codex deserialization keeps only `rate_limit`; Claude parsing preserves new top-level windows. Balance dispatch uses URL substring matching; some missing numeric values become zero. | Correct the earlier blanket description of this Rust tree as only a proxy or scraper. Typed native adapters are candidates; Fleet's installed SDK/runtime remains the first acquisition seam. Preserve all supported buckets, parse exact origins, validate missing values and check endpoint credential scope. |
| cc-switch `src/lib/query/{subscription,queries}.ts:useQuotaKeepLastGood/resolveDisplayUsage`; `src-tauri/src/{commands/subscription,services/usage_cache}.rs`; `src/hooks/useUsageCacheBridge.ts` | Shared cache events synchronize tray and React Query; transient failure can retain success for ten minutes, authentication/schema failure invalidates it. Managed OAuth keys carry account IDs, but CLI subscription keys/events/cache carry only app type; a null managed ID uses `default`. Failure classification partly matches error strings. | Good bounded last-good/publication comparison, not a complete Fleet identity contract. Use resolved account/config revision and typed errors; keep true sample age across cache publication. Verify expiry when polling is disabled, rather than assuming a child relative-time timer reevaluates the parent hook. |
| cc-switch `src/components/SubscriptionQuotaFooter.tsx:128,216,249`; `tests/components/SubscriptionQuotaFooter.test.tsx`; `tests/lib/keepLastGoodUsage.test.ts` | Shared compact/detail view includes age and manual refresh, but silently hides credential parse errors, filters unknown tier names out of both views, and hides Sonnet in compact mode. Current tests cover known Fable windows and last-good transitions. | Reuse the information hierarchy through Craft primitives; expose errors, render valid new buckets with fallback labels, and show model-applicable constraints. Existing tests do not prove future-bucket completeness or live account isolation. |
| cc-switch `src-tauri/src/usage_script.rs:40,247,502`; `services/provider/usage.rs:13` | QuickJS has CPU/memory/stack limits; HTTP is performed by Rust after request extraction, then an extractor reads the response. Custom mode relaxes HTTPS/origin checks and methods are configurable. This is more than a page scraper, but execution bounds are not destination/credential authorization. | Compare typed provider adapters first. Do not add this generic executor to Fleet merely to read allowance. Custom integration belongs under existing Source and permission contracts, with a declared destination and effect. |

Same-task alternatives: OpenChamber `896776d81e13c061b724be98c32b2df17e030806` (MIT),
`packages/ui/src/stores/useQuotaStore.ts:fetchProviderQuota/resetForRuntimeSwitch`, its
`useQuotaStore.refresh.test.ts`, and `types/quota.ts` provide explicit runtime-generation rejection,
request joining, nullable dynamic windows, per-provider errors and retained sample timestamps.
That is a closer frontend lifecycle comparison than copying a complete account manager. It remains
evidence, not a new OpenChamber product authority; its Cursor adapter also uses private client state
and service APIs. Orca's runtime protocol adapter and CodexBar's source/last-known presentation remain
the narrower alternatives above; their invalid-number and synthetic-window limitations still apply.

Endpoint scope was checked against primary documentation: [OpenRouter account credits](https://openrouter.ai/docs/api/api-reference/credits/get-remaining-credits)
requires a management key; [current-key information](https://openrouter.ai/docs/api/api-reference/api-keys/get-current-key)
has its own usage/limit/remaining fields. A valid inference key is not proof of account-credit access.
Fleet should show the available key budget and report missing account scope, rather than label a
403 as an empty balance or require broader credentials just to draw a meter.

Current Craft `app/packages/shared/src/agent/core/usage-tracker.ts` measures Session tokens/context,
not account allowance. Recommended correction is therefore a typed read adapter plus identity-bound
snapshot/scheduler projection over the existing connection owner. No second ledger, proxy, account
store or billing-script runtime is justified. The behavior and additional failure cases are in
[SYS-03](modules/context.md#subscription-allowance-acquisition-and-display).
These remain candidates: authenticated integration, renderer verification, Rust scheduler execution
and distribution admission were not established by this source review.

Historical provider-specific evidence retained from the superseded quota note (2026-07-29):

| Source lock / exact path | Unique mechanism or limitation retained |
|---|---|
| Cockpit Tools `923cc6c45b8dbfe743ea2e04be33d2fe4fbf5654`, `src-tauri/src/modules/grok_account.rs` | `pick_best_live_credential` and per-account/process refresh locks compare same-account rotating credentials before retry. `query_quota` composes CLI billing/user and Grok subscription/task responses; `refresh_account_inner` bounds unauthorized recovery to one forced refresh, transport retries to three and concurrent account refreshes to three. This is historical recovery evidence, not permission to read foreign auth files or a claim about today's implementation. |
| cc-switch `30409878bdbdf1c7091c559d6afc367a052da39c`, `src-tauri/src/services/subscription.rs` | Gemini queries internal Cloud Code Assist `loadCodeAssist` / `retrieveUserQuota`, groups buckets using the lowest remaining fraction, and appeared to keep refreshed tokens query-local. Repeated refresh and loss of per-model windows need explicit checks before reuse. |
| Same cc-switch source lock and path | Grok `GetGrokCreditsConfig` uses a schema-free gRPC-web field scan and infers weekly/monthly labels from reset distance. This cannot establish exact quota, native window names or a stable public contract. |

These observations retain their original commits; they were not revalidated by the current
Claude/Codex/Cursor quota review. Prefer the selected runtime's supported interface and consult the
[xAI authentication evidence](research/context/07-XAI-GROK-AUTHENTICATION.md) for token ownership. The
removed quota note's generic recommendations are superseded by SYS-03 and the current comparison
above; its blanket claims about account-scoped cache keys and truthful fallback displays are not
current evidence.

### Native design software and targeted GitHub checks

Online observations checked 2026-09-21, separate from the pinned local inventory. These answer
specific tasks; they are not additions to the installed/reference set or a proposal to build every
integration. Official API availability is evidence of a possible route, not proof that Fleet can
use it correctly or that it is the best in-workbench editor.

| Task | Existing capability / primary evidence | Selection consequence |
|---|---|---|
| Read/change an existing Penpot design | [Official MCP](https://help.penpot.app/mcp/) already edits native pages, layers, components and tokens through the active editor plugin. The [executor at `e4723cb`](https://github.com/penpot/penpot/blob/e4723cb3a81c6eb381331864d0ac20b9acbcf075/mcp/packages/plugin/src/task-handlers/ExecuteCodeTaskHandler.ts#L175) reports code completion without an automatic rollback/durable-save barrier; [history APIs](https://github.com/penpot/penpot/blob/e4723cb3a81c6eb381331864d0ac20b9acbcf075/frontend/src/app/plugins/history.cljs#L23) belong to the existing editor. | A new third-party write bridge has no demonstrated gap for ordinary edits. Test the official path first when that task is requested. An active browser/plugin and Penpot deployment remain required; a local MCP process alone is not an offline editor. Online SHA differs from local `56bf0e3`; neither checkout was updated. |
| Read/change an existing Figma design | [Official remote `use_figma`](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/) edits native objects; it requires appropriate seat/file permission and [client admission](https://developers.figma.com/docs/figma-mcp-server/). The [official interface at `5d718a2`](https://github.com/figma/mcp-server-guide/blob/5d718a28ea21da0b0f75216cdc71be08b6f9b736/skills/figma-use/references/plugin-api-standalone.index.md#L83) excludes undo, version-history saves and clientStorage from `use_figma`. | Do not create a generic writer just because an older MCP was read-only. First compare the official surface against the exact requested operation. A normal Plugin API's capabilities are not automatically available through MCP. This hosted optional route does not satisfy Fleet's local native-editor contract. |
| Embed a whiteboard editor | Excalidraw `97c68dd3` exposes a React editor with scene read/update and [capture into undo history](https://github.com/excalidraw/excalidraw/blob/97c68dd371e13c017a8dcca49f8b3995ba7890a8/packages/excalidraw/components/App.tsx#L5323), plus [native JSON saving](https://github.com/excalidraw/excalidraw/blob/97c68dd371e13c017a8dcca49f8b3995ba7890a8/packages/excalidraw/data/json.ts#L52). | A bounded alternative for a whiteboard task, not proof of arbitrary SVG editing, native Figma fidelity or Fleet's rich media/workflow canvas. No same-task Electron comparison established superiority; no selection or new wrapper follows from this review. |
| Edit an SVG directly | SVG-Edit `c44f061d` has an [embeddable SvgCanvas](https://github.com/SVG-Edit/svgedit/blob/c44f061d2f9a626d2771cc931298af5a45522d87/packages/svgcanvas/demos/canvas.html#L28), `getSvgString` and [source replacement with undo](https://github.com/SVG-Edit/svgedit/blob/c44f061d2f9a626d2771cc931298af5a45522d87/packages/svgcanvas/core/svg-exec.js#L403). | Compare for a real SVG task before inventing vector editing. Its sanitizer removes unsupported content and multi-instance isolation remains unverified. This is not a general design-document replacement; superiority and faithful round trips have not been demonstrated. |
| Drive a named deep-domain tool | Blender already exposes blend-file data and many UI operators through [`bpy.data` / `bpy.ops`](https://github.com/blender/blender/blob/main/doc/python_api/rst/info_api_reference.rst). | For the existing outside-tool scope in `product.md`, use the tool's own API before adding an agent framework. Operator context, save and undo still need task-specific checks; availability does not prove a complete unattended workflow. |

### Format-editor candidates checked against the compatibility question

These are bounded candidates for the requested file formats, not permission to add a second
document or media authority. The comparison is about an actual editable round trip and the cost of
hosting it; a viewer, converter or project-file parser does not qualify as a native editor.

| Format / task | Existing project capability / primary evidence | Selection consequence |
|---|---|---|
| DOCX/XLSX/PPTX editing | [ONLYOFFICE Docs](https://github.com/ONLYOFFICE/DocumentServer) is an AGPLv3 self-hosted server with text, spreadsheet and presentation editors and direct OOXML support. Its [Docs API](https://api.onlyoffice.com/docs) embeds the editor through a document-server integration, so the editor remains a separate service with its own storage/auth contract. | A viable external editor route for Office formats when a server deployment is acceptable. It is not a drop-in Electron package; the AGPL boundary, [Docs API save callbacks](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/) (WOPI is a separate integration option), conversion behavior and one Fleet document authority require an owner checkpoint before adoption. GenOffice remains the closer local-component candidate because it already has native package patch/save and recovery paths in the checked-out source. |
| DOCX/XLSX/PPTX editing through LibreOffice | [LibreOffice core](https://github.com/LibreOffice/core) exposes the Writer/Calc/Draw document model and UNO SDK; the project is distributed under [MPLv2/LGPLv3+ terms](https://www.libreoffice.org/licenses/). It is a large native desktop suite, not a small embeddable React editor. | Keep as an external delegated editor or conversion fallback candidate. Do not embed or fork the full suite before measuring process, profile, font and save/recovery cost against GenOffice and ONLYOFFICE. |
| DOCX/XLSX/PPTX editing through Collabora | [Collabora Online](https://www.collaboraonline.com/terms/collabora-online-mplv2/) is primarily MPLv2 and its official examples require a separately hosted server plus a WOPI host; the [Kubernetes guide](https://github.com/CollaboraOnline/online/blob/main/kubernetes/helm/collabora-online/README.md) documents that deployment shape. | A credible server-side Office editor, but its WOPI/session topology is a larger integration than the current local Craft shell. Compare it with ONLYOFFICE only for a deliberate remote-editor release; it does not justify a second local document store. |
| Photoshop `.psd` / `.psb` editing | OpenShop is an MIT browser editor built around `ag-psd`; its checked source supports RGB 8/16-bit PSD import and emits an explicit loss report, while text/vector/masks/smart objects can be rasterized or baked on export. Adobe's [Photoshop UXP Document API](https://developer.adobe.com/photoshop/uxp/ps_reference/classes/document/) can save PSD/PSB through the installed application. | OpenShop is a bounded PSD editing candidate only after sample round trips; it is not Photoshop fidelity. For features a fallback cannot preserve, evaluate installed Photoshop through its official API; even that route requires version-specific fixtures. Fleet should preserve the original and report loss for any open-source fallback. |
| Premiere `.prproj` editing | [Kdenlive](https://github.com/KDE/kdenlive) and [Shotcut](https://github.com/mltframework/shotcut) are GPL desktop editors built on MLT. Kdenlive documents its own `.kdenlive` XML/MLT project format in its [file-format specification](https://github.com/KDE/kdenlive/blob/master/dev-docs/fileformat.md); the [MLT XML DTD](https://github.com/mltframework/mlt/blob/master/src/modules/xml/mlt-xml.dtd) is an interchange/rendering model, not a Premiere project writer. | Neither project is a `.prproj` editor. They are useful external-editor or MLT interchange references, not a direct Premiere compatibility layer. For native Premiere project edits, use the installed app's [official UXP Project API](https://developer.adobe.com/premiere-pro/uxp/ppro-reference/classes/project); otherwise support named exchange formats with a fidelity report. |
| WPS `.wps` / `.et` / `.dps` editing | WPS's official conversion endpoints ([WPS→DOCX](https://open.wps.cn/documents/app-integration-dev/docs-center/convert/api-docs/online-convert/to-docx), [ET→XLSX](https://open.wps.cn/documents/app-integration-dev/docs-center/convert/api-docs/online-convert/to-xlsx), [DPS→PPTX](https://open.wps.cn/documents/app-integration-dev/docs-center/convert/api-docs/online-convert/to-pptx)) are authenticated, asynchronous remote conversions. No independent open-source native WPS read/write chain was verified. | Prioritize standard Office formats. Offer WPS conversion or delegation with an explicit conversion receipt; do not promise lossless native WPS editing or mistake Microsoft Works `libwps` support for Kingsoft WPS support. |

### Adobe-Alternatives catalogue review

The [Adobe-Alternatives catalogue](https://github.com/KenneyNL/Adobe-Alternatives) is a discovery index,
not a compatibility or quality ranking. Its ✨ legend includes both open-source and source-available
projects, so that badge proves no redistribution permission. The rows below classify product
categories, not every repository or every feature; only linked primary evidence was checked.
Unmeasured candidates remain candidates, not winners or Adobe-format compatibility claims.

| Adobe area | What the catalogue actually contributes | Fleet decision |
|---|---|---|
| Photoshop / painting | PhotoGIMP is a [GIMP customization patch](https://photogimp.com/what-is-photogimp/), not a separate editor. GIMP has its own XCF format and PSD import/export, with feature gaps still tracked in its [format matrix](https://developer.gimp.org/core/standards/images/). Krita explicitly supports many PSD layer types while warning that PSD cannot be supported 100% because it is a reverse-engineered internal format ([Krita PSD notes](https://docs.krita.org/en/general_concepts/file_formats/file_psd.html)). | Do not absorb PhotoGIMP as product code. Compare GIMP, Krita and the already checked OpenShop only as bounded PSD fallbacks; preserve originals and emit loss reports. Prefer the installed application for unsupported native features, with a version-specific fidelity check. |
| Illustrator / tracing | Inkscape's native format is open SVG and stores editor metadata in SVG ([Inkscape](https://inkscape.org/en/develop/about-svg/)); its current AI route is import-oriented, not native AI write-back. Graphite is dual MIT/Apache but remains alpha, and its own milestone says a stable document format is still being built ([Graphite repository](https://github.com/GraphiteEditor/Graphite), [format milestone](https://github.com/GraphiteEditor/Graphite/issues/3646)). VTracer/SVGcode are tracing utilities, not Illustrator document editors. | SVG is the safe editable interchange. No `.ai` round-trip promise; Graphite is research/evaluation material until its document format and compatibility contract stabilize. |
| Animate / After Effects | OpenToonz/Tahoma2D/Synfig/Glaxnimate and Blender each have their own scene/project models. Natron is an OpenFX compositor with human-editable XML project files ([Natron](https://github.com/NatronGitHub/Natron)); OpenFX is a plug-in boundary, not an `.aep` reader/writer. | Use native project formats inside a future animation/VFX component and exchange rendered media or named interchange formats. Do not label any of these as FLA/AEP compatibility. |
| InDesign / layout | Scribus has an XML-based SLA/SLA.GZ native format and PDF export ([Scribus data sheet](https://wiki.scribus.net/wiki/images/9/93/Scribus-specs-152.pdf)); it is not an INDD editor. Laidout is another layout application with its own document model. | A possible open layout component, not an InDesign file bridge. Import/export must name the fidelity class and keep source files. |
| Substance / materials and meshes | The catalogue names Material Maker, UcuPaint, ArmorPaint, ArmorLab and Meshroom. Their individual source/runtime/format contracts were not audited here. | Native 3D authoring stays outside Fleet under PRODUCT. These may inform a specific external-tool workflow; listing them neither admits an engine nor proves Substance project compatibility. |
| Lightroom / RAW | darktable keeps non-destructive processing history in XMP sidecars and a library database ([sidecar specification](https://darktable-org.github.io/dtdocs/en/overview/sidecar-files/sidecar/)); RawTherapee uses PP3 processing profiles. These are application-specific recipes, not Lightroom catalog or ACR history round trips. | Treat RAW development as an external workflow. Preserve the RAW plus its sidecars; do not claim Lightroom catalog compatibility. |
| XD / interface design | Penpot has an open ZIP+JSON `.penpot` format ([format specification](https://help.penpot.dev/technical-guide/developer/data-model/penpot-file-format/)), but its own migration guidance says Adobe XD files cannot be imported directly and recommends SVG export ([Penpot migration note](https://penpot.app/blog/adobe-xd-export/)). | Use Penpot's native editor/API when the task is Penpot. For XD, support SVG-based migration with an explicit loss boundary, not a direct XD reader. |
| Premiere / timeline editing | Kdenlive and Shotcut use MLT-based projects; OpenShot uses `.osp` and supports partial EDL/Final Cut Pro XML exchange ([OpenShot import/export](https://openshot.org/files/user-guide/import_export.html)); Olive's project XML is versioned but its repository calls the software alpha and highly unstable ([Olive](https://github.com/olive-editor/olive)). | No native `.prproj` editing round trip was verified in the inspected candidates. Use them as external editors or exchange-format references only; native Premiere editing remains an installed-app API path. |
| Acrobat / PDF | PDF Arranger supplies page operations; other candidates model different PDF subsets. [EmbedPDF](https://github.com/embedpdf/embed-pdf-viewer) documents annotation, redaction, search and virtualized viewing; it deserves a bounded in-workbench comparison. The client is Apache-2.0, while `cloudpdf/server` is FCL with a commercial runtime requirement during its FCL term; the PDFium-derived runtime needs its own dependency review. | Separate page operations, content editing, forms and annotations. EmbedPDF was checked at README/license scope only: no source-path audit, save/reopen fixture or dependency admission. A viewer with annotations is not universal PDF content editing. |
| Audition / Media Encoder | Audacity, Tenacity and Ardour use their own audio/session formats; HandBrake is a transcoder, not a project editor. | Keep audio editing and encoding as separate external/job capabilities. No Audition session or Media Encoder project compatibility is implied. |
| Bridge / Dreamweaver / ColdFusion / Mixamo | The catalogue has no open-source Bridge equivalent; its Bridge entries are freeware/commercial. Dreamweaver alternatives are general code editors, BoxLang is a runtime, and Mesh2Motion is a narrow motion tool. | These do not create a Fleet file-format or editor requirement. Do not add them to the production surface merely because they appear in the index. |

## Focused product-flow comparisons

At the owner's request, the nine projects below received three production-flow traces each, covering
callers, state, persistence and failure/recovery at the pre-refresh mechanism-review revisions above. AionUi also required
its AionCore backend. These extend the 67-checkout bounded inventory; they are not whole-repository
or running-product acceptance. Tests were read, not executed; no dependency was installed or reference
changed during those traces. Paths and lines are relative to each named checkout at its review SHA.
The current checkout table separately records later updates. These observations qualify the older
findings below; they do not change historical source locks. Implementation and admission follow the
existing Fleet contracts, and research does not open the R0 feature gate.

### AionUi and AionCore

- **Creation:** `packages/desktop/src/renderer/pages/guid/hooks/useGuidSend.ts:105` reaches AionCore
  `crates/aionui-conversation/src/service.rs:1038`. Human HTTP and the runtime-token agent helper
  share `ConversationService.create`: resolve Assistant snapshot/directory, persist the conversation,
  then bind Project/folder best-effort. The separate writes do not establish an atomic create transaction;
  a Project is not a prerequisite for starting a conversation.
- **Configuration:** `packages/desktop/src/renderer/hooks/agent/useAcpConfigOptions.ts:83` distinguishes
  `observed`, acknowledgement and next-turn pending. However, AionCore
  `crates/aionui-ai-agent/src/session_agent.rs:1129` can return `Observed` from optimistic host overrides,
  without CLI echo. `crates/aionui-conversation/src/service_ops.rs:150` can also succeed after preference
  persistence fails. **This corrects the earlier blanket backend-confirmation claim.**
- **Approval/cancel:** `packages/desktop/src/renderer/pages/conversation/Messages/usePendingConfirmationsRecovery.ts:76`
  rebuilds cards from live pending requests; AionCore `crates/aionui-conversation/src/service.rs:3418`
  carries turn identity through deferred cancellation/watchdog cleanup. A missing agent yields no
  pending cards, so full-process approval recovery is unproven; resetting the UI gate is not a stop receipt.

**Fleet fit:** extend current Session creation, configuration evidence and turn cancellation; do not add
another Conversation/Assistant store. Apache-2.0 code candidates, with backend-specific confirmation
and crash recovery still requiring verification. Real CLI backends, engine internals and asset-license
closure remain outside these traces.

### Open Design

- **Manual/agent editing:** `apps/web/src/components/FileViewer.tsx:13224` applies source patches through
  the file API; agent processes write in their effective directory and
  `apps/daemon/src/run-html-version-snapshots.ts:82` captures HTML versions before completion. They share
  HTML/version storage, but not one universal edit command.
- **Save/restore:** `apps/web/src/components/FileViewer.tsx:13363` preflights source bytes;
  `apps/daemon/src/routes/project/index.ts:6014` checks parent lineage, and `:7762` locks write/version
  capture. These protections do not establish atomic expected-version comparison. A file write
  can succeed while history capture fails; restore UI exposes the typed warning, but
  `apps/web/src/providers/registry.ts:3069` drops it in ordinary manual saves. The version-route tests
  explicitly cover drift, concurrent checkpoints and partial success.
- **Local authority:** `apps/daemon/src/collab/project-request-authority.ts:189` checks persistent bindings
  and frozen/revoked state. Normal local reads/writes do not require a live cloud membership query;
  its authority tests cover offline access and frozen writes.

**Fleet fit:** HTML source patches, provenance and explicit partial-success results belong in the existing
artifact/component path. Apache-2.0 inspected code is a candidate; template licenses remain separate.
FIG import is not native FIG save, and neither multi-file atomic rollback nor every CLI mutation was
proved. Team identity and the large viewer shell are not proposed Fleet dependencies.

### Multica

- **Assignment/run:** GUI and CLI reach `server/internal/handler/issue.go:3783`, then the task queue and
  daemon. Persisted sequenced messages feed the UI cache. `server/internal/daemon/daemon.go:9417` clears
  each outgoing batch before reporting it and only logs report failure: persistence does not guarantee
  disconnected-message delivery. Reassignment or cancelling an issue does not stop an existing run.
- **Approval/cancel:** `server/pkg/agent/claude.go:730` uses `bypassPermissions`;
  `server/pkg/agent/codex.go:2863` automatically accepts supported requests. This is not an interactive
  approval reference. `server/internal/service/task.go:2857` records cancellation intent before the
  daemon observes it, stops execution and acknowledges; intent and physical termination differ.
- **Environment management:** `server/internal/handler/agent_env.go:77` restricts management to humans,
  audits before reveal, and transacts updates with audit records. The inspected `custom_env` path stores
  JSON, not a demonstrated encrypted vault. Task processes retain daemon HOME/XDG access; configuration
  injection and app authorization are not an OS sandbox.

**Fleet fit:** compare queue triggering, cancellation receipts and audit-before-reveal against existing
Task/permission paths. The license includes custom Part I conditions plus Apache-2.0 Part II; this is
a mechanism reference, not unrestricted code admission. Scheduler reclaim, all adapter cleanup and
checkout/finalization safety remain unread. Database test sources were not executed.

### OpenPencil

- **Human/MCP editing:** `crates/op-host-native/src/widget_host/property_dispatch.rs:20` and
  `crates/op-host-services/src/mcp_live/connection.rs:283` converge on EditorState. MCP waits for UI-thread
  apply/repair acknowledgement; some native properties use direct mutators/history capture. A common
  document does not mean all entrances use identical commands. Explicit file-target MCP is a separate route.
- **Open/save:** `crates/op-host-desktop/src/persistence.rs:192` validates before replacing state;
  `crates/op-host-desktop/src/save_session.rs:185` captures immutable snapshots, runs one save plus the
  latest queued save, and fences acknowledgements by document epoch/generation/revision. Its tests cover
  captured revisions and stale acknowledgements. This protects own-format `.op` saves, not FIG/Office fidelity.
- **Collaboration:** `crates/op-collab-host/src/runtime/local_edit.rs:128` reapplies preserved conflicting
  intent; `crates/op-editor-core/src/edit_transaction.rs:166` guards rollback by generation.
  **Active multiplayer collaboration forbids AI/MCP writes** in
  `crates/op-editor-core/src/collab_gate.rs:344`, with an explicit rejection test. Standalone human/MCP
  editing is a different mode; this does not demonstrate AI/MCP writes during a multiplayer session.

**Fleet fit:** document-bound save receipts and conflict recovery are canvas mechanism candidates.
The inspected Rust is MIT, but three required submodules are uninitialized and private auth prebuilt
artifacts have a separate boundary. No build, external-writer compare-and-swap or crash-durability
guarantee was established; local MCP processes are trusted without per-call secrets.

### OpenChatCut

- **Human/agent operations:** `src/editor/storeCommandBuilder.ts:40` serves live editing and private drafts;
  `src/agent/tools/edit-item-batch.ts:70` validates the whole batch before publishing once. Proposals replay
  semantic operations; `src/agent/useAgentRun.ts:129` persists before publication and detects intervening
  UI edits. This is an application workflow, not a universal multi-file transaction.
- **Open/save:** `src/app/AppViews.tsx:35` distinguishes missing from unreadable projects; failed autosave
  retains recovery state. `server/plugins/project-store-project-document.ts:114` **intentionally removes
  expected-revision comparison**, and its verify test accepts stale writes. Owner/epoch/lease checks and
  process serialization remain, but project and ownership use separate SQLite writes with compensation.
  External manual approvals bind exact arguments once; automatic sessions bypass that card.
- **Export/recovery:** `src/export/serverExportOperation.ts:161` reaches the actual Remotion renderer
  (`remotion/render.mjs:200`); preview/render share TimelineComposition. Encoding, target delivery and
  cleanup have separate states. Completed output survives a lost destination grant and can be delivered
  after rebinding without rendering again. Cancellation timeout is explicit, not reported as completed.

**Fleet fit:** shared operations/undo, unreadable-file preservation and export delivery are Video Component
references; keep Fleet's Session/permission/job authorities. AGPL-3.0-or-later means no direct import is
admitted here. Read tests cover draft rollback, stale writes and mocked delivery recovery, not codec,
pixel fidelity, cross-process atomicity or full engine behavior.

### Hermes

- **Turn lifecycle:** `hermes_cli/cli_chat_turn_mixin.py:47` enters
  `agent/turn_facade.py:22`; resumed history follows compression lineage.
  `agent/session_persistence.py:226` advances persistence after writes and filters ephemeral/already
  durable content; finalization releases leases/context state. The lease is conditional on a durable
  session row, not a guarantee for every first turn.
- **Tool approval:** `agent/tool_executor.py:666` authorizes final rewritten arguments;
  `tools/approval.py:1159` and terminal execution distinguish refusal, expiry and remembered grants.
  Automatic/unattended bypasses exist, and cached persistent grants are not reread every turn.
  This is neither a sandbox nor universal manual approval.
- **Memory/evidence:** `tools/session_search_tool.py:355` searches transcript evidence;
  `tools/memory_tool_store.py:157` locks fresh-read/atomic-save memory mutations.
  `agent/background_review.py:981` isolates background review from parent transcript persistence.
  Instance workers/file locks do not enforce Fleet's single consolidation writer. Mem0 sync can skip
  a turn while a previous worker remains busy.

**Fleet fit:** compare cancellation, authorization and evidence/curated-memory separation against existing
authorities. MIT code is a candidate where technically appropriate; importing the Python session runtime
or automatic memory writer is not proposed. Read tests cover batch rejection, search cleanup and review
isolation; gateways, plugins, all model loops and persistent-grant revocation remain outside this review.

### OpenCode

- **Input/events:** current UI `packages/app/src/components/prompt-input/submit.ts:168` routes through
  protocol compatibility to `packages/core/src/session.ts:360`. Stable input identity and payload
  comparison make retries idempotent. `packages/core/src/event.ts:303` commits projections and sequenced
  events before publication. Replay rebuilds pending input without automatically rerunning tools;
  the run coordinator is process-local, not a demonstrated crash/distributed scheduler.
- **Permission/process:** `packages/core/src/permission.ts:155` gives configured deny precedence over
  remembered allow; `packages/server/src/handlers/permission.ts:19` checks the reply's Session.
  Scoped process cleanup reaches actual execution, but pending approvals are in memory and Bash path
  inspection is not an OS sandbox.
- **Context:** `packages/core/src/session/compaction.ts:232` budgets input/tools/output reserve;
  only a successful nonempty summary updates the projection. Full messages remain durable evidence.
  `packages/core/src/session/runner/llm.ts:363` permits one overflow recovery, then preserves the second
  error. Read tests cover duplicate admission, replay without execution, deny priority and overflow.

**Fleet fit:** idempotent admission, permission precedence and context projection are candidates for the
current Session/permission/context paths. The current core/server protocol and legacy CLI/SessionPrompt
coexist; do not splice their evidence into one runtime claim. MIT alone does not justify replacing Craft's
runtime. Full provider, legacy CLI, plugin and crash-restart behavior remain unverified.

### Orca

- **Accounts/options:** `src/main/codex-accounts/service.ts:80` serves desktop IPC and accounts RPC;
  `codex-account-selection.ts:100` scopes selection to host/WSL runtime. Local-path account import is
  local-only. `src/main/codex/codex-structured-session-options.ts:94` validates and persists model
  options for the next turn; this is not current-turn CLI echo or immediate account rebinding.
- **Session recovery:** `src/renderer/src/components/native-chat/use-structured-agent-session-mutate.ts:41`
  sends operation identity/fingerprint and runtime fence. Host admission, durable records and the
  `src/main/native-chat/agent-session-journal/journal-row-writer.ts:20` commit precede cursor publication.
  `src/main/codex/codex-structured-turn-cancellation.ts:88` requires interrupt receipt and actual
  termination before reporting cancellation. Scripted tests do not substitute for real app-server runs.
- **Files:** `src/renderer/src/components/editor/editor-save-queue.ts:85` preserves dirty drafts on
  failure. Local IPC and remote RPC retain host/worktree ownership; local writes share
  `src/main/ipc/filesystem-auth.ts:37` canonical-path checks. Explicit external grants widen roots;
  CLI shell access is outside that app-service check, and atomic protection against path races is unproved.

**Fleet fit:** MIT candidates for scoped account selection, stale-request rejection, event recovery and
save acknowledgements; extend existing credential/Session/file services. Journal, provider history and
session records serve different roles, not a replacement Fleet store. Legacy/TUI orchestration,
SSH/WSL internals and full remote-client permission admission remain outside these traces.

### ZCode

**Plugin source inventory:** the current CDN manifest contains 26 URL/ZIP entries; all 26 were
downloaded to `源码参考/plugins/zcode-official-marketplace/` and matched their declared SHA-256.
The owner's ZCode installation has 27 installed packages: 26 are byte-identical to those ZIPs,
and the extra `example-plugin` is retained separately in `源码参考/plugins/zcode-installed-extra/`.
The signed ZCode 3.14.3 app bundle supplies 14 plugin directories plus `bundled-skills`, copied
with per-file hashes to `源码参考/plugins/zcode-bundled-3.14.3/`. The four document Skills exist there
but not in the pinned public Git checkout. Their `skills/{docx,pdf,pptx,xlsx}/LICENSE.txt` files
permit only personal, educational and non-commercial use; they are behavior references, not Fleet
redistribution candidates. GenOffice's Apache-2.0 core and separately licensed `ee/` remain a
different source boundary. No reference package was executed or installed for this inventory.

- **Install and configure:** `packages/ui/src/settings/PluginStorePage.tsx` →
  `packages/ui/src/store/pluginManagementStore.ts:252` / `pluginManagementStoreLoading.ts:16` →
  `packages/services/src/plugins/pluginManagementService.ts:32` → CLI protocol server →
  `apps/zcode-cli/packages/bootstrap/src/plugins.ts:707` →
  `apps/zcode-cli/packages/adapters/src/plugins/marketplace.ts:587` and its sibling `atomic-directory.ts:58`.
  One CLI inventory serves the UI. The UI reports diagnostic failures even inside a successful RPC
  envelope and fences late results by Workspace/config scope. Directory transaction IDs, installed
  records and backups determine commit versus recovery. **Installation always targets host user
  inventory and default-enables new IDs globally**; Workspace activation and permission are separate.
- **Send, interrupt and recover:** `packages/ui/src/v4/SessionPane.tsx:1395` records command identity
  before sending through `packages/ui/src/v4/agentConversationTransport.ts` and the host's
  `packages/services/src/zcode-agent/zcodeAgentService.ts:5026`. CLI
  `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/commands/handlers/session-flow.ts:184` uses one Core admission;
  start-now acquires a foreground lease and waits for prior execution to release it. The renderer
  reconciles acknowledged input against authoritative projections, not invented chat rows.
  `packages/ui/src/v4/pendingCommandRegistry.ts:188` silently settles an unknown server result; that is not proof of
  recoverable delivery. Sensitive approval answers are not replayed, but ordinary pending input is
  retained in renderer localStorage for up to 24 hours. Do not import that persistence policy blindly.
- **Provider and credential state:** `packages/ui/src/hooks/useModelProviders.ts:77` consumes the saved provider view;
  host account keys include provider/account identity. `packages/services/src/credential/credentialService.ts#readAll` refuses corrupt
  credential overwrite, and `createCredentialService` locks the whole read/modify/atomic-replace. Explicit remote
  provisioning (`packages/services/src/model-provider/providerProvisioningTarget.ts:52`) has sync-ID idempotence and
  compare-before-rollback per domain, with an explicit rollback-failed result. It is compensating
  recovery, not one atomic transaction. `packages/shared/src/remoteEnvironmentKey.ts` separates host
  Environment identity from Workspace/Session; its SSH/WSL/Docker product is not Fleet's remote model.

**Fleet fit:** staged installation and scoped asynchronous-result guards are R15/R18 candidates;
command acknowledgement/projection separation extends the existing Session event path. Credential
corruption handling exposed an R0 comparison: the reviewed Craft source deleted bytes after
header/decryption failure. Fleet now retains those bytes and propagates a classified recovery error
through its current credential manager; `profile-storage.isolated.ts` supplies the regression
evidence. This correction does not import ZCode's store or cipher.
ZCode's cipher fallback derives a secret from platform/home/username, so do not copy its crypto or
claim OS secret-store protection. First-party Apache-2.0 does not cover every dependency/binary.
`providerConfigMigration.test.ts`, `importedClaudeRecovery.test.ts` and `nonCliAcpRetirement.test.ts`
cover specific migration/retirement contracts; they do not validate these entire three flows.

## Admission vocabulary

`PRODUCT_REFERENCE` in older source notes means `EVIDENCE_ONLY` for observed product behavior,
not a separate admission grade. `C`/`M`/`X` in the current review describe comparison scope, never
capability readiness or dependency approval.

| Status | Meaning |
|---|---|
| `FORMAL_REFERENCE` | Multiple mechanisms are needed repeatedly and all admission gates passed. |
| `MODULE_REFERENCE` | Only a bounded subtree/protocol/symbol passed; never the product shell. |
| `LOCAL_IMPROVEMENT` | A small Fleet change can meet or exceed the candidate; put the change in an active spec. |
| `EVIDENCE_ONLY` | Product or mechanism evidence only; no standing dependency or code import. |
| `candidate` | Not yet admitted; fixed commit, exact symbols, comparison, license and deletion test are incomplete. |
| `REJECT` | No gap, weaker, conflicting authority, or unacceptable license/dependency. |

## Source-review minimum (not README review)

Before a project can influence a Fleet implementation decision, its record must identify, where the
project provides them: (1) the executable entrypoint and control flow; (2) the state/persistence
authority; (3) the human and Agent/API callers of the same operation; (4) permission, trust,
dependency and failure/recovery paths; (5) lifecycle/disposal or update/rollback behavior; (6) the
tests/fixtures that prove the mechanism; and (7) the exact license boundary of the files and runtime
dependencies. A README, screenshot, star count or package name may route an investigation, but
cannot promote a project to `MODULE_REFERENCE`, determine product status, or justify deletion of an
existing checkout. If a project has only partial code evidence, label the verdict `EVIDENCE_ONLY` or
`candidate` and state what remains unread.

Admission also requires a measured same-task comparison against current Craft/Fleet, a bounded
local-improvement attempt, failure/cancel/restart evidence and the consuming capability's proof.
For example, SYS-05 owns the Electron rich-card/concurrent-update/media-proxy benchmark; a
historical xyflow source audit never satisfies it. Candidate names without a current capability
gap do not form a permanent research queue. Removing such a documentary queue does not remove
or authorize deletion of any source checkout.

## Historical source locks and intake records

The following table retains earlier source locks and admission records; it is not a live inventory
and several recorded revisions differ from current disk HEADs. Use the inventory above for presence
and read Git for the actual revision before comparison. `pending` describes the historical admission record, not absence of the current bounded review; even an exact SHA and a readable LICENSE is not a formal reference.

> **Pin integrity, 2026-09-10.** `software/craft-agents-oss-v0.10.5` was found checked out at
> `abdc281a` (v0.12.0) — the same commit as the rolling pin — so the two reference roots were
> byte-identical and the v0.10.5 product/interaction baseline did not exist on disk. It had been in
> that state since 2026-08-17, meaning every "compare against v0.10.5" instruction in `AGENTS.md`
> rule 1, `../DESIGN.md` and `modules/shell.md` R1-C1 silently compared
> against v0.12.0. Restored to `c9d9a26f`. The row below is the assertion to check: a fixed HEAD in
> this table is only true if the checkout is actually on it.

| Checkout | Fixed HEAD | License text at checkout root | Admission-v2 |
|---|---|---|---|
| `plugins/dockview` | `0eef758ef3bc` | MIT (text verified) | `pending` |
| `plugins/markitdown` | `e144e0a2be95` | MIT (text verified) | `pending` |
| `plugins/react-resizable-panels` | `a1eeb7aefdb0` | MIT (text verified) | `pending` |
| `plugins/react-rnd` | `fec7303134ab` | MIT (text verified) | `pending` |
| `plugins/repomix` | `a5577d5718b1` | MIT (text verified) | `pending` |
| `plugins/xyflow` | `dd308ab401d4` | MIT (text verified) | `source-reviewed / INSUFFICIENT_COMPARISON` |
| `plugins/agentskills` | `38a2ff82958a` | Apache-2.0 code; CC-BY-4.0 docs | `source-reviewed / MODULE_REFERENCE candidate` |
| `plugins/hyperframes` | `6ad738b580ad` | Apache-2.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `plugins/mem0` | `ddaa655edf41` | Apache-2.0 | `source-reviewed / EVIDENCE_ONLY` |
| `plugins/playwright-mcp` | `55679f5f3d4b` | Apache-2.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/OpenHands` | `613406ca2bca` | MIT (text verified) | `pending` |
| `software/codex` | `38b064c31b1f` | Apache-2.0 | `pending` |
| `software/craft-agents-oss-v0.10.5` | `c9d9a26fbefa` | Apache-2.0 | `product/interaction baseline` |
| `software/craft-agents-oss` | `abdc281a7592` | Apache-2.0 | `selective-update reference (v0.12.0; repinned 2026-09-10 from v0.11.2, 97-file delta / +1751 −545, intake below)` |
| `software/hermes-agent` | `2ea39daeb1f6` | MIT (text verified) | `pending` |
| `software/openclaw` | `9f5609382b54` | MIT (text verified) | `pending` |
| `software/opencode` | `40e4d730cac3` (re-cloned 2026-07-27 sparse; prior incomplete snapshot retired) | MIT (text verified) | `pending` / mode evidence in `context/06-MODE-SELECTION-COMPARISON.md` §4.5 |
| `software/opencut-classic` | `cf5e79e91914` | MIT (text verified) | `pending` |
| `software/penpot` | `bdc078d5ea0c` | MPL-2.0 | `pending` |
| `software/pi-mono` | `13437ca82889` | MIT (text verified) | `source-reviewed / EVIDENCE_ONLY` |
| `software/tldraw` | `c26735e45258` | tldraw License (production restrictions) | `pending` |
| `software/browser-use` | `950eb03617e6` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/browser-harness` | `afbcc381b963` (owner-requested shallow clone, 2026-09-14) | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — CDP browser harness, MCP and editable helper Skills |
| `software/CLIProxyAPI` | `7fa443dc8bf9` (owner-requested shallow clone, 2026-09-14) | MIT (text verified) | `source-reviewed / EVIDENCE_ONLY` — external Go model proxy; not a Fleet model authority |
| `software/dashi-taskboard` | `c346e8e16c9` (owner-requested shallow clone, 2026-09-14) | Apache-2.0 (text verified) | `source-reviewed / EVIDENCE_ONLY` — separate issue store and Codex injection; no Fleet Task import |
| `software/flowgram.ai` | `5afd287a989a` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/grok-build` | `b41c75a578f9` | Apache-2.0 first-party code; vendored code retains original licenses | `source-reviewed / EVIDENCE_ONLY` |
| `software/mcp-registry` | `29e32c39dcb5` | mixed Apache-2.0/MIT transition; docs CC-BY-4.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/opencut` | `5e0696bc9b92` | MIT (text verified) | `source-reviewed / EVIDENCE_ONLY` |
| `software/waku` | `9500440002b4` (shallow `main`, owner-requested 2026-08-12) | GPL-3.0-only (text verified) | `source-reviewed / EVIDENCE_ONLY` — competing native host; no code import |
| `software/deepseek-harness` | `b150a551b8d4` (existing checkout rechecked 2026-09-14; not cloned in this task) | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — plugin slots, scoped composition and lifecycle |
| `software/OpenChatCut` | `607e0fcc2b75` (owner-requested shallow clone, 2026-09-14) | AGPL-3.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — video component shape; direct code reuse requires AGPL review |
| `software/genoffice` | `d35d77094854` (existing checkout rechecked 2026-09-15) | Apache-2.0 root; `ee/` Enterprise License | `source-reviewed / MODULE_REFERENCE candidate` — native Office/document engines, patch saves, AI editor actions and recovery; direct `ee/` reuse excluded |
| `software/spec-kit` | `bf88c9f9a82f` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/OpenSandbox` | `f8ed8734ce1f` | Apache-2.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/OpenChamber` | `1636fd2bf` (owner-requested fast-forward to fetched `origin/main`; no product merge) | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — Git/PR and browser-control evidence; updating the reference does not admit its full implementation |
| `software/herdr` | `9166e07b` | Apache-2.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/orca` | `95633a788` (verified 2026-09-10) | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — max-lines ratchet (2026-08-15); subscription usage + managed accounts (2026-09-10) |
| `software/cindy` | `f4422f816` (owner-requested fast-forward to fetched `origin/main`; no product merge) | Apache-2.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — capability ownership, skill slot, right-sidebar registration and project grouping; updating the reference does not admit its full implementation |

The historical source-lock table above retains the revisions actually inspected. Current comparison roles
are the v0.10.5 look pin and v0.13.4 implementation pin stated above. PRODUCT, not either old
checkout, decides product shape; earlier intake findings are rechecked before reuse.

## Retained mechanism observations

These are source observations at their original review boundaries, not a current checkout list or
execution instruction. Every candidate still requires the current seven-field promotion record. PRODUCT controls scope: OpenChamber owns Git/GitHub and
the bounded browser-control seam, not Goals, Fusion, general remote control or Fleet navigation.
Older observations outside that remit remain comparison data only.

| Checkout | Exact inspected evidence | Fleet verdict |
|---|---|---|
| `software/flowgram.ai` | `packages/client/editor`, `packages/canvas-engine/document`, `packages/common/command`, `packages/plugins/*`, `packages/runtime/interface` | workflow/canvas editor seam only; TaskRunner remains execution authority |
| `software/opencut` | `README.md`, `apps/web`, `apps/desktop`, `apps/api` | current rewrite has a real TS/Rust shell but Editor API, plugin-first, MCP and headless items are still roadmap claims; use classic for implemented timeline evidence |
| `plugins/hyperframes` | `packages/core`, `packages/engine/src/services`, `packages/studio-server/src/routes/render.ts`, cancellation/failure tests | primary programmatic-video renderer evidence; absorb deterministic composition and Job adapter behavior, not its Studio or cloud control plane |
| `plugins/mem0` | `mem0/memory/main.py`, `mem0/client/main.py`, tests/evaluation | explicit add/search/update/delete and evaluation mechanisms only; no Fleet service dependency |
| `plugins/agentskills` | `docs/specification.mdx`, `docs/client-implementation/adding-skills-support.mdx`, `docs/skill-creation/best-practices.mdx` | primary Skill format/progressive-disclosure evidence; Fleet adds trust, grants and receipts |
| `software/mcp-registry` | `pkg/api/v0/types.go`, `internal/service/registry_service.go`, `internal/validators`, publication/auth/version tests | primary MCP catalog/publication evidence; registry metadata is never install trust |
| `software/browser-use` | `browser_use/browser/session.py`, `browser_use/dom/enhanced_snapshot.py`, `browser_use/dom/views.py` | BrowserPane executor/recovery evidence only |
| `plugins/playwright-mcp` | `src`, accessibility-snapshot/action tools and tests | deterministic structured action seam; screenshots remain evidence, not selectors |
| `software/waku` | `src/driver/{mod,acp,claude,codex,opencode,pi}.rs`, `src/command_env.rs`, `src/model_catalog.rs`, `src/grok_session.rs` | CLI-host evidence only. Native protocol per vendor (Claude stream-json, Codex app-server, OpenCode HTTP, Pi RPC); ACP only where that *is* the long-lived session (Cursor, Grok). Login-shell PATH + last-good model cache. GPL-3.0-only; direct reuse is not admitted under Fleet's current distribution contract. Do not take GPUI/app shell, persistence, or a second session store. Refines H6: ACP replaces *probes*, not native session transports Fleet already has (Claude SDK / Pi). |
| `software/deepseek-harness` | `README.md` ("everything is a plugin", Cordis); `packages/README.md` (39-group hierarchy, ~167 packages); `packages/AGENTS.md` (plugin export/injection rules); `.agents/notes/implemented/architecture/2026-06-13-capability-seams.md`; `2026-08-03-per-session-agent-presets.md`; `2026-08-09-cordis-event-walk-backstop.md`; `2026-07-29-package-regrouping.md`; `packages/{core,session,subagent,compaction,sandbox,acp,workflow,extensions}` | **Revised by owner direction 2026-09-14:** adopt the plugin-first *composition principles* for Fleet Components, but do not replace Fleet's Craft/Cindy core with Cordis. Admitted: Service Definition / Service Provider / Consumer seams; declared additive UI slots; scoped composition; lazy/optional dependency loading; durable composition snapshots; lifecycle disposal; and "enforce in the operation that decides". Rejected: Cordis as composition root, wholesale 167-package split, property-proxy injection, live self-modification, and any second Session/Task/Permission authority. Cost evidence remains relevant: generated catalogs, independent graph checks and per-package invariants are needed because a failed registration is otherwise indistinguishable from a missing component. |
| `software/deepseek-harness` | `vendor/loader/src/config/{tree,entry,isolate}.ts`; `vendor/include/src/index.ts`; `vendor/cordis/src/{fiber,context,registry}.ts`; `packages/client/ui-slots/src/{index,renderer,store}.ts`; `packages/preset/agent-presets/src/{mount,discovery,authoring,session}.ts`; `packages/extensions/cordis-host-runner/src/{index,inspect-registry}.ts`; associated loader/slot/preset tests | **Code-level admission, 2026-09-15.** The architecture is a coordinated runtime, not a folder convention: `EntryTree` mounts nested rows and awaits every fiber; a failed subtree is reported as an `AggregateError` and disposed; `disabled` keeps a stable entry while unloading its fiber and reactivates dependency-pending rows; `Context.provide`/`ctx.effect` bind service ownership and teardown to a Fiber; `SlotCore.register` validates declarations, scopes, duplicate cells, child-slot ownership and returns an idempotent disposer; `mountPreset` proves every row is usable and rejects services leaked into the root realm before publishing the mount. Preset composition is input-only (`PresetTree.write()` is intentionally a no-op); user authoring copies a whole preset into a user root, tightens modes, refuses overwrite and leaves shipped roots immutable; session preset changes are logged as events so resume reconstructs the composition the later turns actually used. Fleet should implement these invariants as a smaller Manifest → Plan → Activate → Health → Publish → Dispose pipeline over existing Workspace/Session/Permission/Settings, not import Cordis or its process-wide context kernel. |
| `software/OpenChatCut` | `README.md`; `skills/openchatcut/`; `.mcp.json`; `server/`; `src/`; `remotion/`; `shared/` | **Interaction/source evidence for a future Video Editing Component; no engine is selected.** Its implemented shape combines a local editable multitrack project, timeline/editor UI, proposal-based agent edits, undo/redo, MCP, 26 on-demand skills, preview and export. Fleet may independently specify the observed workflow against its own authorities; copying source or source-derived contracts requires AGPL-3.0 obligations, project-format compatibility, and an owner license checkpoint. Its project/media files must remain component-owned artifacts, while permissions, sessions and jobs remain Fleet authorities. |
| `software/genoffice` | `packages/{docx-engine,pptx-engine,pdf2docx,html2docx,file-parse}`; `apps/{docs,sheets,slides,pdf,shell}`; `apps/docs/src/main/{atomic-write,external-change,docs-main}.ts`; `apps/slides/src/main/ops/{registry,executor}.ts`; `apps/slides/src/preload/index.ts` history/snapshot APIs | **Source-level document-component reference.** The engine parses native OOXML/PDF/HTML formats, applies narrow patches and repacks untouched archive entries; the Docs host tracks dirty state, external changes, autosave recovery and Restore/Discard; Slides exposes operation registries, undo/history batches and AI snapshots through the same IPC surface. The UI/Agent share the document's native operation path rather than editing a flattened preview. Root is Apache-2.0, but `ee/` is development/test-only enterprise licensed and third-party engines retain their own notices; no direct `ee/` reuse. |
| `software/spec-kit` | `src/specify_cli`, `.spec-kit/templates`, `presets`, `bundles`, `prompts`, `docs` | Spec-Driven Development (SDD) contract evidence, executable specification generation, constitution/principles, task decomposition templates, and role presets/bundles |
| `software/OpenSandbox` | `modules/`, `server/`, `components/{ingress,egress}`, `sdks/`, `kubernetes/`, `cli/` | General-purpose sandbox platform, unified sandbox lifecycle/execution protocol, Docker/K8s/gVisor runtime adapters, network ingress/egress policy, and credential vault |
| `software/openchamber` | Historical multi-surface checkout observation; current inspected paths appear above | Goals, Fusion and private relay pairing were observed in that product but are outside its Fleet remit. They are not an implementation queue. Retained Git/GitHub and browser-control evidence is recorded in the bounded rows below. |
| `software/herdr` | `src/{app,client,server,ui,config}`, `tests/` | Rust native terminal multiplexer & background supervisor server, working/blocked/idle pane state detection, socket API / CLI orchestration, and persistent detach/reattach |
| `software/cindy` | `apps/{desktop,mobile}`, `packages/{maker-core,maker-cc-manager,maker-pi-manager,model-providers,device-link,browser-control-runtime,lizi-im}` | Multi-harness agent client, mid-task harness switching, device-link remote control, IM bridges (WeChat, Slack, Lizi), and local background automation |

## Source-level intake, 2026-08-15

Read at source level, not from READMEs. Each row names the exact evidence and the Fleet row it
serves. **A licence column that forbids import is not a footnote** — it decides whether the entry is
a port target or a specification input. F3 requires license, approved-source and product-fit
checks; it contains no blanket language ban. The mechanism-only verdicts below describe the
scope and integration fit of those historical comparisons, not a prohibition on other runtimes.

| Checkout | Licence / language | Exact evidence read | Verdict for Fleet |
|---|---|---|---|
| `software/cindy` | Apache-2.0 · TypeScript | `packages/model-providers/src/{types,registry,invocation,effortResolution,classification}.ts`; `packages/maker-core/src/{types/capabilities.ts, agents/base-agent.ts, agents/credential-mode.ts, session.ts}` | **The agent/model split is real and package-enforced**: `maker-core` and `model-providers` never import each other; `Provider.models[agent]` / `routing[agent]` fan one provider over many harnesses; `resolveRoute` is pure and reads no storage. Grounds Decision **E15**. Port candidates: `types/capabilities.ts` + the two-layer `NotSupportedError` guard (~330 lines, no deps); `invocation.ts` (its header records six duplicated implementations and a real security incident from divergent fallbacks — an unsupported permission mode must fall back to the **strictest**, never the scenario default). **Do not take** `session.ts` (84 KB) or `maker.ts` (47 KB): a second session/turn/permission authority with its own lease model; nor `agents/shared/auto-review.ts` (295 KB), a second approval-granting authority |
| `software/AionCore` | Apache-2.0 · **Rust** | `crates/aionui-session/src/backend/{mod,types,descriptor,cli_version}.rs`, `capability.rs` | Specification input for **E15**, not a port. `BackendConnection` + `SessionBackend` two-trait split; `CommandNotSupported`; `request_external_permission` defaults **Denied**; `CapabilityOrigin` + `effective_agent_capabilities` (constructed `false` beats stale ACP discovery); `mode_switch_effect: Immediate|NextTurn`; verified-CLI-version verdicts. **Do not take** the per-vendor connection modules (`claude_conn.rs` 352 KB, `codex_conn.rs` 472 KB) or its reducer/FSM — a second timeline |
| `software/omnigent` | Apache-2.0 · **Python** | `harness_capabilities.py`, `native_policy_hook.py`, `inner/executor.py`, `inner/policies.py`, `inner/sandbox.py`, `harness_plugins.py`, `designs/harness-plugin-interface.md` | Specification input for **E15** and **EXEC-08**. Declared capability with `None` = *no claim*, live-verified by a bench. One `POST /policies/evaluate` authority with per-harness hook translation, **fail-closed** with a bounded retry budget — six vendors, one permission path. Its `SandboxBackend.{resolve, wrap_launcher_argv, post_spawn}` is **daemonless and per-spawn** across bwrap/Seatbelt/JobObject, which disproves the premise that an OS sandbox needs a control plane. Its own Windows backend documents that it isolates nothing |
| `software/OpenSandbox` | Apache-2.0 · **Go + Python** | `components/execd/pkg/isolation/{isolator,bwrap,seccomp_gen,probe}.go`, `pkg/runtime/errors.go`, `pkg/web/router.go`, `configs/isolation.example.toml` | **A second sandbox is outside the product boundary.** The inspected implementation was bwrap-only, Linux-only (`bwrap_stub.go` is a no-op elsewhere); no Seatbelt, no Landlock, no gVisor in-tree — those are delegated to a container runtimeClass. Requires a resident in-sandbox daemon **plus** a FastAPI/Docker/K8s control plane. Useful only as vocabulary: `Capabilities`+`Probe` per-mode probing with a human diagnostic message, and the denial taxonomy in `runtime/errors.go`. **EXEC-08 now tracks inherited isolation under R0/R2.** This observation neither closes that audit nor establishes equivalence to a container sandbox |
| `software/AionUi` | Apache-2.0 · TypeScript | `tests/unit/acpConfigOptions.test.ts`, `tests/unit/settings/agentFilters.test.ts`, `docs/prds/conversations/acp/*.md`, `packages/desktop/src/index.ts` | Corrects **H7**'s citation (`ManagedAgent`, not `DetectedAgent` — see 02-DECISIONS). One portable invariant: a config write commits to UI state only when the backend **echoes** the value (`confirmation: 'observed'`); a bare `command_ack` must not mutate confirmed state. Its ACP PRDs enumerate per-backend behaviour differences as acceptance criteria. **Current qualification:** the deeper [AionUi/AionCore trace](#aionui-and-aioncore) finds host-optimistic `Observed` replies; this historical UI finding is not a universal backend-echo guarantee. **Do not take** `ipcBridge.ts` (89 KB, a second IPC authority) or the `aioncore` subprocess pattern — it moves session state outside the one store |
| `software/Kun` | **PolyForm Noncommercial** · TypeScript | `src/renderer/src/AppShell.tsx`, `components/workbench/*`, `components/workbench-layout*.ts`, `store/chat-store.ts`, `kun/src/contracts/policy.ts`, `kun/src/server/approval-consent.ts` | **No direct reuse is admitted under the current product/distribution contract.** Pattern evidence: a **155-line `AppShell`** that switches one route field over lazy children, a composition-root `Workbench` that owns nothing, ~40 single-purpose `useWorkbench*` controller hooks, layout as a hook with persistence isolated in one file, and a 190-line store that only spreads slice factories. This does not prescribe a replacement Fleet shell or a line-count target. Also: three product approval modes projected onto three raw axes with unknown combinations resolving to the **narrowest** mode, and approvals gated by a single-use HMAC consent token with the audit event written **before** the tool is released |
| `software/orca` | MIT · TypeScript | `config/scripts/check-max-lines-ratchet.mjs`, `config/max-lines-baseline.txt`, `.oxlintrc.json`, `src/renderer/src/store/{index,store-listener-census}.ts`, `AGENTS.md` | **Maintainability mechanism evidence.** A `max-lines` **ratchet**: the linter fails an over-budget file, so the only escape is a disable comment, and the script freezes the set of files holding one in a baseline that may only shrink. Budgets: 300 `.ts` / 400 `.tsx` / 800 tests. Counter-evidence that principles alone fail: Orca's own `App.tsx` is 2,831 lines opening with `/* eslint-disable max-lines */`, and slices reach 248 KB. Fleet has not adopted these limits; compare a ratchet only against an observed maintainability problem |
| `software/openchamber` | MIT · TypeScript | `packages/ui/src/sync/{DOCUMENTATION.md, event-reducer.ts, materialization.ts, session-event-router.ts}`, `stores/permissionStore.ts` | Historical cache-versioning observation: `permissionStore.ts` (207 lines) — a client **cache** of a server-owned policy fenced by `revision` + `generation` + `runtimeKey`, refusing to apply a snapshot older than the last applied. This does not expand OpenChamber's product remit beyond Git/GitHub and the browser seam. **Counter-evidence to itself**: `useUIStore.ts` 103 KB, `useConfigStore.ts` 170 KB, and a second layout host (`VSCodeLayout.tsx`) grown to serve a second surface — precisely Fleet's forbidden second shell, observed in the wild |
| `software/herdr` | Apache-2.0 · **Rust** | `src/app/runtime_mutations.rs`, `src/api/{mod,event_hub}.rs`, `src/events.rs`, `AGENTS.md` | Pattern only. Observed mechanism: **the local UI dispatches the same `Method` enum an external client would** — the TUI has no privileged mutation path — and `request_changes_ui` enumerates in one match everything that can move the UI. Also a bounded, sequence-numbered event ring clients resume from, and agent-state tiers separating an authoritative hook report from a heuristic screen detector from display-only metadata with a TTL |
| `software/open-design` | Apache-2.0 · TypeScript | `packages/contracts/src/api/{files,artifacts,live-artifacts}.ts`, `apps/web/src/edit-mode/{types,source-patches}.ts`, `artifacts/{version-origin,renderer-registry}.ts` | CREATE-07 comparison evidence, with the limitations in the current Open Design flow trace. `ProjectFileVersion` carries `source: 'ai'|'manual'|'restore'`, `contentDigest`, `parentVersionId` and an `ArtifactOrigin` with `entrySurface` — Fleet's provenance need, in a contracts package whose only dependencies are `zod` and its own release helper. Preview isolation is correct: `sandbox="allow-scripts allow-downloads"` with **no** `allow-same-origin`, so the frame is opaque-origin and the host is the sole writer. **Do not take** `FileViewer.tsx` (776 KB) |
| `software/html-anything` | Apache-2.0 · TypeScript | `next/src/components/preview-pane.tsx`, `lib/history/db.ts`, `lib/extract-html.ts`, `lib/security/host-validation.ts` | **Negative finding, recorded so Fleet does not repeat it:** its preview iframe uses `sandbox="allow-scripts allow-same-origin"` on a `srcdoc` frame, which collapses the sandbox — agent-generated script inherits the app origin and can reach the parent window, local storage, the IndexedDB history and the loopback API routes. A Host-header allowlist mitigates DNS rebinding, not same-origin frame access. Fleet's preview must preserve origin isolation; the current Open Design flow trace still limits broader correctness claims. Small port candidates: the IndexedDB version ring and `extractHtml`/`previewHtml` for streamed-LLM HTML recovery (delete its CDN `<script>` injection — local-first) |
| `software/openpencil` | MIT · **Rust** | `crates/op-editor-core/src/{command,command_batch,history,history_snapshot,edit_transaction}.rs` | Pattern only, and **the schema is not in the checkout**: `vendor/jian` is an empty submodule, so `jian_ops_schema::PenDocument` — the canonical `.op` document type — is absent and its licence unknown. Confirms **E11**'s shape (one DTO, one pre-validate-then-mutate apply path, an ordered batch landing as a single undo step, with an exhaustive `batchable()` gate that fails to compile on a new unclassified variant) but **rejects inverse-carrying change records** in favour of structurally-shared snapshots. **Current qualification:** the [production-flow trace](#openpencil) finds native direct-mutator paths and rejects AI/MCP writes during active collaboration; the command-batch finding does not cover every caller |
| `software/flowgram.ai` | MIT · TypeScript | `packages/runtime/{interface,js-core,nodejs}/package.json`, `runtime/interface/src/index.ts`, `canvas-engine/*/package.json`, `common/history/package.json` | **Narrows the existing MODULE_REFERENCE row.** The editor/runtime seam is real *only* for `runtime-interface` (one dependency: `zod`) and `runtime-js` (which keeps the contract as a devDependency and inlines types at build). The **document and history models are not liftable**: `@flowgram.ai/document` and `@flowgram.ai/history` both require `inversify` + `reflect-metadata` + the canvas-engine container. Take the packaging discipline, not the types |
| `software/openreel-video` | MIT · TypeScript (Electron) | `packages/core/src/export/{types,export-engine,encoder-backend,webcodecs-backend}.ts`, `device/export-estimator.ts`, `ai/cloud-job-types.ts` | **R11–R13 export/recovery candidate; stack similarity does not establish superiority.** `ExportEngine.exportVideo` is an `AsyncGenerator<ExportProgress, ExportResult>` polling an `AbortController` inside the frame loop; a closed error union (`CANCELLED | DISK_FULL | MEMORY_EXCEEDED | TIMEOUT | UNSUPPORTED_CODEC`) each carrying `phase` and `recoverable`; on abort the writable stream is discarded so no partial file survives; pre-flight clamping of resolution/frame-rate rather than freezing (**E8**); and an estimator returning `confidence: 'measured'|'estimated'|'rough'`. **Do not take** the bundled **GPL** ffmpeg fetch path — its own `DISTRIBUTION.md` records that as an unfinished legal decision — nor the prebuilt mac-only `.dylib` binaries |
| `software/palmier-pro` | **GPL-3.0** · **Swift**, macOS 26 + Apple Silicon only | `Sources/PalmierPro/Export/{ExportQueue,ExportService,ExportOptions}.swift`, `Models/MediaManifest.swift` | Platform lock confirmed. Historical job-mechanism evidence for **ORCH-05**: an explicit job status machine (`waiting/preparing/exporting/canceling/completed/failed/canceled`), enqueue returning a queue position and **refusing a duplicate destination**, state-aware cancel, and `finish()` always calling `startNext()` so the queue drains rather than stalls. Its staging idiom is a CREATE-12 comparison candidate: write to `.partial`, `defer` its removal, check cancellation, then atomically commit — and refuse to cancel once committed. `MediaManifestEntry` carries `MediaImportInput` **and** `GenerationInput` with references stored as **asset IDs**, making it a real source→operation→output graph |
| `software/OpenMontage` | **AGPL-3.0** · Python | `lib/{delivery_promise,media_profiles,events}.py`, `tools/{base_tool,cost_tracker}.py` | **AGPL; no source import is admitted by this record.** One idea worth re-specifying for CREATE-12: a *delivery promise* that locks what a render claims and refuses a silent downgrade (`still_fallback_allowed: false`, `min_motion_ratio`, and a validator that reports "these are animated slides which do not count as motion"). Also a budget state machine of estimate → reserve → reconcile → refund. It has **no cancellable job**, only stage checkpoints |
| `software/cc-switch` | MIT · TypeScript + **Rust** | `src/config/{piThinkingProfiles,piModelCatalog}.ts`, `src/types.ts` | **E9a** data-semantics candidate: A tri-state reasoning-profile map with the semantics documented in source: **key absent = the model does not support that level; key → `null` = the level exists but sends no wire value; key → string = the wire value; `{}` is reserved for the user's explicit "use provider defaults"**. Plus `CodexChatReasoning { thinkingParam, effortParam, effortValueMode, outputFormat }` declaring *how* reasoning is wired per provider, and `AppConfig { providers, current }` as a single-authority shape. **No wholesale proxy/account rewrite import.** `src-tauri/**` also contains native quota/balance adapters and shared cache services; the current [quota review](#cockpit-tools-and-cc-switch-acquisition-to-display-review) supersedes the earlier blanket exclusion. `UsageScript` constructs HTTP requests and parses responses in bounded QuickJS; it is not selected for Fleet allowance acquisition |
| `software/cockpit-tools` | **CC-BY-NC-SA-4.0** · TypeScript + Rust | `src/services/codexModelProviderService.ts`, `CONTEXT.md`, `src-tauri/Cargo.toml` (licence) | **NonCommercial + ShareAlike; no root LICENSE file** — licence found only in `Cargo.toml` and the README. No direct reuse is admitted while license provenance and the distribution boundary remain unresolved. Two ideas to re-specify independently if wanted: N **named** API keys per connection, and a reference-count check before deleting a connection. **Do not take** its 16-IDE automated check-in/wake-up surface — automating vendor accounts is barred by F1 |
| `software/spec-kit` | MIT · Python + Markdown | `templates/commands/{analyze,converge}.md`, `templates/checklist-template.md`, `templates/spec-template.md`, `scripts/bash/check-prerequisites.sh` | **Process reference only — never a Fleet product capability.** One mechanism Fleet's spec discipline lacks: `analyze.md` is a *strictly read-only* cross-artifact pass that builds a requirements inventory keyed on stable IDs, maps every task to a requirement, and emits a coverage table with counts of ambiguity and critical issues — where a constitution conflict is automatically critical and "requires adjustment of the spec, plan, or tasks — not dilution, reinterpretation, or silent ignoring". Also: checklist markers are a gate the implement step may **read but not write** |

## Source-level intake, 2026-09-10 (owner-directed: product surfaces and capability ownership)

Read at owner direction against the areas Fleet expresses badly. Disjoint from the 2026-08-15
intake above, which covered these same three checkouts on different subtrees — nothing here
restates a row already recorded there. Same rules: a licence that forbids import decides port
target versus specification input. F3 governs license, approved-source and product fit;
TypeScript compatibility alone does not admit code, and another language alone does not reject it.

| Checkout | Licence / language | Exact evidence read | Verdict for Fleet |
|---|---|---|---|
| `software/cindy` | Apache-2.0 · docs | `docs/product-rules/core-product-principles.md` §§1–8; `docs/dev-rules/maker-core-and-agent-behavior.md` §2 | **Source evidence for P11 and PRODUCT's capability boundary.** Describes the division now recorded in Fleet: **Core** carries only what the host must provide for everyone (shell, agent/model connection, session and task lifecycle, Skill/plugin runtime + permission + isolation, multi-device continuity, marketplace mechanism); a **Skill** describes *how work is done*; a **plugin** carries rich interaction. §6 「Core 永远保持纯粹」 bars any personal/team/industry workflow, data connection or interaction surface from Core, behind four conjunctive conditions, and defaults an unclear boundary to "prove it as a Skill or plugin first". §4.1 and §7 forbid replacing structured, operable results with long non-interactive LLM text. `maker-core` §2 requires branching, validation, state machines, orchestration, permission control, error handling, retry and fallback to live in **code**, with prompt carrying only what needs language. The current ruling is P11: Components and Assistant loadouts are distinct; the old expert-kit/label model is superseded |
| `software/cindy` | Apache-2.0 · TypeScript | `apps/desktop/src/main/cindy-brain/skillSlot.ts` (532 lines); `main/maker-host/shared-global-skills.ts` (516) | **Immutable Skill snapshot and reconciliation evidence.** A declared skill reaches the agent as a link in the shared skill root pointing at an **approved snapshot** (`skill-snapshots/<id>/<revision>/<dir>`), never at the mutable install directory, then fanned into the harness's own skill directory. Invariant: 「确认框看到的 = Agent 读到的」 — manifest `skill.items` name/description must be byte-identical to the package's `SKILL.md` frontmatter, and `checkSkillMdConsistency` is the single judge shared by packing and loading, so the two ends cannot drift. Reconciliation is a single idempotent expected-vs-actual pass, so a crash leaves dangling links that self-heal next round; only links whose realpath falls inside one of two managed roots are ever removed. **Candidate invariant, not a port instruction** — it is Node/Electron-specific and assumes Cindy's ghost-plugin model |
| `software/cindy` | Apache-2.0 · TypeScript | `renderer/router.tsx` (170); `components/settings/SettingsView.tsx` (619, 45 `*Section.tsx`); `features/skillhub/` (14,037) | **Navigation discipline, directly answering the owner's "no second-level pages".** Settings is one route with the tab in `?tab=`, composing 45 section components — not 45 detail routes; `billing` is a redirect into it. SkillHub market removed both its full-screen detail page and its separate management page in favour of a floating panel inside the list, and **kept every retired route as a redirect to the list** rather than a 404. That pairing — delete the page, keep the link resolving — is the concrete form of the owner's standing 「简化不等于删除」 rule. Store completeness for comparison: category filter, sort (trending/downloads/latest/created), in-list preview, publish, review verdict, security scan, visibility tiers, team permissions; `components/InstallTargetPicker.tsx` specifies install targets as global (shared by both engines), current project, or chosen directory |
| `software/cindy` | Apache-2.0 · TypeScript | `features/right-sidebar/` (47,609) — `registry.ts`, `RightSidebarShell.tsx`, `plugins/` | **R18 lifecycle comparison evidence; current Craft PanelStack is the implementation starting point.** Tabs render through `getTabKind(kind).TabBody` from an import-side-effect registry; adding a built-in is one line. Tab bodies remain mounted at this layout layer while CSS switches visibility. This does not guarantee browser retention: the bounded browser pool can evict a busy guest; see the current browser comparison above. Third-party plugins register and unregister at runtime as `ghost:<id>` kinds following the installed manifest, with a version-counter subscription so the "+" menu and empty state notice. Nine built-ins: background tasks, file browser, iOS simulator, Orca workers, resource usage, review, subagents, terminal, web browser. The sidebar also detaches into its own window as a route peer to the main layout |
| `software/cindy` | Apache-2.0 · TypeScript | `features/cc-agent/NewMakerDraftRoute.tsx`; `components/new-chat/` (34,448) | **Answers R1's create-flow question.** `/cc-agent/new` is a transient draft with **no backend session** — creation happens on Send. One surface produces both kinds of work: `workingDir=null` **is** the conversation case, folder chosen is the project case, and the route deliberately draws neither a global sidebar nor a project selector. The retired `/new-dialogue` entry redirects here. `lastByVendor` restores each vendor's last model, effort and permission mode across switches; a vendor auth gate runs before send and routes to settings instead of failing at request time; the worktree path creates the session first, then the worktree in background, returning the message to that session's composer draft on failure |
| `software/cindy` | Apache-2.0 · docs | `docs/dev-rules/remote-and-mobile-adaptation.md` | **Failure-isolation evidence for current transport review.** Three remote shapes (SSH workspace via `maker-remote-ssh` + `remote-file-service`; device-link remote control with an IPC allowlist; mobile as a pure control client). Its governing invariant is **failure radius**: failure domains rank as one request / one peer's link / the whole relay connection / relay aggregate backpressure, and a recovery action may not act at a wider radius than the failure, with anything wider requiring a written reason that survives "what happens when one phone sleeps?". Backed by case law — escalating "reliable retry exhausted" into tearing down the whole relay connection passed wire-compat, unit tests and several reviews, then in production one sleeping phone repeatedly knocked every device on the account offline. Records that protocol compatibility, allowlists and unit tests are all immune to this class |
| `software/orca` | MIT · TypeScript | `src/main/rate-limits/` (9,582); `src/main/{claude,codex}-usage/`; `src/shared/{claude-usage-types,usage-percentage-display,status-bar-usage-mode}.ts` | **Usage evidence with distinct acquisition paths.** Some inspected Orca paths read CLI transcripts/credentials or parse a hidden PTY; the current quota comparison separately examines its Codex runtime RPC path. The private-cache/PTY acquisition paths are not Fleet candidates: Fleet must use supported provider/runtime interfaces or explicit user-supplied evidence, never private-cache scraping. Potentially useful display semantics are product-attributed versus account usage, observable scan/error state, nullable estimated cost, cache categories and worktree/run attribution. Invalid provider data must remain unknown, not 100% remaining; choose rounding only after validating units and denominators. No wholesale model or store import is approved. |
| `software/orca` | MIT · TypeScript | `src/main/claude-accounts/{managed-auth-path,runtime-selection}.ts`; `src/main/codex-accounts/` | **Credential-selection mechanism candidate over Fleet's existing credential owner.** Switching an account is selecting a pointer, never overwriting a token. Each account owns `<userData>/claude-accounts/<accountId>/auth/`, proved to be the app's by a marker file containing the account id created `0o600` with an exclusive `wx` flag; every read and write resolves the real path and refuses a symlink, a path outside the managed root, the wrong depth, or a mismatched account id, and writes atomically at `0600`. "Active" is a per-runtime pointer (`activeClaudeManagedAccountIdsByRuntime`: one for host, one per WSL distro). Because inactive accounts keep their own directories, their remaining quota is fetchable — so the user sees which account has headroom **before** switching. Alternative design in `software/cc-switch` (MIT): rewrite the CLI's config plus a local proxy transforming between responses/chat/codex-chat shapes — larger blast radius for that mechanism. This does not exclude reviewing its independent native quota/cache modules, as recorded in the current quota comparison |
| `software/openchamber` | MIT · JavaScript | `packages/web/server/lib/github/{pr-status,auth,device-flow,gh-cli-credential,rate-limit}.js` + its `DOCUMENTATION.md` | **Candidate mechanism within OpenChamber's approved R14 Git/PR remit.** One resolver answers the product question — which PR belongs to this local branch — searching across remotes, forks and upstreams, then enriching with checks, mergeability and permissions; the result is cached once and shared between the session sidebar badge and the full Git view, so both read one entry. Auth is multi-account with an explicit `activateGitHubAuth(accountId)` and an OAuth **device flow** (no client secret in a desktop app); `gh-cli-credential.js` reuses the credentials the user's existing `gh` CLI already holds rather than asking for a pasted token. Storage is `0600` with atomic writes; client id, scopes and account id each have a documented resolution order |
| `software/openchamber` | MIT · JavaScript + TypeScript | `packages/web/server/lib/browser-control/{broker,routes}.js` + its `DOCUMENTATION.md`; `packages/ui/src/lib/browser/` | **Bounded browser-control mechanism evidence.** The server can never act on a page; it publishes one action and waits. Invariants, each naming the failure it prevents: **capability belongs to the connection, not to configuration** — a client declares it can drive a page by opening its event stream with `browser=1`, which only a Chromium host does, so there is no setting to enable and no restart to remember; exactly one client performs a request, claimed over a separate endpoint because deciding by whose result arrives first is too late — by then each has already clicked; nobody listening is answered immediately with a 503 describing the environment, because a blocked wait followed by a timeout cannot be told apart from a hung page; a client that accepted and vanished still times out, because assuming success reports an interaction that never happened. The UI half adds page annotation (overlay, screenshot, prompt, session) so a human can point at the page and hand that to the agent, plus dev-server discovery, dev tunnel and crash recovery |
| `software/OpenChamber` | MIT · TypeScript/React | `packages/ui/src/components/layout/{MainLayout,ContextPanel,ContextPanelRail}.tsx`; `packages/ui/src/components/session/sidebar/{SessionSidebar,sidebar/list/SessionProjectCollection,sidebar/projects/*}` | **Selective layout evidence.** `MainLayout` keeps chat as the primary surface and routes Git, files, terminal, browser and other context tools through one `ContextPanel` + draggable rail; the panel stays mounted while tabs switch, preserving local state. Its session sidebar still contains Recent/Chats and Project-grouped sections, so it is useful evidence for ownership-aware grouping, prefetch and bounded virtualization, but **not** a model to copy for Fleet's navigation: Fleet adopts one Conversation list and treats Project/label/status/archive as predicates, avoiding duplicate conversation homes. OpenChamber supplies Fleet's Git/PR and bounded browser seams; Craft remains the visual authority and Cindy/DeepSeek the component composition references |
| `software/browser-harness` | MIT · Python | `README.md`; `browser-harness`; `agent-workspace/agent_helpers.py`; `docs/MCP.md`; `interaction-skills/` | **Module reference for the browser seam.** The harness exposes one editable CDP websocket, a stdio MCP server and a protected core while domain helpers are authored in the agent workspace; its Skills cover tabs, downloads, uploads, iframes and profiles. Fleet may learn the helper/skill separation and explicit connection failure path, but the built-in BrowserPane remains the user-facing browser authority and this browser seam does not become a universal Core controller. The optional specified-app Component is separately governed by SYS-02/EXEC-15. |
| `software/CLIProxyAPI` | MIT · Go | `README.md`; `docs/sdk-usage.md`; `test/` compatibility and failover tests | **Do not combine into Fleet's core or provider registry.** It is a local Go proxy translating multiple CLI OAuth/account protocols into OpenAI/Gemini/Claude-compatible APIs, with round-robin accounts and a management surface. Fleet already owns provider connections and usage/permission semantics; importing this would create a second model gateway and a subscription-relay product. A user-run proxy can remain an explicit external endpoint through the existing connection adapter, with no Fleet account-token scraping or automatic OAuth reuse. |
| `software/dashi-taskboard` | Apache-2.0 · TypeScript/Rust | `README.md`; `web/`; `server/database.mjs`; `shared/task-records.mjs`; `integrations/deepseek-harness/`; `test/` | **OV-026: owner-requested Board plugin source, combined with Craft.** At `1fbdedacf1b2185793daa358d24ec09e69e560eb`, `server/database.mjs:1908,2856` implements versioned issue mutations; `web/src/api.ts` and the CLI use the domain API. A business issue can have its own owner distinct from a host Session/run. Exclude the separate `ai_chat_threads/runs/events` tables (`:407,432,451`), external launcher, CDP injection and DOM-scanning overlay; use Fleet's host and Session adapters. The [Board contract](modules/components.md#board-plugin--craft-and-dashi) supersedes the earlier blanket rejection; persistence/migration still requires a bounded implementation decision. |
| `software/craft-agents-oss` | Apache-2.0 · TypeScript | v0.11.2 → v0.12.0, 97 files / +1751 −545 (bun.lock +560 of it) | **Historical v0.12 observations; these are not a current intake backlog after the v0.13.4 rebuild.** `session-tools-core/handlers/archive-session.ts` + `server-core/sessions/archive-guards.ts` make archive an agent-callable tool with guards rather than a UI-only action (R1 archive/labels). `shared/src/mcp/proxy-tool-name.ts` de-collides tool names across MCP servers — a prerequisite for any kit that projects a tool subset. `app-shell/inherited-filter-params.ts` supplied implicit creation context; current R1 rejects that behavior and uses explicit none/workspace_root context. Filtering existing Sessions must not assign a new Session. `server-core/bootstrap/lock-identity.ts` settles single-instance identity at bootstrap. Plus a startup migration in `shared/src/config/storage.ts`. No new authority in any of them |

## Owner-provided UI captures, 2026-09-10 (QoderWork CN · TRAE SOLO CN) — `EVIDENCE_ONLY`

**Licence status decides what these are.** Both are proprietary commercial desktop applications,
installed on the owner's own machine and captured there at owner direction. There is no licence
permitting reuse of their code or their visual design. They are therefore `EVIDENCE_ONLY` under the
same ceiling as `Kun` and `cockpit-tools`: **information architecture and interaction patterns may
be read and re-specified in Fleet's own terms; markup, styles, assets and visual design may not be
copied, and Fleet must not be made to look like either product.** Nothing in the captures is a port
target.

Captures live at `/Volumes/AIGC/Paper Clone Outputs/app-{qoderwork-cn,trae-work-cn}-2026-09-10T…/`
— renderer DOM over Electron CDP, with recovered stylesheets, an interaction graph, and a
reconstruction. The Qoder capture records 18,285 nodes, 488 localized materials, 4 stylesheets, 87
authored motion rules, 26 hover panels and a causality journal of 14 interactions / 64 reveals.

| Observation | Where | What Fleet does today, and the reading |
|---|---|---|
| **Three-tier token system** — palette (`--color-amber-500`, oklch) → semantic (`--color-bg-{base,layout,container,elevated,highlight,highlight-hover,mask,spotlight}`, `--color-text-{,secondary,tertiary,quaternary}`, `--color-fill-*`, `--color-border-{,secondary,tertiary}`, and a full family per status: `{base,hover,active,bg,bg-hover,border,border-hover,text}`) → component (`--agents-content-area-{bg,gap,radius}`). Four themes ship as alternate values on the semantic layer only | qoder `assets/styles/globals-*.css` (298 KB) | Fleet's `--spacing: .25rem` matches exactly; the structure does not. Fleet has one `--background` with `--card: var(--background)` — **card and page are literally the same value, so there is no elevation** — and expresses depth as `foreground` at an opacity step (UI-SPEC §1/§3). That is a defensible, simpler system and the six-colour rule is enforced by a guard after real violations (H34). The gap worth taking seriously is **surface elevation**: Fleet nests shell → workbench → panel → popover, and with one background token each layer either reads identically or someone reaches for a literal — which is exactly the H34 violation history. Adding elevation is a UI-SPEC authority change and is **not** taken here |
| **Kit cards state the payload as counts** — "8 个技能 · 3 个数据连接 · v1.1.1" in the card footer — and label the **action**, not the state: an installed kit's button reads 「定制此套件」, never "installed" | qoder 专家套件 page | Historical implementation at `fd47db6ae` was removed. The useful requirement is to show resolved payload counts, not a success verdict over an empty array |
| **Market and installed are two counted tabs in one page** — 「套件广场 20 · 已安装 1」 — with horizontal category chips and a `>` overflow scroller, not a dropdown and not a second route | qoder | The former Fleet kit-gallery helpers were removed. Keep the interaction observation as evidence for a future Component catalog, never identity-as-label |
| **The authoring entry sits inside the marketplace banner** — 「+ 让 QoderWork 帮我创建」 — so creating a kit is an offer at the moment of browsing, not a separate flow | qoder | Fleet has no authoring flow. `skills/plugin-creator/SKILL.md` (read 2026-09-10, recorded above) is the conversational contract behind that button |
| **Left nav is flat and the market is one page.** Qoder: 扩展 → {专家套件, 技能, 连接器} as three peers. Trae: 新建任务 / 插件市场 / 模板库 / 自动化 / 办公助理 / 我的文件, no nesting, with a Work / Code / Design mode switcher above it | both | Corroborates the routing discipline already recorded from Cindy's source: settings is one route with `?tab=`, retired detail routes redirect to the list rather than 404 |
| **Trae's market is a conventional app store** — featured carousel, category sections, 3-column compact rows, per-row 「+ 安装」 / 「💬 使用」 | trae | Weaker for Fleet's purpose than Qoder's: it never says what an item carries. Recorded so the comparison is not re-run |

**What this does not license.** Fleet's visual identity, colour count, spacing ladder and motion
rules remain `DESIGN.md` and `DESIGN.md`. Any change to the token structure is an
owner decision against that authority, not something an intake row can settle.

## Video candidate reality check

Revision-locked source symbols and licenses are recorded in the bounded source review above;
current checkout/document observations are recorded separately. OpenCut's present rewrite has a placeholder timeline; opencut-classic has inspectable
command/undo/export mechanisms. OpenReel, Palmier, OpenChatCut and OpenMontage are also present;
older “no checkout” claims no longer apply. These are bounded candidates, not admitted Fleet
editors. The retained discovery pool and remaining gaps are in
[the video inventory](research/video/00-CANDIDATE-INVENTORY.md). Older symbol lists in the July audit require
revalidation against the exact recorded commit, not today's HEAD.

## Named external evidence without a local checkout

These names appear in the product matrix or capability notes but are not present under
`源码参考/software` or `源码参考/plugins`. They can support a product-behavior comparison only;
they have no immutable local source evidence and must not be described as admitted source
references.

| Name | Safe status | Missing before any promotion |
|---|---|---|
| LobeHub product | `PRODUCT_REFERENCE` candidate | dated product-flow capture, same-task comparison, and a clear TipTap local-improvement test |
| `lobehub/lobe-editor` | `MODULE_REFERENCE` candidate | fixed checkout, license/NOTICE, exact editor symbols and TipTap comparison |
| MiniMax Hub / Hilo / TRAEWork analyses | `EVIDENCE_ONLY` | primary source or reproducible capture; public-bundle observations cannot prove source mechanisms |
| ChatCut | `PRODUCT_REFERENCE` candidate | reproducible product capture and explicit separation of observed behavior from vendor claims |
| Remotion | candidate; license gate | fixed checkout and current license terms for target distribution |
| Unabyss | `PRODUCT_REFERENCE` only | product behavior can inform source/structure/grant/freshness decomposition; no public source, no MCP-first internal architecture, and no hosted dependency admission |

## Current upstream synchronization boundary

The owner requests current Pi and other source updates. Twenty-five existing source mirrors have
fetched upstream default HEAD; `refs/fleet/upstream-current` keeps that observation queryable.
Original ZCode, Craft/app and look pins stay fixed. The two `*-latest` comparison checkouts move
to the fetched source while `refs/fleet/source-baselines/<sha>` retains their previous commits.

Historical OV-069 used Pi 0.99.2's Coding Agent wrapper plus Host transport/OAuth. OV-084 replaces
that wrapper with Agent Core; the existing proxy/media
patch applied cleanly to the released package; strict Anthropic schemas, overflow and retry fixes
come from upstream. Host tools, credentials, canonical Session, permissions and accounting remain
Fleet-owned; Pi's community resource discovery is not implicitly enabled by this version change.
[Release](https://github.com/earendil-works/pi/releases/tag/v0.99.2).

CLIProxyAPI `b467a83c` fixes Grok chat-proxy's version rejection even while `/models` still works.
Fleet adopts its current version header through the single subscription identity helper; catalog,
usage and inference readers share it. Offline header/transport tests do not prove live membership.
[Source](https://github.com/router-for-me/CLIProxyAPI/commit/b467a83c0fe5bf6adb1ff158db0d9f8997802427).

Craft 0.14.0 adds a decision model and guarded permissions, and fixes large-result processing,
Stop, thinking changes and source activation. These are comparisons for the existing scoped
contracts; this review does not transplant its permission owner or enable another paid model.
Cindy's `b7cb47b56` native-session preservation and authorization checks, AionCore's CLI-version
checks, Qwen recovery claims and OpenChamber 2.1.0 likewise feed the ongoing source audit.
Source fetch/review is distinct from an admitted production feature; unresolved baseline work
continues in [TODO](../TODO.md#delivery-order).

## Per-project adaptation routes

This table is the canonical second-development routing map. The bounded source-review row above
owns each repository's origin, historical review revision, inspected paths/symbols, license and
candidate/rejected mechanisms. The current intake table separately owns refreshed SHA, upstream
documentation and new observations. The linked capability section owns Fleet code entry points, data/failure contract,
implementation/proof order and acceptance. A route means **where to evaluate the evidence**, not
that every named source must be copied or added as a dependency.

Each formal reference checkout receives an owner-requested, generated `FLEET-ADAPTATION.md` at its
root (87 current guides; four evidence-only checkouts are listed separately above). It projects this route, the separate source revisions and documentation intake, linking upstream files and
Fleet contract, and is not an independently maintained plan. Regenerate with
`python3 scripts/reference-guides.py --write`; verify with `python3 scripts/reference-guides.py --check`.
The generator refuses unrecorded HEADs, missing/escaping documentation, occupied non-generated paths
and missing contracts. Do not change a historical source lock to make generation pass: record and
inspect the new checkout separately. Reference
source, refs, existing local changes and license notices remain untouched. Generated guide files
are expected local reference metadata, not upstream source modifications or intake completion.

For C/M/X and restricted-license projects, read the rejection boundary before attempting extraction.
No guide upgrades a mechanism into an approved dependency, a standalone product fork, or permission
to modify this reference checkout's implementation. Any admitted extraction lands in Fleet through
the linked owner; a requested independent product fork needs its own explicit scope.

| Checkout | Fleet execution contracts |
|---|---|
| `software/harnessrouter` | [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/deepagentsjs` | [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/openai-agents-js` | [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/agent-client-protocol` | [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `plugins/mcp-apps` | [CORE-11](modules/components.md#execution-core-11) |
| `plugins/cindy-official-plugins` | [ORCH-11](modules/marketplace.md#execution-orch-11) |
| `plugins/hermes-plugin-claude-subscription-directsdk` | [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/craft-agents-oss-latest` | [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `plugins/hyperframes-latest` | [CREATE-09](modules/media.md#execution-create-09) |
| `plugins/hyperframes-current` | [CREATE-09](modules/media.md#execution-create-09), [ORCH-05](modules/media.md#execution-orch-05) |
| `software/minimax-code` | [EXEC-05](modules/agent-core.md#execution-exec-05), [ORCH-11](modules/marketplace.md#execution-orch-11), [CREATE-09](modules/media.md#execution-create-09) |
| `software/goose` | [EXEC-05](modules/agent-core.md#execution-exec-05), [ORCH-11](modules/marketplace.md#execution-orch-11), [CORE-11](modules/components.md#execution-core-11) |
| `plugins/SoL-Pi` | [INTEL-01](modules/memory.md#execution-intel-01), [INTEL-02](modules/memory.md#execution-intel-02), [INTEL-07](modules/context.md#execution-intel-07) |
| `software/craft-agents-oss` | [CORE-01](modules/agent-core.md#execution-core-01), [CORE-02](modules/agent-core.md#execution-core-02), [CORE-03](modules/agent-core.md#execution-core-03), [EXEC-01](modules/agent-core.md#execution-exec-01), [INFO-03](modules/browser.md#execution-info-03) |
| `software/craft-agents-oss-v0.10.5` | [CORE-01](modules/agent-core.md#execution-core-01), [CORE-10](modules/agent-core.md#execution-core-10), [CORE-11](modules/components.md#execution-core-11) |
| `software/cindy` | [CORE-11](modules/components.md#execution-core-11), [ORCH-03](modules/components.md#execution-orch-03), [ORCH-11](modules/marketplace.md#execution-orch-11), [INFO-03](modules/browser.md#execution-info-03), [EXEC-14](modules/context.md#execution-exec-14) |
| `software/openchamber` | [EXEC-13](modules/remote.md#execution-exec-13), [EXEC-07](modules/remote.md#execution-exec-07), [INFO-03](modules/browser.md#execution-info-03), [INTEL-04](modules/context.md#execution-intel-04) |
| `software/deepseek-harness` | [ORCH-03](modules/components.md#execution-orch-03), [ORCH-11](modules/marketplace.md#execution-orch-11), [CORE-11](modules/components.md#execution-core-11) |
| `software/AionCore` | [CORE-03](modules/agent-core.md#execution-core-03), [EXEC-05](modules/agent-core.md#execution-exec-05), [ORCH-06](modules/orchestration.md#execution-orch-06) |
| `software/AionUi` | [EXEC-14](modules/context.md#execution-exec-14), [INTEL-03](modules/models.md#execution-intel-03), [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/CLIProxyAPI` | [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-03](modules/models.md#execution-intel-03) |
| `software/codex` | [EXEC-01](modules/agent-core.md#execution-exec-01), [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-04](modules/context.md#execution-intel-04) |
| `software/grok-build` | [EXEC-14](modules/context.md#execution-exec-14), [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-03](modules/models.md#execution-intel-03) |
| `software/Qwen-MM-Plugins` | [CREATE-03](modules/media.md#execution-create-03), [INTEL-03](modules/models.md#execution-intel-03), [ORCH-11](modules/marketplace.md#execution-orch-11) |
| `software/Qwen-Live-Harness` | [CREATE-04](modules/media.md#execution-create-04), [ORCH-05](modules/media.md#execution-orch-05), [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/pi-multimodal-proxy` | [CREATE-03](modules/media.md#execution-create-03), [INTEL-03](modules/models.md#execution-intel-03), [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/pi-claude-bridge` | [INTEL-03](modules/models.md#execution-intel-03), [EXEC-05](modules/agent-core.md#execution-exec-05), [ORCH-11](modules/marketplace.md#execution-orch-11) |
| `software/pi-mono-latest` | [EXEC-05](modules/agent-core.md#execution-exec-05), [CORE-03](modules/agent-core.md#execution-core-03), [ORCH-11](modules/marketplace.md#execution-orch-11) |
| `software/herdr` | [EXEC-05](modules/agent-core.md#execution-exec-05), [ORCH-06](modules/orchestration.md#execution-orch-06) |
| `software/hermes-agent` | [INTEL-05](modules/memory.md#execution-intel-05), [EXEC-11](modules/remote.md#execution-exec-11), [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/kimi-code` | [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-01](modules/memory.md#execution-intel-01) |
| `software/Kun` | [EXEC-05](modules/agent-core.md#execution-exec-05), [ORCH-06](modules/orchestration.md#execution-orch-06) |
| `software/multica` | [CORE-04](modules/agent-core.md#execution-core-04), [EXEC-04](modules/agent-core.md#execution-exec-04), [ORCH-06](modules/orchestration.md#execution-orch-06) |
| `software/omnigent` | [EXEC-05](modules/agent-core.md#execution-exec-05), [EXEC-14](modules/context.md#execution-exec-14) |
| `software/openclaw` | [INTEL-05](modules/memory.md#execution-intel-05), [EXEC-11](modules/remote.md#execution-exec-11), [INTEL-01](modules/memory.md#execution-intel-01) |
| `software/opencode` | [EXEC-04](modules/agent-core.md#execution-exec-04), [EXEC-01](modules/agent-core.md#execution-exec-01), [INTEL-02](modules/memory.md#execution-intel-02) |
| `software/OpenHands` | [CREATE-01](modules/canvas.md#execution-create-01), [ORCH-01](modules/workflow.md#execution-orch-01) |
| `software/orca` | [EXEC-15](modules/remote.md#execution-exec-15), [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-04](modules/context.md#execution-intel-04) |
| `software/pi-mono` | [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-01](modules/memory.md#execution-intel-01), [INTEL-02](modules/memory.md#execution-intel-02) |
| `software/waku` | [EXEC-05](modules/agent-core.md#execution-exec-05), [EXEC-03](modules/agent-core.md#execution-exec-03) |
| `software/ZCode` | [CORE-05](modules/agent-core.md#execution-core-05), [ORCH-11](modules/marketplace.md#execution-orch-11), [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/cc-switch` | [INTEL-04](modules/context.md#execution-intel-04), [INTEL-03](modules/models.md#execution-intel-03) |
| `software/cockpit-tools` | [INTEL-04](modules/context.md#execution-intel-04), [CORE-05](modules/agent-core.md#execution-core-05) |
| `software/dashi-taskboard` | [CORE-04](modules/agent-core.md#execution-core-04), [EXEC-02](modules/agent-core.md#execution-exec-02) |
| `software/OpenSandbox` | [EXEC-08](modules/agent-core.md#execution-exec-08) |
| `software/spec-kit` | [INTEL-07](modules/context.md#execution-intel-07) |
| `software/Cowart` | [CREATE-01](modules/canvas.md#execution-create-01), [CREATE-03](modules/media.md#execution-create-03), [INFO-03](modules/browser.md#execution-info-03) |
| `software/genoffice` | [INFO-05](modules/canvas.md#execution-info-05), [CREATE-08](modules/media.md#execution-create-08) |
| `software/html-anything` | [INFO-04](modules/browser.md#execution-info-04), [CREATE-07](modules/canvas.md#execution-create-07) |
| `software/open-design` | [CREATE-06](modules/canvas.md#execution-create-06), [CREATE-07](modules/canvas.md#execution-create-07), [INFO-02](modules/browser.md#execution-info-02) |
| `software/openpencil` | [CREATE-06](modules/canvas.md#execution-create-06), [INFO-05](modules/canvas.md#execution-info-05) |
| `software/penpot` | [CREATE-06](modules/canvas.md#execution-create-06) |
| `software/tldraw` | [CREATE-01](modules/canvas.md#execution-create-01), [CREATE-06](modules/canvas.md#execution-create-06) |
| `software/OpenChatCut` | [CREATE-02](modules/media.md#execution-create-02), [ORCH-05](modules/media.md#execution-orch-05), [CREATE-12](modules/media.md#execution-create-12) |
| `software/OpenMontage` | [CREATE-10](modules/media.md#execution-create-10), [CREATE-12](modules/media.md#execution-create-12) |
| `software/opencut` | [CREATE-02](modules/media.md#execution-create-02) |
| `software/opencut-classic` | [CREATE-02](modules/media.md#execution-create-02) |
| `software/openreel-video` | [CREATE-02](modules/media.md#execution-create-02), [CREATE-04](modules/media.md#execution-create-04), [ORCH-05](modules/media.md#execution-orch-05) |
| `software/palmier-pro` | [CREATE-02](modules/media.md#execution-create-02) |
| `plugins/dockview` | [CORE-11](modules/components.md#execution-core-11) |
| `plugins/react-resizable-panels` | [CORE-11](modules/components.md#execution-core-11) |
| `plugins/react-rnd` | [CORE-11](modules/components.md#execution-core-11) |
| `plugins/xyflow` | [CREATE-01](modules/canvas.md#execution-create-01) |
| `plugins/hyperframes` | [CREATE-09](modules/media.md#execution-create-09), [CREATE-12](modules/media.md#execution-create-12), [ORCH-05](modules/media.md#execution-orch-05) |
| `plugins/markitdown` | [INFO-04](modules/browser.md#execution-info-04), [INFO-08](modules/browser.md#execution-info-08) |
| `software/browser-harness` | [INFO-03](modules/browser.md#execution-info-03) |
| `software/browser-use` | [INFO-03](modules/browser.md#execution-info-03), [EXEC-01](modules/agent-core.md#execution-exec-01) |
| `software/flowgram.ai` | [ORCH-01](modules/workflow.md#execution-orch-01), [CREATE-01](modules/canvas.md#execution-create-01) |
| `software/mcp-registry` | [ORCH-12](modules/marketplace.md#execution-orch-12), [ORCH-04](modules/marketplace.md#execution-orch-04) |
| `plugins/GPTCache` | [INTEL-02](modules/memory.md#execution-intel-02) |
| `plugins/LLMLingua` | [INTEL-02](modules/memory.md#execution-intel-02) |
| `plugins/SuperClaude_Framework` | [INTEL-07](modules/context.md#execution-intel-07) |
| `plugins/agentmemory` | [INTEL-05](modules/memory.md#execution-intel-05) |
| `plugins/agentskills` | [INTEL-06](modules/memory.md#execution-intel-06), [ORCH-10](modules/marketplace.md#execution-orch-10) |
| `plugins/caveman` | [INTEL-02](modules/memory.md#execution-intel-02) |
| `plugins/claude-mem` | [INTEL-05](modules/memory.md#execution-intel-05) |
| `plugins/claude-task-master` | [CORE-04](modules/agent-core.md#execution-core-04), [EXEC-04](modules/agent-core.md#execution-exec-04) |
| `plugins/claude-token-efficient` | [INTEL-02](modules/memory.md#execution-intel-02) |
| `plugins/claw-compactor` | [INTEL-01](modules/memory.md#execution-intel-01), [INTEL-02](modules/memory.md#execution-intel-02) |
| `plugins/context7` | [INFO-06](modules/browser.md#execution-info-06), [ORCH-12](modules/marketplace.md#execution-orch-12) |
| `plugins/letta` | [INTEL-05](modules/memory.md#execution-intel-05) |
| `plugins/mem0` | [INTEL-05](modules/memory.md#execution-intel-05), [INTEL-07](modules/context.md#execution-intel-07) |
| `plugins/planning-with-files` | [EXEC-14](modules/context.md#execution-exec-14) |
| `plugins/playwright-mcp` | [INFO-03](modules/browser.md#execution-info-03), [ORCH-04](modules/marketplace.md#execution-orch-04) |
| `plugins/repomix` | [INFO-06](modules/browser.md#execution-info-06), [INTEL-02](modules/memory.md#execution-intel-02), [ORCH-10](modules/marketplace.md#execution-orch-10) |

| `software/openstock` | [ORCH-03](modules/components.md#execution-orch-03), [ORCH-01](modules/workflow.md#execution-orch-01) |
| `software/octop` | [ORCH-03](modules/components.md#execution-orch-03), [ORCH-11](modules/marketplace.md#execution-orch-11), [EXEC-05](modules/agent-core.md#execution-exec-05), [EXEC-14](modules/context.md#execution-exec-14) |

## Required promotion record

Before any candidate is promoted in the product matrix or a module packet, add a row to the
admission record with all of the following:

1. repository URL, immutable commit and checkout path;
2. exact license/NOTICE and whether the target distribution is permitted;
3. exact files, symbols, caller and tests that prove the mechanism;
4. the concrete Fleet/Craft gap, the owning software's native facilities, a small local correction
   and at least one relevant same-task alternative;
5. the mechanism-to-seam mapping and demonstrated benefit after integration/maintenance cost;
   compare frontend and backend separately and admit only the part that wins;
6. failure, cancellation, recovery and deletion implications;
7. dated same-task evidence (observed interaction or relevant failure/data-path tests; measured
   performance where claimed) and a traceable admission decision; obtain owner approval
   where the existing source, production-dependency or authority checkpoint applies. A particular
   model or CLI is not required to perform the review.

Until all seven are present, use `candidate`, `INSUFFICIENT_COMPARISON` or `EVIDENCE_ONLY` as
appropriate. A row in `CAPABILITY-REFERENCE-MAP.md` or `capabilities.md` is a pointer, not
evidence.

## Owner-provided product reverse-analysis reports (EVIDENCE_ONLY)

These are analysis documents, not local checkouts: no commit, no license to import, no code
copying. They ground product/mechanism decisions only.

| Report | Subject | Status | Grounds consumed by |
|---|---|---|---|
| [`canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`](research/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md) | Mayi Canvas v3.4.4 — custom DOM+translate3d+SVG infinite canvas; node/port/connection system; performance mode, workers, object pools; local HTTP agent bridge with self-describing capabilities, allowlisted/batch actions, and token; provider proxy layer; project ZIP format | `EVIDENCE_ONLY` | Decision E5a (DOM-family + in-family fallback), `architecture.md` §§4.5/7, matrix canvas/AIGC rows |
| [`plugins/00-MINIMAX-HUB-PLUGIN-STACK.md`](research/plugins/00-MINIMAX-HUB-PLUGIN-STACK.md) | MiniMax Hub 1.1.1 six official plugins — iframe sandbox, postMessage protocol-v2, `window.hub` SDK, BlobRef upload, placeholder→dag→insert with permanent IDs, three implementation patterns, host requirements | `EVIDENCE_ONLY` | `architecture.md` §§3/7 module registration, matrix plugins/extensions rows, R15 SYS-08 packet |

## Owner-requested six-repo scan (README + licence; two already source-reviewed)

Owner asked whether these six GitHub projects have reference or combination value. Verdicts
follow [`product.md`](product.md): no second kernel, no second task store, no universal
Core computer controller, no second OS sandbox, no telemetry as a product feature. The optional
R16 specified-app Component follows SYS-02/EXEC-15 and does not adopt these products wholesale. The verdicts concern
these products and their integration boundaries, not a language prohibition under F3.

| Repo | Licence / language | What it actually is | Verdict |
|---|---|---|---|
| [Niall-Young/Canvasight](https://github.com/Niall-Young/Canvasight) | MIT · TypeScript · Codex plugin | Task/asset DAG canvas (`Page → Group → Task/Asset`) that a person and Codex edit, then Run into the *current Codex task*. Concurrent merge + conflict-copy pages. Not a production image/video/web/PPT board. | **`EVIDENCE_ONLY` for Fleet's own canvas collab** (same-board edit, graph write, conflict copies, assets as first-class nodes). Do not install it, do not inject Codex, do not make the Fleet canvas a task DAG for an external agent. Production canvas stays Fleet's. |
| [router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) | MIT · **Go** | Local proxy that turns CLI OAuth subscriptions (Claude Code, Codex, Gemini, Grok Build, …) into OpenAI/Claude/Gemini-shaped HTTP APIs, with multi-account round-robin. | **Do not combine as a built-in gateway.** Fleet already has provider OAuth. Building this in would be a second model gateway and a ToS-sensitive “subscription as API” product. A person may point Fleet at a proxy they already run; that is an optional remote connection, not a Fleet capability. |
| [chuspeeism/dashi-taskboard](https://github.com/chuspeeism/dashi-taskboard) | Apache-2.0 · TS + Rust/Tauri | Local-first issue board with SQLite, CLI/Skill, optimistic edits and optional external-app/cloud integrations. | **Revised by OV-026:** adapt its domain/UI as the requested Craft+Dashi Board plugin. One issue owner shared by UI and Agent; host owns conversations, execution and permissions. Do not bring CDP injection, unauthenticated LAN/cloud defaults or a second Agent runner. See [Board contract](modules/components.md#board-plugin--craft-and-dashi); root licensing does not clear every dependency. |
| [opensandbox-group/OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) | Apache-2.0 · Go+Python | Docker/K8s sandbox control plane + in-sandbox daemon. Already source-reviewed at `f8ed8734ce1f`. | **Second-sandbox integration remains excluded.** `product.md` forbids a second OS sandbox. A second sandbox stays excluded; EXEC-08 verifies inherited isolation under R0/R2. If isolation is ever reopened, the reference is omnigent's daemonless per-spawn seam, not this. |
| [trailhq/Graft](https://github.com/trailhq/Graft) | MIT · TypeScript | Local markdown+tree-sitter codebase graph (`graft/`) so coding agents stop re-exploring. Wires Claude Code/Cursor/Codex via hooks/MCP. Opt-out telemetry. | **`EVIDENCE_ONLY` for SYS-03** (durable repo map, blast radius, “onboard once”). Do not take the other-agent hook wiring or telemetry. Do not stand up a second context authority. A later context-economy slice may port the *idea* (files on disk the agent greps) into Fleet's own routing, not install Graft. |
| [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | MIT · TypeScript | “Everything is a plugin” Cordis microkernel. Already source-reviewed; Decision **E14**. | **Unchanged: do not rebuild Fleet on it.** Admitted only: service definition/provider/consumer vocabulary, per-session composition invariants, “enforce in the operation that decides”. Rejected: Cordis as root, 167-package split, live self-modification. Combining it as the runtime would be a second kernel. |

## Owner-requested Cowart clone (2026-09-11)

Historical observation: `源码参考/software/Cowart` @ `47206ab` (2026-09-09). The current `43fc8882daf2` review appears above; the later SHA does not retroactively validate this observation. Cowart **MIT**; renderer depends on **tldraw ^5.1.1** (production license gate — same as existing tldraw row). Ships GA4 (`G-SJYHV19YZ9`); telemetry is out of product.

| What it is | Verdict |
|---|---|
| Codex-native infinite-canvas **plugin**: tldraw widget + MCP + three skills. Persist under the *user project* `canvas/pages/<id>/`. AI 图片框 (prompt + refs → replace holder), annotation screenshot → clean image beside original, AI HTML 16:9 embed, AI Slides (pages + fullscreen). MCP: `get/save_cowart_canvas_state`, `get_cowart_selection`, `insert_cowart_image`, `insert_cowart_html_draft`, widget render. | **Bounded production-board interaction reference** (one board for image / HTML-site / deck). Closer to [`product.md`](product.md) than Canvasight (task DAG) or Craft Pages (mini-apps). **Do not install, do not weld to Codex, do not import tldraw, do not take GA4.** When R7 is built: compare the *holder → generate → replace*, *annotate → revise beside*, *HTML/Slides as canvas objects*, and *project-local canvas/ storage* into Fleet's pane — person and agent edit the same board. Not this slice. |

## Shared UI library comparison

Owner input: `/Users/lullwen/Documents/TraeWork.zip` (SHA-256 `ffc1f2b6022e4e4b4f4013984d7c8a73bc7d6a56bedf1c43fc01dcd252e4ebd9`). Inspected the archive directory, README, consumption manifest and button/form contracts without running its scripts or adopting its bundled instructions. It contains 671 SVGs, 14 component contracts and 24 static HTML previews/showcases; no React/TypeScript runtime, package manifest or license file was found. Its own manifest identifies Light-mode tokens and medium-confidence contracts derived from previews. Borrow its indexed tokens/components/states/examples organization; do not substitute its CSS/assets for the current theme and interaction owners.

| Candidate | Inspected evidence | Decision for this existing app |
|---|---|---|
| [shadcn/ui](https://github.com/shadcn-ui/ui) + [Radix](https://github.com/radix-ui/primitives) | New sparse source reference `源码参考/software/shadcn-ui` at `98a1fe67b439324ddc857f47fbdce056600a4329` (MIT); `apps/v4/registry/bases/radix/ui/{button,context-menu}.tsx` compared with candidate equivalents. Candidate `packages/ui/components.json` already selects radix-mira/Lucide; 45 files exist under `components/ui`. | Retain and consolidate the existing wrappers. Upstream supplies primitive behavior/source distribution; Fleet tokens and business patterns still own the appearance. Do not rerun an initializer or replace local wrappers wholesale. |
| [Base UI](https://github.com/mui/base-ui) / [React Aria](https://github.com/adobe/react-spectrum) | Official repositories identify unstyled accessible primitives; Base UI is MIT, React Spectrum/Aria is Apache-2.0. shadcn `skills/shadcn/rules/base-vs-radix.md` documents incompatible composition/selection APIs. | Useful behavioral references; no measured current defect warrants replacing all existing Radix overlays, focus and keyboard paths. This comparison is not a runtime acceptance test. |
| [Mantine](https://github.com/mantinedev/mantine) / [Ant Design](https://github.com/ant-design/ant-design) | Official source repositories provide larger React component suites. Their breadth does not remove migration, token and interaction reconciliation. | No second general-purpose UI system. Revisit a specialized missing control on concrete evidence rather than mixing page-by-page libraries. |
| [Lucide](https://github.com/lucide-icons/lucide) + [Lobe Icons](https://github.com/lobehub/lobe-icons) | Lucide is ISC and deliberately excludes brand logos; Lobe Icons is MIT and supplies AI/provider branding. Both are already pinned dependencies. `ProviderLogo.tsx` consumes local static SVG assets following the owner's Lobe guideline. | Lucide for actions/status; shared local provider-brand projection with original slots/backplates. [UIEDSVG](https://uiedsvg.com/components/comet-api) publishes the same Bailian SVG paths as pinned Lobe1.95.1; Model Studio uses its product glyph. BigModel current public favicon/header assets show Z, and OV-092 selects the ChatGPT account mark independently of its native Codex executor. [OpenRouter](https://openrouter.ai/brand) requires supplied theme colors: use the already admitted Grape/Volt SVGs rather than recoloring the mark. OAuth/account surfaces reuse ProviderLogo; original source-asset provenance remains in model-provider-logo-sources.json. No new dependency/CDN or per-page icon system. |

The missing work is enforcement and reusable **business patterns**, not another download: settings rows, credential/model draft rows, provider cards, capability rows, empty/error/loading states and page-local Agent entry. Keep actual implementations as the source of truth and add rendered light/dark, locale, keyboard and narrow-window checks as each pattern lands. An inventory or visual showcase is not completion of subscription/media/Agent behavior.

## Context meter and token attribution comparison

Inspected source locks: ZCode `29628c9acdb81b703bbd4080c207a0e7ce5e276e`, Cindy
`374923c219ba93c405c237647ea7f1a6ac5d604f`, OpenCode
`b471c2b4495747353af768fbf2e0790c9d820ce2`. Paths below are relative to
`源码参考/software/<project>/`. This is source evidence and bounded pure fixtures, not a new live
inference, restart, cost benchmark or acceptance of another product's state system.
Remote refs were refreshed: ZCode and OpenCode remain at these heads. Cindy's remote default is
`2d4507f9c3ad893dc950f4270f0e7e52859327da`; the inspected token/runtime files and package versions
are unchanged, and the two changed Session files only add Bot group-lane provenance. That diff was
read directly; the retained reference checkout and its untracked adaptation note remain preserved.

| Boundary | ZCode | Cindy | OpenCode |
|---|---|---|---|
| Ring numerator | V4 `product-projection.ts:4522` uses the latest **main** model call's normalized input + output; auxiliary/compaction calls do not replace it. This proxies the last request, not a fresh measurement of all retained context. | `packages/maker-core/src/agents/shared/usage-tracker.ts:450` uses the last API input + separate cache-read/cache-create, without current output. Native Claude can update input at message-start; Codex uses tokenUsage.last; Pi updates at message-end. | `packages/app/src/components/session/session-context-metrics.ts:28` sums the last assistant's uncached input, visible output, reasoning and separate caches. It does not exclude summary calls. |
| Capacity | Current Registry config; generic fallback and user correction are not provider observations. | Runtime → verified catalog → catalog, with a 200K non-Codex fallback (`renderer/lib/contextWindow.ts:15`). Native Codex distinguishes total, usable and auto-compact threshold; Pi's working budget is separate. | Provider registry takes models.dev, configured limits and selected provider loaders (`provider/provider.ts:1284,1558`); unknown custom capacity is 0. UI coalesces unknown usage to 0%, which Fleet must not inherit. |
| Detailed attribution | ContextBuilder system/meta/Skills/tool prompt and serialized tools/messages. Runtime has estimates, but renderer receives `{source,chars}` and percentages use characters (`core/runtime/methods/context-usage.ts:234,310`; UI `chat-input-toolbar/contextUsage.tsx:166`). Tool inventory contains some non-wire metadata; serialized media can skew character counts. | `/context` is an on-demand system card, separate from the ring (`CCAgentSessionView.tsx:3573`). Claude forwards SDK runtime categories; Pi returns Messages only; Codex does not support this card. SDK category precision is undocumented, so call it runtime-reported, not provider billing. | `session-context-breakdown.ts` estimates chars/4 across stored UI messages, approximates tool args by key count, and rescales categories to the last **uncached** input. This is not the actual final request. Its explanatory “Approximate” note is hidden in `session-context-tab.tsx:344`. |
| Cache / cost | Normalized input already includes cache; do not add cache or reasoning again. Popup hides cache hit rates below 78% in production (`contextUsage.tsx:117`). Cost is 0/null placeholders, not a free-use receipt. | Per-runtime normalizers handle separate cache buckets and duplicate/cumulative frames. Last-context pressure differs from turn/session accounting. | V1 `session/session.ts:361` subtracts cache from SDK v6 input and reasoning from output before separate buckets; V2 `core/session/runner/publish-llm-event.ts:18` uses normalized nonCachedInput/visibleOutput. Session cost is separate from the latest request ring. |
| Refresh / persistence | Finish usage → ModelComplete → V4 snapshot → composer. Assistant/step-finish usage persists; default eventStore is memory and breakdown has no equivalent cold-restart guarantee (`zcode-protocol/server.ts:239`, `session-mapper.ts:643,728`). | Host persists done-context snapshots; renderer does not own writes. Duplicated/late Codex accounting frames are rejected; native capacity reads bind model/account generation. Newest in-flight values need not survive a crash. | Step-finish usage is persisted/published, then `message.updated` reconciles the UI store. Text streaming alone does not establish new real token counts. The context panel derives its chart from current client history, not a durable per-request composition snapshot. |
| Compression / model switch | `truePostCompactTokenCount` is a local estimate, while `postCompactTokenCount` is summary-call usage. Missing post-counts and capacity-only model updates can retain old used values without stale metadata (`product-projection.ts:4385,4598`; `compact-active.ts:545`). | Claude/Pi only replace occupancy when a valid post-compact count exists; no universal stale reset. Native-window queries have stronger identity binding, but non-Codex fallbacks/100%-clamped text remain unsuitable. | Last-assistant selection can choose a summary's token count and model capacity. History-based classification can include compacted history or the current assistant output. |

Pure fixtures confirmed OpenCode input=100, cache-read=900, output=50, reasoning=50 produces ring
1100; its attribution can rescale 400 user chars + 800 assistant chars to 33/66/1 against input=100.
A last summary is selected even when its model capacity is absent. Cindy's tracker fixture kept
1050 input-context tokens after a zero post-compact value and changed to 200 only when a positive
count arrived; repeated usage frames did not double count. The Claude SDK 0.2.112 interface exposes
categories and a separate apiUsage, but no category source/confidence flag; the process wrapper
alone does not prove its internal counting algorithm.

**Fleet recommendation:** keep the ZCode ring/hover-card and the existing V4 Session snapshot owner.
Carry request/model/connection revision, observation time, scope and reported/estimated/unknown/stale
semantics end to end. Preserve total capacity, usable/working budget and compaction threshold as
separate facts. Use provider usage for normalized per-call consumption, native runtime context
reports when available, and explicitly labelled final-request estimates otherwise. Classify the
actual model-facing prompt/tools after projection; do not call inventory characters token accounting,
count base64 as text tokens, or silently rescale categories to make a bill total fit. Preserve
Cindy's separation between occupancy and native context analysis, and OpenCode's inspectable detail
view, without importing their Session stores or hiding estimation. Persist count/provenance evidence
with the existing call/step/Session records; raw prompt retention remains a separate user preference.
Implementation and acceptance belong to the current INTEL-01/02/04 and model-foundation workflow.

## Multi-account quota and conversation access

Source locks: ZCode `29628c9acdb8`, Cockpit Tools `a24199f73505`, CC Switch `1ee2fdc3a791`,
Cindy retained `374923c219ba` (latest fetched objects and relevant delta were checked above).
No reference was repinned, no credential was read, and no allowance API was called for this audit.

| Source | Verified mechanism | Transfer boundary |
|---|---|---|
| ZCode `packages/ui/src/lib/codingPlanQuotaPresentation.ts:67`, `chat-input-toolbar/StartPlanContextBalance.tsx:20` | Coding Plan remaining is clamped `100-used`; Start Plan is clamped `remaining/total`. Both cap at 100%. `bigmodelUsageQuotaProvider.ts:1294` preserves promotional buckets separately. | This pin does not establish a promotional >100% capacity formula. `WorkspaceSidebarFooterPlanBadgeHelpers.ts:44` takes plan names from quota/subscription data, not capacity multipliers. |
| ZCode `settings/model-provider-section/StatusCards.tsx:56,1028` and `styles.css:522,667` | Original quota cards use a 6px `secondary` track and theme-aware `usage-chart` colors per window. The shared Progress's `bg-muted` has no corresponding token in this host. | Candidate shared Progress now has the valid track; `SubscriptionAllowanceDetails` reuses the original window palette in Settings and the composer. Real renderer geometry/color checks cover partial, empty, unknown and unlimited readings at 320px in both theme families; the primary also inspected the live account card in light/dark. This is visual/geometry evidence, not a new quota-acquisition claim or owner acceptance. |
| [OpenAI's Work and Codex usage guidance](https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex) | Pro 5x/20x examples are estimated model-specific five-hour message ranges, not fixed message limits. Five-hour windows start with each account's first request; weekly limits can independently bind usage. Task, model, reasoning, Fast and tools alter consumption. | A plan-name multiplier cannot transform two reported percentages into one exact, transferable allowance. Preserve each account/window identity and reset time. |
| Cockpit `src/utils/codexQuotaPool.ts:32` and `:63` | Group by lowercased window label, sum remaining percentages, record account count; compute ALL and per-plan groups. `CodexAccountsOverviewPanel.tsx:2192` displays this pool. | This is a sum of account percentages, not combined native remaining capacity. No denominator, tier weighting or freshness check. Bare Pro→20X in `src/types/codex.ts:1114` is a display rule, not provider proof; PRO grouping merges variants. |
| CC Switch `src/components/CodexOauthAccountQuota.tsx:12`, `src/lib/query/subscription.ts:35` | Per-account quota with shared account-keyed queries. Transient failures retain dated last-good for at most 10 minutes; identity/auth/parse changes clear it. | No cross-account percentage aggregate in the inspected path. Some USD limits exist for particular vendors, not all subscriptions. |
| Cindy `renderer/hooks/useAccountUsage.ts:74`, `components/status/TodaySpendChip.tsx:1102` | Conversation chip opens a quota card on hover/focus; provider/model/remote identity changes dismiss stale content. Account, route and model choose the quota bucket. | `QuotaHoverCard.tsx:143` marks data older than five minutes; reset passage does not imply full replenishment. Credits and windows are separate. No mixed-account aggregation. |
| Candidate `packages/services/src/model-provider/subscriptionUsage.ts:5`, `subscriptionUsageCache.ts:35`, `chat-input-toolbar/ConversationSubscriptionUsage.tsx` | Existing owner provides account-scoped percentages, plan, native bucket/window/reset/observation facts, isolated cache and stale-result guards. The conversation follows the selected model's persisted last-request account ID, including a successful failover, and provisionally labels the default before a receipt. A missing ID cannot borrow a sibling quota. | No absolute used/limit, verified multiplier or all-account reader. The popup does not claim an account switch before the next request receipt; the default before first use is provisional. |

Landing contract: reuse the existing subscription owner/cache and original ZCode/Cindy quota-card
interaction. The conversation shows the selected model's last served account and its native windows;
before first use it labels the configured default as provisional. Account comparison stays in
Model Settings, with no manual inspection choice in the Token ring.
Do not derive total capacity from 20X/1X marketing names, sum short/week/model limits, double-count
one identity across connections, or silently switch accounts while reading quota. A pooled native
amount is only defensible with verified compatible units, limits, scope and periods; current
percentage-only adapters do not satisfy this. Conversation receipt binding is implemented in the
isolated candidate; all-account capacity projection is not. Cockpit pure-fixture execution
was unavailable because its Tauri dependency was absent; the formula is source evidence only.

## Usage accounting and quota-monitor comparison

OV-041 requests CC Switch statistics plus five named monitoring/accounting projects. Retained
sources were inspected read-only; no application/scanner ran, no personal CLI logs or credentials
were read, and no proxy/service was installed. New shallow clones are retained under `software/`:
`AIUsage`, `one-api`, `CPA-Manager-Plus` and `codeburn`. CodexBar and CC Switch already existed.

| Source / inspected revision / license | Strongest implementation evidence | Limits not to transfer |
|---|---|---|
| [CodexBar](https://github.com/steipete/CodexBar) · retained `78ba5a1e65e6859da59a21b799df95ab91bc0b89`; fetched `12691b5cd0284760b68da6134e7981fb790a0b63` · MIT | `Sources/CodexBarCore/CostProvenance.swift:3` distinguishes list-price estimate, vendor-metered, mixed and unknown, explicitly not a billing receipt; priced/unpriced/unmetered/estimated coverage remains separate. `CostUsageModels.swift:226` preserves nullable totals and partial-history lower bounds. `Vendored/CostUsage/CostUsageScanner+Claude.swift:243` reconciles message/request identity; `CostUsageScanner+CacheHelpers.swift:874` retains cumulative watermark/interleaved/fork state across incremental scans. `Sources/CodexBar/UsageStore+TokenCost.swift:799` rejects stale scope/config/credential publication. | Local “This Mac” consumption is not necessarily the selected account's spend. Do not import broad credential discovery or Swift UI. The relevant accounting/scanner files were unchanged in the fetched revision; the retained checkout was not moved. |
| [AIUsage](https://github.com/sylearn/AIUsage) · `5870b477d90cb7fb7709aa475efd9aa06da576cc` · Apache-2.0 | `AIUsage/ViewModels/ProxyViewModel+ProxyServer.swift:646` freezes estimated price from actual node ID and preserves requested/upstream models; `Models/ProxyConfiguration.swift:93` records price provenance/time. `ProxyViewModel+UsageArchive.swift:23` replaces a recomputed dirty-day bucket while preserving older archives. Codex `Providers/CodexCostProvider+Scanning.swift:27` recomputes related rollouts and parents. | `ProxyViewModel+LogManagement.swift:35` appends with fresh UUID; upstreamRequestId is not an idempotency key. Local Codex `CodexCostProvider+FileParsing.swift:119` deliberately assigns cost=0 and no reasoning bucket. Its previousTotals fallback can regress on out-of-order cumulative snapshots. Whole-day replacement is not request-event deduplication. |
| [CodeBurn](https://github.com/getagentseal/codeburn) · `37f3ff4ed1392b154024579a1bb81b711e1d02ec` · MIT | `src/parser.ts:1572` merges repeated message IDs using latest usage/content; `providers/codex.ts:1190,1272` distinguishes last-request from cumulative counters and fork identity. `src/models.ts:1238,1579` separates rate tiers, cache TTLs, billing mode and API-equivalent estimates. `usage-aggregator.ts:38` retains incomplete per-provider cache coverage instead of claiming a complete sum. | Amounts may still be zero beneath an explicit unpriced marker; never treat that as a complete bill. `session-cache.ts:94` contains message/path/command content; `quota/zcode.ts:10` reads another app's OAuth storage. Those are not necessary permissions for Fleet's own usage ledger. No such scanner was run. |
| [CC Switch](https://github.com/farion1231/cc-switch) · `1ee2fdc3a791f1e73476c631c7ab7ce8fac0638f` (fetched default unchanged) · MIT | `src-tauri/src/proxy/usage/logger.rs:67,130` preserves requested/actual/pricing model and merges proxy/import records in one ledger. `services/session_usage.rs:623` commits imported rows and cursor atomically. `services/sql_helpers.rs:23` declares cache-inclusive/fresh/legacy semantics; `usage_events.rs:1` coalesces events before query invalidation. UI `UsageDashboard.tsx:89` shares filters/date/refresh with hero/charts/logs; `UsageHero.tsx:80` rederives ratios from sums rather than averaging percentages. | `services/usage_stats.rs:309` heuristically matches app/model/token-vector within ten minutes without provider/account/session conditions, so independent accounts can be merged. `_session`/`_codex_session` provider placeholders are not actual billing identities. Missing-price totals remain incomplete; inference from positive tokens plus cost=0 is not a reliable free/unpriced distinction. |
| [one-api](https://github.com/songquanpeng/one-api) · `8df4a2670b98266bd287c698243fff327d9748cf` · MIT | `relay/controller/text.go:36` binds original/resolved model/channel, then `helper.go:97` settles its own gateway credit ledger. `model/log.go:15` provides request/channel filtering. | `adaptor/openai/token.go:52` can substitute GPT-3.5 tokenization or byte×0.38 without preserved estimation provenance. Log schema lacks cache/reasoning breakdown and request-ID uniqueness. Its billing/subscription endpoint is gateway balance, not vendor membership. Stream errors can still return success; retries/rotation are not admitted Fleet policy. |
| [CPA-Manager-Plus](https://github.com/seakee/CPA-Manager-Plus) · `29d676f8eebfbc11eedc96573f3a059360163a3e` · MIT | `internal/usage/event.go:19,258` separates raw/normalized usage and declares included/separate cache semantics. `repository/usageevent/repository.go:345,525` keeps normalization outside short insert/identity transactions. `collector/auth_snapshot.go:56` scopes account evidence and rejects ambiguity. `usagepricing/projection_read.go:55` joins covered rollups and uncovered tails without overlap; `usage/analytics_bucket.go:7` uses IANA zones/half-open intervals. `apps/web/src/features/monitoring/hooks/useMonitoringAnalytics.ts` uses cancellation/sequence guards and stale last-good presentation. | Data comes from CPA's observed events, not arbitrary native CLI history. Missing semantics may be guessed from model names; fallback output+reasoning can double-count inclusive SDK output. Event hash includes mutable token values, so corrected usage may become another identity. Historical Estimated Cost can use current prices; it is not a subscription bill. WHAM quota uses a separate authenticated evidence path with native resets/model scope. |

**Fleet landing choice:** retain ZCode's Session/SQLite usage owner and the existing services/RPC;
borrow CodexBar's provenance/coverage and quota identity/freshness, CodeBurn's snapshot/cumulative
rules, CC Switch's consistent filter/detail workflow, and CPA's raw/normalized separation and
nonoverlapping aggregates. AIUsage supplies a useful request-time price snapshot reference.
No gateway, proxy, imported account store, broad credential discovery or second usage ledger is
introduced by this comparison. Token context occupancy, cumulative request consumption,
API-equivalent price estimates, actual vendor-reported spend and remaining subscription limits
remain different facts even when reachable from one conversation control.

For OV-057, the acquisition paths matter more than their UI names. CC Switch combines proxy request
logs and selected CLI session imports, computes from token-class prices and offers models.dev
updates; its heuristic cross-source merge is too weak for Fleet's per-account billing identity.
AIUsage freezes proxy cost at request time, subtracts overlapping proxy rows from Codex local logs,
and leaves non-proxy subscription/third-party use token-only. CodexBar reads local usage separately
from authenticated quota, keeps a 24-hour models.dev price cache and explicit priced/unpriced
coverage; neither history scan nor public list price is a receipt. CodeBurn parses tool sessions,
uses a 24-hour LiteLLM catalog plus fallback/overrides, and labels subscription token costs as
API-equivalent; its plan-pacing ratio divides that estimate by a configured flat budget, not by a
vendor-reported invoice, and live provider quota is a separate source. Fleet does not copy that ratio.
Cockpit
Tools displays account-scoped native quota and tier, not an automatically discovered paid invoice.
Fleet therefore keeps its unique request IDs, recorded account/provider/model and frozen price facts;
unpriced complete facts may receive a current-rate read projection without rewriting history.
Public plan list prices were inspected but the owner retired the account-card reference-price
row; they are not actual invoices and are not shown beside quota.

Current candidate evidence: `core/runtime/methods/usage-observability.ts:76` already records main,
compact, title and auxiliary calls through UsageStorePort; `adapters/storage/session-store/repositories/usage.ts:20`
upserts IDs. The same file writes missing numeric counters through `integer()` as zero and prunes
all three usage tables after 30 days (`:335`), whereas the UI provides an all-time/lifetime view.
`bootstrap/zcode-protocol/usage-stats-builder.ts:86` consumes normalized inclusive input correctly
for cache rate, but carries no coverage/account/price provenance. `hooks/useUsageStats.ts:191`
keeps a previous range/Host snapshot during refresh or failure without a scope/stale label. SQL
uses one fixed current-zone offset for historical daily grouping. These are explicit acceptance
gaps, not corrected by copying the reference screenshot. No statistics runtime changes or claims
of live-provider coverage were made in this research pass.


## Pi package intake and original-source correction (OV-046)

This is source inspection, not package installation or runtime admission. Pins below are retained
under `源码参考/software/`; catalog popularity does not prove compatibility or quality. The candidate
now embeds a Pi AgentSession loop under OV-069, with explicit Host resources. Its existing MCP/Skills, credential, Session,
permission and artifact owners remain the landing points.

| Retained source / license | Inspected implementation | Decision for Fleet |
|---|---|---|
| [pi-better-openai](https://github.com/monotykamary/pi-better-openai) · `39171682343754366439b2c0890f5b0f4c3ed891` · MIT | `src/image.ts:19,274,391` submits native Codex Images generation/edit JSON and returns image bytes; `fast-controller.ts:9,38` uses a configured model allowlist and separate desired state. `config.ts:173` enables automatic reset redemption. | High-priority source for the missing subscription image execution path. Reuse Fleet auth/artifact/preview; do not import its settings/controller stores, static Fast eligibility, automatic card redemption or optional voice stack. No image request was submitted in this intake. |
| [pi-codex-image-tool](https://github.com/ross-jill-ws/pi-codex-image-tool) · `ca7e6002a04226d82895e46e6ba6b32dc457336a` · MIT declared in manifest; no root license found | `extensions/index.ts` builds Responses-hosted image-generation calls and extracts streamed image results. | Alternative protocol comparison; standalone Images source above is the first candidate. Resolve full license provenance before copying; do not wrap a second chat executor around Fleet. |
| [kling-ai-pi](https://github.com/klingai-dev/pi-plugin) · `8cfa106dd0868c3a51fe376d67fec175a60a5da5` · MIT; service/content excluded | `extensions/kling-ai.ts:112` creates `pi-mcp-adapter` and the region command; `mcp.global.json` declares lazy OAuth MCP with generation/read/credit scopes. `skills/kling-ai/references/mcp-contract.md` obtains live model arguments through `who_am_i`, preserves generation/task IDs, and queries the same job. Confirmation/no-blind-retry requirements are Skill instructions, not proven server enforcement. | Best bounded video/image workflow reference in this intake: adapt Skills and the remote MCP contract to Fleet's existing connector/permission path. No separate Pi MCP runtime, copied region preferences or assumed API-key entitlement. Actual authorization, generation and result preview remain unverified. |
| [pi-web-access](https://github.com/nicobailon/pi-web-access) · `5217074850047543ba1f850741ce20698f79530f` · MIT | `index.ts:1837,2535` registers search/fetch; `video-extract.ts:165` checks video size and chooses Gemini API/Web; `extract.ts:769` gates hosted fetch destinations; `gemini-search.ts:597` bounds configured provider fallback. Nine runtime dependencies; optional ffmpeg/yt-dlp. | Useful extraction, timestamped frame and source-attribution patterns for media/browser gaps. Compare individual adapters against existing tools first. Do not import its broad fallback routing, browser-cookie reader, provider config or separate curator UI. Local video analysis is not video generation. |
| [pi-usage-analytics](https://github.com/frostime/pi-usage-analytics) · `812dd26b80190b19de8243ca2728f20d2ad9b23d` · MIT | `pi/normalize.ts:15` requires attributed assistant usage; `storage/usage-database.ts:115,349,411` fixes reporting timezone, deduplicates and compacts days transactionally. `usage/identity.ts:17` hashes timestamps/model/counters, omitting account/session IDs. `usage/fact.ts:52` drops records with missing cost or required counters. | Borrow calendar/retention and atomic aggregate checks for the existing usage ledger. Do not add its database or copy its identity/missing-data assumptions: Fleet requires account/request attribution and honest unknown cost. Native subscription allowance is a separate fact. |
| [pi-multimodal-proxy](https://github.com/pungggi/pi-multimodal-proxy) · `cdf53ccc21be534240e227a5fb85392cf42d774c` · MIT declared in package.json; no root LICENSE text | `extensions/vision-proxy.ts:1930-2525` hooks Pi's `before_agent_start`, `tool_result`, `context` and Session entries; `extensions/internal.ts` bounds image reads, recall and captions. Its package declares `pi-coding-agent` as a peer, and its own source review tracks scoped consent and per-turn call caps. | Use its explicit provider egress/unknown-result and tool-result ordering as acceptance cases for Fleet's existing vision bridge. Direct installation still needs Host context and egress/persistence mapping; OV-069 does not enable its independent config/consent store. Its implicit keyed-model fallback and all-provider consent wildcard are not Fleet defaults. No package was installed. |
| [pi-claude-bridge](https://github.com/elidickinson/pi-claude-bridge) · `a78a2a5525e96318f8dba7f9fd32ce2191be0136` · MIT | `src/index.ts:1943-2007` starts a Claude Agent SDK query with `tools: []` and `permissionMode: "bypassPermissions"`; `src/mcp-server.ts` maps Pi tools back into the SDK; `src/index.ts:750-853` rewrites/resumes Claude session JSONL. Its peers require `pi-coding-agent` and `pi-tui`. | Strong abort/resume/tool-result comparison for later native Claude CLI work, but direct install would add a second session writer and permission mapping to the ZCode host, which currently embeds only `pi-ai`. Keep Fleet's existing Session and permission owners; no package was installed or Claude subscription invoked. |

The installed `@earendil-works/pi-ai@0.87.1` already includes a `kimi-coding` OAuth driver and a
separate image-model interface; its only bundled image executor here is OpenRouter Images. Neither
fact supplies Fleet with a Pi extension host or all vendors' media endpoints. The
[Kimi membership guide](https://www.kimi.com/en/help/kimi-code/membership-guide) reserves automatic
OAuth for the official CLI/VS Code client and tells third-party/self-built applications to use a
membership API key; Fleet keeps its supported key route and treats the built-in Pi OAuth driver as
source evidence, not a new login. [`pi-xai-oauth` 1.6.0](https://pi.dev/packages/pi-xai-oauth)
declares peer support below Pi 0.87, and [`pi-claude-auth`](https://pi.dev/packages/pi-claude-auth)
reads another application's credentials. Neither is installed over the candidate's existing
account/credential owner. Pi Skills and standalone MCP servers can be assessed independently of
the full extension host.

The bounded correction compared pinned ZCode `29628c9` with the actual candidate, plus Cindy's
`FastModeToggle.tsx`, OpenCode's `session/message-v2.ts` and Codex's auth-generation request setup.

| Examined candidate delta | Original behavior / observed defect | Disposition |
|---|---|---|
| Added Default models section and favorites group | Original picker and per-model enabled flags already own ordinary visibility; the owner rejected the extra selection workflow. | Removed the added page/sidebar/group/copy, retaining compatible stored preferences and the ordinary picker. |
| Reasoning completion | Selecting a model could require a second choice or infer the highest level. | One shared provider-default resolver; missing default means native automatic effort, and valid explicit choices remain. Auto is omitted on the wire. |
| `contextUsage.tsx` tabs / ledger-first popup | Original layout exposes capacity and composition before quota; the added tabs obscured them. Original runtime-only composition also disappears on cold restoration. | Restore original hierarchy; keep exact request counters in a disclosure. Persist existing estimated composition with its own assistant reply; never fabricate old samples. |
| Subscription account lifecycle | A login-flow generation could cancel an existing account refresh; account-list revisions and native effort parsing could lose the visible current catalog. | Separate login cancellation from actual authorization revocation inside the existing owner. Preserve exact member/workspace identity and verify native catalog and request paths. |
| Mid-conversation settings change | Original submission freezes model intent; subsequent auth reads could follow a changed global account default. | Extend active submission with an account reference, renew at admitted Guide boundaries, scope signed history and rebuild portable rejected-request replay. No additional Session store. |
| Fast mode | Pi/Cindy demonstrate actual service-tier control, while some plugins call lower effort “Fast”. | Per-submission mode through existing ModelOptionMaps/native payload hook; only declared support is selectable, standard remains default, no premium live test. The owner rejected the compound control; a small lightning action in the effort-menu header now owns the independent toggle. API mapping tests are not proof every gateway supports that tier. |

This does not certify all custom product deltas. Media execution, complete statistics, contextual
Agent settings and marketplace activation/revocation still require their own end-to-end audit.


### OV-047 official rates and accounting boundary

[OpenAI API pricing](https://developers.openai.com/api/docs/pricing) and each admitted model page
were checked for Standard/Fast and the >272K input threshold. [ChatGPT credit rates](https://learn.chatgpt.com/docs/pricing)
and [speed](https://learn.chatgpt.com/docs/agent-configuration/speed) define an independent native
credit basis: admitted GPT-6/5.6/5.5 Fast requests consume 2.5 times Standard credits; this is not
the API's multiplier or proof of a plan's included allowance. Credit billing has no separate cache-write
charge. [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing) supplies cache read/miss,
output, peak/off-peak and public-holiday rules; unknown calendars/models/modes stay unpriced.
`packages/shared/src/usage-price.ts` freezes the checked 2026-09-27 source version with each request.
It does not claim negotiated discounts, tax, regional premiums, tools/media fees or historical prices.
A payment allocation is an observed-use estimate, never an official per-model subscription tariff.

### OV-049 statistics and manual model UI comparison

| Source lock / inspected files | Reusable behavior | Fleet landing |
|---|---|---|
| ZCode `29628c9acdb8`, `packages/ui/src/settings/usage-stats/AppUsagePanel.tsx`, `AppUsageModelUsagePieChart.tsx`, `CodingPlanUsageBarChart.tsx`, `usageStatsUiParts.tsx` | Summary → heatmap → trend → model donut; existing surface/spacing, chart colors, aligned legend, segmented ranges and tooltip details. | Keep that order; remove added `UsageAccountingPanel` table. Reuse donut/legend renderer for Tokens and cache. Place an API-only cost chart in the same original panel/range; payment allocation is no longer rendered (OV-057). OV-058 limits monetary bars to positive priced amounts, retains unknown/zero facts in coverage and model usage, and reuses the original segmented Progress colors with a lower source legend. Unknown/partial coverage is not converted to zero. |
| CC Switch `1ee2fdc3a791`, `src/components/usage/UsageDashboard.tsx`, `UsageHero.tsx`, `UsageTrendChart.tsx`, `ModelStatsTable.tsx` | Shared filter scope, values before methodology, cache indicator and sourced cost, recomputed weighted cache rate, local chart details. | Preserve Fleet's existing query scope and weighted denominators; focus hints carry coverage and source links. Do not import its dashboard theme, request-log surface, foreign-log scanning or proxy owner. |
| CC Switch `1ee2fdc3a791`, `src/components/providers/forms/shared/ModelInputWithFetch.tsx`; ZCode `ProviderCardSections.tsx`, `ProviderFormControls.tsx` | Known models can be selected; manual IDs supply absent entries. Upstream deletion is for non-builtin records, while discovery in Fleet creates such records too. | The owner retires model-row deletion in favor of enablement; no data deletion. Native subscription catalog refresh replaces meaningless manual entry. API manual drafts remain explicit and never run inference automatically. |

The simplification audit rechecked original ZCode `AppUsagePanel.tsx` and its context popup against the candidate: neither original surface owns payment-period allocation. CC Switch `UsageDashboard.tsx` uses one filter scope for request-price estimates, while its subscription reader is independent. The candidate had retained a payment-aware `UsageCostReport` with no active payment caller and a personal purchase-preview hook with no mounted caller. The visible report is now API-only; the saved payment schema and standalone allocator remain for old records. Team source callers need subscribed organization/project IDs, so their former static purchase-SKU read and discount/price display mapping are retired; only the account pricing response is projected. The original unmounted footer plan-summary source also had no caller; its purchase/extra-reader code was removed while composer/account/Usage entries remain. This avoids creating another product/catalog authority and preserves the existing Team endpoint and Session usage owner.

The pure accounting projection has weighted-cache/coverage/identity tests. Primary desktop checks
cover live metric switching, API duplicate/cancel behavior, subscription list controls and the
replacement API-only chart. Old payment allocation tests protect stored compatibility facts but no
longer establish a visible accounting feature. Owner visual acceptance remains open.

### OV-050 reusable price directories and DeepSeek live case

CC Switch `1ee2fdc3a791` implements models.dev import in `src/lib/modelsDevPricing.ts` and a six-hour
startup/manual synchronization policy in `src/lib/modelsDevAutoSync.ts`. It normalizes provider/model
names and defaults some missing rate fields to zero. Fleet reuses the public dataset, not that zero
fallback or broad suffix stripping. [models.dev](https://models.dev) documents provider-scoped data,
context tiers and an offline snapshot; its [repository](https://github.com/anomalyco/models.dev)
declares MIT. The retained API response hash is `9fe0b9615b0b0af9f188c117373bdc12e465cea38b93e25ccb284149de977fb8`.
The 2026-09-28 raw response has 225 providers/8,255 entries; the validated text-output price subset
has 215 providers/7,631 entries, including 576 context-tier schedules. These are provider/model
entries, not 7,631 unique first-party models or individually verified official prices. Missing
cache rates remain absent. Media-only prices require their actual generation units and executors.

The candidate's maintainer command `pnpm sync:usage-prices` refreshes its bundled data atomically;
`--input` and `--fetched-at` allow deterministic offline regeneration. No SDK dependency or runtime
outbound service is added. Existing API presets are tested against price-provider attribution across OpenAI/Anthropic-compatible paths, retaining China/global scope; native subscription adapters keep their explicit provider identity. Official [OpenAI](https://developers.openai.com/api/docs/pricing),
[DeepSeek](https://api-docs.deepseek.com/quick_start/pricing),
[Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) and
[Z.AI](https://docs.z.ai/guides/overview/pricing) schedules override known directory gaps.
Anthropic's 1h cache-write count comes from the reported usage split, never an assumed TTL.
Z.AI's free cache storage is not free cache-create inference: ordinary new-input pricing still
applies. BigModel's China endpoint is not assigned Z.AI international official-override rates.

A read-only GET using the review connection and existing proxy-aware transport returned HTTP 200
and exactly `deepseek-flash` / `deepseek-v4-pro`, matching the
[official model-list schema/example](https://api-docs.deepseek.com/api/list-models).
[DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing) states that
`deepseek-v4-flash` and `deepseek-v4-flash-vision-exp` remain accepted but are served and billed as
current Flash. The primary agent copied only the review Provider configuration into a temporary
profile, added the documented vision-exp alias through the existing ProviderSettingsService,
reopened the runtime and observed all three saved IDs. Byte comparison verified the original
configuration stayed unchanged. No inference, payment, key disclosure or artificial fourth model
was involved; this verifies manual save/reopen, not a separate live model or media capability.


### OV-051 unified cost and actual-account projection

Primary comparison reuses pinned ZCode's `AppUsagePanel.tsx` summary strip and
`usageStatsUiParts.tsx` segmented tabs, with CC Switch's single shared-filter scope. OV-057 retires
the visible payment form, paid-unit-cost chart and monthly ratio after comparing their acquisition
paths: a plan price is not a paid invoice and neither shares the selected usage-statistics window.
The compact API-rate chart derives only from Fleet's existing ledger, with missing-price coverage
and exact model source links; plan list price and native quota stay on each account card. No new
chart library or accounting owner is added.

The earlier isolated fixture verified the payment allocator's arithmetic, but those values are no
longer exposed as model/project prices. Old saved payment records remain in the settings owner for
compatibility. The replacement desktop review shows a compact account price row and an API-only
model/project chart in Chinese light; dark and narrow-window owner acceptance remain.
A no-model startup exposed the inherited `getAppUsageStats` dependency on an active model runtime;
reusing the existing local control-plane carrier made the same historical SQLite query work without
creating a conversation or performing inference.

Original context popup structure remains. Fleet's added quota selector previously preferred the
configured default even after a different account served a request. Actual local account identity now
flows from the existing `fleetAccounting` receipt through ModelComplete/V4 and cold usage reads;
read-only inspection, default, last-used and automatic switching remain separately labelled.
Synthetic failover/projection/restore tests cover the lineage; the restored review conversation displayed its recorded last-used account and corresponding native windows. No real account switch or reset-card
redemption was performed for this change. A standalone project panel and cross-host billing
aggregation remain future work.


## Current modification audit

The review inventories the candidate against ZCode `29628c9acdb81b703bbd4080c207a0e7ce5e276e`
and the retained `app/` against Craft v0.13.4. The 0061 candidate tree has 454 changed files:
348 runtime/UI files (+19,123/-12,967 lines), 68 test files (+15,300/-3), 15 catalog/config/lock
files (+46,635/-30), 17 documentation/license files and six build tools. Counts are source volume,
not a justification or an acceptance score. The ignored `.fleet/reviews/project-audit/` holds
machine inventories and test output; capability status remains in the register.

| Scope and original path | Current finding and disposition | Evidence and limits |
|---|---|---|
| ZCode `core/runtime/methods/turn-loop.ts` | Keep the existing Host owners and Pi loop. Remove the extra `piToolContent` conversion: the private SDK does not feed these payloads into the provider; Host context already does. | Actual Pi/Host/SQLite fixtures preserve full tool text/images, permission, queue, stop and restart. This proves neither token savings nor stronger model quality. Native vendor executors and complete application-kernel acceptance remain open. |
| Provider/connection writers and `InlineEditableProviderCard` | Keep version-checked field writes and acknowledged receipts; they fix reproduced overwrites without another settings store. Narrow probe identity to the tested model. Remember subscription revision with the existing probe owner, so revisiting the same account does not erase health. | Existing Chinese/English draft fixtures plus the actual provider hook reject changed credentials/accounts and retain unrelated-model evidence. Native desktop loopback probe stays green when a different model is disabled. No live vendor health claim. |
| Original `ProviderCardSections` and CC Switch conversion | Keep original editing controls, sparse capability evidence, protocol-specific discovery, grouped source identity and eligible-row default selection. Configuration readiness remains distinct from inference. | Source SQLite/reopen/dedup tests and synthetic native import. Known wire routes are covered by captured SDK requests. Subscription-token copying is excluded; comprehensive vendor/model/live coverage remains incomplete. |
| Composer, thinking and Token ring | Keep observed defaults, independent effort/Fast, immutable admitted input and the original local context/allowance popup. The private Pi resource loader remains explicit rather than autoloading unrelated extensions. | Model/effort/queue/Guide/stop and media-input fixtures plus staged CLI receipts. New native levels/service tiers, full context-source history and owner visual acceptance are not established. |
| Public prices and `usage-price.ts` | Fix the conflation of included Fast allowance (2.5x) with published purchased-credit billing (2x). The UI names both; new estimates carry a corrected version. Historical rows are not rewritten. | [Official speed guide](https://learn.chatgpt.com/docs/agent-configuration/speed), captured usage and SQLite reopen tests. Public API values are references, not invoices or automatic knowledge of a workspace's private agreement. |
| Auxiliary requests and `model-execution.ts` | The unsourced-capacity omission rule had also removed explicitly requested probe/caption budgets. Keep ordinary unknown-capacity compatibility; auxiliary calls retain their existing Host operation identity and wire budget. | Real SDK with fake transport reproduces an absent limit, then verifies explicit limits across Chat, Responses and Messages. Live provider-specific minima/limits require their own acceptance. No new selector or persisted flag. |
| `workspace-generate-text.ts` and statistics acquisition | Connectivity probes discard finish usage and do not enter the model ledger. The model table requires a real Session FK, so filling this gap must not invent a user conversation. | Native loopback probe completed while `model_usage` remained empty; source/DDL verified. A reviewed non-chat operation/ledger change is still needed before promising complete software-wide cost coverage. |
| `AppUsagePanel` / cost-source view | Keep one filter scope, positive-only money bars, shared meter tones and model-focused tool/Skill facts. `recentProjects`/open tabs are not durable project membership. Request-source colors are not an exact tool/Skill context invoice. | Usage/timezone/cache/source/hover view-model tests. Historical project attribution, the project panel, retained context-source estimates and simple correctable plan-price comparison remain open. No billing-period form is justified. |
| Media tool/Session artifacts | Fix image usage IDs with the existing Session/turn/assistant request identity. Reused upstream call IDs no longer overwrite charges; original files/IDs remain. | Three synthetic paid-result receipts and disk artifacts survive SQLite restart; late-return/save-failure fixtures remain. Actual xAI payment, subscription images, video, image editing and full Job reconciliation are not established. |
| Plugin installer and application contributions | Reuse existing installer/digest/rollback/storage paths; extra catalogs are not a framework. UI uninstall currently omits `keepData`; active revocation, grants, native surfaces and default data-preserving removal remain unfinished. | `bootstrap/plugins.ts:769` and `zcode-protocol/plugins.ts:364`, existing storage-scope tests. Skill/MCP recognition does not establish Pi executable/TUI or native UI compatibility. No installed owner plugin was removed. |
| Desktop/profile startup and `main/index.ts` | Original cold restore read `homedir()` while the Host respected the desktop-home override. Reuse that same override in Main; no data or preference migration. | Fresh built desktop initially warmed a real user's saved workspace, then correctly used the isolated conversation directory after the one-path fix. The existing draft window was preserved. |
| Retained Craft shell, Project, review and GitHub controls | Preserve its declared data/route changes separately; they are not active-candidate capabilities. Native GH remains credential owner and historical edit review is not a Git snapshot. | Retained full typecheck and 66 focused tests pass; root delta/orphan gates pass. Combined retained-suite closure and owner visual acceptance remain incomplete. |
| Documentation and release | Correct the paused Claude SDK-credit announcement. Separate source evidence, fixture proof, live provider behavior and visual acceptance. The 700-line contracts still contain oversized paragraphs; structural validation is not readability or feature delivery. | Cross-document joins/links and source pins pass. Native SDK/permission admission, complete notices (including proxy-agent-negotiate), signed platform builds, updater feed and actual page/office/canvas integrations remain open. |

The bounded corrections repair specific failures and remove duplicate processing. They do not
approve every changed hunk, prove all platforms/providers, or complete the remaining product.
Priority remains kernel/native execution and shared page operations, followed by acquisition/project
costs and data-preserving plugin/artifact lifecycle under the existing delivery order.

### CC Switch route conversion and subscription import boundary (OV-052)

CC Switch `1ee2fdc3a791` `src-tauri/src/proxy/providers/claude.rs:832` joins the source base with
versioned endpoints, while `providers/codex.rs:1053` adds v1 only to a bare origin.
`proxy/model_mapper.rs:147` removes Claude's local `[1M]` marker before forwarding; it is not a
second upstream model ID. `ModelMapping::from_provider` also includes Fable and subagent mappings.
Import now translates these semantics, reads explicit client catalogs, matches existing connections
by key and route/service identity, and retries incomplete model writes after restart.

The primary agent imported a consistent read-only-source SQLite backup into a temporary Provider
runtime, reopened it and verified already-bound detection. OpenCode Go's corrected
[model endpoint](https://opencode.ai/docs/go/#models) returned 30 IDs; the shared directory spans
multiple wire protocols, so discovery uses existing route-specific catalog membership. The normal
AI SDK request test asserts `/zen/go/v1/chat/completions` with `glm-5.2`, never the local marker.
A reviewed exact duplicate had zero SQLite/config references; its missing models were retained in
the original connection, a recovery copy was saved, and only the duplicate configuration was removed.
Different-key connections remain separate. No paid inference or source mutation was performed.

CC Switch `services/subscription.rs:109` reads Claude Code's own Keychain/credential file to display
usage; those credentials are not a self-contained subscription row in its providers database.
Membership API keys can be imported with endpoint-based plan classification. OAuth refresh tokens
should stay with their authorization owner; prefer reauthorization or an explicit native-runtime
binding over copying another application's mutable refresh state.

Current Anthropic sources need to be read together: the
[Agent SDK plan article](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
now says the announced separate monthly SDK credit is paused. SDK, `claude -p` and third-party
SDK usage still draw from subscription limits; the preserved June 15 announcement is not active
policy. [Claude Code legal terms](https://code.claude.com/docs/en/legal-and-compliance) distinguish
an end user signing into the unmodified official CLI from a third party collecting or proxying
claude.ai tokens. Hosting that unmodified client also retains the commercial-agreement conditions:
each user authenticates directly, the binary and its authentication methods remain intact, and the
host does not collect or intermediate subscription tokens. The [SDK quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart)
separately requires prior approval for a third-party product offering claude.ai login. A technically
working OAuth flow is not evidence of that approval. Keep login and credential refresh with the
official client. The primary's installed Claude CLI/SDK model-directory read and loopback-inference
Host-tool allow/deny/Stop probe verify local protocol and permission behavior only; they do not
prove live subscription inference.

Craft v0.14.0 `73bd9c2` uses `shared/src/auth/claude-oauth.ts:114,190` for its own browser PKCE/code
exchange, `server-core/src/handlers/rpc/onboarding.ts:131` to save connection-scoped and legacy
OAuth credentials, and `shared/src/auth/state.ts:202` for refresh. `config/llm-connections.ts:1073`
projects the token into `CLAUDE_CODE_OAUTH_TOKEN`; `agent/claude-agent.ts:1210,1613,1720` runs the
Claude Agent SDK query with native continuation and Host hooks. API-key authentication is a
separate branch. `agent/options.ts:229` resolves the matching packaged SDK native binary, with an
explicit executable override; this avoids requiring a separately installed global CLI. Its SDK
pin is 0.3.280. These are source observations, not evidence of Craft's live account access or
Anthropic authorization. Fleet's current native inspect/login/execution files instead default to
`claude` on PATH; bundling/resolving the SDK's official binary consistently is a concrete integration
gap. Native resume and governed-attempt limitations stay in the capability register and kernel contract.
Antigravity's installed `agy models` and `/usage` command were read without inference. AionCore's
`aionui-session/src/backend/antigravity/conn.rs` bounds approval before the native hook's fail-open
timeout; its whole-agent protocol cannot be used as a model transport. The candidate still lacks
the Antigravity native executor. Claude subsequently gained its official SDK lane under OV-071;
its current execution and acceptance boundaries are in the [kernel contract](modules/agent-core.md#first-proof).
The earlier probes remain separate protocol evidence.

The primary billing audit got HTTP 200 for both saved ChatGPT accounts at the existing account-check
and subscription metadata endpoints. Exact periods, currencies and discount fields were present;
no paid-invoice amount was returned. Period/currency now prefill only from a validated single billing
period, while discount amounts are never treated as money paid. Generic automatic fee acquisition
and the contextual Agent editing bridge remain open requirements, not implied by this partial read.


### OV-053 chart components and inherited activity facts

| Source lock / component | Finding | Landing |
|---|---|---|
| EvilCharts `500ecd44c1fdcf319ba83ea68f3771bc76125974`, `src/registry/examples/recharts/ex-horizontal-layout-bar-chart.tsx`, `src/registry/charts/recharts-bar-chart.tsx` | MIT; React, shadcn, Recharts 3.8, with optional Motion effects and its own theme wrappers. | The first copied grouped-bar component was retired under OV-057. The current source bars use ZCode's existing segmented Progress; no EvilCharts component or runtime remains, so its former copied-component manifest entry was removed while the reference and license are retained. |
| beUI `9f19813a3ea19ce167da9920fba5658b392e4e7f`, `components/charts/composition-chart/model.ts`, `legend.tsx`, `components/motion/tabs.tsx` | MIT; composition marks missing periods instead of interpolating them; interactive legends and reduced-motion handling. Its composition plot normalizes complete columns to 100%. | Missing values and keyboard discoverability are useful references. A composition chart is not appropriate for adding an API estimate to the actual payment for the same usage. No beUI package or theme is installed. |
| Original ZCode `29628c9acdb8`, `repositories/usage.ts`, `usage-stats-builder.ts`, `AppUsagePanel.tsx` | The existing tool_usage table and stats payload already carry tool counts, errors and mean duration, while the UI does not render them. | Expose the original aggregate in Activity insights; no second counter or backend query endpoint. |
| Same ZCode pin, `core/tool/handlers/skill.ts`, `core/tool/executor/events.ts`, `bootstrap/zcode-protocol-v4/conversation-telemetry-facts.ts` | Skill result/error events already carry qualified name, plugin ID and source; the local usage upsert discarded these fields. No version digest or accepted-task evaluation is present there. | Store only this existing identity metadata on tool_usage and derive skill counts under the same range. Old missing identity remains explicit; do not claim loaded skills are accepted outcomes or fabricate a historical version. |
| Same ZCode pin, `chat-input-toolbar/contextUsage.tsx`, `components/ui/progress.tsx`, `ControlHintTooltip.tsx` | The original context popover sorts composition sources by share and renders a segmented Progress using one blue tone ladder; the tooltip has title and secondary copy. This is estimated context occupancy, not a provider charge. | Reuse the Progress tone ladder and title/secondary tooltip in aggregate usage and quota UI. Segment priced model requests by recorded source, not prompt-composition estimates or invented per-tool bills. |
| Codex `67a709665ac7`, `codex-rs/backend-client/src/client/rate_limit_resets.rs`, `app-server/src/request_processors/account_processor/rate_limit_resets.rs` | GET lists credits, POST consumes a selected credit with a stable `redeem_request_id`; type/status/expiry and outcome codes are explicit. | Keep redemption inside the existing subscription owner and lock it to the displayed saved account and revision. Count itself opens details; zero count has no redundant action. Synthetic tests cover account separation and idempotent retry; real cards are not spent in acceptance. |

The source directories are retained under `software/evilcharts` and `software/ui-components-starc007`
on the reference volume. They were cloned for inspection, not executed or installed as production
libraries. Existing telemetry remains disabled; local accounting does not enable vendor reporting.

### OV-054 connection failure evidence

Original ZCode `29628c9acdb8` keeps explicit probe failures in
`ProviderFormControls.tsx::handleTest`; the candidate regression opened the metadata editor instead.
Its `ProviderStatusIndicator.tsx` uses configuration executability, which does not prove upstream
access. Preserve the original inline feedback and annotate actual probe observations separately.
The real Kimi `k3-256k` test returned HTTP 403, `error.type=access_terminated_error`, and an explicit
message that the current subscription lacks Kimi Code access. A read-only catalog query returned
HTTP 200 with `kimi-for-coding`, `kimi-for-coding-highspeed`, `k3`, `k3-256k`; catalog access is not
inference entitlement. No response established a specific expiry date. A local loopback fixture
replayed that error through the built desktop/Host/CLI/AI SDK path: localized inline failure, amber
status, no metadata dialog; a streamed success changed the tested-model marker to green. Both
Chinese and English were checked. No production credential or paid request was used in replay.

### OV-055 product identities and Grok tier source

ZCode 29628c9acdb8 `ProviderDetailFeedback.tsx` and `SectionLayout.tsx` have zero candidate diff:
same detail-panel bottom overlay, styles, spacing and close control. `ProviderFormControls.tsx`
intentionally retains classified failures until dismissal instead of the original eight seconds.

Grok Build f0e3be1100ef5252488e3be8bb0e91cf68d8c305
`xai-grok-shell/src/extensions/billing.rs:251` enriches credits from
`RemoteSettings.subscription_tier_display`, falling back to `subscription_tier`; it does not get
the tier from credits alone. `remote/client.rs:576` reads `/settings` with the same account headers.
`xai-grok-config-types/src/lib.rs:811,832` separates tier display from `allow_access`.
`xai-grok-telemetry/src/client.rs:563` records distinct Free, SuperGrok Lite, SuperGrok, Plus, Heavy
and X membership labels. Adopt only reported identity/display fields, never its remote controls or
unknown-tier access policy. Existing account scope/revision/credential cache remains the owner.

[Official pricing](https://x.ai/pricing) lists multiple consumer and business tiers separately from
API pricing. [Official FAQ](https://docs.x.ai/grok/faq) describes a shared usage pool and separately
manages X-linked subscriptions. Neither a marketing plan name nor a quota reset proves paid term
expiry or that every Grok product is implemented in Fleet. The existing Lobe static Grok and xAI
assets supply separate marks without another dependency or a copied theme.

### Provider format correction

The 41 preset routes are scoped by service, region and authentication in
`config/provider/zcode-builtin.json`; format choices for a saved route now also require the same
model list. [OpenCode Go](https://opencode.ai/docs/go/) and
[Zen](https://opencode.ai/docs/zen) list each model's Chat/Messages/Responses endpoint, proving
that a common provider host does not make all its models interchangeable across wire formats.
New connections select the matching sibling template/model list; saved format changes require
identical model membership. The pinned ZCode detail kept the old list while swapping formats.
[Alibaba Coding Plan FAQ](https://help.aliyun.com/en/model-studio/coding-plan-faq) explicitly
excludes Responses and distinguishes its plan key/URL from ordinary API keys.
[DeepSeek's Responses guide](https://api-docs.deepseek.com/guides/responses_api/) and
[xAI Responses reference](https://docs.x.ai/developers/rest-api-reference/inference/responses)
confirm their own endpoints; they do not establish a different vendor's support.
[Kimi Code's model guide](https://www.kimi.com/code/docs/en/kimi-code/models.html) declares
Chat and Messages, while [Claude's API overview](https://platform.claude.com/docs/en/api/overview)
declares Messages separately from Claude Code subscription login.
[Anthropic's legal guidance](https://code.claude.com/docs/en/legal-and-compliance) permits an end
user to sign in to the unmodified official Claude Code binary but prohibits a third-party Claude.ai
login/token relay. A native Claude executor would need Fleet Session, permission and usage mapping;
no API-key or imported CC Switch row can masquerade as that native subscription.

## Tool capability, vision bridge and busy input comparison

| Source / revision | Mechanism verified | Fleet decision |
|---|---|---|
| Cindy `374923c21`, `maker-core/src/session.ts:865,1071,1115`, `desktop/src/main/vision-bridge/{vision-bridge,vision-channel}.ts` | A reserved send or steer invokes the optional image-description hook before the main model; cancellation fences late results. The host selects a configured primary/fallback vision backend, caches by image/prompt/backend and reports an unavailable image rather than guessing. Proxy and Pi-tool layers cover other entry paths. | Start with one Session pre-dispatch adapter for current user attachments, preserving original bytes and a derived-text receipt. Do not copy three parallel paths or auto-scan credentials. Tool-result images and history need separate proofs. |
| OpenChamber `60d836c48`, `stores/messageQueueStore.ts:16,66`, `web/server/lib/message-queue/DOCUMENTATION.md`, `hooks/useQueuedMessageAutoSend.ts:207` | The composer captures text, mentions, attachments, context and model configuration when queued. Its server owns desktop/web delivery when the full turn is idle; VS Code uses a foreground auto-send hook. `steer` and `queue` are distinct. | Preserve captured request intent and idle/subagent gates, but reuse ZCode's existing Session admission and command ledger rather than importing another persisted queue. |
| [Pi Agent core](https://github.com/earendil-works/pi/blob/main/packages/agent/README.md) | Steering is polled after current tool execution; follow-up is delivered when the Agent would otherwise stop. Queues and clear methods are runtime primitives. | Evidence for delivery semantics, not permission to replace ZCode's Session/queue authority or promise that unsent draft text was delivered. |
| ZCode `29628c9` candidate, `adapters/src/model/model.ts:167`, `ui/src/v4/ConversationComposer.tsx:1126`, `shared/src/zcode-protocol-v4/command.ts:78`, `bootstrap/src/zcode-protocol/v4-bridge.ts:771` | Runtime rejects tool requests when `supportsToolCall` is false. Discovery may report the field, but the model editor previously did not allow correcting it. The composer accepts text while busy; submission records `queue` or `guide` before execution. | The existing Provider overlay now edits an explicit true/false/unknown tool fact. Tool quality needs model-attributed argument validation and outcomes, not a synthetic score from call count. Busy-input desktop/restart/remote acceptance remains. |


### Composer attachment preview and document reader reuse

Compared ZCode `29628c9` `packages/ui/src/v4/ConversationComposer.tsx`,
`components/ai-elements/attachments.tsx`, `PreviewPane` and its format viewers. Original ordinary
attachments expose a type icon/name; images/video/PDF have separate preview paths. Craft v0.13.4
`apps/electron/src/renderer/components/app-shell/AttachmentPreview.tsx` and `input/FreeFormInput.tsx`
add optional native thumbnails but read full base64 on intake. Its
`packages/ui/src/components/overlay/DocumentFormattedMarkdownOverlay.tsx` renders a centered,
width-limited article through its shared Markdown component, distinct from source and editing.

Read-only LobeHub source snapshot `3d3439c7d9236e497c3d97ec568185a818a7911a` is retained in
`.fleet/research/lobehub-preview`. `src/features/AgentDocumentReader/index.tsx` has an 840px
article column and a compact fixed header. `DocumentModal/{index,Header}.tsx` and
`PageEditor/EditorCanvas/index.tsx` share an editor with document identity, autosave, collaboration
locks, unsaved-change guards and selection comments. These are durable editing owners, not an
attachment renderer. Fleet reuses its existing ZCode Markdown/Office/PDF/PPTX readers and common
Dialog; no Lobe/Craft editor code or production dependency is imported.

[OpenAI's document guide](https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work)
confirms rich desktop previews for documents, spreadsheets, presentations and PDFs. The installed
Codex app's `artifact-preview-loaders.electron` / `library-file-preview-kind` modules additionally
recognize DOCX, XLSX, PPTX, CSV, TSV, IPYNB, PDF, Markdown, text and images. This is format-routing
inspection, not proof of identical thumbnails on every surface; no proprietary code was copied.

Candidate 0068 uses original 96px grid cards in one scrolling row. Text is bounded to 64 KiB;
Office/PPTX use the existing binary boundary, PDF uses Blob or the existing range service, and
external Markdown images are not requested. Actual Electron fixtures cover bounded File/path
reads, empty/binary/unavailable content, progress caching, late removal/scope replies, nested keys,
base-Host reads beneath a remote context, CSV quoting, PDF ranges and unadmitted media URLs. Native desktop self-check
uses synthetic format files; evidence distinguishes each verified viewer from adapter-only legacy
formats, remote transport, editing and owner acceptance.


### Candidate model-facing context correction

Additional bounded comparisons: original `29628c9` `core/runtime/methods/plugin-reference.ts`
collected every plugin Skill/profile regardless of dispatch visibility, and `context.ts` passed
the Skill catalog to child contexts without the main builder's tool check. Pi source
`e792ba131ed0` `packages/coding-agent/src/core/skills.ts:355` confirms the manual-only discovery
filter. Fleet applies those checks to its existing projection; explicit human invocation survives.
Original `steering.ts` published Guide in memory before `appendEvent`, while `events.ts` swallowed
the durable admission error. Pi `agent-session.ts:2165` supplies an in-memory steering queue, not
a replacement Host durability barrier. The candidate fixes ordering within those same owners and
tests failed/slow saves, Stop, replacement turns and cold SQLite reopen with scripted Pi requests.

Plugin data preservation also needed a source-backed distinction. Original ZCode's desktop
uninstall omitted the bootstrap `keepData` option; Cindy `a46bb58fc3263f1a3dde04cf9470ed9b0379c82c`
`plugin-market/service.ts:1299` and `cindy-brain/index.ts:6480–6556` separate package removal from
Library data. Fleet reuses its own existing data directory and suppression writer. Independent
review reproduced stale commands after a v1→uninstall→v2 reinstall: original
`adapters/plugins/index.ts:materializeCommandMetadataRoot` only appended generated Markdown.
The bounded correction replaces only that derived snapshot, preserving siblings and rollback;
no Cindy account/library machinery is introduced.

ZCode `29628c9`, `core/context/sections/skills.ts` already lists metadata and loads bodies on
invocation; its names-only fallback is a description budget, not a hard catalogue-size cap.
`core/context/builder.ts` already avoids mirroring tool descriptions into the system prompt.
Preserve both mechanisms. Pi's `coding-agent/src/core/skills.ts:formatSkillsForPrompt` filters
manual-only skills; [Claude's official invocation contract](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill)
likewise keeps their descriptions out of context and blocks model invocation while retaining `/name`.

The candidate's NodeSkillAdapter previously forced `allowImplicitInvocation: true` for every skill.
It now maps that existing policy from `disable-model-invocation`, omits manual-only metadata from
main/child discovery and rejects unrequested model-facing Skill loads. Original composer `$name`/linked mentions and CLI `/name` are recognized only from the current admitted human input; that intent does not carry into a later input or another run. Direct SkillPort loading remains.
The existing command argument expander now also serves Skill, with one-pass literal substitution;
no shell expansion, grant inference or new loader was introduced. Context estimates count visible
catalogue lines and model-facing tool name/description/input schemas, excluding local permissions,
output schemas and result budgets. They remain Host estimates, not provider tokenization.

`core/test/context-footprint.test.ts` reproduces prior failures and verifies these boundaries in
real AgentRuntime/Pi with scripted inference. `scripts/test-pi-bundle.mjs` verifies the staged
CLI's actual loopback request, denial and process reopen. Desktop identity/rendering guidance
is checked separately from the unchanged terminal control. These are local protocol/behavior
proofs; they establish no live-provider savings percentage or accepted-task quality improvement.

### Public ChatGPT and bundled Claude correction

For Claude allowance, the previously inspected official SDK 0.3.286 `sdk.d.ts:3040,4219` and `sdk.mjs`
define `usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET({skipBehaviors:true})` as a
`get_usage` control request. Its query percentages are explicitly 0–100; nullable resets, model
windows and extra-usage money are separate fields. The native reader sends no prompt, keeps SDK
authentication, and skips transcript analysis. A real SDK/fake executable protocol fixture confirms
initialize→get_usage only and refuses another account before the usage call. The method remains
experimental; its [official pinned release](https://github.com/anthropics/claude-agent-sdk-typescript/releases/tag/v0.3.286)
also changes omitted permission-mode behavior, so this control process explicitly uses `default`,
empty tools/settings sources and disabled hooks. The matched SDK is now 0.3.289; thirteen actual
local native Host cases and the staged CLI prove preserved permission, Stop, media and continuation.
No CLI credential import or paid inference is used.

Pi 0.99.2 `dist/auth/oauth/openai-chatgpt.js` provides PKCE, a loopback listener, public-client exchange and refresh; `providers/openai.js` provides Responses execution. Fleet reuses these flows through the Host transport, retaining issued-registration callbacks for reauthorization and validating ID tokens with Node’s standard RS256/JWK verifier. The [official sign-in contract](https://developers.openai.com/siwc/token-sharing-open-source/sign-in), [profile/refresh contract](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions) and [preview limits](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations) define client/host/subject binding, public endpoints, required history and supported tools. The new token’s authentication metadata is opaque; private WHAM quotas/reset cards and hosted image/video generation are not inferred from this grant.

Craft v0.14.0 `73bd9c2a3573158bea880984eb8d5fdb41e0cac2`, `packages/shared/src/agent/options.ts` resolves its SDK-matched optional native binary and retains overrides; `claude-agent.ts` passes native resume IDs. Candidate SDK 0.3.289 now uses the same dependency/executable principle and public `query({resume})`, while its existing Session journal fences interrupted/changed state and owns all Host receipts. SDK graceful stdin close was observed to trigger one extra loopback request with pending Host callbacks; immediate termination of the owned process before channel close fixes the verified Stop/admission race. This is local execution evidence; it does not establish live subscription entitlement, native Guide governance or other-platform behavior.

Matched Codex `rust-v0.160.0` (`a956835d020762cb2b570053af06f643a11c0ecc`, Apache-2.0)
uses native stdio app-server, CLI-owned authentication and continuation. The separate
[scoped SDK recipe](../patches/codex-host/README.md) preserves its Rust ToolPolicy ceiling,
customization isolation, handshake, callbacks, committed Host receipts, usage and Stop/resume.
Upstream dynamic tools alone still cannot restrict built-ins. The 0.156.1 adapter was ported in a
new adaptation directory; the old source, rolling reference `94d642d8` and user CLI are retained.
A native refresh must report an actual publication and retain its request/catalog identity.
The source-level injected identity test first reproduced a discarded response becoming apparent
success; the correction changes only checked scoped discovery, retaining unscoped cache behavior.
Protocol 313, manager 58, Host parser 2 and core isolation 3 tests passed; stable/experimental
schemas and the matched binary were regenerated. All 1313 external Rust packages remained fixed.
Eight real Host/executor loopback cases verify allow/deny, Stop, failed admission, continuation,
manual IDs, fresh failures and actual capacity. Initial cold copied-binary controls timed out;
a second run passed all eight and the real catalog read without increasing timeout or weakening
scope. A prompt-free same-account read now returns eight visible IDs including `gpt-6.1-sol`,
its default selection, text/image input, six effort grades and 272000 resolved executor capacity.
The built single-instance desktop was restarted and opening the existing connection automatically
replaced the unknown capacity with 272K/vision; its advanced editor contained all six grades plus
Auto while output capacity stayed empty. Inspection was cancelled without saving preference edits.
The preceding 0.156.1 read, including hidden rows, omitted that exact model. Native discovery sends
client_version; the official 0.160.0 binary separately returned it under the same identity.
This proves version-dependent directory discovery, not subscription inference entitlement.
Maximum/override capacity is distinct; unknown fallback is not ModelComplete evidence. Native
image/video, signed releases, other platforms and owner acceptance remain unproved. Pi Agent Core
remains the generic default; no native credential is copied into public SIWC routing.

The latest stable tag object `79b1b666f2e8551f8abbbca34957227f67f3f553` is retained in separate
immutable intake `源码参考/software/intake/codex-0.160.0-review`. [OpenAI’s model-discovery
contract](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference)
distinguishes public plan `/v1/models` from cached/bundled app-server lists. Fleet's scoped
model/list awaits checked Online through that same native manager; failed reads retain Fleet's
saved directory. Warm-cache/new-ID/503/identity-discard evidence uses actual Rust or its injected
endpoint boundary, with no paid inference.

Original ZCode `29628c9` Provider model commands/editor remain the UI/data path. OpenCode `f66b86ce` `dialog-custom-provider.tsx:117–155` writes explicit model IDs through its existing provider configuration, and `context/models.tsx:11–42,112–135` separates user visibility/recent intent from discovered metadata. Fleet adapts that intent separation within its existing Provider record: `manualModelIds` is optional and never inferred from legacy automatic lists or exact capability rules. Subscription/native Add reuses the existing single draft/editor; refresh, overlap, account changes, rename, deletion and real repository restart preserve manual corrections. Built-window Add then exposed a second defect: native manual IDs inherited API-only required parameter maps and were absent from selectable models. Registry and editor preview now share native route completion: a no-op API map and Auto when no effort declaration exists; no model capability or Fast claim is added. Real Codex/Claude Provider tests verify selection, metadata preview, refresh and restart. The primary added `gpt-6.1-sol` through the built Settings UI, closed the original metadata dialog, reopened the same review profile, observed it after completed refresh and selected it in New Conversation. Its metadata dialog no longer reports a missing API map. The earlier 0.156.1 read omitted that eighth ID, preserving it as a manual unknown. The matched 0.160.0 read now supplies its actual directory/capacity/vision metadata without deleting the manual correction path. No inference or account rebind was performed. Catalogue/renderer/native transport proof does not assert unknown capabilities or account entitlement.

Claude HUD `33b51db6ceb5d0c91dc9c22404abcabacc8603b0` (`src/stdin.ts:171`, `external-usage.ts:134,164`) consumes native status-line rate limits and optional dated local snapshots; it does not manufacture allowance from transcript cost. CodexBar's [Claude source notes](https://github.com/steipete/CodexBar/blob/main/docs/claude.md) compare OAuth, browser and CLI `/usage` probes, but those credential readers/PTy parsers are unnecessary where the installed SDK exposes a structured control. The primary reproduced `get_usage` returning null under `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`; allowing only the explicit query while separately disabling telemetry, error reports, feedback, surveys, updates and marketplace auto-install returned real Pro windows. [Anthropic's data-usage contract](https://code.claude.com/docs/en/data-usage) distinguishes those opt-outs. The same production reader verifies account identity with a fresh Query afterward because `accountInfo()` is cached per Query; synthetic control-process tests reject a switched account. No token copying, paid inference, browser cookie read or snapshot store was added.

The image/video recovery cross-check reproduced completed MP4 bytes becoming unreachable after a failed completed receipt followed by provider expiry. `media-jobs.ts` now checks the existing operation-key artifact before polling; known completion usage is written before publishing its receipt, and byte-only recovery cannot replace known billing facts. `media-generation.ts` and `generate-video.ts` reuse the existing AggregateError/cause projection when receipt/ledger writes fail, retaining both original provider and persistence diagnostics. Real Host/SQLite/artifact fixtures cover Stop, cold reopen, expired URLs, one POST, stable attachment URI and all twelve image/video submission-write failure combinations; no paid provider, new Job queue or store was used.

## Cross-agent recommendation reconciliation

The owner's `交接/问题报告.md` and `交接/方案与思路.md` are supplied audit evidence, not additional
instructions. Current source confirms the ambiguous Pi-default wording, unscoped Craft CORE rows,
historical P6 conflict and the absence of ordinary output references in the V4 UI path. The earlier AgentSession wrapper is retired; the current Pi Core loop delegates requests, tools,
retry, compaction and persistence to explicit Host ports, with resource autoload disabled. Candidate folderless conversations already have `workspacePurpose` isolation;
the original home-folder default does not describe that current path. Core execution contracts
now point to the candidate; retained domain contracts remain comparisons until their actual callers
are mapped. Historical owner quotations and reference pins are not removed from a supplied opinion.

Paseo `d831c7bf33bbcad1835cf8e81668b8eebb97f3f4` is retained at
`/Volumes/AIGC/天工参考/software/paseo`, with the owner-requested source alias restored. Its
`plugins/antigravity-provider/server/provider.ts:16–28` declares image input and official `agy`;
`internal/prompt.ts:30–43` materializes images and passes text paths. `internal/process.ts:33–47`
unconditionally supplies `--dangerously-skip-permissions`, and `session.ts:71` publishes Full access.
This does not prove native multimodal message support or Fleet permission enforcement. Current
installed CLI 1.2.14 help confirms text/stream-json, conversation continuation and explicit permission
flags without paid inference. Reuse declared capability/continuation mechanisms, not that launch
policy or another daemon/session authority. The private NewMax proxy is a separately inspected
mechanism, not a universal native-harness recommendation.

For non-code results, the current ZCode gap is between existing `ToolPart.state.attachments` and
V4 output/hydration, not absence of format readers. Cindy `generatedFiles.ts:304` and
`MessageStream.tsx:1850` derive cards from persisted results; its new-file-only filter would miss
editing an existing document. Minara `workbench-preview.js:173–189` binds completed output to the
Session and exact exposed file; generated rows remain read-only. NewMax renderer
`MessageFileCards:26515` and `FilePreviewComponent:206693` distinguish file types and preview/edit
targets, but failed existence checks and rendered UI are separate evidence. Fleet reuses its
Session/artifact owner and format-aware preview, preserving code review and precise tool-result
read identity. Official [Codex file review guidance](https://learn.chatgpt.com/docs/reference/troubleshooting),
[Codex artifact previews](https://learn.chatgpt.com/docs/changelog),
[Claude artifacts](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them)
and [Cursor generation](https://prod.cursor.com/help/ai-features/agent) corroborate distinct review,
preview and result surfaces; none establishes native Office editing or media entitlement in Fleet.

The reproducible candidate `scripts/measure-context-projection.mts` captures a fixed fresh
AgentRuntime/Pi/SQLite fixture with scripted inference, excluding synthetic Probe and local-only
tool contracts. It currently reports 16 tools, 6,542 system-content characters, 27,322 projected
tool-array JSON characters and 34,235 `{messages,tools}` characters. The same fixture restricted
to Read/Glob/Grep reports 3 tools and 12,288 envelope characters. This is not a token count,
final vendor wire, accepted-outcome test or a like-for-like reduction from the older fixture.
The fixture disables optional memory/title/workflow; model-side lightness is still an open measured
delivery requirement, not established by the SDK choice or this read-only profile.

Per-tool projection measurement separates description and input-schema JSON: the same sixteen-tool
terminal fixture reports 15,555 description characters and 10,620 schema characters. AskUserQuestion,
EnterPlanMode, ExitPlanMode, Agent and Bash account for 17,029 of 27,322 tool-array characters. The
Host-only contract is not duplicated into the request. Removing required contracts without an
accepted-outcome comparison is not a verified economy improvement. The bounded correction instead
fixes actual turn-disallowed Skill discovery/dispatch and failed-call-ID success attribution.

The original ZCode `core/runtime/methods/turn-model-step.ts:263–276` drops a result received after
Stop; the candidate inherited this before the receipt correction. Current Host/Pi/SQLite fixtures
also reproduce a finish frame followed by iterator failure. One existing response snapshot and
usage writer now preserve the known response without replay; the original V4/legacy observations
and stream-row path consume it, while logical error/cancellation stays distinct. This is source
and isolated execution evidence, not a comparison of model intelligence or paid vendor latency.

The official [AGY headless contract](https://www.antigravity.google/docs/cli/headless/) supports text
input and cumulative session results, rejects Claude control messages, and soft-denies unavailable
approvals. Its [PreToolUse contract](https://www.antigravity.google/docs/hooks/) uses camelCase
`conversationId`, `workspacePaths`, `modelName`, `stepIdx`, `toolCall.name/args`; the NDJSON stream
uses a different schema. The isolated native preflight is corrected to those actual fields,
omits transcript/artifact paths and arbitrary metadata, and accepts only an explicit local Host
allow/deny response. Five tests prove that transport boundary; no production hook installation,
native account binding or inference is implied. The official Python SDK and forced-bypass Paseo
adapter remain separate mechanisms, neither a substitute for that missing executor proof.

The owner-supplied audits are hypotheses; the following source comparisons resolve their material
claims without importing another Agent's instructions or declaring complete-product delivery.

| Recommendation | Verified implementation and decision |
|---|---|
| Remove the old ZCode execution alternative | Candidate `core/runtime/methods/turn-loop.ts` now dispatches to Pi or an explicitly admitted native executor. The production legacy `agentExecutor`/environment selector is retired. The Host still owns canonical admission, permissions, history and receipts; one turn has one executor. |
| Replace Host preparation with Pi defaults to make models lighter | Actual desktop AgentRuntime/Pi scripted inference measured 7,563 system-prompt characters and 28,281 tool-schema characters across 18 tools, including a synthetic test Probe. The audit's 38 KB figure was source-file size, not a request. The context tax is real and still needs task-specific outcome measurement; Craft v0.14.0 `pi-agent-server/src/index.ts` also overrides Pi's prompt and wraps Host tools. Retain the proven Host boundaries while removing unavailable tools and developing scoped capability loading, rather than claiming the SDK name makes a model smarter. |
| Add subscription failover | Already implemented in `packages/services/src/model-provider/subscriptionRecovery.ts`, alongside API-key `credential-failover.ts`: identity/model-scoped health, bounded attempts, cooldown/reset facts and no uncertain-success replay. Improve a reproduced gap; do not introduce CLIProxyAPI as a duplicate owner. |
| Pi images can replace every generator | Released Pi 0.99.2 `providers/images/register-builtins.js` registers only OpenRouter Images; `images-api-registry` is an extension seam. Codex `ext/image-generation/src/{tool,backend}.rs` separates the Skill workflow from authorized backend execution. This supports retaining Fleet's shared media port rather than replacing every generator with that registry. Current API image/edit/video receipt coverage and remaining subscription/general-Job boundaries are owned by [Media](modules/media.md#candidate-generation-and-recovery-contract). |
| Claude should first use direct Pi OAuth | Current official-native SDK route owns login credentials and private continuation, with Host tool permissions and durable receipts. Its matching bundled binary, resume/stop and rejected Console/API authentication have local integration proof. Returning to third-party Claude token handling would discard that verified boundary; no demonstrated improvement supports it. |
| Runtime pricing sync is better than a frozen catalog | cc-switch `src/lib/modelsDevAutoSync.ts` and CodeBurn acquisition/cache paths informed the implemented bounded runtime refresh and offline last-good/bundled fallback. Public prices remain estimates and cannot establish actual invoices. [Context](modules/context.md#subscription-allowance-acquisition-and-display) owns the current acquisition, coverage and remaining subscription-value comparison boundary. |
| Add page assistance, UI plugins and project suites | Craft `EditPopover.tsx`, Cindy `plugin-protocol/src/manifest.ts` and its registered right-side panels supply mechanisms. The candidate's first Model Settings assistant uses the version-checked non-secret Provider operation and normal Session/permission path; other pages and the full native UI/plugin lifecycle remain separate delivery gaps. [Agent core](modules/agent-core.md#context-menu-assistance-source-backed-landing-boundary) and [Components](modules/components.md) own those boundaries. |
| Replace all storage with experimental Pi durable/Chord | The earlier [whole-product comparison](#kernel-choice-against-fleets-complete-product) already tested their commit/queue boundaries. Their shared-document mechanisms remain valuable, but replacement requires equivalent account/input binding, permission, recovery and native-editor proofs. Difficulty or workload is not the rejection criterion. |

The project-membership correction now queries the existing local TaskIndexRepo, so old Projects no
longer disappear from cost attribution after the recent-ten preference rotates. No usage rows or
user Project records were migrated. Native Claude catalog projection now preserves the SDK's
reported Fast support instead of dropping it. Source reconstruction gates cover the actual active
candidate, and independent archive restoration checks supplement the patch replay.


## Combined composer and first page operation proof

The current correction additionally compares native Grok Build `2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8`:
`crates/codegen/xai-grok-shell/src/remote/client.rs` reads scalar/default and explicit window menus;
`agent/config.rs::context_window_choices` retains/prepends the default and deduplicates choices;
`session/acp_session_impl/model_switch.rs` persists selection and changes sampling/compaction budgets.
Its sampler does not send a guessed context-window parameter. Fleet reuses those semantics in its
existing Provider/ModelSelection owners. Local catalog, write-failure, SQLite restart, backup-account
and actual styled-renderer cases verify the path; the built review's synthetic 256K/500K choice
updates the original ring before inference. Real Grok entitlement is separate evidence.

For automatic public pricing, cc-switch `f678f7c539c90ed0e43872680b7f7162db5d0ef2`
`src/lib/modelsDevAutoSync.ts` coalesces startup sync and uses a six-hour interval. CodeBurn
`986d72ce1efbfaf40b3c9d4050d9ecdbc24be986` `src/models.ts` keeps a dated disk cache, bundled fallback,
long-context rates and pricing-generation identity. Fleet admits bounded refresh/cache into its
existing ledger read, preserving frozen request amounts instead of importing another usage store.
The real anonymous models.dev read returned 215 providers/7,722 prices with source hash
`902fd888080a` on 2026-10-01; this is public-directory acquisition, not paid inference. Fixtures
prove coalescing, backoff, corruption/write failures, restart, read-only repricing and duplicate receipts.
[Official GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol) supplies its API
rates and >272K threshold; [ChatGPT pricing](https://learn.chatgpt.com/docs/pricing) separately supplies
purchased-credit rates. [Speed](https://learn.chatgpt.com/docs/agent-configuration/speed) distinguishes
1.5x generation speed for older models from 2.5x included allowance and 2x purchased-credit billing.
These do not establish a universal Fast multiplier or an actual subscription invoice.


OV-074 uses the owner's Codex desktop screenshots as the interaction reference: one model/effort
entry, independent Fast, and Brain-only collapse at insufficient width. The public Codex checkout
`94d642d8b40e45e2e544770f0d1f28df9a717f06` supplies native effort ordering/advanced-option and
request semantics, not the proprietary desktop component. Desktop automation of Codex was refused
by the available UI tool; no private component source is claimed. Candidate `ModelConfigSelect`
retains its original provider/account submenus, locks, footer actions and focus restoration;
`ComposerModelControl` contributes exact effort rows and a small provider-specific Fast action to
that menu. `useComposerToolbarFit` remains the only fit owner. Standalone automation controls are
preserved. OV-075 supersedes the expanded root effort list with the owner's compact four-row
reference: Fast uses the existing Switch and Effort/Model open the original menu primitives. The
owner’s follow-up hides Context for fixed-capacity models; only the explicit Grok menu and its
executable Host budget now establish context choices. Confirmed model capacity is available before first inference in the
original Token ring, with explicitly unmeasured occupancy. The composer has no Settings footer; one provider's Model row
opens its model list directly. Closed menus do not materialize the model rows. Updated fixtures
exercise keyboard submenu entry, exact model/effort/Fast callbacks, the visible switch thumb,
hidden fixed-capacity selectors, removed navigation and Brain collapse in both languages/themes.
Separate actual renderer cases cover capacity before first inference, unknown usage and changed
model capacity without leaking the previous reading. Renderer fixtures verify 560/150px, both languages/themes, one trigger, compact Brain,
no mount/resize writes and separate effort/Fast callbacks. The actual built composer also verified
independent selection and focus return; the owner still judges the interaction/look.

The page assistant reuses Craft's centralized contextual entry and normal Session path, with the
existing ZCode Popover/SessionPane and Provider writer. Built local loopback checks exercised exact
model right-click, retained target Session after restart, read-only context, one-change permission,
and a committed toggle updating the original page. The observed permission receipt records allowed
versus denied outcomes; the first overly permissive capability declaration was replaced by the
existing always-ask/no-always-allow policy. Its new localized tool summary replaces the generic raw
JSON fallback, using the same timeline/permission rendering path. Pi/SQLite tests additionally reject
invented registered tools outside the page scope, stale human writes and deleted targets. No live
provider content or credential was sent; synthetic inference is distinct from live model quality.

The scoped implementation exposes model-enabled state and context/output capacity correction. It does not implement every page's
operations, price-correction tools, secure conversational credential entry or plugin/UI lifecycle.
Those requirements retain their owning contracts and execution order rather than being counted as
complete by this single proof.

### Capacity correction and recorded usage identities

Original ZCode `29628c9` already owns the human metadata editor, personal rule layering and option
maps. Current `ProviderFormControls.tsx` captures the first draft revision; `ProviderSettingsFacade`
and `NodeProviderConfigService.savePersonalModelDraft` check registry revision, personal-file
revision and model membership under the existing serialized atomic writer. Fleet's page operation
uses that same path; no generic configuration or file-edit tool is introduced. Craft v0.13.4's
`EditPopover.tsx:684,957` supplies target-bound context and a normal Session; its default allow-all
and edit-then-validate path are not copied. Cindy `a46bb58fc326`
`apps/desktop/src/main/maker-host/plugins/settings-reader.ts:100` read/modify/write
has no caller CAS and cannot replace this writer; its navigation helper is not a mutation service.
The current provider catalog and sparse rule schema, rather than names or Pi runtime fallback
limits, supply capacity evidence. The Host's existing preflight reserve remains a separate policy:
one pure function now serves the original compact policy and the shared writer. It does not become
a vendor output limit. Local real Pi/SQLite tests prove permissions, stop, stale writes, committed
receipt and reopen; renderer checks use the original permission card in both languages/themes.
The built desktop additionally completed a loopback capacity correction and refreshed its original
model row. It exposed a redundant read title and a false effort prompt on a fixed-level legacy
Session; both were corrected using the original summary/picker primitives. The prior ZCode
`ThoughtLevelCycleControl.tsx` fixed-level branch is retained behavior, not a new effort choice or
default writer. Actual renderer tests keep model/Fast selection and mount-time no-write checks.

For the next simple subscription-value view, CodeBurn `models.ts` uses a 24-hour price cache and
generation-aware refresh; Fleet already has its own six-hour runtime catalog/cache. Its
`plan-usage.ts` monthly allocation/reset-day calculation is incompatible with OV-057. CodeBurn
`plans.ts` also uses credit budget as `monthlyUsd` for some plans, so that value cannot be treated as
the public subscription price. CC Switch's `modelsDevPricing.ts` missing-price-to-zero fallback is
not adopted. Fleet's existing request writers already freeze auth and billing identities, but its
SQL read aggregation omitted them. The corrected projection groups those saved facts without
rewriting history, guessing from the current connection or introducing a billing store. A public
monthly reference and the retained requests' API-equivalent value remain separate facts; this read
correction alone does not implement the future visible comparison or establish an invoice amount.

### Primary Craft contextual-assistant and model-default trace

Primary inspected Craft v0.13.4 `EditPopover.tsx:675,719,779,949,963,1055`, `AppShell.tsx:1878,3758`,
`AiSettingsPage.tsx:949,967,1058` and `SessionManager.ts:2562,2596`. Right-click retains an actual item
identity and anchor; a short typed edit request becomes a context badge. Opening clears the inline
Session; first send creates a hidden ordinary Session and uses the normal send/permission/credential
callbacks. Its `fast` hint resolves through the selected connection's mini/default model ID, not a
service-tier speed flag. App and workspace defaults live with existing configuration owners;
restored Sessions are separate from new defaults. Fleet retains these lifecycle/scope mechanisms
and its own original primitives, permissions and version-checked writers; it does not copy allow-all
or arbitrary config-file editing. Craft's visible `currentModel` state and inline creation's `model`
prop are separate in the inspected code; Fleet must prove the selected/default identity reaches
the physical request instead of taking a changed picker label as execution evidence.

The primary re-traced Craft's `AppShell.tsx:1884,1923,3713` and `EditPopover.tsx:845,856,865,907,1016,1033`: a menu action captures the source/position before closing, then opens the popover; movement applies to its inner surface, resize is bounded, and opening resets geometry/inline Session. Candidate `PageAssistantHost` now uses ZCode's existing virtual-anchor API (also used by `ChatPromptActionMenu.tsx:75,265`), preserves domain menus, retires repeated header actions and moves/resizes the inner window independently of entry animation. Backend `pageAssistantConfig` binds the immutable target and short rule prompt; `ReadPageContext` returns that page's current safe facts and supported operations rather than scraping rendered fields. Real renderer checks cover pointer variation, keyboard movement/resize, fresh generation, stale rejection and preserved native actions; the primary also verified native right-click selection, fresh General/Model Settings targets, actual mouse drag and corner resize in the rebuilt desktop. Owner visual acceptance and unsupported domain operations remain separate.

Cherry Studio `e22924df` `ModelTypeFilterTabs.tsx:127` hides categories without results;
`modelListDerivedState.ts:119` distinguishes generated output and dedicated speech endpoints.
`MODEL_COUNT_THRESHOLD=10` is declared but not used by its actual header, which exposes a manual
filter control. Fleet's automatic threshold is its own bounded enhancement. The source is AGPL;
these are mechanism comparisons, not copied implementation. Input vision/audio and a known model
name do not alone establish a generation or transcription route.

### Kernel receipt release and private Pi projection

Primary source inspection follows the original ZCode `turn-loop.ts`/`model.ts`, the candidate's
`native-agent-turn.ts`, and the installed Claude SDK 0.3.286 and Pi 0.99.2. Host request persistence
precedes media/context assembly; the native adapter's `admitNextStep` releases a waiting MCP callback.
Releasing it before `runModelTextRequest` finished assembly could allow native continuation even
when assembly failed. Real SDK/bundled-CLI/loopback tests reproduced two releases for one successfully
prepared request. The correction releases at the observation handle only after final assembly and
Stop validation. Tests preserve the already committed effect, leave uncertain continuation inflight,
and forbid another native request. Cold reopen of that inflight state uses complete visible history
and keeps the committed tool effect without replay. Non-streaming observation also consumes the final projected
input, matching the existing streaming route; both retain real image/PDF blocks and derived paths.

Pi's custom stream uses the Host's final admitted request, not Pi's private transcript. The
current adapter uses Core's public `runAgentLoop`, actual tool input schemas and completed assistant
text/reasoning and tool text results. It removes the unused Agent object's queues/state/subscription
and the detached tool-error fallback. One memoized Host batch closes even unknown or Pi-rejected
calls in the awaited finish hook. The Host remains the request/history/permission/result owner;
Core schedules rounds. This is not full Pi Coding Agent behavior or a provider-token saving.

The controlled core fixture with the default available tools measured 6,799 serialized system
characters and 27,446 characters for the 17 name/description/input-schema tool entries (including
a synthetic Probe). Its full internal contracts were 65,278 characters and include output schemas
and permission metadata that do not go into Pi's provider tool declarations. These are fixture
character counts, not token counts, prices or a production loadout benchmark. They confirm that
model-facing tool descriptions still require the bounded capability-loading work in the context
contract; merely selecting Pi does not achieve the owner's lightweight-context goal.

### Default executor selection under OV-084

Primary read the installed/reference Pi 0.99.2 `agent/src/agent.ts`, `agent-loop.ts` and `types.ts`,
Craft latest `pi-agent-server/src/index.ts`, Cindy `maker-core/src/agents/pi/{index,transport}.ts`,
and MiniMax `agent-core/src/pi-turn-runner/{agent,pi-turn-runner}.ts`. Pi Agent Core exposes a
generic Agent with public `prepareRequest` and `finishTurn`; it does not require a Coding Agent
resource loader, CLI settings or SessionManager. MiniMax uses that Agent directly with Host
history/tool/LLM hooks. Craft uses AgentSession plus proxy tools and a configured system prompt;
Cindy invokes the actual Pi CLI through RPC and retains its product/extension runtime. These
are different integrations, not proof that all three have a single interchangeable kernel.

Fleet selects the generic Agent Core loop mechanism for a general workbench and keeps existing Host
operations, permission and durable writers. The default route removes Coding Agent session/resource
construction and hidden continuation messages, using Core's supported finish decision instead.
Native executors remain sibling routes; their built-in capabilities are not forced through the
default model loop. The currently pinned Agent Core 1.0.2 remains the declared direct dependency; no dependency,
remote service or storage owner is added by the public-loop correction. Compatibility checks
verify implementation after this requirements-based decision; they are not the selection criterion.
The adapter imports Core directly rather than Coding Agent. The staged CLI checks real file-tool
execution and cold process restart; the current public-loop correction also retains the source
permission, streaming, Guide, output-limit and reopen fixtures. Controlled
large-catalog fixtures keep core tools direct, discover one exact operation, reject same-batch
hallucinated calls, preserve semantic denial and retire replaced/changed/restricted bindings.
Successful search receipts use the existing tool ledger; failed persistence sends no later request.
These verify the chosen boundary without claiming an unmeasured model-quality advantage.

Pi's Coding Agent also exposes a built-in `createToolSearchExtension` (its tool uses BM25 and records
active tool changes in its own SessionManager). That exact extension is not directly applicable to
Fleet's Core/Host split: Host owns per-input availability and committed tool receipts. The small
client search projection loads the original tool in the next Host request, using the same semantic
handler/permission instead of creating an invocation broker. Official Anthropic tool search requires
model-specific server support; the ChatGPT plan route explicitly excludes hosted tool search.
Fleet's client path does not send those unsupported vendor fields. Provider-context savings and
accepted-task quality still require their own measurement.

### Selected Pi library release intake

The matched v1.0.2 published release (`cd32f7725fdbddbaecdff5b1e68491563394e0ca`) is retained
in `源码参考/sdk/pi-earendil-1.0.2-review`, including package hashes and the exact commit MIT license.
Agent Core loop/hooks and every original Host-patched AI file are byte-identical across 1.0.1→1.0.2.
The OAuth/registration, classifier, cache, admission and SQLite paths retain their existing owners.
AI changes include per-thinking sampling and catalog facts, not new Fleet routing authority.
`@mariozechner` 0.73.1 is a different publication family lacking these consumed APIs; changing
namespace is not a patch upgrade. Coding Agent remains source-only; its extension autoload is off.

The candidate's declared Agent Core and Pi AI dependencies are both 1.0.2; Coding Agent is a
reference package, not a production executor. The official [release](https://github.com/earendil-works/pi/releases/tag/v1.0.1)
and published package sources are preserved under `源码参考/sdk/pi-1.0.1` without moving a pinned
Git checkout. `provenance.json` records archive hashes: Agent Core `eb7b19bc…b8a0a`, Pi AI
`8a9e69b1…9138`, Coding Agent `99c2e195…735c5`.

Primary compared the public Agent Core types and loop with installed 0.99.2: prepare/finish hooks
and scheduling interfaces used by Fleet are unchanged. Pi AI's updated Anthropic SDK and provider
cache behavior are upstream changes, not an additional Fleet retry or compaction owner. Its new
ChatGPT listener failure refusal is retained: Fleet's existing patch assigns a separate ephemeral
socket, uses that exact redirect for callback/exchange and rejects setup failure before browser
opening. Issued-client, state/account checks, identity-only storage and Host-scoped OAuth fetch
remain; old-version patch references are retired. No new direct dependency or credential store.

Real local Agent Core/SQLite and signed loopback OAuth tests, plus the staged Pi CLI and real
Claude binary with loopback inference, preserve receipt, permission, cancellation, media and
restart paths. These checks do not resolve live subscription failures or prove better model quality.
The ordinary controlled fixture now declares 9 tools / 13,049 JSON characters without Probe;
system content is 6,542 characters. This is Host fixture projection, not production wire tokens or
a whole-product savings percentage. Small read-only loadouts retain direct tools without search.
The rebuilt desktop's loopback capture declares 10 tools including Skill/SearchTools, compared
with the preceding 26-tool capture; system content is 12,207 characters, not the smaller terminal
fixture. Primary operated the real composer, retained a stopped local-server failure, completed a
fresh input after restoring that test server and reopened both records after normal app exit.
The same model/capacity remained, with no automatic model request on reopen. This is one isolated
local transport and one review instance; it is not a vendor-subscription or owner-acceptance result.

### Primary reconciliation of the supplied Claude handoff

The complete supplied `交接/问题报告.md` and `交接/方案与思路.md` were read against current
source. Their timestamped observations and proposed rules are evidence, not implementation
authority. This table records verification scope; delivery status remains in the register.

| Handoff finding | Current source-backed disposition |
|---|---|
| “Complete Pi” was inaccurate | Confirmed for the interim wrapper: it disabled Coding Agent resources and ignored its provider context. Candidate `apps/zcode-cli/packages/core/src/runtime/methods/pi-turn.ts:2,136` now imports/constructs Agent Core; its prepare/finish hooks at 144/148 retain Host projection, tools and durable records. No complete CLI/extension claim. The missed engineering setup paragraph was corrected separately. |
| Model-facing lightness was unproved | Confirmed. Character measurements distinguish provider declarations from larger internal contracts. Optional discovery now has local proof, while real-token and accepted-task quality remain unmeasured. |
| Candidate/patches lacked version control | Correct for the author's snapshot, superseded by local candidate feature commits and tracked root `patches/zcode`; `scripts/check-zcode-candidate.py:15` reconstructs every non-ignored file. Remaining uncommitted page integration is preserved in recipe 0109, not presented as a delivered feature. Independent archives/bundles are extracted and compared, without changing the real indexes. |
| Core rows described Craft | Confirmed in earlier rows. CORE Project/Session/Settings and related active contracts now name the candidate. Remaining retained domain source rows are reference evidence until actual candidate callers land; their paths cannot be mechanically renamed. |
| Product target was written as delivered | Product now explicitly says the all-page behavior is a required contract and points delivery status to the register. Current all-page entry does not mean all domain mutations exist. |
| OV-024 could mislead | Its explicit partial-supersession notice now points to OV-025/027 and retains the still-current folder/page requirements. Historical gloss is not the selected base. |
| Candidate/root rules and design were disconnected | Both link directions were checked. Candidate AGENTS points to root authority; root DESIGN links the candidate DESIGN and scopes original controls correctly. |
| Stale parallel-frontier workflow | Confirmed and retired: the ignored executable entry now refuses before any dispatch and references current AGENTS/TODO. Its complete original is retained outside the project by SHA-256; a controlled invocation verified zero Agent/pipeline calls. |
| Context prose bypassed readability limits | Oversized historical prose was reflowed; executable contracts and evidence remain in their distinct homes. The 700-line gate remains enforced. |
| Quotation statistics and history counts | The reported 559 messages and 203 matching quotes are the handoff author’s snapshot. They were not fully recomputed in this source audit; alleged altered/untraceable quotations are not marked resolved. |
| Remove quotations/reduce references to ten | Those are recommendations, not verified defects. Current owner rules retain exact decision evidence and reference pins. Bounded per-module intake prevents whole-ledger loading; unique evidence is not silently removed. |
| Page assistant only changed model enablement | Superseded partly: candidate `modelSettingsAssistant.ts` adds capacity operations through original writers. `packages/ui/src/root/RootShell.tsx:12` hosts `PageAssistantHost`; its new invocation at `PageAssistantHost.tsx:141` changes generation. General preferences and Model Settings defaults invoke their matching original writers. Other pages have typed guidance/read scopes. Full domain mutation coverage and visual acceptance remain open. |
| Plugins cannot add general UI | Confirmed, as the handoff says. Candidate `plugins/index.ts:110` recognizes manifest formats, while `packages/ui/src/lib/workspaceSidePane.ts:516` remains a finite built-in tab union. Format recognition and general registered UI contributions are different capabilities; the latter remains a later delivery gap. |
| Folderless work needs only renaming the home folder | Insufficient: candidate uses a distinct conversation backing purpose and excludes it from Project grouping. Original home-folder behavior does not provide that isolation or Project suite lifecycle. |
| NewMax's Claude conversion proxy deserves comparison | Source confirms the reported mechanism, but it does not establish better model behavior or native subscription entitlement. The handoff itself recommends native vendors/Pi for incompatible endpoints, not a universal conversion gateway. Keep that distinction in the executor decision. |
| Antigravity image support conflicts between sources | The handoff correctly calls this unverified. Paseo passes materialized paths as text and skips permissions; that is not proof of native visual input or Fleet policy. Installed `agy` and official SDK/hook contracts were inspected separately. The earlier handoff described only Claude. The current candidate exports Claude and scoped Codex; the Antigravity type in `contracts/src/model/model.ts:47` does not implement an executor. |
| Native CLI routes are incomplete | Partly stale. The scoped Codex app-server executor is now built and locally proved alongside Claude; ACP/agy remain absent. Public ChatGPT local callback tests still do not establish successful live consent or resolve organization policy. Native catalogue reads and synthetic inference prove separate paths, not live model entitlement. |
| Non-code output had no interface path | Confirmed earlier missing V4 references. Committed `packages/ui/src/v4/conversationOutputs.ts:12` now collects durable successful image/video tool attachments and the existing output cards open original viewers. Its generation whitelist does not cover every document or live provider; those remain distinct gaps. |

Source owners: root AGENTS/DESIGN, current `product.md`, capability register, original Provider/Session
code, candidate `pi-turn.ts`, `plugin-types.ts` and `workspaceSidePane.ts`, and the preserved source
recipe. Individual live account failures remain separate from this documentation/source audit.

The optional-tool controlled fixture measured 36,776 characters for its 25 optional declarations
plus Probe, versus 721 for initial Probe/SearchTools. This narrow fixture does not include Fleet's
ordinary core tool set, so it is not a whole-conversation savings percentage. Loading one matched
operation preserves the original semantic permission and records three actual model requests
(search, execution, answer). Small catalogs preserve direct invocation without that extra search.


### Contextual defaults and composer regression correction

Source trace uses Craft v0.14.0 `EditPopover.tsx:604,684,770,799,845,1020`: one compact conversation,
explicit target/rules, mini/default model hints separate from service Fast, normal permission UI,
pointer-relative entry, bounded movement and processing-aware dismissal. These are mechanisms,
not permission to copy allow-all or treat read-only guidance as an implemented operation.
Original ZCode `ModelConfigSelect.tsx:529` and supplier submenus remain the baseline for a model
with no adjustable parameters. The candidate had inserted an empty options layer, repeated provider/
model/effort in its tooltip and shown fixed Off as though the model were disabled. It now bypasses
that empty layer, retains grouping, hides non-adjustable effort and uses a short control-name hint.
Merged parameter controls remain only when real choices exist. A non-adjustable catalog above
20 choices keeps the existing search/list directly, without an empty Model row; above 50 matches
it retains virtualization. Both 500-model paths passed keyboard, pointer and off-screen search checks.
No new UI design system is introduced.
Default configuration moved while its Agent writer stayed on General; page-helper fallback also
ignored ordinary policy and reused an inactive fixed model. `pageAssistantService` now uses the
versioned preference view, exposes the existing writer on the actual modelDefaults surface and
retains the older General service path for recorded compatibility. New General toolsets do not
advertise defaults. Policy/vision writes use the same CAS and capability validation as human controls.
The form separates policy from fixed identity and keeps long explanation in original Help. No
contextual-operation claim extends to the still-unimplemented browser/plugin/document mutations.
The built review instance was personally inspected: a fresh draft selected an available model,
its real adjustable options appeared together, and right-clicking the defaults surface opened a
compact assistant titled Default models. No provider message or paid inference was sent. Four
locale/theme renderer states and narrow controls, original menus for non-adjustable models,
24 scoped-service/Host cases and the staged Pi local transport passed. Owner visual acceptance
is pending; these observations do not prove full page mutation coverage or live subscription access.
The same isolated review profile saved fixed mode through the real form: a newly initialized
ordinary draft used its saved Grok identity while a project draft retained that project's Claude
choice. Returning to recent mode hid the inactive fixed control without erasing it. Keyboard focus
showed the short Model options hint; its accessible name still contained the selected identity.

### Related-flow regression reconciliation

The original host establishes regression parity; each borrowed feature also needs its own complete
reference comparison under OV-090. Current source intake includes Pi tip
`200387122ca450d6387f033949423114a270b96c`, retained at
`源码参考/software/intake/pi-tip-2003871-review`, with release v1.0.2
`cd32f7725fdbddbaecdff5b1e68491563394e0ca`. All six Agent Core source files are byte-identical to
the retained v1.0.1 source. Historical tag-object comparison in the shallow intake failed on missing
objects twice; filesystem comparison supplies that narrower proof. Existing runtime dependencies
now use v1.0.2; AI's per-thinking sampling change supplies no automatic Fleet consumer or entitlement.

| Related chain and reference | Candidate/retained defect and correction | Proof boundary |
|---|---|---|
| Pi public-loop/prepare/stream/tool/finish hooks plus ZCode permission/service/SQLite writers | An unused Agent state/queue and permissive scheduling schemas obscured the Host boundary; the adapter now uses the public loop, real schemas/results and awaited batch settlement. Waiting approval ignored later project denial; remembered updates could overwrite a concurrent denial. Dispatch reloads rules, and the original SQLite writer compares observed rules atomically. | Real Host/Pi/SQLite denial and stale-write/reopen fixtures; no paid request. |
| ZCode request events, completed results, detailed ledger and cold resume | Failed model-receipt writes disappeared; raw tool IDs collapsed distinct rounds. The existing Session journal retains failed facts, then reconciles their exact ID; scheduled/error receipts keep assistant scope. | First-write and persistent-failure recovery, metadata/cache/account retention, dual-error-event and reused-ID fixtures. |
| Media port approval/binding, provider submit/retrieve, artifact bytes, receipt and statistics | Final JSON was exposed before complete write; saved image bytes could become unreachable. Existing staging/fsync/link publishes receipts; operation-keyed bytes can recover without POST. Pre-dispatch refusal is failed/not-started, uncertain dispatch remains unknown. | Actual interrupted filesystem write/publication, concurrent publication, binary/SQLite reopen and no-POST tests. Public provider eligibility/quality remains separate. |
| Craft preview/open lifecycle and LobeHub reader error/retry pattern; ZCode file/upload ownership | Failed composer previews were cached indefinitely. Explicit reopening retries a failed bounded read while successful reads and upload-progress reuse remain. Original attachment/upload data is unchanged. | Actual renderer/file-service fixtures; preview is not native document editing. |
| Craft regional menu → EditPopover/config → compact conversation → page contract → shared writer; ZCode native guest menu | The shared primitive injected one generic assistant item and non-modal behavior into unrelated menus. Those are removed; supported settings/provider/model regions explicitly own their scoped entries and non-modal mode. Browser helper used another DOM page's old point; saved unavailable helper defaults blocked new initialization. Native menu captures its own screen point in Host coordinates; typed requests without native coordinates use a fresh fallback. Shared directory validation resolves new helper defaults without changing saved choices. | Local source/renderer proof; fresh review binding restored native control; primary verified repeated provider positioning, latest Claude target and real dragging. Native guest anchoring and non-Mac evidence still require successful built interaction. Broader page mutations, eager helper creation and processing-aware dismissal remain unclosed. |
| OpenChamber account flow and official gh credential/process owner; retained RPC/Workspace lifecycle | Unmount could cancel on the new Host. Opaque auth continuations remain with their initiating RPC client; disconnect cancels only that client's pending gh process. Completed credentials stay with gh. | Fake process, cross-client, Host-switch and late-reply tests; no live gh authorization. |
| Craft header/drawer filters, statuses, Project/Archive routes and G9 read scope | Compact navigation and status/read entry points disappeared. Existing menus retain those paths; Mark All Read snapshots the metadata-filtered view, fences Workspace changes and disables content-search ambiguity. | Source/logic/types; retained rendering and owner acceptance remain pending. The retired Project list and folder-based flow are preserved. |
| ZCode Personal preference writer → provisioning wire → runtime directory → cold reopen/rollback | Ordinary/page/vision defaults, policy and decision settings did not all cross the wire. The existing codec now carries all five; an inactive fixed identity cannot invalidate another active policy. | Real source/target Node repositories, strict decode, cold reopen and failed-refresh/CAS rollback preserve every role without copying credentials. |
| Official Sign in with ChatGPT registration, callback, identity, scope, refresh, catalog and error chain | Numeric-prefixed organization-policy code was filtered out before UI classification. Safe code/status/kind survive without exporting the response body; callback errors retain state/route checks and existing registrations. | Signed OIDC/loopback, structured error and renderer fixtures; normal live account entitlement is not established by these tests. |

The official [registration](https://developers.openai.com/siwc/token-sharing-open-source/sign-in),
[account lifecycle](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)
and [app-server contract](https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server)
were reopened during this audit. Dynamic registration, verified identity, granted plan scope,
model membership and successful inference remain distinct. Electron's
[screen coordinates](https://www.electronjs.org/docs/latest/api/screen) and
[native menu contract](https://www.electronjs.org/docs/latest/api/menu/) establish the native popup's
screen-point origin; Wayland does not supply that cursor API and no cross-platform visual claim is made.
Source/fixture success does not promote a capability to usable or declare the repository complete.

The latest owner-supplied audit was read completely and checked against this working tree. Its
Pi placeholders and global menu injection were real and are corrected above; removal of the Host
request/history/permission owner is not justified by those adapter defects. Its Claude empty-usage
claim predates the corrected opt-out environment and real native Pro reading described above;
Paseo's token/keychain reader is therefore not selected as a duplicate credential access path.
The ordinary ChatGPT live-registration flow remains unverified, while new subscription connections
already default to official Codex. Antigravity/ACP remains absent beyond preflight/types; no executable
route is claimed. Decision expansion stays off pending kernel/subscription closure. Instructions
reported from another conversation remain audit evidence, not authority to remove owner history.

### Regional menu and close-lifecycle comparison

Craft v0.14.0 `SessionItem.tsx:140-185`, `entity-row.tsx:262,489-500` and
`useSessionMenuActions.ts` reuse one entity action set for overflow/context/compact views. Rename
keeps its captured Session ID and delete retains the original confirmation. Original ZCode
`29628c9` already shares ordinary Task actions; grouped Tasks use a different action component.
The candidate's provider header and navigation now share `ProviderActionsMenuItems`; navigation
rename selects the exact provider and consumes one request in the original editor. Plain Open is
retired from settings navigation, provider navigation, file-tree rows and message file links. Left
click/Enter retain those primary paths. Web links retain their distinct in-app/external routes.
Other task/group, Git, terminal and side-pane actions were traced; useful existing actions stay.
Sticky-group rename, project overflow/context parity and grouped-task common actions remain gaps,
not completed by this bounded correction.

`useAppPanels.ts` re-enumerated visible tabs after native closure, so a newly opened/replaced tab or
another selected owner could be removed. The correction freezes owner and exact resources, fences
late returns and retains original recovery/release. Twelve actual React-hook cases cover new tabs,
owner/workspace/remote/away-back transitions, replacement, metadata, early native notifications and
failure; native close is controlled transport. Real provider renderer cases retain identity/revision
and cancellation. Name Enter depends on native blur, so its existing runner uses a focused window;
hidden-window failure is not treated as a provider-writer defect. Primary's fresh built inspection
also read real native Claude Pro windows without inference. Built provider inspection verified
rename from an unselected row enters/focuses that exact original editor; Esc writes no name;
delete opens the clicked provider's original confirmation and cancel preserves it. Normal ChatGPT
login remains separate. A prompt-free real CLI check returned a Pro identity/catalog; the saved
review connection is bound to Team and has a different identity. Rejection is correct; the expired-
authorization wording was not. The reader/view now carries account-changed separately and retains
the original binding. No account selection, credential copy, inference or automatic rebind is implied.

### Active design-chain comparison

Comparison starts from candidate `64ec9b0bce6bbef24c648961f522387ddb5e0664`, original ZCode
`29628c9`, and the refreshed immutable sources below. The installed Pi Core/AI packages are both
1.0.2; inspecting published 1.0.3 does not upgrade them. Source availability is not inspection of
every feature. Primary owns account/product decisions and running integration; bounded workers
inspected context, shell and native artifacts, then catalog persistence, with primary cross-review.

| Source | Exact observed source | Related chain inspected |
|---|---|---|
| Craft v0.14.0 | `73bd9c2a3573158bea880984eb8d5fdb41e0cac2` | regional actions → EditPopover → normal create/send → mini prompt/local guides → file target → validate/refresh; drag/resize/focus/close and formatted reader |
| Pi current / published 1.0.3 | `b9ab918c626ad3dd5edb58de037540f9467def88` / `d78dc83d633229d12f8b79631384c4c2717c399f` | Core prepare/stream/tool loop versus full harness declaration accounting; exact directory IDs |
| Cindy current / published 0.1.97 | `cd3921a43c8877c2513f8750538e6747b42ef04b` / `88e224475a6183f7b31218a7499be956a4bf2667` | parked executor state/delta handoff, input ownership, layered model facts and approved view activation/crash/stop |
| OpenCode current / marked published product | `907b3bc518fa48e90e8ec24dd327d13eee71c36c` / `aec0b9a6d8898f68f923aaf08b7306d931fd9d76` | provider catalog versus overrides, limits/modalities and current protocol contracts; release lineage remains separately recorded |
| GenOffice | `e4be545a881eed5b700d5da997aae26e8e24fc82` | live DOCX operations/context → undo → native serializer → save queue/atomic write → close |
| LobeHub | `026e7afc519eb568850474a1060f33be7f83e5ba` | file reader versus document JSON/Markdown edit, autosave and conflict recovery |
| OpenChamber | `e302062e3be0686986594fddabdafd8a97c129e5` | conversation-bound controls and selected browser capabilities/control lease/reset |
| BrowserOS | `0152e0a829b36921787196b66a13d1025bc850be` | actual Chromium extension-import patches and screenshot consumer; not an Electron drop-in |

All current source paths resolve under `源码参考/latest/`; original pins are preserved. Official
Codex 0.160 app-server turn/steer and extension model-request contracts, Claude SDK 0.3.289 controls
and hooks, and the original `plugins/zcode-bundled-3.14.3/zcode-guide-plugin` were also read. A
synchronous Codex request contributor and Claude prompt hooks do not establish an asynchronous
Host gate for every physical inference attempt. A permission observer is not enforced admission.

| Finding and disposition | Producer → consumer / original comparison | Proof and limit |
|---|---|---|
| P1: restoring recommended model configuration erased directory facts; corrected | `provider/config-service.ts` restore → `config/model-config.ts:deleteExact` removed the added discovered layer → Registry/frozen factory fell back → failed refresh/reopen retained loss. Original deleteExact removed only personal exact rules; the correction restores that meaning and uses separate deleteModel for actual removal. | Real Provider/Facade/Node repository/Registry with synthetic OpenRouter catalog: provider65536/4096 → personal32768 → restore originally lost observations; red/green now retains them through503/reopen and clears them only on deletion. Other corrections/disabled/order remain. Normal catalog154 cases pass; no live access claim. |
| P1: final request budget misses newly projected declarations; unresolved | `core/runtime/methods/turn-step-prepare.ts:88,129` compacts before tools; `compact.ts:202,325` counts messages plus old reported usage, without changed declarations/prefix. Pi Core provides no corrective budget gate. | Real Host/Pi/SQLite fixture: messages2312 + tool estimate53637 + reserve4096 = heuristic60045 against capacity32768, still dispatched. The estimate is not an actual vendor tokenizer/limit; no unconditional rejection is justified from it alone. |
| Native enforced admission/Guide and parked A→B→A resume remain unfinished | `native-agent-turn.ts:18`, native model auxiliary wrapper and `turn.ts:280` correctly refuse unsupported admission/Guide. `native-continuation.ts:35,43` retains one journal pointer and overwrites the other binding. Cindy switch handler preserves parked engine pointers and explicit history delta. | Source refusal verified. Actual leaf helper with Map store retained1 pointer and did not resume A; not live provider/full Host switching proof. Preserve current account/history hash/inflight fences; use existing journal rather than a second Session store. |
| P1: underlying composer captures helper-input model/effort keys; unresolved | `ui/v4/composer/toolbarShortcuts.ts:86,198` window capture → ordinary composer callbacks; helper pane does not revoke underlying ownership. Cindy checks editor/send-button ownership/top surface. | Actual hook execution with standard-key stubs dispatched main actions for helper targets; no physical-keypress claim. Fix shared event/focus ownership, not another shortcut table. |
| P1: attachment preview loses persisted document target; unresolved | composer/saved attachment producers retain ID/ref/row identity → `ChatMediaAttachmentPreviewDialog.tsx:24,109` drops it → createSession/history retain generic document-preview. Existing resource schema already represents saved documents. | Source proof; unsent Blob IDs are not cold-readable saved refs. Carry actual owner identity without inventing a path or grant. |
| P2: edge drag followed by resize overflow; corrected | placement clamps old rect, resize changed size only. Craft also lacks resize containment. Existing same-owner position is now reconciled after layout. | Red then green installed renderer in zh/en light/dark plus regional menu cases; primary built-window inspection moved to right edge and enlarged repeatedly with full containment. Owner appearance acceptance remains separate. |
| P2: restricted loadout still waits for unrelated MCP; unresolved | context/MCP initialization connects configured servers before tool filtering, inherited from original ZCode. Pool leases can be reused. | Injected connection gate delayed first model request; Stop settled promptly with zero calls/effects. No cancellation or permission-leak claim. |
| Native Office edit, human media recovery, plugin-contributed views and browser evidence are still missing | Actual DOCX/XLSX readers and plugin enumerator are byte-identical to original; ResumeMediaJob has a durable owner but no human status/recovery consumer; browser handles/files are not artifact provenance. | Source and pure output tests, not native-edit/live-provider proof. Retain readers, receipts, bytes and browser owner. GenOffice's create path ignores false save result; do not copy that premature success. |

#### Guide, page rules and conversation lifetime

The owner's “ordinary conversation plus context” hypothesis is partly confirmed, not taken as a
requirement or a complete implementation description. Craft EditPopover `721,767,965–979` calls
ordinary create/send, uses `workingDirectory='none'` (its Session folder), mini prompt and hidden
Session. Candidate `PageAssistantConversation.tsx:24–38` calls normal createSession; Node uses
`getConversationWorkspaceDir()` for the fixed outside-Project folder. Candidate bootstrap additionally
selects focused prompt/tool allowlist and disables unrelated MCP/hooks/memory/delegation. Closing
hides presentation; a fresh invocation and explicit history resume have different Session lifetimes.

Candidate Help `ui/lib/productDocs.ts` imports the English/Chinese Markdown in the same packaged
Guide content plugin. Ordinary enabled Skill discovery → Skill body/baseDirectory → relative Read
exposes that package; its suppression remains effective. Restricted helpers previously had neither
Skill nor general Read, so “the package exists” did not prove they could use it. The corrected
ReadPageContext/ReadModelSettings `documentation:true` path requests only the matching packaged topic,
with version/locale and explicit unavailable state; no hosted fetch, second manual, auto-injected
whole guide or extra execution/file grant. Default reads retain short operation contracts/current
facts. Staged exact bytes, real serialized RPC and actual Host/Pi input forwarding are separate
local checks; no paid model behavior is implied. Original six specialized configuration/diagnostic
Skills versus the current general Skill, and the rejected single-article human reader, remain gaps.

Retain exact sparse observed/personal facts, manual ID correction, atomic full-catalog publication,
enabled/account binding and immutable admitted models. Antigravity native config is correctly refused
by schema/Registry today; its executor remains absent. Generic PDF serialization suspicion was
withdrawn after reading the installed AI7 serializer. Unknown metadata is not itself a defect or
proof of provider permission. Kernel, real login/inference, platform and owner acceptance remain open.

### Repository-wide audit coverage and defect index

The review locks candidate `e19924b15788e66a787dd6aa99c2dddd28ff791f` (134 patches) against ZCode `29628c9`, the retained Craft branch and refreshed reference snapshots. The input inventory contains 734 changed candidate paths and 79 retained dirty paths. All 63 register IDs have a source disposition; this is **not** a claim that every source body, real provider, OS or owner experience has been verified. Final changed hunks, coupled callers and failure consumers are inspected separately from scan-only or partial paths. The evidence reports preserve those exact boundaries.

Auditing and implementation are separate here: this pass records failures and priorities without changing the execution, credential, storage or UI authority. The [current evidence manifest](../源码参考/meta/fleet-audit-current/manifest.json) preserves checked source reports, disposable reproducers and logs outside the project tree. Each report states its source versions and actual read ranges. Model accounts/NewMax and running inspection remain primary-owned; bounded independent source audits are cross-reviewed. The supplemental plugin proof distinguishes first input/cold materialization from merely opening a folder, and disabled resident hooks from unproved blanket continuation after uninstall.

All changed production `src` paths now have a recorded disposition across the reports; a disposition
can be full source, final changed hunks, partial, retirement or an explicit exclusion. Candidate UI
has 220 such paths, including 13 retired original bodies and two translation prose bodies whose
complete bodies remain partial. The retained branch has 51 UI source dispositions, with five large
files retaining partial baseline/net-pin depth; its 13 non-UI changes and seven locale key sets are
separately reviewed. The primary additionally read 146 contract/protocol/native/service final-change
paths; the API report grades110 paths. Its local captures cover45 configured API templates,
428 model routes and1596 option combinations, not vendor entitlement. Test bodies, licences,
generated data, packaging and unchanged baseline bodies do not inherit production-source acceptance.

#### Operational defects and recovery gaps

These are not equivalent to the product capabilities still absent. Source-only findings require their listed execution proof before closure; a synthetic model or transport is never live entitlement.

| Finding | Priority | Trigger / failure | Evidence level and consumer boundary |
|---|---|---|---|
| API-01 | P1 | Standard Host enabled-key guard consumes every automatic-switch POST before transport | installed SDK + actual local HTTP loopback; standard production injection source traced; actual SDK ModelAdapter generate/stream all three formats; full trigger, exact paths, recovery and source lineage in `api` evidence. |
| API-03 | P1 | Credential-pool stop marker is lost between runner normalization and workflow recovery | actual installed ModelAdapter failure + executed policy inspection for all3formats; driver redrive code inspected, full long-running workflow not launched; full trigger, exact paths, recovery and source lineage in `api` evidence. |
| API-04 | P1 | Changing a discovered model ID forges provider facts for the new ID | real ProviderRuntime/Facade/Node repository/Registry and cold reopen with synthetic directory transport; no provider HTTP/inference; full trigger, exact paths, recovery and source lineage in `api` evidence. |
| API-05 | P1 | Deleting and recreating an API connection can resurrect old provider observations | real ProviderRuntime persistence/Registry, delete/recreate/manual add with synthetic keys; full trigger, exact paths, recovery and source lineage in `api` evidence. |
| DOM-01 | P1 | Unadmitted Project inline plugin hooks run on first input/cold materialization outside direct-hook trust | Actual bootstrap/Host/Pi/SQLite and reviewed local Node marker: plugin hooks2, direct hooks0, ordinary tool denied; `plugin-proof` narrows opening-only claim. |
| DOM-02 | P1 | Resident future turns retain disabled plugin hooks | Actual owner disable succeeded/UI flagfalse; next input added marker3, cold recreation added0. Skill/MCP/uninstall branches remain resource-specific source evidence; removed files may fail. |
| DOM-12 | P1 | Expected revision is not held through native atomic publication | actual native NodeFileSystemAdapter fixture plus caller source trace; full trigger, exact paths, recovery and source lineage in `domains` evidence. |
| DOM-20 | P1 | atomic:true file save silently degrades to destructive direct rewrite after publication failure | actual native adapter with narrowly scoped fault injection; full trigger, exact paths, recovery and source lineage in `domains` evidence. |
| K-01 | P1 | Background Agent Stop waits for artifact/notification publication before requesting cancellation | real_runner_and_registry_with_scripted_child; full trigger, exact paths, recovery and source lineage in `kernel` evidence. |
| K-02 | P1 | Resuming an interrupted running world.run executes the effect a second time | real_local_process_effect_and_sqlite_cold_reopen; full trigger, exact paths, recovery and source lineage in `kernel` evidence. |
| K-03 | P1 | Automatic memory extraction physically calls the model but drops returned usage — corrected in candidate 0152 for memory extraction (`usage-before-publication.test.ts`); WebFetch/ReadSessionContext auxiliary calls remain open | real_Host_Pi_sqlite_with_scripted_model; full trigger, exact paths, recovery and source lineage in `kernel` evidence. |
| K-04 | P1 | Main/title completion publication failure drops already received known usage — corrected in candidate 0151: main/title/workspace/verifier record before publishing (`usage-before-publication.test.ts`, fails before the fix) | real_Host_sqlite_with_scripted_model_and_event_write_fault; full trigger, exact paths, recovery and source lineage in `kernel` evidence. |
| K-05 | P1 | Malformed/failed Goal verifier is persisted as complete — corrected in candidate 0150: inconclusive results pause the Goal, late passes complete only the reviewed Goal (`goal-verification.test.ts`) | real_Host_goal_consumer_sqlite_with_scripted_model; full trigger, exact paths, recovery and source lineage in `kernel` evidence. |
| K-07 | P1 | Final discovered tool declaration is excluded from the current request-budget heuristic | real_Host_Pi_sqlite_with_scripted_model_and_existing_heuristic; full trigger, exact paths, recovery and source lineage in `kernel` evidence. |
| PRI-01 | P1 | Cancelling post-login native inspection still commits the connection — corrected in candidate 0149: cancel fences the write until it starts (`native-cli-login.test.ts`, fails before the fix) | real Provider runtime/facade/repository and cold reopen; injected native login/inspect; full trigger, exact paths, recovery and source lineage in `primary` evidence. |
| PRI-02 | P1 | Default credential encryption key is derived from non-secret machine/user identifiers | actual cipher with forced empty-env synthetic fixture, independently decrypted using platform/home/username; full trigger, exact paths, recovery and source lineage in `primary` evidence. |
| PRI-03 | P1 | SSH connection has no server host-key verification | complete config/constructor/ensureConnected source and installed ssh2 contract; full trigger, exact paths, recovery and source lineage in `primary` evidence. |
| SHELL-ATTACHMENT-TARGET | P1 | Attachment preview drops the saved resource identity before helper creation | Source reconfirmed at e19924b; native viewer excluded.; full trigger, exact paths, recovery and source lineage in `shell` evidence. |
| SHELL-HELP-DRAFT | P1 | Help leaves Settings and discards unsubmitted local form state | Primary desktop/AX proof: temporary new Subagent name and description were present, Help left Settings, and reopening the form cleared both; installed count stayed0. Other local forms have source evidence only. Full lifecycle and lineage are in `shell`. |
| SHELL-SHORTCUT-SCOPE | P1 | Helper input model/effort shortcuts target the underlying composer | Reran actual hook isolation at e19924b: targetReads0; helper CtrlT->main-thought, CtrlM->main-model-menu. Scheduler/matcher stubs; no physical keypress.; full trigger, exact paths, recovery and source lineage in `shell` evidence. |
| SHELL-SUBAGENT-SCOPE | P1 | Late Subagent save refresh replaces the newly selected scope view | Original loadAgents/handleSave isolated execution: selectedScope B, old save completion replaces agents with A and closes form. No production write.; full trigger, exact paths, recovery and source lineage in `shell` evidence. |
| API-02 | P2 | New model discovery selects a different effective auth key from retained inference header overrides | installed SDK + actual loopback synthetic credentials, all three formats; key-restriction consequences source-inspected only; full trigger, exact paths, recovery and source lineage in `api` evidence. |
| API-06 | P2 | Normal API result wrapper overwrites retained provider-reported cost facts | actual installed ModelAdapter + HTTP loopback using origin-mapped synthetic OpenRouter response; ledger source inspected; full trigger, exact paths, recovery and source lineage in `api` evidence. |
| PRI-08 | P2 | Native Codex login/catalog/usage resolves an OS/PAC route using Claude's OAuth URL — corrected in candidates 0146/0149: per-vendor sign-in and executor endpoints for login, inspection, usage and turns | Actual production environment closure, real resolver and synthetic site-specific PAC select Claude proxy for both executors. Manual/uniform proxy is unaffected; no CLI/login/HTTP or real account failure claim. |
| DOM-03 | P2 | Same plugin name from different marketplaces silently collides in MCP routing | actual source-function synthetic fixture; full trigger, exact paths, recovery and source lineage in `domains` evidence. |
| DOM-04 | P2 | A cache-removal failure leaves uninstall configuration and retry state incomplete | source inspection; full trigger, exact paths, recovery and source lineage in `domains` evidence. |
| DOM-10 | P2 | Rich document attachment previews stop at the sent-message boundary | source inspection; full trigger, exact paths, recovery and source lineage in `domains` evidence. |
| DOM-11 | P2 | Preview byte limits inspect one file state and read a later unbounded state | source inspection; full trigger, exact paths, recovery and source lineage in `domains` evidence. |
| K-06 | P2 | Scheduler recovery can overwrite a known dispatched/completed occurrence as skipped | real_sqlite_repository_with_scripted_settlement_fault; full trigger, exact paths, recovery and source lineage in `kernel` evidence. |
| K-08 | P2 | Unsupported semantic Skill frontmatter is advertised and loaded without model-facing diagnosis | real_local_skill_parser_context_and_handler; full trigger, exact paths, recovery and source lineage in `kernel` evidence. |
| SHELL-FILEMANAGER-RECOVERY | P2 | File Manager entry catches failure without actionable recovery | Source trace; no OS action.; full trigger, exact paths, recovery and source lineage in `shell` evidence. |
| SHELL-HELP-DUPLICATE-TABS | P2 | Repeated Help appends the same guide as new anonymous tabs | Full Help source/identity/append trace and primary live repeated-tab proof. Preserve generic anonymous text; give Help stable identity. |
| SHELL-PROVIDER-NAME-DRAFT | P2 | Old provider-name save acknowledgement clears a newer unsubmitted draft | Actual blur/sync function isolation with deferred transport and original comparison; no production save. New candidate acknowledgement clears dirty unconditionally, unlike original retained value check. |
| SHELL-PROFILE-CLOSE-LOCALE | P3 | Local-profile dialog retains an English accessibility Close label in Chinese | Current shared Dialog default plus missing localized argument; screen-reader/owner acceptance unverified. |
| DESKTOP-01 | P3 | Development shell native menu loses picked-element Inspect on an empty text context | Current/original native-event branch source only; DOM event routing untested. Help DevTools and browser-guest Inspect remain; packaged runtime is excluded. |

The highest data/effect risks are DOM-20 (atomic save destroys original after failure), DOM-12 (concurrent stale revisions both write), K-01 (failed artifact write prevents Stop), K-02 (unknown world-run replay), and DOM-01/02 (Project executable origin/resident withdrawal). API-01/03 and PRI-01 affect normal request/cancellation paths; API-04/05 forge or revive stale catalog facts. K-03/04 and API-06 are distinct lost-accounting consumers. K-05 is the inherited explicit Goal fail-open policy, not automatic Goal creation or a Pi regression.

Retained-only `RETAINED-PINNED-COLLAPSE` (P2) is a separate dirty-overlay source finding:
`app/.../AppShell.tsx:2472–2473` enables Project grouping/Pinned, `useSessionSearch.ts:175–198`
removes collapsed Project rows, then `SessionList.tsx:530–538` extracts Pinned from those already
filtered rows. Collapsing the Project therefore removes its flagged conversations from Pinned until
expanded. This is not a candidate defect, Session deletion, or running retained-app proof; its
source versions, working blobs and original lineage are preserved in `shell.retained_findings`.

#### Missing capability, compatibility and remaining proof

Native editing/undo/save/reopen, registered plugin views and Project suites, cross-domain artifact/ingestion/citation, durable canvas/design/media production, browser evidence/extensions and human media recovery remain the owning modules' unclosed targets. Their basic readers, players, generation receipts, MCP/install and browser guest paths remain real and are not removed merely because the complete target is absent. PRI-04 records native multiple-profile/account management; PRI-05 is only an unproved same-email organization binding concern; PRI-06 records the bounded OpenCode static route intersection; PRI-07 keeps standalone paid-probe accounting unresolved without fabricating a Session. Live login/inference, all OS packages and signed distribution remain separately unverified.

The final local process snapshot found no candidate Electron executable and several adopted
`zcode-cli` children whose titles did not reveal their executable/profile origin. Their ownership,
active work and parent-disconnect cleanup are not established; no process was killed or labelled a
proved duplicate-launch defect. A controlled owned startup/quit fixture remains required. Native
usage before a failed terminal receipt and a generic output option versus an enforced native
generation ceiling also remain named proof questions in the primary final-change report.

Correct or stale allegations are retained explicitly: matched native GPT-6.1 discovery, restored recommendations, current resize containment, committed page operations, denial/CAS and receipt-aware media retrieval were confirmed; earlier full-Pi/placeholder/untracked-source and universally empty-Claude claims are stale. Unknown model metadata is not itself proof of broken inference. Generic PDF rejection was withdrawn after reading the installed AI7 serializer. A direct-store Goal retarget fixture bypassed the public busy gate and is not presented as a current App blocker.

#### Capability coverage

Delivery status remains solely in [the capability register](capabilities.md#capability-register). This table records source responsibility and related finding IDs, not status promotion. `kernel`/`shell`/`domains`/`primary`/`api` identify the corresponding evidence reports; `desktop` is the supplemental desktop-boundary report. An ID with no operational defect can still have a missing target or pending live/visual proof described in its report/module.

| Capability | Source disposition owners | Related defects / gaps |
|---|---|---|
| [CORE-01](modules/agent-core.md) | kernel, shell | See module and source disposition; no new reproduced defect |
| [CORE-02](modules/agent-core.md) | kernel, shell | SHELL-FILEMANAGER-RECOVERY |
| [CORE-03](modules/agent-core.md) | kernel, shell | K-04, SHELL-SHORTCUT-SCOPE |
| [CORE-04](modules/agent-core.md) | kernel | K-02, K-05 |
| [CORE-05](modules/agent-core.md) | kernel, shell | SHELL-HELP-DRAFT, SHELL-SUBAGENT-SCOPE, SHELL-PROFILE-CLOSE-LOCALE, SHELL-PROVIDER-NAME-DRAFT, PRI-01, API-04, API-05 |
| [CORE-06](modules/agent-core.md) | kernel, shell | See module and source disposition; no new reproduced defect |
| [CORE-07](modules/agent-core.md) | kernel, shell, primary | See module and source disposition; no new reproduced defect |
| [CORE-08](modules/agent-core.md) | kernel, shell, primary | SHELL-HELP-DRAFT, SHELL-HELP-DUPLICATE-TABS |
| [CORE-09](modules/agent-core.md) | kernel, shell, primary, desktop | DESKTOP-01 (development native branch; source only) |
| [CORE-10](modules/agent-core.md) | kernel, shell, primary | SHELL-PROFILE-CLOSE-LOCALE |
| [CORE-11](modules/components.md) | shell, domains | SHELL-HELP-DUPLICATE-TABS, DOM-06 |
| [INFO-01](modules/browser.md) | shell, domains | SHELL-FILEMANAGER-RECOVERY, DOM-11, DOM-12, DOM-20 |
| [INFO-02](modules/browser.md) | domains | DOM-17, DOM-19 |
| [INFO-03](modules/browser.md) | domains | DOM-08, DOM-17, DOM-18 |
| [INFO-04](modules/browser.md) | domains | DOM-10, DOM-19 |
| [INFO-05](modules/canvas.md) | shell, domains | SHELL-ATTACHMENT-TARGET, DOM-08, DOM-09, DOM-10, DOM-11, DOM-20 |
| [INFO-06](modules/browser.md) | shell, domains | DOM-19 |
| [INFO-07](modules/browser.md) | domains | DOM-17, DOM-19 |
| [INFO-08](modules/browser.md) | shell, domains | DOM-19 |
| [EXEC-01](modules/agent-core.md) | kernel | K-01, PRI-02, PRI-03 |
| [EXEC-02](modules/agent-core.md) | kernel, shell | SHELL-SHORTCUT-SCOPE, SHELL-ATTACHMENT-TARGET |
| [EXEC-03](modules/agent-core.md) | kernel | See module and source disposition; no new reproduced defect |
| [EXEC-04](modules/agent-core.md) | kernel, shell | K-01, SHELL-SUBAGENT-SCOPE |
| [EXEC-05](modules/agent-core.md) | kernel, primary, api | PRI-01, PRI-04, PRI-05, PRI-08, API-01, API-03 |
| [EXEC-07](modules/remote.md) | primary | See module and source disposition; no new reproduced defect |
| [EXEC-08](modules/agent-core.md) | kernel | K-02, PRI-02, PRI-03 |
| [EXEC-09](modules/remote.md) | shell, primary | SHELL-FILEMANAGER-RECOVERY, PRI-03 |
| [EXEC-10](modules/agent-core.md) | kernel | K-06 |
| [EXEC-11](modules/remote.md) | primary | See module and source disposition; no new reproduced defect |
| [EXEC-13](modules/remote.md) | primary | See module and source disposition; no new reproduced defect |
| [EXEC-14](modules/context.md) | kernel, shell | K-07, K-08, SHELL-SUBAGENT-SCOPE |
| [EXEC-15](modules/remote.md) | primary | See module and source disposition; no new reproduced defect |
| [INTEL-01](modules/memory.md) | kernel | K-07 |
| [INTEL-02](modules/memory.md) | kernel | K-03, K-07 |
| [INTEL-03](modules/models.md) | shell, primary, api | SHELL-PROVIDER-NAME-DRAFT, PRI-01, PRI-02, PRI-04, PRI-05, PRI-06, PRI-07, PRI-08, API-01, API-02, API-04, API-05 |
| [INTEL-04](modules/context.md) | kernel, primary | K-03, K-04, PRI-07, API-06 |
| [INTEL-05](modules/memory.md) | kernel, shell | K-03 |
| [INTEL-06](modules/memory.md) | kernel, shell | K-08 |
| [INTEL-07](modules/context.md) | kernel | K-05 |
| [CREATE-01](modules/canvas.md) | domains | DOM-13, DOM-14 |
| [CREATE-02](modules/media.md) | domains | DOM-16 |
| [CREATE-03](modules/media.md) | domains | DOM-15 |
| [CREATE-04](modules/media.md) | domains | DOM-16 |
| [CREATE-05](modules/media.md) | domains | DOM-16 |
| [CREATE-06](modules/canvas.md) | domains | DOM-13, DOM-14 |
| [CREATE-07](modules/canvas.md) | domains | DOM-14 |
| [CREATE-08](modules/media.md) | domains | DOM-09, DOM-16 |
| [CREATE-09](modules/media.md) | domains | DOM-16 |
| [CREATE-10](modules/media.md) | domains | DOM-16 |
| [CREATE-11](modules/canvas.md) | domains | DOM-14, DOM-19 |
| [CREATE-12](modules/media.md) | domains | DOM-16 |
| [CREATE-16](modules/canvas.md) | domains | DOM-09 |
| [ORCH-01](modules/workflow.md) | kernel | See module and source disposition; no new reproduced defect |
| [ORCH-02](modules/workflow.md) | kernel | K-02, API-03 |
| [ORCH-03](modules/components.md) | shell, domains | DOM-01, DOM-02, DOM-05, DOM-06, DOM-08 |
| [ORCH-04](modules/marketplace.md) | shell, domains | DOM-01, DOM-02, DOM-03, DOM-08 |
| [ORCH-05](modules/media.md) | domains | DOM-15, DOM-16 |
| [ORCH-06](modules/orchestration.md) | kernel | K-04, K-05, K-06 |
| [ORCH-07](modules/orchestration.md) | kernel | K-01 |
| [ORCH-08](modules/agent-core.md) | kernel, shell, primary | K-06, SHELL-FILEMANAGER-RECOVERY, API-03 |
| [ORCH-10](modules/marketplace.md) | shell, domains | DOM-02, DOM-07, DOM-08 |
| [ORCH-11](modules/marketplace.md) | shell, domains | DOM-01, DOM-02, DOM-03, DOM-04, DOM-05, DOM-06, DOM-07, DOM-08, DOM-18 |
| [ORCH-12](modules/marketplace.md) | shell, domains | DOM-02, DOM-03, DOM-08 |

The previous handoff was read as evidence, not instructions. Candidate Git/patch/recovery protection and Pi Core selection now differ from its snapshot; plugin UI absence and broad page-operation/native-production gaps remain true. Mixed retained/candidate register descriptions and older execution-source pointers require reconciliation without transferring authorities. Most importantly, passing the earlier suites did not cover combined SDK/header/body behavior, post-result observer failure, partial scheduler settlement, interrupted effects, pending scope changes or file-publication faults; those gaps must be tested at the actual producer and consumer.


### Source-backed kernel corrections

The active comparison links nine original findings to bounded corrections: DOM-20/12,
K-01/02 and API-01/03/04/05/06. It retains the selected ZCode Host, installed Pi Core, canonical
Session/registry/journal and provider repository. No authority cutover, credential import,
production dependency, UI redesign or reference re-pin is implied. Evidence lives in
`/Volumes/AIGC/天工参考/meta/fleet-kernel-corrections/manifest.json`; earlier red fixtures and the
whole-project finding index above remain intact. Capability delivery statuses are unchanged.

| Chain | Reference mechanism and disposition | Implemented boundary and evidence |
|---|---|---|
| File Read → Write/Edit → atomic publication → Host/Pi/SQLite | Original ZCode `29628c9`; GenOffice `e4be545a881eed5b700d5da997aae26e8e24fc82` atomic writer; Kun `ebce7f6cd94fc2882009fcf8169d7a59f5f5c289` pre-commit/signal seam. Current public tips checked. GenOffice's destructive direct-write fallback is rejected; bounded retry and staging are adapted under the existing FileSystemPort. | Same canonical file and same OS-user lock rendezvous across HOME/TMPDIR profiles; revision/hash recheck before publication; optional cancellation before commit; preserve executable mode and original bytes on fault. Truncated reads omit a whole-file hash. Strict complete Read consumers compare content before metadata shortcuts. Real file, separate-process and Host/Pi/SQLite failure/freshness cases. |
| Background Stop → abort → artifacts/notification/events → registry → resumed child | Pi current tip `98d2e1947aa9c75dff4c20474d541873dadc1d05` Core `agent.ts` abort/waitForIdle and Coding Agent session cancellation order; Cindy current tip `a5c582f4ebf69f28f83f6e4f2f22d589a5c94285` continuation retirement; Craft v0.14.0 `73bd9c2a3573158bea880984eb8d5fdb41e0cac2` late-event fencing. Immutable inspected files retained externally; required pins and installed Core unchanged. | Existing AbortController signals before receipt I/O. Per-run temporary write coordination retains failed Stop retry stages, fences old completion, releases normal terminal state, preserves known completion and waits the prior writer on same-child resume. TaskStop/public Runtime/reducer plus disposable real Node termination proof; not universal native termination or exactly-once receipts. |
| Opaque world.run → admitted node → effect → durable result → orphan/resume/amend | Original ZCode's running fallthrough duplicated effects. OpenCode current immutable `907b3bc518fa48e90e8ec24dd327d13eee71c36c` V2 typed unknown interruption and Pi durable-call non-idempotence are comparisons, not imported Hosts. Original dynamic-workflow Skill/patterns define completed-result invalidation after a live world change. | Unknown admitted run refuses redispatch, retaining its original row. Existing amendment lineage and hash occurrence carry unknown barriers through cache closure and cold replay. Completed same-run receipts retain original replay; amended completed imports invalidate after live changes. Missing/cyclic lineage refuses recovery. Actual subprocess append + reopened SQLite proves no duplicate recovery effect; independently fresh work still runs. |
| API selection/switch → Headers/body → provider → SDK finish → accounting/error → workflow | Existing transport/credential owners and installed AI SDK7 `7.0.127` stream source: finish-step carries provider metadata; final finish does not. Follow original provider-body/auth failover semantics and existing typed workflow stop policy. | Guard inspects Headers without transferring a Request body. Final adapter errors retain pool-stop code. Successful accounting overlays existing cost facts; step metadata stays within its attempt and clears on step/error/retry. Actual loopback POSTs cover three formats, generate/stream, revocation/rotation and zero/nonzero reported cost; not live entitlement or invoices. |
| Model edit/preview → Rules → repository → refresh failure → cold reopen | Original provider Rules/personal repository own both human and Agent operations. Exact provider observations are facts about returned IDs, unlike explicit personal corrections. Existing recommendation restore semantics provide a countercase to indiscriminate cleanup. | Renames move personal corrections only; actual connection deletion clears both exact layers before identity reuse. Failed refresh/cold reopen do not manufacture capabilities for an unreturned ID. Five new lifecycle cases and the 37 existing discovery cases exercise real repository/facade/registry, with synthetic directory transport. |

Cross-review found four additional coupled defects: a truncated prefix hash masqueraded as the
whole file; HOME/TMPDIR split same-user file locks; close failure masked staging ENOSPC; and
complete Read content could be stale despite equal size/time. Each was corrected at its producer or
consumer and re-exercised independently. Lock coordination uses existing OS-user file persistence;
if its cache cannot be used the write refuses, rather than bypassing serialization. It does not
lock arbitrary foreign editors, create OS compare-and-swap or prove power-loss durability.

An initial workflow repair also reused completed imports after world changes. Primary review
rejected that expansion: an actual changed-source/identical verifier command returned old output.
The correction restores original invalidation, carrying only uncertainty barriers and occurrence
positions across closure. This retraction and the failing/passing countercase are retained in the
workflow evidence; reading one replay branch was insufficient to define the whole feature.

The independent entered-rename Stop fixture still shows a file may commit after the turn has
settled cancelled without a late effect receipt (RECOVERY-01). This inherited generic executor
settlement gap is explicitly pending; no rollback or no-effect claim follows from cancellation.
Background after-commit acknowledgement loss, cold Stop-plan reconstruction, general native
termination, paid/provider effects, plugin withdrawal, request budgets, scheduler/Goal and other
receipt failures remain separate indexed work. Source, real local execution, staged executable,
live service behavior and owner visual acceptance remain separate proof levels.


## OpenStock and Octop — bounded reference admission

Inspection evidence is retained at `/Volumes/AIGC/天工参考/meta/openstock-octop-intake/manifest.json`.
Both owner-named repositories are cloned with full Git history, detached at the current official
main ref, with separate frozen source worktrees and `源码参考/latest/software/` aliases. Octop's
published `v1.0.2b6`, main SHA and `pyproject.toml` version match. OpenStock has no GitHub latest
release; its `package.json` version is not labelled as a published product release. The source
inventory above and `meta/current-upstream.json` include both without moving prior references.

| Checkout / reviewed SHA / license | Source path or symbol read | Reuse boundary |
|---|---|---|
| [software/openstock](https://github.com/Open-Dev-Society/OpenStock.git) · `e109f188480b` · AGPL-3.0 | `lib/actions/finnhub.actions.ts:67-148,298-350`; `lib/actions/watchlist.actions.ts:10-71`; `database/models/watchlist.model.ts:10-24`; `lib/inngest/functions.ts:207-330`; `lib/nodemailer/index.ts:102`; `components/TradingViewWidget.tsx:16-66`; `app/(root)/stocks/[symbol]/page.tsx:28` | **M** — Optional trading/market-observation Component reference: bounded/deduplicated quote requests, watchlist uniqueness, chart retention/fullscreen and rule/job flow. TradingView supplies external charts; no brokerage/order/backtest/position engine found. AGPL code combination requires specific license-compatibility review; no MongoDB/Inngest/SMTP/market service or dependency selected. |
| [software/octop](https://github.com/TencentCloud/Octop.git) · `eb28011249c0` · MIT | `src/octop/infra/agents/settings/acp.py:40-92`; `src/octop/cli/commands/acp.py:12-51`; `src/octop/infra/agents/manager.py:1294-1345,3253-3268,3359-3382`; `src/octop/infra/agents/plugins/manager.py:135-161,487-555`; `src/octop/api/routers/plugins.py:278-330,401-428`; `dashboard/src/plugins/toolRenderers/{loader,host}.ts`; `src/octop/infra/agents/middleware/octop_ui_offload.py:38-94`; `dashboard/src/pages/Chat/components/MessageBubble.tsx:381`; bundled `market-quotes/{main.py,plugin.yaml,ui/manifest.json}` | **M** — Shared execution/settings ownership, ACP adapter configuration, removable tool-result renderers and UI payload separate from model content. Compare the actual finance card/tool package for later application plugins. Do not import Python/LangGraph/control-plane storage, global registry or new permissions into the selected Host; separate dependency implementations need their own proof before any extraction. |

OpenStock's alert pipeline atomically marks `triggered=true, active=false` before SMTP. Caught
failures or disabled email release the claim, but a crash between claim and send can lose the
notification without a durable delivery receipt; missing recipients deliberately close it.
Its quote cache may serve stale values through repeated failures. A live label must not become a
freshness guarantee. Reuse domain/data flow and interaction lessons under Fleet's existing
Artifact/Job/permission owners, not those recovery or stale-data assumptions. Only source inspection
was performed; no real market request, database, notification, installed package or visual claim.

Octop's ACP runner definitions live once per user; each Agent separately opts into the tool.
This is useful against duplicated configuration, but its legacy migration removes per-Agent runner
settings before saving the chosen global value and is not a Fleet migration template. Inbound ACP
boots a separate server process; outbound execution and approvals come from `octop-harness`, not
this main repo. Commands such as `npx -y` and `trusted=true` are not adopted defaults.

Octop plugin UI loads authenticated JavaScript as Blob ESM in the dashboard's own realm; its host
exposes authenticated requests and patches frontend chat data. This is not a third-party sandbox
or proof of native document editing/save/undo. Global enablement is saved before load/reload and
needs failure reconciliation; per-Agent switches use the same existing config owner. Its
`octop_ui` middleware moves large card data to ToolMessage artifacts while keeping compact content;
the dashboard resolves those artifacts. Existing file:// guards preserve media consumers, but model
conversion, complete checkpoint/fork recovery and all dependency versions were not executed or
fully inspected. Fleet should compare this with its current result projection and on-demand reads
before adding another mechanism. These admissions supply references; kernel-first order and
capability statuses remain unchanged.

### OpenRouter live catalog check (2026-10-05)

Fleet's `readDiscoveredModelMetadata` was run over the public `GET openrouter.ai/api/v1/models?output_modalities=all`
(648 models). Context window, image input and tool flags matched the source rows. Two defects were fixed in candidate
patch 0142: reasoning levels were offered to every model because OpenRouter always sends `supported_parameters`
(336 declare `reasoning`/`include_reasoning`; offered now equals declared), and `transcription`/`speech` outputs
(24/23 models) produced no output capability. Embeddings (37) and rerank (9) remain non-chat, untagged rows.


### Native CLI executor intake: Antigravity and Cursor (2026-10-06)

Installed binaries, not screenshots: `agy` 1.2.14 and `cursor-agent` 2026.08.04-aaa8809.

| Question | Antigravity (`agy`) | Cursor (`cursor-agent`) |
|---|---|---|
| Long-lived protocol | `--input-format/--output-format stream-json`; no ACP subcommand | `cursor-agent acp` (ACP server); also `-p --output-format stream-json` |
| Modes | `--mode plan|accept-edits`, `--dangerously-skip-permissions`, `--sandbox`; plan is disabled by `--disable-slash-commands` (measured) | `--mode plan|ask`, `--force/--yolo`, `--auto-review`, `--sandbox enabled|disabled` |
| Mid-run approval | none headless; PreToolUse hook file only (AionCore `antigravity_hook.rs`, 20 s deadline before agy proceeds) | ACP `session/request_permission` reaches the client (Paseo `acp-agent.ts:2517`) |
| Catalog | `agy models` (`id\tlabel`) | ACP ext `cursor/list_available_models` with per-model config options (Paseo `cursor-acp-agent.ts`) |
| Resume | `--conversation <id>` | ACP session load / `--resume <chatId>` |
| Account | none exposed | `cursor-agent about` / `status` |
| Quota | keyring token only; Orca mirrors Gemini CLI | Paseo/Orca read Cursor desktop `state.vscdb` token → excluded (foreign token) |
| Others | Paseo/AionCore: CLI + skip-permissions (+ hook); CLIProxyAPI/NewMax: Antigravity OAuth client + UA impersonation of `cloudcode-pa` (excluded) | Paseo: ACP; Goose: `--print --output-format json --force`; Multica: stream-json `--yolo` |

Disposition: keep each vendor's official CLI as a whole executor (H6), mapping Fleet's four permission
modes onto the vendor's own modes. Cursor follows Paseo's ACP route so its permission requests reach
Fleet's existing approval UI; direct model access through another client's OAuth identity is excluded.

Implemented in candidate 0155 as one hand-written ACP v1 executor (no SDK dependency) for Cursor,
Kimi Code CLI and OpenCode CLI. Verified 2026-10-06: Kimi 0.37.2 and OpenCode 1.18.32 connect and
list account models (10 / 31; OpenCode thinking levels low…max); signed-out Cursor fails in 20 s with
its login instruction (its `authenticate` never answers). Live prompts reached each vendor and
returned its plan errors (Kimi 403 "subscription does not have access to Kimi Code"; OpenCode "An
active OpenCode Go subscription" required), matching the CLIs run directly. The approval card was
proved in the real desktop UI with a local fake ACP agent (allow → file written → reply). OpenCode is
given `OPENCODE_CONFIG_CONTENT` permission `ask` outside Full access so its edits reach Fleet. No
live paid request was made; the user's DeepSeek key behind OpenCode was not used.


Candidate 0156 adds Hermes (`hermes-acp`; hermes-agent `acp_adapter/server.py` modes default /
accept_edits / dont_ask, no plan; models via `session/set_model`) and OpenClaw (`openclaw acp`, a
Gateway bridge: model selection and per-session MCP unsupported per `docs/cli/acp.md`, exec approvals
relayed through `session/request_permission`). Fake-agent tests only; neither CLI is installed here.
