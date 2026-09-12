import * as React from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@craft-agent/ui'
import type { LoadedPage } from '@craft-agent/shared/pages/types'

interface SharePageDialogProps {
  workspaceId: string
  page: LoadedPage
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Confirmation for removing a historical public copy; never uploads content. */
export function SharePageDialog({ workspaceId, page, open, onOpenChange }: SharePageDialogProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = React.useState(false)

  const unpublish = async () => {
    setBusy(true)
    try {
      const result = await window.electronAPI.unpublishPage(workspaceId, page.config.slug)
      if (result.warning === 'remote-copy-may-remain') {
        toast.warning(t('toast.pageUnpublished'), { description: t('toast.pagePublicCopyMayRemain') })
      } else {
        toast.success(t('toast.pageUnpublished'))
      }
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(t('toast.pageUnpublishFailed'), {
        description: message.replace(/^PAGE_[A-Z0-9_]+:\s*/, ''),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open && Boolean(page.config.share)} onOpenChange={next => { if (!busy) onOpenChange(next) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pages.share.unpublish')}</DialogTitle>
          <DialogDescription>{t('pages.share.disabledNote')}</DialogDescription>
        </DialogHeader>
        <p className="break-all text-xs text-foreground/60">{page.config.share?.url}</p>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" disabled={busy} onClick={() => void unpublish()}>
            {busy ? <Spinner /> : null}
            {t('pages.share.unpublish')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
