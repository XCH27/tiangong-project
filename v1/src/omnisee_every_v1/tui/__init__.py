"""OmniVerse Vision · V1 Textual TUI (可运行兜底 · 视觉参考).

V1 是当前可运行入口和 V2 视觉/交互复刻样板。V2 (TS/Ink + ai-sdk)
是目标主线前端，两者共享 Python 后端。

参考：
  - docs/ROADMAP.md           当前方向与边界
  - docs/BACKEND.md           共享后端 / REST / MCP 契约
  - docs/V1.md                V1 维护与视觉参考

V1 改动须遵守：
  - 跑 `uv run pytest tests/ -q` 全绿才能提交
  - 改 widget/CSS 前先看 docs/V1.md 是否已记录
  - 大的视觉重设计先评估是否应直接交给 docs/V2.md
"""
