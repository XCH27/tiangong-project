/**
 * Provider icon sprite adapted from OpenCode (MIT).
 * See assets/provider-icons/opencode-LICENSE.txt.
 */

import * as React from 'react'
import providerSprite from '@/assets/provider-icons/opencode-provider-sprite.svg'
import { cn } from '@/lib/utils'
import { resolveProviderBrandIconId } from '@/lib/provider-icons'

interface ProviderBrandIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  providerId: string
  baseUrl?: string | null
  piAuthProvider?: string | null
  size?: number
}

/** Render a provider logo from the bundled OpenCode sprite. */
export const ProviderBrandIcon = React.forwardRef<SVGSVGElement, ProviderBrandIconProps>(
function ProviderBrandIcon({
  providerId,
  baseUrl,
  piAuthProvider,
  size = 16,
  className,
  ...props
}, ref) {
  const iconId = resolveProviderBrandIconId(providerId, baseUrl, piAuthProvider)

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={cn('shrink-0 text-foreground', className)}
      {...props}
    >
      <use href={`${providerSprite}#${iconId}`} />
    </svg>
  )
})
