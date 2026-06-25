export type GitFileChangeKind =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'untracked'
  | 'conflicted'
  | 'unknown'

export interface GitFileStatus {
  path: string
  oldPath?: string
  indexStatus: string
  workingTreeStatus: string
  kind: GitFileChangeKind
  staged: boolean
  unstaged: boolean
  untracked: boolean
  additions?: number
  deletions?: number
}

export interface GitBranchSummary {
  name: string
  current: boolean
}

export interface GitHubCliStatus {
  ghInstalled: boolean
  authenticated: boolean
  username?: string
  error?: string
}

export interface GitRemoteSummary {
  name: string
  url: string
  githubRepository?: string
}

export interface GitReviewState {
  isGitRepository: boolean
  rootPath: string
  repositoryRoot?: string
  currentBranch?: string
  files: GitFileStatus[]
  branches: GitBranchSummary[]
  remotes: GitRemoteSummary[]
  github: GitHubCliStatus
  totals: {
    files: number
    staged: number
    unstaged: number
    untracked: number
    additions: number
    deletions: number
  }
  error?: string
}

export interface GitFileDiffResult {
  path: string
  diff: string
  binary: boolean
  tooLarge: boolean
}
