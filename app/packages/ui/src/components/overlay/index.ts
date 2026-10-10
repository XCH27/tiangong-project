// Base overlay components
export { FullscreenOverlayBase, type FullscreenOverlayBaseProps } from './FullscreenOverlayBase'
export { FullscreenOverlayBaseHeader, type FullscreenOverlayBaseHeaderProps, type OverlayTypeBadge } from './FullscreenOverlayBaseHeader'
export { PreviewOverlay, type PreviewOverlayProps, type BadgeVariant } from './PreviewOverlay'
export { ContentFrame, type ContentFrameProps } from './ContentFrame'

// Helper components
export { CopyButton, type CopyButtonProps } from './CopyButton'
export { ItemNavigator, type ItemNavigatorProps } from './ItemNavigator'
export { OverlayErrorBanner, type OverlayErrorBannerProps } from './OverlayErrorBanner'

// Specialized overlays
export { CodePreviewOverlay, type CodePreviewOverlayProps } from './CodePreviewOverlay'
export { MultiDiffPreviewOverlay, type MultiDiffPreviewOverlayProps, type FileChange, type DiffViewerSettings } from './MultiDiffPreviewOverlay'
export { TerminalPreviewOverlay, type TerminalPreviewOverlayProps } from './TerminalPreviewOverlay'
export { GenericOverlay, detectLanguage, detectLanguageFromPath, type GenericOverlayProps } from './GenericOverlay'
export { JSONPreviewOverlay, type JSONPreviewOverlayProps } from './JSONPreviewOverlay'
export { DataTableOverlay, type DataTableOverlayProps } from './DataTableOverlay'
export { DocumentFormattedMarkdownOverlay, type DocumentFormattedMarkdownOverlayProps } from './DocumentFormattedMarkdownOverlay'
export { ImagePreviewOverlay, type ImagePreviewOverlayProps } from './ImagePreviewOverlay'
export { MediaPreviewOverlay, type MediaPreviewOverlayProps } from './MediaPreviewOverlay'
export { PDFPreviewOverlay, type PDFPreviewOverlayProps } from './PDFPreviewOverlay'
export { DocxPreviewOverlay, type DocxPreviewOverlayProps } from './DocxPreviewOverlay'
export { XlsxPreviewOverlay, type XlsxPreviewOverlayProps } from './XlsxPreviewOverlay'
export { PptxPreviewOverlay, type PptxPreviewOverlayProps } from './PptxPreviewOverlay'
export { DocumentLockedOverlay, type DocumentLockedOverlayProps } from './DocumentLockedOverlay'
export { AdmissionNotice } from './AdmissionNotice'
export {
  DOCUMENT_SAVE_LOCKED,
  presentDocumentRow,
  presentDocumentViewer,
  presentMcpAppsPane,
  type McpAppsPanePresentation,
  type ViewerPresentation,
} from './admission-presentation'
export { MermaidPreviewOverlay, type MermaidPreviewOverlayProps } from './MermaidPreviewOverlay'
export { HTMLPreviewOverlay, type HTMLPreviewOverlayProps } from './HTMLPreviewOverlay'
export { ActivityCardsOverlay, type ActivityCardsOverlayProps } from './ActivityCardsOverlay'
