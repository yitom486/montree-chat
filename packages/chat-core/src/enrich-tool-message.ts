import type { ChatMessage } from './chat-message.js'
import { isToolActiveStatus } from './chat-message.js'
import { enrichToolMessageWithChapterPlan } from './parse-chapter-mark-plan.js'
import { enrichToolMessageWithMarkProposal } from './parse-mark-proposal.js'
import { enrichToolMessageWithPresentResult } from './parse-present-result.js'

/** tool 消息 enrich：批注提议 + 章级建议 + 呈现结果。 */
export function enrichAcpToolMessage(message: ChatMessage): ChatMessage {
  return enrichToolMessageWithPresentResult(
    enrichToolMessageWithChapterPlan(
      enrichToolMessageWithMarkProposal(message, isToolActiveStatus),
      isToolActiveStatus,
    ),
    isToolActiveStatus,
  )
}
