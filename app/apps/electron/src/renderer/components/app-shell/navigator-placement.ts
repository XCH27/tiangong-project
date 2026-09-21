/** Settings (and full production surfaces) keep their existing navigation shape. */
export function navigatorPlacement(navigator: string, compact: boolean, sidebarVisible: boolean): 'sidebar' | 'navigator' | 'none' {
  if (compact) return 'navigator'
  if (navigator === 'board' || navigator === 'pages') return 'none'
  if (navigator === 'settings' || !sidebarVisible) return 'navigator'
  return 'sidebar'
}
