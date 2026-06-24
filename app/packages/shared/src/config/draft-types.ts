/** Browser-safe types for persisted composer drafts. */
export interface DraftAttachmentContent {
  type: 'image' | 'pdf' | 'text' | 'office' | 'audio' | 'unknown';
  mimeType: string;
  size: number;
  base64?: string;
  text?: string;
  thumbnailBase64?: string;
}

export interface DraftAttachmentRef {
  path: string;
  name: string;
  /** Inline content for attachments without a filesystem path. */
  content?: DraftAttachmentContent;
}

export interface SessionDraft {
  text: string;
  attachments?: DraftAttachmentRef[];
}
