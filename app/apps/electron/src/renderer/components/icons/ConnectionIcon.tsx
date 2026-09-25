/**
 * ConnectionIcon
 *
 * Displays the provider logo for an LLM connection.
 * Falls back to the first letter of the connection name if no icon is available.
 *
 * Used in:
 * - AI Settings (connections list)
 * - FreeFormInput (model display)
 * - Session List (connection badge)
 * - New Session (model selector group names)
 */

import { Brain } from 'lucide-react'
import { getProviderIcon, getProviderIconKey } from '@/lib/provider-icons'
import { hasProviderBrandIcon, ProviderBrandIcon } from './ProviderBrandIcon'
import { getModelDisplayName } from '@config/models'
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui'
import type { LlmConnectionWithStatus } from '../../../shared/types'

interface ConnectionIconProps {
  /** The connection to display an icon for */
  connection: Pick<LlmConnectionWithStatus, 'name' | 'providerType' | 'baseUrl' | 'piAuthProvider' | 'customEndpoint'> & { type?: string; defaultModel?: string }
  /** Size in pixels (default: 16) */
  size?: number
  /** Additional CSS classes */
  className?: string
  /** Show tooltip with connection name + model on hover (default: false) */
  showTooltip?: boolean
}

export function ConnectionIcon({ connection, size = 16, className = '', showTooltip = false }: ConnectionIconProps) {
  // On a custom endpoint piAuthProvider selects the wire credential format,
  // not the vendor. A recognized host can still supply its actual brand.
  const brandProvider = connection.customEndpoint ? undefined : connection.piAuthProvider
  const providerIconKey = getProviderIconKey(
    connection.providerType || connection.type || '',
    connection.baseUrl,
    brandProvider
  )
  const providerIcon = getProviderIcon(
    connection.providerType || connection.type || '',
    connection.baseUrl,
    brandProvider
  )

  const iconElement = hasProviderBrandIcon(providerIconKey) ? (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }} aria-hidden>
      <ProviderBrandIcon provider={providerIconKey} size={size} />
    </span>
  ) : providerIcon ? (
    <img src={providerIcon} alt="" width={size} height={size} className={`rounded-[3px] flex-shrink-0 ${className}`} style={{ width: size, height: size }} />
  ) : (
    <div
      className={`rounded-[3px] bg-foreground/10 flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Brain
        className="text-foreground/50 flex-shrink-0"
        style={{ width: Math.round(size * 0.7), height: Math.round(size * 0.7) }}
      />
    </div>
  )

  if (!showTooltip) return iconElement

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {iconElement}
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        <div className="text-center">
          <div>{connection.name}</div>
          {connection.defaultModel && <div className="text-[10px] opacity-60">{getModelDisplayName(connection.defaultModel)}</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
