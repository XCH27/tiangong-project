/**
 * W0.1 text freeze — ArtifactRef / EntityRef
 * Freeze id: w0.1-doc-freeze-2026-07-10 (artifact)
 * Source: docs/contracts/composable-workspace-contracts.md §2
 * Lead-owned. Port to packages/shared/src/protocol/ on clean v0.11 base only.
 */

export type SemVer = string
export type JsonSchemaRef = string

export type EntityRef = {
  entityKind:
    | 'artifact'
    | 'capability'
    | 'workflow'
    | 'workflow_step'
    | 'native_document'
    | 'job'
    | 'session_event'
  entityId: string
  version?: string
  ownerModuleId: string
}

export type ArtifactKind =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'web_project'
  | 'presentation'
  | 'design_document'
  | 'media_project'
  | 'evidence'
  | 'file'

export type ArtifactSensitivity = 'public' | 'workspace' | 'restricted'

export type ArtifactRef = {
  artifactId: string
  versionId: string
  kind: ArtifactKind
  mediaType: string
  ownerModuleId: string
  /** Opaque storage handle resolved by M05 / native owner — never raw unrestricted path to untrusted callers */
  storageRef: string
  contentHash?: string
  nativeSchema?: string
  provenanceRef: string
  parentRefs: Array<{ artifactId: string; versionId: string }>
  licenseRef?: string
  sensitivity: ArtifactSensitivity
  previewRef?: string
}
