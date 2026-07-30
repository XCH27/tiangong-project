/**
 * Importing from other agent products.
 *
 * The obvious feature is "import your Claude / Cursor / Coze memories". Most
 * products ship it. It is the wrong thing to build here, and the reason is not
 * effort — it is that a foreign memory file is not a fact about you.
 *
 * Another product's curated memory is a set of claims *it* decided were durable,
 * distilled for *its* retrieval, phrased for *its* prompt, under assumptions
 * about what its agent could see and do. Loading those as memory imports a
 * different product's opinions and presents them as your history:
 *
 *   - **They encode a different tool surface.** "Prefers the terminal for file
 *     edits" is a fact about an agent that had a terminal and no file tools. It
 *     is not a preference; it is a workaround, and here it is wrong.
 *   - **They carry no evidence pointer this system can follow.** D5 requires
 *     every retained entry to point back into session evidence. A foreign entry
 *     points into a transcript that does not exist here, so it can never be
 *     checked, corrected, or argued with.
 *   - **They are already lossy.** Someone else's summariser threw away the
 *     context that would let this system decide whether the claim still holds.
 *
 * What *is* valuable is the raw history underneath: the conversations, the
 * project records, the decisions actually taken. That is evidence, and the
 * curator can derive Fleet-shaped claims from it with real source pointers.
 *
 * So the rule is: **history imports as an archive; memory does not import at
 * all.** A foreign memory file is accepted only as *reading material* the
 * curator may search and cite — never as entries.
 */

export type ForeignProduct =
  | 'claude'
  | 'cursor'
  | 'coze'
  | 'chatgpt'
  | 'other'

export type ForeignArtifactKind =
  /** Raw conversations. The valuable part. */
  | 'conversation-history'
  /** Project notes, specs, decisions written by a human. */
  | 'project-records'
  /**
   * The other product's distilled memory file. Accepted as a document to read,
   * never as entries to adopt.
   */
  | 'curated-memory'
  /** Rules or instructions written for that product's agent. */
  | 'agent-instructions'

export interface ForeignArtifact {
  product: ForeignProduct
  kind: ForeignArtifactKind
  locator: string
  label: string
}

export type ImportDisposition =
  /** Becomes a searchable archive; the curator mines it for patterns. */
  | 'archive-for-mining'
  /**
   * Readable as a document, quotable with attribution, never adopted as fact.
   * The user can ask "what did my old assistant think?" and get an answer that
   * is clearly a report about another product rather than this one's memory.
   */
  | 'read-only-reference'
  /** Refused. */
  | 'rejected'

export interface ImportPlan {
  disposition: ImportDisposition
  /** Shown before the import, so the user is not surprised by the outcome. */
  explanation: string
  /** True when the material is somebody's correspondence. */
  sensitive: boolean
}

/**
 * What happens to each kind of foreign artifact.
 *
 * Nothing imports *as memory*. The distinction the user sees is between material
 * that gets mined and material that only gets read, and both are honest about
 * being from somewhere else.
 */
export function planForeignImport(artifact: ForeignArtifact): ImportPlan {
  switch (artifact.kind) {
    case 'conversation-history':
    case 'project-records':
      return {
        disposition: 'archive-for-mining',
        explanation:
          'Imported as a searchable archive. Nothing is copied into memory; the '
          + 'curator finds recurring patterns and states them as new claims with '
          + 'pointers back to this archive.',
        sensitive: artifact.kind === 'conversation-history',
      }

    case 'curated-memory':
      return {
        disposition: 'read-only-reference',
        explanation:
          'Kept as a document from another product, not adopted as memory. Its '
          + 'claims were distilled for a different tool surface and carry no '
          + 'evidence this system can follow, so they are quotable with '
          + 'attribution but never treated as facts about you.',
        sensitive: false,
      }

    case 'agent-instructions':
      return {
        disposition: 'read-only-reference',
        explanation:
          'Kept as a document. Instructions written for another agent describe '
          + 'that agent’s capabilities, not your preferences, and applying them '
          + 'here would encode its workarounds as your rules.',
        sensitive: false,
      }

    default:
      return artifact.kind satisfies never
  }
}

/**
 * Never true. Present as an explicit, greppable answer so the next person to ask
 * "can we just import their memories?" finds the decision instead of the gap.
 */
export function mayAdoptAsMemory(_artifact: ForeignArtifact): false {
  return false
}

// ── Mining ──────────────────────────────────────────────────────────────────

export interface MinedClaim {
  /** A new sentence, written here. Never a passage lifted from the archive. */
  claim: string
  /** Locations in the archive that support it. */
  sources: readonly string[]
  /** How many independent occurrences back it. */
  occurrences: number
  /** Which archive it came from, so it can be re-derived or dropped wholesale. */
  archiveId: string
}

/**
 * Three occurrences, and the claim must not be a quote.
 *
 * The threshold matches tool facts for the same reason: two is a coincidence.
 * The quote check matters more here — lifting a sentence out of somebody's chat
 * log and storing it as memory is the exact failure this whole module exists to
 * prevent, and it is an easy one to commit by accident when the source phrasing
 * is already good.
 */
export const MINED_CLAIM_MIN_OCCURRENCES = 3

export function isAdmissibleMinedClaim(input: {
  claim: MinedClaim
  /** Passages the claim was derived from, for the quote check. */
  sourceExcerpts: readonly string[]
}): boolean {
  if (input.claim.sources.length === 0) return false
  if (input.claim.occurrences < MINED_CLAIM_MIN_OCCURRENCES) return false

  const normalized = input.claim.claim.trim().toLowerCase()
  if (normalized.length === 0) return false

  // A claim that appears verbatim in the source is a quote wearing a claim's
  // clothes.
  return !input.sourceExcerpts.some((excerpt) => excerpt.trim().toLowerCase().includes(normalized))
}

/**
 * Dropping an archive drops what was derived from it.
 *
 * Mined claims keep `archiveId` so removing an import is complete: a claim whose
 * evidence has been deleted cannot be checked, and leaving it behind turns a
 * revocable import into a permanent one.
 */
export function claimsToRemoveWithArchive(
  claims: readonly MinedClaim[],
  archiveId: string,
): readonly MinedClaim[] {
  return claims.filter((claim) => claim.archiveId === archiveId)
}
