import { describe, expect, it } from 'vitest'
import { isProposalPromotedToAgent } from './mark-promotion.js'
import type { ChatMessage } from './chat-message.js'
import { toProposedMark } from '@yitom/annotations'

describe('mark-promotion', () => {
  it('isProposalPromotedToAgent 检测已挂载', () => {
    const proposal = toProposedMark({ id: 'p1', excerpt: '', note: 'x', source: 'agent' })
    const messages: ChatMessage[] = [
      {
        id: 'a1',
        role: 'agent',
        text: 'ok',
        createdAt: 1,
        markProposals: [{ proposal, status: 'pending' }],
      },
    ]
    expect(isProposalPromotedToAgent(messages, 'p1')).toBe(true)
  })
})

describe('attachMarkProposalsToCurrentTurn 按 toolCallId 关联', () => {
  const tool = (id: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
    id, role: 'tool', text: '', createdAt: 2, toolCallId: id, toolTitle: 'montree_propose_mark', toolStatus: 'completed', ...extra,
  })
  const content = (excerpt: string, toolCallId?: string) =>
    JSON.stringify({ proposed: true, excerpt, note: `笔记:${excerpt}`, message: 'm', ...(toolCallId ? { toolCallId } : {}) })
  const base = (): ChatMessage[] => [
    { id: 'u', role: 'user', text: 'go', createdAt: 1 },
    tool('call-a'),
    tool('call-b'),
  ]

  it('快照带 toolCallId 时挂到对应调用，而不是最新一条', async () => {
    const { attachMarkProposalsToCurrentTurn } = await import('./mark-promotion.js')
    const r = attachMarkProposalsToCurrentTurn(base(), content('甲', 'call-a'))
    expect(r.attached).toBe(true)
    expect(r.messages[1]!.markProposal?.excerpt).toBe('甲')
    expect(r.messages[2]!.markProposal).toBeUndefined()
  })

  it('toolCallId 无匹配时不乱挂', async () => {
    const { attachMarkProposalsToCurrentTurn } = await import('./mark-promotion.js')
    const r = attachMarkProposalsToCurrentTurn(base(), content('甲', 'call-x'))
    expect(r.attached).toBe(false)
  })

  it('无 toolCallId 时优先已回显同一结果的调用', async () => {
    const { attachMarkProposalsToCurrentTurn } = await import('./mark-promotion.js')
    const c = content('乙')
    const messages = base()
    messages[1] = tool('call-a', { toolContentText: c })
    const r = attachMarkProposalsToCurrentTurn(messages, c)
    expect(r.messages[1]!.markProposal?.excerpt).toBe('乙')
    expect(r.messages[2]!.markProposal).toBeUndefined()
  })
})
