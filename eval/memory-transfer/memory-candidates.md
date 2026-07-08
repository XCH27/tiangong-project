# Memory Candidate Extraction

Generated at: 2026-07-04T08:35:07.499Z

| Scope | Count |
|---|---:|
| raw_path | 6 |
| sensitive | 4 |
| tool_pattern | 2 |

## Candidates

| Memory | Source Project | Scope | Risk | Content |
|---|---|---|---|---|
| M-CAND-0001 | P-0010 | sensitive | high | 该会话包含敏感凭据、账号或 token 相关讨论，默认禁止注入或跨项目迁移。 |
| M-CAND-0002 | P-0010 | raw_path | high | 该会话包含项目本地绝对路径，默认只可在源项目内用于定位。 |
| M-CAND-0003 | P-0010 | tool_pattern | low | Bun/TypeScript 工作区的局部验证优先跑 targeted bun test，再按触达面决定是否 typecheck。 |
| M-CAND-0004 | P-0017 | raw_path | high | 该会话包含项目本地绝对路径，默认只可在源项目内用于定位。 |
| M-CAND-0005 | P-0009 | raw_path | high | 该会话包含项目本地绝对路径，默认只可在源项目内用于定位。 |
| M-CAND-0006 | P-0017 | sensitive | high | 该会话包含敏感凭据、账号或 token 相关讨论，默认禁止注入或跨项目迁移。 |
| M-CAND-0007 | P-0008 | raw_path | high | 该会话包含项目本地绝对路径，默认只可在源项目内用于定位。 |
| M-CAND-0008 | P-0011 | raw_path | high | 该会话包含项目本地绝对路径，默认只可在源项目内用于定位。 |
| M-CAND-0009 | P-0013 | sensitive | high | 该会话包含敏感凭据、账号或 token 相关讨论，默认禁止注入或跨项目迁移。 |
| M-CAND-0010 | P-0012 | raw_path | high | 该会话包含项目本地绝对路径，默认只可在源项目内用于定位。 |
| M-CAND-0011 | P-0014 | tool_pattern | low | Bun/TypeScript 工作区的局部验证优先跑 targeted bun test，再按触达面决定是否 typecheck。 |
| M-CAND-0012 | P-0016 | sensitive | high | 该会话包含敏感凭据、账号或 token 相关讨论，默认禁止注入或跨项目迁移。 |
