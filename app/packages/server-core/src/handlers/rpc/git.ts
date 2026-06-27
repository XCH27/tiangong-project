/**
 * Git review RPC — workspace status, file list, and per-file diff for review UI.
 * LOCAL_ONLY; read-only git operations via GitReviewService.
 */

import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { GitReviewService } from '../../services/git-review-service'

const gitReview = new GitReviewService()

export function registerGitHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(RPC_CHANNELS.git.GET_REVIEW, async (_ctx, dirPath: string) => {
    return gitReview.getReviewState(dirPath)
  })

  server.handle(
    RPC_CHANNELS.git.GET_FILE_DIFF,
    async (_ctx, dirPath: string, filePath: string) => {
      return gitReview.getFileDiff(dirPath, filePath)
    },
  )
}
