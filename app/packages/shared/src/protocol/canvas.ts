export type NodeType =
  | 'text_frame'
  | 'image_asset'
  | 'sticky'
  | 'code_block'
  | 'browser_embed'
  | 'video_frame'
  | 'aigc_placeholder'
  | 'connector'
  | 'group';

export interface Viewport { cx: number; cy: number; zoom: number }

export interface CanvasNode {
  id: string;
  type: NodeType;
  cx: number;
  cy: number;
  width: number;
  height: number;
  data: Record<string, unknown>;
  contentType?: 'static' | 'live';
  groupId?: string;
  seq: number;
}

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
}

export interface CanvasDocument {
  id: string;
  workspaceId: string;
  sessionId?: string;
  nodes: Record<string, CanvasNode>;
  edges: Record<string, CanvasEdge>;
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
}
