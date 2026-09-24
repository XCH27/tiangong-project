/** Extract a bounded, human-readable provider error without logging raw token responses. */
export function formatOAuthTokenError(operation: string, status: number, body: string): string {
  let detail = ''
  try {
    const payload: unknown = JSON.parse(body)
    if (payload && typeof payload === 'object') {
      const fields = payload as Record<string, unknown>
      const nested = fields.error && typeof fields.error === 'object'
        ? fields.error as Record<string, unknown>
        : null
      const description = [
        fields.error_description,
        nested?.message,
        nested?.description,
        fields.message,
      ].find((value): value is string => typeof value === 'string' && value.trim().length > 0)
      const code = [fields.error, nested?.code, nested?.type]
        .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
      detail = [code, description].filter((value, index, values) =>
        value && values.indexOf(value) === index
      ).join(': ')
    }
  } catch {
    // Unstructured responses may contain HTML or credential-bearing query text.
  }

  const safeDetail = detail.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 400)
  return `${operation} failed (HTTP ${status})${safeDetail ? `: ${safeDetail}` : ''}`
}
