# GUI 终端 / Fleet

当前主线已经切换为 **Fleet 桌面 Agent 工具**：直接基于 `app/` 下的 craft-agents-oss 完整副本做二次开发，并按文档把 AionUi 作为第二绿灯来源补齐 CLI Runtime、ACP、Team、Skill 等能力。

旧 OmniVerse Vision 的 V1/V2 资料仍保留在 `v1/`、`v2/` 和 `docs/_archive/`，但只作为历史背景，不再作为当前实现入口。

## 当前入口

- 执行铁律：`AGENTS.md`
- 文档索引：`docs/README.md`
- 单一产品决策：`docs/04-产品决策记录.md`
- 主工程：`app/`
- Electron app：`app/apps/electron`

## 当前首攻

按 D3，当前第一个落地功能是 **终端 / 本机 CLI Runtime Host**：

1. 已先做 P0-B CLI 自动探测。
2. 下一步做 AionUi 式 Runtime Catalog / Runtime Adapter。
3. 内置浏览器 + 网页标注顺延到下一阶段。

## 推荐命令

```bash
./scripts/craft.sh install
./scripts/craft.sh run typecheck:all
./scripts/craft.sh run electron:dev
```
