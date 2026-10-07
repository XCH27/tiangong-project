# ZCode candidate reconstruction

These patches reconstruct the isolated Fleet candidate from ZCode
`29628c9acdb81b703bbd4080c207a0e7ce5e276e`. Apply them in numeric order only to a
fresh checkout of that pin. An existing `.fleet/zcode` has its own Git history and may contain later local work; do not
reapply, reset or replace it. Later patches can retire an earlier design. This is a cumulative
source recipe, not a list of accepted capabilities.

Use `git apply <absolute-patch-path>` from the fresh checkout. Stop on a rejected hunk;
never use forced checkout or discard an occupied tree to make the recipe apply.
Keep upstream Apache-2.0 notices and the dependency notices. Current build/profile/check
instructions are in [Engineering](../../docs/engineering.md#zcode-candidate).

| Order | Patch | Previously observed cumulative tree |
| 0001 | [0001-provider-route-ownership.patch](0001-provider-route-ownership.patch) | — |
| 0002 | [0002-connections-and-local-startup.patch](0002-connections-and-local-startup.patch) | — |
| 0003 | [0003-local-help-and-profile.patch](0003-local-help-and-profile.patch) | — |
| 0004 | [0004-model-credentials.patch](0004-model-credentials.patch) | — |
| 0005 | [0005-subscription-bundle-and-plans.patch](0005-subscription-bundle-and-plans.patch) | — |
| 0006 | [0006-provider-catalog-selection.patch](0006-provider-catalog-selection.patch) | — |
| 0007 | [0007-provider-protocol-defaults.patch](0007-provider-protocol-defaults.patch) | — |
| 0008 | [0008-subscription-catalog-and-network.patch](0008-subscription-catalog-and-network.patch) | — |
| 0009 | [0009-model-settings-lifecycle.patch](0009-model-settings-lifecycle.patch) | — |
| 0010 | [0010-subscription-system-network.patch](0010-subscription-system-network.patch) | — |
| 0011 | [0011-model-discovery-and-account-usage.patch](0011-model-discovery-and-account-usage.patch) | — |
| 0012 | [0012-provider-brand-icons.patch](0012-provider-brand-icons.patch) | — |
| 0013 | [0013-inline-api-format-routes.patch](0013-inline-api-format-routes.patch) | — |
| 0014 | [0014-api-format-autosave.patch](0014-api-format-autosave.patch) | — |
| 0015 | [0015-inline-model-add-and-key-removal.patch](0015-inline-model-add-and-key-removal.patch) | — |
| 0016 | [0016-model-list-footer.patch](0016-model-list-footer.patch) | — |
| 0017 | [0017-credential-failover-guards.patch](0017-credential-failover-guards.patch) | — |
| 0018 | [0018-model-and-key-draft-controls.patch](0018-model-and-key-draft-controls.patch) | — |
| 0019 | [0019-explicit-draft-confirmation.patch](0019-explicit-draft-confirmation.patch) | — |
| 0020 | [0020-single-row-confirmation.patch](0020-single-row-confirmation.patch) | — |
| 0021 | [0021-model-connection-workflows.patch](0021-model-connection-workflows.patch) | — |
| 0022 | [0022-avatar-preference-menu.patch](0022-avatar-preference-menu.patch) | — |
| 0023 | [0023-software-update-menu.patch](0023-software-update-menu.patch) | — |
| 0024 | [0024-account-context-and-allowance.patch](0024-account-context-and-allowance.patch) | — |
| 0025 | [0025-usage-costs-and-subscription-ui.patch](0025-usage-costs-and-subscription-ui.patch) | — |
| 0026 | [0026-statistics-charts-and-model-controls.patch](0026-statistics-charts-and-model-controls.patch) | — |
| 0027 | [0027-public-price-catalog.patch](0027-public-price-catalog.patch) | — |
| 0028 | [0028-unified-cost-and-account-attribution.patch](0028-unified-cost-and-account-attribution.patch) | `29e0554256bfaf9421ff3dd9b71bee5e3b5241d9` |
| 0029 | [0029-cc-switch-import-and-billing-context.patch](0029-cc-switch-import-and-billing-context.patch) | `889f3668fb94524e8be96965078c68c79010302c` |
| 0030 | [0030-usage-insights-and-agent-read-tool.patch](0030-usage-insights-and-agent-read-tool.patch) | — |
| 0031 | [0031-provider-connectivity-diagnostics.patch](0031-provider-connectivity-diagnostics.patch) | `a959d899622f6a65df8282ad496e9e3eedf16a45` |
| 0032 | [0032-subscription-product-identities.patch](0032-subscription-product-identities.patch) | `e47726dd3300b11a680287a2d0f7b66280ee0ea9` |
| 0033 | [0033-verified-protocol-and-key-controls.patch](0033-verified-protocol-and-key-controls.patch) | `ff9774c7fd6c4b7e8475df670cc1e65a606d3e5d` |
| 0034 | [0034-source-backed-model-facts.patch](0034-source-backed-model-facts.patch) | `a1db6909261199088904d48185abd22529a2187b` |
| 0035 | [0035-model-evidence-through-session.patch](0035-model-evidence-through-session.patch) | `916d185b44aebf156582e1caa1473be1170f5199` |
| 0036 | [0036-unsourced-output-limit-wire.patch](0036-unsourced-output-limit-wire.patch) | `a205e707e1ab4e37e0716d554929d182a3930a41` |
| 0037 | [0037-cost-source-separation.patch](0037-cost-source-separation.patch) | `b3db60a2f44df1db95d82136de73ab10c8c8eb64` |
| 0038 | [0038-provider-status-and-import-presentation.patch](0038-provider-status-and-import-presentation.patch) | `294c0953504fc6daa1804b04c8b041cc9697f938` |
| 0039 | [0039-usage-and-account-controls.patch](0039-usage-and-account-controls.patch) | `e14ba35ff4889e53f904e58e6a073f3fbb841a59` |
| 0040 | [0040-subscription-effort-catalog-repair.patch](0040-subscription-effort-catalog-repair.patch) | `bb04c90dd04a728e7255c63ae4f76151859946ad` |
| 0041 | [0041-fast-and-usage-integrity.patch](0041-fast-and-usage-integrity.patch) | `f62fe090f9a43da456286d13a57ed2bb09515727` |
| 0042 | [0042-cost-bars-and-composer-locality.patch](0042-cost-bars-and-composer-locality.patch) | `e026e521d5c4b381ef8f20b723b6acc8371f7f18` |
| 0043 | [0043-account-and-api-draft-layout.patch](0043-account-and-api-draft-layout.patch) | `dcc93a20fa6e0c3882d8e67df94b0a43a0c238d1` |
| 0044 | [0044-workflow-audit-corrections.patch](0044-workflow-audit-corrections.patch) | `1dc009af0dad824cef4600232c9b16a1d850ed45` |
| 0045 | [0045-format-candidate-deltas.patch](0045-format-candidate-deltas.patch) | `56d9cd1b39e27ffec2b4719805518bcd1435dae2` |
| 0046 | [0046-overengineering-consolidation.patch](0046-overengineering-consolidation.patch) | `021131af55c3891ac158351c3342cc1b6137eb42` |
| 0047 | [0047-context-ring-selection-scope.patch](0047-context-ring-selection-scope.patch) | `b5227d6409e4e5323ea886912ac6f19a3ebd7d50` |
| 0048 | [0048-conversation-quota-account-binding.patch](0048-conversation-quota-account-binding.patch) | `56c47a7ab6d7238e9f9d855ce2a271ea9da260f8` |
| 0049 | [0049-model-tool-capability-correction.patch](0049-model-tool-capability-correction.patch) | `871a01061f464d09a47b0436f6e50ef517148ba2` |
| 0050 | [0050-vision-bridge-input.patch](0050-vision-bridge-input.patch) | `12955e489aae7c76d267db4c59aaaebcb95ac9ab` |
| 0051 | [0051-media-catalog-and-xai-image.patch](0051-media-catalog-and-xai-image.patch) | `e115b40d1cbac4f39ece631e342384a5d1b1006b` |
| 0052 | [0052-catalog-identity-integrity.patch](0052-catalog-identity-integrity.patch) | — |
| 0053 | [0053-qwen-token-plan-billing-category.patch](0053-qwen-token-plan-billing-category.patch) | — |
| 0054 | [0054-submission-account-affinity.patch](0054-submission-account-affinity.patch) | — |
| 0055 | [0055-runtime-and-usage-audit.patch](0055-runtime-and-usage-audit.patch) | `10db193cd9f335d8a0029eb5628c04474db40751` |
| 0056 | [0056-kernel-model-commit.patch](0056-kernel-model-commit.patch) | `928bd62d831e7ef0455b31f64e36c0f612e5c1ac` |
| 0057 | [0057-full-pi-executor.patch](0057-full-pi-executor.patch) | `0421df70af83730546ed22f804b590a21c04480a` |
| 0058 | [0058-admission-and-tool-accounting.patch](0058-admission-and-tool-accounting.patch) | `b00aca9ff9a3a0ef4dbb0cb92c673b9f5d0d05fd` |
| 0059 | [0059-provider-draft-integrity.patch](0059-provider-draft-integrity.patch) | `83f051396d15719066bdecb0b94a43bc3b4a7ac6` |
| 0060 | [0060-owned-model-write-receipts.patch](0060-owned-model-write-receipts.patch) | `1f50467bcae0b4fb335d88f0b6214a50446336d8` |
| 0061 | [0061-cc-switch-default-selection.patch](0061-cc-switch-default-selection.patch) | `7ecadcac92a774eccfbfadfe819dddb6c45daaef` |
| 0062 | [0062-image-request-accounting.patch](0062-image-request-accounting.patch) | `b73faffab6a4f7518ba0b41a08f6bc6e99932d9a` |
| 0063 | [0063-fast-credit-billing.patch](0063-fast-credit-billing.patch) | `256a860f4d5933559411b3c26477458f4ecf083f` |
| 0064 | [0064-model-probe-scope.patch](0064-model-probe-scope.patch) | `b1645eb4e37646cc753809d45cf63fbfe37b5bf9` |
| 0065 | [0065-desktop-startup-profile.patch](0065-desktop-startup-profile.patch) | `91ae46985d202a78b866d188ff58fb477da28815` |
| 0066 | [0066-compact-pi-tool-receipts.patch](0066-compact-pi-tool-receipts.patch) | `3ee0b3777fec5b4ec8e15d8ff8f1e582c0b42e5c` |
| 0067 | [0067-auxiliary-output-budgets.patch](0067-auxiliary-output-budgets.patch) | `e3ee537cec8aa0a134e01a670478388cd93376b3` |
| 0068 | [0068-composer-document-previews.patch](0068-composer-document-previews.patch) | `a12ba34ef1dc96b95bec1a6325f5cd22bc1c00aa` |
| 0069 | [0069-model-facing-context.patch](0069-model-facing-context.patch) | `df26c73eae4d02bdfbc314ede39a1dfb25c1b725` |
| 0070 | [0070-claude-native-executor.patch](0070-claude-native-executor.patch) | `64abd7dafaf7bb2f50656be3947d30e14eb8130f` |
| 0071 | [0071-native-account-boundary-corrections.patch](0071-native-account-boundary-corrections.patch) | `b01934d239231bf11f7af11cbee1c607d93fb2bd` |
| 0072 | [0072-pi-0992-upstream-sync.patch](0072-pi-0992-upstream-sync.patch) | `856d198700d7ee0b7691aea5887837f7bc57eaee` |
| 0073 | [0073-readable-settings-navigation.patch](0073-readable-settings-navigation.patch) | `01345bc30a3b9c447e41bb983087fce53c4be63a` |
| 0074 | [0074-subscription-typography.patch](0074-subscription-typography.patch) | `ca9903fd664cbe7ccbeb985632180e1e23c470aa` |
| 0075 | [0075-settings-card-layout-and-test-feedback.patch](0075-settings-card-layout-and-test-feedback.patch) | `043dd888dd4357d2e5fe3907be223d0e3482b039` |
| 0076 | [0076-connectivity-first-failure-and-deadline.patch](0076-connectivity-first-failure-and-deadline.patch) | `f9dd59a3a2c46d795510c3c1e6e37fba87a9fb46` |

| 0077 | [0077-public-chatgpt-and-native-continuation.patch](0077-public-chatgpt-and-native-continuation.patch) | `e8dea63d40c7b0f82f7fc95b25c5343405d18e26` |
| 0078 | [0078-kernel-and-project-membership-audit.patch](0078-kernel-and-project-membership-audit.patch) | `05d289f9b9f555db5c87b0df000dcae07623301d` |

| 0079 | [0079-account-managed-model-controls.patch](0079-account-managed-model-controls.patch) | `5fd52720ffca782d2bce5d23426759f7a4e75c4f` |

| 0080 | [0080-page-local-model-settings-agent.patch](0080-page-local-model-settings-agent.patch) | `a0fd40d4e4d15b3f6144a620029c3363f84018f7` |
| 0081 | [0081-combined-model-and-thinking-control.patch](0081-combined-model-and-thinking-control.patch) | `3e8fe6a8fff019f036b981ec4aba4712cbd52671` |

| 0082 | [0082-compact-composer-model-options.patch](0082-compact-composer-model-options.patch) | `d479c219603e6c4678e8778ad3c1ae5bddfe335e` |

| 0083 | [0083-catalog-capacity-before-first-request.patch](0083-catalog-capacity-before-first-request.patch) | `0395a0797fa0fb8368005129adcd253a79055f56` |

| 0084 | [0084-context-windows-and-runtime-prices.patch](0084-context-windows-and-runtime-prices.patch) | `2412087ad7ebbb2822ecf77ba2e78424ecc1d1d3` |

| 0085 | [0085-withdrawn-context-recovery.patch](0085-withdrawn-context-recovery.patch) | `7e0ad2799927753fedd455ffcb1796a84d267980` |

| 0086 | [0086-context-clearing-and-renderer-review-guard.patch](0086-context-clearing-and-renderer-review-guard.patch) | `8337c8cdaae248805de4a2271b8b151ab43a7ab7` |

| 0087 | [0087-browser-search-stop-and-native-menus.patch](0087-browser-search-stop-and-native-menus.patch) | `9dd34875e43b49abb886463f08c7402eaff42fe8` |

| 0088 | [0088-browser-draft-popup-scope.patch](0088-browser-draft-popup-scope.patch) | `54e271c34da6405d5999660f895935c8c5f960b7` |

| 0089 | [0089-browser-keyboard-scope.patch](0089-browser-keyboard-scope.patch) | `9acbcefe13bde4808519fa75aa25e91aa59b0ee6` |

| 0090 | [0090-browser-task-find-dispatch.patch](0090-browser-task-find-dispatch.patch) | `3c5083a4175fe981f485ab2bf3729bd573cd056b` |

| 0091 | [0091-subscription-login-readiness.patch](0091-subscription-login-readiness.patch) | `d54c080e182f7f5f2897c5c55fddf90619a628b9` |

| 0092 | [0092-composer-provider-menu-hit-targets.patch](0092-composer-provider-menu-hit-targets.patch) | `15e62f60fbfacb5f2df244c25d884674ba24f45b` |

| 0093 | [0093-scoped-new-conversation-model-defaults.patch](0093-scoped-new-conversation-model-defaults.patch) | `6089a82aeaeef3d3c38ee00fff55c6db182e79b8` |
| 0094 | [0094-searchable-composer-model-list.patch](0094-searchable-composer-model-list.patch) | `21b3be837d7c6279e2001f2d789d639d3b1f19fa` |

| 0095 | [0095-model-specific-composer-parameters.patch](0095-model-specific-composer-parameters.patch) | `789e6ef7fe2fe383e3c6c85e00646fa1dd7ec5e3` |
| 0096 | [0096-bounded-composer-model-catalog.patch](0096-bounded-composer-model-catalog.patch) | `f711e38ced4ea325d3f85e8b2508f6d113bafdcc` |

| 0097 | [0097-grok-subscription-fast-model.patch](0097-grok-subscription-fast-model.patch) | `0c5078e6b71b2b221ca9ce7c45a92d87326342cc` |

| 0098 | [0098-api-media-receipts-and-binary-artifacts.patch](0098-api-media-receipts-and-binary-artifacts.patch) | `ddceb90c65886757a241a4c173e54798c9c99fad` |

| 0099 | [0099-media-confirmation-scope-and-failure-reasons.patch](0099-media-confirmation-scope-and-failure-reasons.patch) | `33c8f492e562a0e2e294a6dd4bbe2d8343323cf2` |

| 0100 | [0100-foundation-admission-context-and-data-preservation.patch](0100-foundation-admission-context-and-data-preservation.patch) | `8f0c21fc63b30ecba9442fce73aa7f9e86d02813` |

| 0101 | [0101-context-keyboard-regression.patch](0101-context-keyboard-regression.patch) | `9ce2b24961360edb38967ac9195a3821fe67cc04` |

| 0102 | [0102-durable-non-code-turn-outputs.patch](0102-durable-non-code-turn-outputs.patch) | `6e44155d2ac70a184c059a9ad218b23c4dfa1f3c` |

| 0103 | [0103-native-login-lifecycle.patch](0103-native-login-lifecycle.patch) | `72b016f1b74bfe56ae05c290ef4a3f51ea2bdb5b` |
| 0104 | [0104-cancelled-response-receipts.patch](0104-cancelled-response-receipts.patch) | `055230c1a0fa482fc2cef72b3b1ba31b1866fe90` |
| 0105 | [0105-effective-tool-dispatch-and-skill-facts.patch](0105-effective-tool-dispatch-and-skill-facts.patch) | `0aeb6a381756aa6e9af49ba987559a4dc2a89105` |

| 0106 | [0106-recorded-usage-auth-and-billing.patch](0106-recorded-usage-auth-and-billing.patch) | `7e1dfbdfe89fec1227b5a48308ee9f65722f5193` |
| 0107 | [0107-model-settings-capacity-operations.patch](0107-model-settings-capacity-operations.patch) | `6c71ea5de950bc6c4ad0045c39a846f4eca09908` |

| 0108 | [0108-kernel-request-admission-and-private-receipts.patch](0108-kernel-request-admission-and-private-receipts.patch) | `39470aa6743221f78fc53f63a055a6de9ca54424` |
| 0109 | [0109-contextual-assistance-integration.patch](0109-contextual-assistance-integration.patch) | `5a034fd3971ea125e25c8be9ef09c4f77bf02934` |

| 0110 | [0110-native-failed-preparation-recovery.patch](0110-native-failed-preparation-recovery.patch) | `a3008772f727f15b5b01f58015d04932a6b553b7` |

| 0111 | [0111-pi-core-and-optional-tool-discovery.patch](0111-pi-core-and-optional-tool-discovery.patch) | `985671c44f761a96fad2fae334b65898972cfb79` |

| 0112 | [0112-pi-core-admitted-tool-routing.patch](0112-pi-core-admitted-tool-routing.patch) | `4955944c43c2a41fdf59847c9707fd2946d5937b` |

| 0113 | [0113-pi-core-loadout-and-release-intake.patch](0113-pi-core-loadout-and-release-intake.patch) | `e3e70df70fc71bf5633e6a99a10633080d3fc81c` |

| 0114 | [0114-native-codex-and-contextual-interaction.patch](0114-native-codex-and-contextual-interaction.patch) | `15d1bc304d945f9602c44018c3673fbc1b890842` |

Tree observations are retained reconstruction evidence, not live-provider, visual or release acceptance.
The source gate replays every patch and compares the final tree without modifying the working index.
Patch 0108 is the committed kernel correction. Patch 0109 preserves the current unfinished contextual
assistance/default/filter and account-diagnostic integration; it does not declare those paths accepted.

Patch 0114 records the scoped native Codex integration, corrected allowance tracks/Claude usage
and contextual popup interaction. It also preserves remaining catalog/account diagnostics;
reconstruction and local execution do not declare whole-kernel, media or owner acceptance.

| 0115 | [0115-contextual-menus-and-purpose-defaults.patch](0115-contextual-menus-and-purpose-defaults.patch) | `3ecd147570b61e48427676630fce0ccd8b1b1188` |

| 0116 | [0116-typed-decision-validation-and-intake.patch](0116-typed-decision-validation-and-intake.patch) | `fff60fbbc55594798d97d394dc64523b8ce4bf01` |

| 0117 | [0117-governed-decisions-and-default-policies.patch](0117-governed-decisions-and-default-policies.patch) | `a9cdb14f47a7f728615c910f8ed650b8832ad357` |

| 0118 | [0118-contextual-defaults-and-model-menu-correction.patch](0118-contextual-defaults-and-model-menu-correction.patch) | `4cb2a9b2e5ebd353298152585286de1a4f1bf5ee` |

| 0119 | [0119-kernel-receipt-and-related-flow-corrections.patch](0119-kernel-receipt-and-related-flow-corrections.patch) | `d24f099ce3f408e3b3d793b355f612e5e8bdec0d` |

| 0120 | [0120-regional-menu-actions-and-close-snapshots.patch](0120-regional-menu-actions-and-close-snapshots.patch) | `ddcc77836f64466d8ef21b60c7bc5eb1ba5c9475` |

| 0121 | [0121-native-account-mismatch-diagnosis.patch](0121-native-account-mismatch-diagnosis.patch) | `e22e0422ad9cce82fdb00dbf91819bb3164ecfd0` |

| 0122 | [0122-manual-model-correction-and-native-discovery.patch](0122-manual-model-correction-and-native-discovery.patch) | `e84b029720f19da74cbcdd7b0ad9483a7f40b996` |

| 0123 | [0123-media-failure-and-saved-video-recovery.patch](0123-media-failure-and-saved-video-recovery.patch) | `418154b30d09d3636bfc4a8435c0da26e673d8f6` |

| 0124 | [0124-manual-native-model-route-completion.patch](0124-manual-native-model-route-completion.patch) | `eca771aa8c6ffc2b80be40775a3e564e2c6c9b68` |
| 0125 | [0125-api-completion-and-continuation-integrity.patch](0125-api-completion-and-continuation-integrity.patch) | `794c4fd646c04e40877f4140841c4d8951ffda6b` |
| 0126 | [0126-platform-api-catalog-contracts.patch](0126-platform-api-catalog-contracts.patch) | `1dcfb59b8848d5cbfc795dfeac7a4e599297dd35` |
| 0127 | [0127-native-api-catalog-and-thinking-contracts.patch](0127-native-api-catalog-and-thinking-contracts.patch) | `3d8231773a401646d893b801312e82e026a857e2` |
| 0128 | [0128-provider-brand-svg-corrections.patch](0128-provider-brand-svg-corrections.patch) | `19f591d07afd9b33ff6568ef67f4083136b9fc88` |
| 0129 | [0129-chatgpt-account-icon.patch](0129-chatgpt-account-icon.patch) | `61331b8059cdc26ddf8c9e5d45297c2c66bc4c3a` |

| 0130 | [0130-model-evidence-capacity-and-tool-contract.patch](0130-model-evidence-capacity-and-tool-contract.patch) | `dd77c87acc53806eeb2d3fbb49abdedb6fcabe5e` |

| 0131 | [0131-reviewed-runtime-sdk-upgrades.patch](0131-reviewed-runtime-sdk-upgrades.patch) | `61573bef1dacbfb887da615ed595f73b4a0d209f` |

| 0132 | [0132-preserve-discovered-model-recommendations.patch](0132-preserve-discovered-model-recommendations.patch) | `2726e667b826a64d8f123b83c332cbaac462257e` |

| 0133 | [0133-contain-contextual-assistant-resize.patch](0133-contain-contextual-assistant-resize.patch) | `0efe00738ffcd6935c13b244056631a658871417` |

| 0134 | [0134-shared-on-demand-guide-topics.patch](0134-shared-on-demand-guide-topics.patch) | `5791dcc138695154e75443839f83c3a43d58a099` |

| 0135 | [0135-file-publication-integrity.patch](0135-file-publication-integrity.patch) | `9b493fff3eaff99cf3ab343c192eccea4c877777` |

| 0136 | [0136-background-agent-stop-settlement.patch](0136-background-agent-stop-settlement.patch) | `3151c06000e8ed7842c809425bac41fb3d3523fb` |

| 0137 | [0137-api-request-and-accounting-chain.patch](0137-api-request-and-accounting-chain.patch) | `132c16bc2674fe95bc5c60c4646ab46cd4682cb9` |

| 0138 | [0138-unknown-workflow-effect-recovery.patch](0138-unknown-workflow-effect-recovery.patch) | `6b5e311266a51e4ecdd9c54f472c9d6c25e22c25` |

| 0139 | [0139-catalog-observation-identity.patch](0139-catalog-observation-identity.patch) | `58e7eb82e244aa9115fb903df370e801ca2e8dcb` |

| 0140 | [0140-official-allowance-readers-and-chatgpt-name.patch](0140-official-allowance-readers-and-chatgpt-name.patch) | `1edd9dc4a2cbce581620a89650fd97e37bfc8c71` |

| 0141 | [0141-api-key-plan-allowance.patch](0141-api-key-plan-allowance.patch) | `af139ff176692257d832623c8d478c90ce233f4a` |

| 0142 | [0142-catalog-reasoning-and-audio-capabilities.patch](0142-catalog-reasoning-and-audio-capabilities.patch) | `d7ae120023552ad54a1d928fa33498224bed4e92` |

| 0143 | [0143-guide-allowance-and-model-actions.patch](0143-guide-allowance-and-model-actions.patch) | `84d60025b3f8607b081e4815f46e4fd13e8ec414` |

| 0144 | [0144-grok-fast-variant-listed-once.patch](0144-grok-fast-variant-listed-once.patch) | `13d84dbba93af344a4b956b7032cccdc0e3b9a3f` |

| 0145 | [0145-craft-style-contextual-assistant.patch](0145-craft-style-contextual-assistant.patch) | `afced14e153d5c40c628b2b7d72069b6caaa8eb6` |

| 0146 | [0146-antigravity-native-executor.patch](0146-antigravity-native-executor.patch) | `62d259456e922800e87cf613dec2e8bff2d07757` |

| 0147 | [0147-antigravity-permission-truth.patch](0147-antigravity-permission-truth.patch) | `c1ad6573c3a7d3804654c8357c5ec7271751f309` |

| 0148 | [0148-kimi-code-allowance.patch](0148-kimi-code-allowance.patch) | `bfaf479c3889d98b7eb39c50b2db3dc64e5a3dd1` |

| 0149 | [0149-native-login-cancel-and-vendor-route.patch](0149-native-login-cancel-and-vendor-route.patch) | `f2b0ff8d8290cd223c00c003df0ff9eb2fa78d2f` |

| 0150 | [0150-goal-verifier-inconclusive.patch](0150-goal-verifier-inconclusive.patch) | `9e0685810d3a156f210f66fb28eda988767bf3c6` |

| 0151 | [0151-usage-before-publication.patch](0151-usage-before-publication.patch) | `db4ef4688a65c77bb028644c6698bd8407c261ba` |

| 0152 | [0152-memory-extraction-usage.patch](0152-memory-extraction-usage.patch) | `b7fc1e138245b480970cffdfea2772a9a00f1a91` |

| 0153 | [0153-shell-scope-fixes.patch](0153-shell-scope-fixes.patch) | `60753ec73d73b15672ef2431e2b3d0e040cbd143` |

| 0154 | [0154-antigravity-modes-measured.patch](0154-antigravity-modes-measured.patch) | `5bb3824ec314ceb96243b4f5679f1d7b678cf70a` |

| 0155 | [0155-acp-native-executor.patch](0155-acp-native-executor.patch) | `3d4dc297c0de705261f244a0e89ac71c38a1d361` |

| 0156 | [0156-acp-hermes-openclaw.patch](0156-acp-hermes-openclaw.patch) | `364ec6c85782ad52bce761e4793d59ad9811915e` |

| 0157 | [0157-api-key-balances.patch](0157-api-key-balances.patch) | `b7b6fd8cb9f2171f7e2376f499092f30e9d6e39b` |

| 0158 | [0158-acp-codebuddy.patch](0158-acp-codebuddy.patch) | `badd43e9f52d7c8bef58360e809aa5b321d07d56` |

| 0159 | [0159-acp-gemini-qwen.patch](0159-acp-gemini-qwen.patch) | `3808786782f46f6129ba1765a63504f635d80944` |

| 0160 | [0160-retire-gemini-cli.patch](0160-retire-gemini-cli.patch) | `5798efe03c287a7de48d1b3509bdb5ea8445509c` |

| 0161 | [0161-kimi-mimo-logos.patch](0161-kimi-mimo-logos.patch) | `918213ea789a4628ff658a537d7d81ea42b4f90a` |

| 0162 | [0162-fold-model-variants.patch](0162-fold-model-variants.patch) | `533e1974fb5889eec35f9a13fd86724d9d9e1f72` |

| 0163 | [0163-native-cli-accounts.patch](0163-native-cli-accounts.patch) | `9212a3bff679163a234564b011c65318520fa6c5` |

| 0164 | [0164-model-knowledge-catalog.patch](0164-model-knowledge-catalog.patch) | `bbde03d9a4dc5c21672f4df5d0c4c12763d52b27` |

| 0165 | [0165-native-account-stability.patch](0165-native-account-stability.patch) | `5e209a097d66c0b0f37f130932713d59e5ef7e7e` |

| 0166 | [0166-vendor-compliant-routes.patch](0166-vendor-compliant-routes.patch) | `36d443026dd85c33ca1787f50f2a518047dd6582` |

| 0167 | [0167-claude-hosted-acp-signin.patch](0167-claude-hosted-acp-signin.patch) | `4a8ff8772e4c813330468a5b1f25e88fc36be23f` |

| 0168 | [0168-models-dev-catalog.patch](0168-models-dev-catalog.patch) | `dc4371ef2b35e1ad63b1c04b258a2a03f42f11ca` |

| 0169 | [0169-follow-login-turns.patch](0169-follow-login-turns.patch) | `c18b924fcbf5f924801a42dcf0083fefeaf32cce` |

| 0170 | [0170-automatic-model-tiers.patch](0170-automatic-model-tiers.patch) | `3d64e1ba497d158f0cda004241f0dc06f271e315` |

| 0171 | [0171-stop-late-effect.patch](0171-stop-late-effect.patch) | `a6b4e9cfd6dd8f080643424d5ee88d24ffc93b8b` |

| 0172 | [0172-plugin-hook-trust.patch](0172-plugin-hook-trust.patch) | `d2b3413105a5e0f4b8eeb5573977afe55c7caab4` |

| 0173 | [0173-native-failure-reasons.patch](0173-native-failure-reasons.patch) | `7843eb6ff996507cfff6589963843b84fa3a6edc` |

| 0174 | [0174-plan-allowance-templates.patch](0174-plan-allowance-templates.patch) | `0bc781e57804f30f75809fdd3b699f5b9ede2813` |
