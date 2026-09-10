export type ConfirmedBrowserActionResult =
  | { ok: true }
  | { ok: false; error: unknown }

/** Apply renderer state only after the native BrowserPane action confirms. */
export async function runConfirmedBrowserAction(
  action: () => Promise<unknown>,
  onConfirmed: () => void,
): Promise<ConfirmedBrowserActionResult> {
  try {
    await action()
    onConfirmed()
    return { ok: true }
  } catch (error) {
    return { ok: false, error }
  }
}

export function getBrowserActionErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
