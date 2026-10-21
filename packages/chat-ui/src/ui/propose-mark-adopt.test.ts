// @vitest-environment happy-dom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatMessageBubble } from './agent-message-bubble.js'
import type { ChatMessage as AcpChatMessage } from '@yitom/chat-core'

;(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const proposal = { id: 'p1', kind: 'note' as const, excerpt: '原文摘录', note: 'AI 原稿', source: 'agent' as const }
const message = {
  id: 'tool-1', role: 'tool', text: '', createdAt: 0,
  markProposal: proposal, markProposalStatus: 'pending',
} as unknown as AcpChatMessage

function setTextarea(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
  setter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('聊天气泡内批注提议「采用并保存」', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container) })
  afterEach(() => { act(() => root.unmount()); container.remove() })

  const render = (props: Record<string, unknown>) => act(() => {
    root.render(createElement(ChatMessageBubble, { message, pendingPermission: null, ...props } as never))
  })
  const expandAndEdit = async (value: string) => {
    const toggle = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('待确认'))!
    await act(async () => { toggle.click() })
    const textarea = container.querySelector('textarea')!
    await act(async () => { setTextarea(textarea, value) })
  }
  const adoptButton = () => Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '采用并保存')!

  it('把用户改过的批注交给宿主写库，成功后再落定 adopted', async () => {
    const resolveMarkProposal = vi.fn()
    const onAdoptMarkProposal = vi.fn().mockResolvedValue(undefined)
    await render({ resolveMarkProposal, onAdoptMarkProposal })
    await expandAndEdit('用户改过的批注')
    await act(async () => { adoptButton().click() })
    expect(onAdoptMarkProposal).toHaveBeenCalledWith(proposal, '用户改过的批注')
    expect(resolveMarkProposal).toHaveBeenCalledWith('p1', 'adopted')
  })

  it('写库失败时不落定，错误回宿主', async () => {
    const resolveMarkProposal = vi.fn()
    const onMarkProposalError = vi.fn()
    const onAdoptMarkProposal = vi.fn().mockRejectedValue(new Error('未找到摘录'))
    await render({ resolveMarkProposal, onAdoptMarkProposal, onMarkProposalError })
    await expandAndEdit('改')
    await act(async () => { adoptButton().click() })
    expect(resolveMarkProposal).not.toHaveBeenCalled()
    expect(onMarkProposalError).toHaveBeenCalled()
  })
})
