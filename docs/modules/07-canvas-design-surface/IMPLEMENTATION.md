# Canvas Design Surface Implementation Plan

## 18. Native Design Engine Specification
结合 OpenPencil 原生设计引擎，构建独立于普通 DOM 的 Native Design Document 结构与可追溯的撤销/重做历史树：

```typescript
// app/src/lib/design-engine.ts (UI节点设计引擎)
export interface DesignNode {
  id: string;
  type: 'rect' | 'text' | 'image';
  props: any;
  history: Array<{ before: any; after: any }>;
}

export class DesignEngine {
  private nodes: DesignNode[] = [];
  private selection: DesignNode[] = [];
  
  createNode(type: 'rect' | 'text' | 'image', props: object): DesignNode {
    const node: DesignNode = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      props,
      history: [],
    };
    this.nodes.push(node);
    return node;
  }
  
  mutate(nodeId: string, props: object): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      node.history.push({ before: { ...node.props }, after: props });
      node.props = props;
    }
  }
  
  undo(nodeId: string): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node && node.history.length > 0) {
      const last = node.history.pop()!;
      node.props = last.before;
    }
  }
}
```
