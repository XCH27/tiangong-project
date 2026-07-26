/**
 * Centralized branding assets for Craft Agent
 * Used by OAuth callback pages
 */

export const CRAFT_LOGO = [
  '  ████████ █████████    ██████   ██████████ ██████████',
  '██████████ ██████████ ██████████ █████████  ██████████',
  '██████     ██████████ ██████████ ████████   ██████████',
  '██████████ ████████   ██████████ ███████      ██████  ',
  '  ████████ ████  ████ ████  ████ █████        ██████  ',
] as const;

/** Logo as a single string for HTML templates */
export const CRAFT_LOGO_HTML = CRAFT_LOGO.map((line) => line.trimEnd()).join('\n');

/**
 * Session share/viewer target.
 *
 * Fleet operates no share service: the inherited `agents.craft.do` viewer is a
 * Craft-operated dependency, and uploading there silently is forbidden
 * (Decision P8, spec R2-C3). Online sharing is therefore disabled until the
 * user points FLEET_SHARE_VIEWER_URL at a viewer deployment they own
 * (`app/apps/viewer/` is self-hostable). Read at call time so tests and
 * long-lived processes see environment changes.
 */
export function getShareViewerUrl(): string | null {
  return process.env.FLEET_SHARE_VIEWER_URL?.trim() || null;
}
