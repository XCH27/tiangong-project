/**
 * Return whether an @ character should open the mention menu.
 *
 * Kept independent from the rendered menu so keyboard/parser tests do not
 * load the PDF and attachment component graph just to exercise this predicate.
 */
export function isValidMentionTrigger(textBeforeCursor: string, atPosition: number): boolean {
  if (atPosition < 0) return false
  if (atPosition === 0) return true
  const charBefore = textBeforeCursor[atPosition - 1]
  if (charBefore === undefined) return false
  return /\s/.test(charBefore) || /[("']/.test(charBefore)
}
