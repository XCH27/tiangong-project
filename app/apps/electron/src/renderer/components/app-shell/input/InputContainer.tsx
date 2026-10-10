import * as React from 'react'
import { FreeFormInput, type FreeFormInputProps } from './FreeFormInput'
import { StructuredInput } from './StructuredInput'
import type { RichTextInputHandle } from '@/components/ui/rich-text-input'
import type { StructuredInputState, StructuredResponse } from './structured/types'
import { getComposerMaxHeight } from './composer-height'
import { useInputAvailableHeight } from '@/hooks/useInputAvailableHeight'
import { BackgroundFinishedChip } from '../BackgroundFinishedChip'

interface InputContainerProps extends Omit<FreeFormInputProps, 'inputRef' | 'maxHeight'> {
  structuredInput?: StructuredInputState
  onStructuredResponse?: (response: StructuredResponse) => void
  textareaRef?: React.RefObject<RichTextInputHandle>
}

/** A single composer surface for new and ongoing conversations. The editor owns
 * its scroll region; a second animated card made its toolbar move separately
 * from the draft. Structured prompts retain their original response handler. */
export function InputContainer({
  structuredInput,
  onStructuredResponse,
  textareaRef,
  compactMode,
  isProcessing,
  ...freeFormProps
}: InputContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const availableHeight = useInputAvailableHeight(containerRef)
  const maxHeight = getComposerMaxHeight(availableHeight, structuredInput ? 'structured' : 'freeform')

  return (
    <div ref={containerRef} className="relative">
      {structuredInput ? (
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[12px] border border-foreground/10 bg-background shadow-minimal"
          style={{ maxHeight }}>
          <StructuredInput state={structuredInput} onResponse={onStructuredResponse ?? (() => {})} unstyled />
        </div>
      ) : (
        <FreeFormInput
          {...freeFormProps}
          compactMode={compactMode}
          isProcessing={isProcessing}
          inputRef={textareaRef}
          maxHeight={maxHeight}
        />
      )}
      {!structuredInput && freeFormProps.sessionId && (
        <BackgroundFinishedChip sessionId={freeFormProps.sessionId} />
      )}
    </div>
  )
}
