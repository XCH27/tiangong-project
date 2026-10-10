/**
 * Locked document suites.
 *
 * Legacy and macro workbooks and decks stay Locked. This overlay names that
 * state. It does not parse the package and it does not offer a write.
 */

import { FileText, Presentation, Table } from 'lucide-react'
import { suiteForPath, type DocumentSuiteId } from '@craft-agent/shared/protocol/document-command'
import { AdmissionNotice } from './AdmissionNotice'
import { presentDocumentViewer } from './admission-presentation'
import { ContentFrame } from './ContentFrame'
import { PreviewOverlay } from './PreviewOverlay'

export interface DocumentLockedOverlayProps {
  isOpen: boolean
  onClose: () => void
  filePath: string
  theme?: 'light' | 'dark'
}

export function DocumentLockedOverlay({
  isOpen,
  onClose,
  filePath,
  theme = 'light',
}: DocumentLockedOverlayProps) {
  const suite = suiteForPath(filePath)
  const presentation = presentDocumentViewer({
    filePath,
    load: 'ready',
  })
  const title = filePath.split(/[\\/]/).pop() ?? 'Document'
  const badge = badgeForSuite(suite?.id)

  return (
    <PreviewOverlay
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      filePath={filePath}
      title={title}
      typeBadge={badge}
    >
      <ContentFrame title={title}>
        <div className="px-8 py-6" data-document-overlay="locked">
          <AdmissionNotice presentation={presentation} detailKey="admission.document.lockedSuite" />
        </div>
      </ContentFrame>
    </PreviewOverlay>
  )
}

function badgeForSuite(suiteId: DocumentSuiteId | undefined): {
  icon: typeof FileText
  label: string
  variant: 'blue' | 'green' | 'orange'
} {
  switch (suiteId) {
    case 'xls':
      return { icon: Table, label: 'XLS', variant: 'green' }
    case 'xlsx':
      return { icon: Table, label: 'XLSX', variant: 'green' }
    case 'ppt':
      return { icon: Presentation, label: 'PPT', variant: 'orange' }
    case 'pptx':
      return { icon: Presentation, label: 'PPTX', variant: 'orange' }
    case 'docx':
      return { icon: FileText, label: 'DOCX', variant: 'blue' }
    case undefined:
      return { icon: FileText, label: 'Locked', variant: 'blue' }
    default: {
      const unexpected: never = suiteId
      return unexpected
    }
  }
}
