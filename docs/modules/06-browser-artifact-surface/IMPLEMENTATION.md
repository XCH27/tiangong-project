# Browser Artifact Surface Implementation Plan

## 18. IPC Bridge & Jotai State Sync
在渲染层，通过 Jotai 原子与 Electron 主进程的 `BrowserPaneManager` 建立 IPC 通道，以同步浏览器实例并回传 CDP 划选的 DOM 快照数据作为 Timeline 证据：

```typescript
// 联动 apps/electron/src/renderer/atoms/browser-pane.ts (CDP 数据交互)
import { atom } from 'jotai';

// 监听主进程同步的浏览器实例列表
export const browserInstancesMapAtom = atom<Map<string, any>>(new Map());

// 新增 Read/Annotate/Evidence CDP 证据捕获绑定
export const captureEvidenceAtom = atom(
  null,
  async (get, set, instanceId: string, selectionGeometry: any) => {
    // 经由 electronAPI 管道向主进程的 BrowserPaneManager 发送 CDP 节点快照提取命令
    const snapshot = await window.electronAPI.invoke(
      'browser-pane:captureSnapshot',
      instanceId,
      selectionGeometry
    );
    
    // 捕获并生成结构化证据，自动注入 Session Timeline 数据库
    await window.electronAPI.invoke('timeline:addEvidence', {
      type: 'dom_selection',
      instanceId,
      content: snapshot.text,
      timestamp: Date.now()
    });
  }
);
```
