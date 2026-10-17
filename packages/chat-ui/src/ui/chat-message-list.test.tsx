// @vitest-environment happy-dom
// `ChatMessageList` 行为测试（C6）：窗口边界、快照线程绑定、卸载清理、
// 根 DOM 透传、空态/孤立审批/回到底部。只从 barrel 取组件，消息用 `chat-core` 真结构。
import { act, createElement, createRef, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatMessageList, type ChatMessageListHandle, type ChatScrollSnapshot } from '@yitom/chat-ui'
import type { ChatMessage } from '@yitom/chat-core'

;(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@streamdown/mermaid', () => ({ createMermaidPlugin: () => ({
  name: 'mermaid', type: 'diagram', language: 'mermaid',
  getMermaid: () => ({ initialize() {}, render: async () => ({ svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>A to B</text></svg>' }) }),
}) }))

function makeMessages(count: number, prefix = 'm'): ChatMessage[] {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, '0')
    return {
      id: `${prefix}${n}`,
      role: i % 2 === 0 ? 'user' : 'agent',
      text: `正文${prefix}${n}`,
      createdAt: 1000 + i,
    }
  }) as ChatMessage[]
}

describe('ChatMessageList 通用列表', () => {
  let container: HTMLDivElement
  let root: Root
  let skipUnmount = false

  beforeEach(() => {
    skipUnmount = false
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    if (!skipUnmount) {
      act(() => {
        root.unmount()
      })
    }
    container.remove()
  })

  async function renderList(props: {
    messages?: ChatMessage[]
    threadId?: string
    initialScroll?: ChatScrollSnapshot | null
    onScrollSnapshot?: (threadId: string, snapshot: ChatScrollSnapshot) => void
    emptyState?: React.ReactNode
    pendingPermission?: { requestId: number; toolCallId?: string; summary: string; options: [] } | null
    listRef?: React.RefObject<ChatMessageListHandle | null>
  } = {}) {
    await act(async () => {
      root.render(
        createElement(ChatMessageList, {
          messages: props.messages ?? makeMessages(12),
          threadId: props.threadId ?? 't1',
          resolveMarkProposal: () => {},
          initialScroll: props.initialScroll,
          onScrollSnapshot: props.onScrollSnapshot,
          emptyState: props.emptyState,
          pendingPermission: props.pendingPermission ?? null,
          ref: props.listRef,
        }),
      )
    })
  }

  function viewport(): HTMLElement {
    const el = container.querySelector('[data-testid="chat-viewport"]')
    if (!(el instanceof HTMLElement)) throw new Error('viewport 缺失')
    return el
  }

  function loadMoreButton(): HTMLElement | null {
    return container.querySelector('[data-testid="chat-load-more"]')
  }

  it('12 条初次只看末 5 条，按钮显示剩余 7 条', async () => {
    await renderList()
    const text = container.textContent ?? ''
    expect(text).toContain('正文m12')
    expect(text).toContain('正文m08')
    expect(text).not.toContain('正文m07')
    expect(loadMoreButton()?.textContent).toContain('还剩 7 条')
  })

  it('点加载更早补 5 条，再点全量后按钮消失', async () => {
    await renderList()
    const click = async () => {
      await act(async () => {
        loadMoreButton()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
    }
    await click()
    let text = container.textContent ?? ''
    expect(text).toContain('正文m03')
    expect(text).not.toContain('正文m02')
    expect(loadMoreButton()?.textContent).toContain('还剩 2 条')
    await click()
    text = container.textContent ?? ''
    expect(text).toContain('正文m01')
    expect(loadMoreButton()).toBeNull()
  })

  it('离底快照恢复冻结窗口：滚动事件后起点固定', async () => {
    await renderList({
      initialScroll: { scrollTop: 123, pinned: false, windowStart: 2, windowCount: 10 },
    })
    // happy-dom 无排版：手动给几何量并派发滚动，让 checkNearBottom 判定离底
    const el = viewport()
    Object.defineProperty(el, 'scrollHeight', { value: 3000, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 500, configurable: true })
    el.scrollTop = 123
    await act(async () => {
      el.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
    const text = container.textContent ?? ''
    expect(text).toContain('正文m03')
    expect(text).toContain('正文m12')
    expect(text).not.toContain('正文m02')
    expect(loadMoreButton()?.textContent).toContain('还剩 2 条')
  })

  it('滚动快照携带绑定线程 id，卸载后不再通知', async () => {
    const seen: Array<[string, ChatScrollSnapshot]> = []
    await renderList({ onScrollSnapshot: (id, snap) => { seen.push([id, snap]) } })
    const el = viewport()
    Object.defineProperty(el, 'scrollHeight', { value: 3000, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 500, configurable: true })
    await act(async () => {
      el.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every(([id]) => id === 't1')).toBe(true)
    const count = seen.length
    await act(async () => {
      root.unmount()
    })
    skipUnmount = true
    // 监听已清理： detached 节点与 window 再派发滚动不再通知
    el.dispatchEvent(new Event('scroll', { bubbles: true }))
    window.dispatchEvent(new Event('scroll'))
    expect(seen).toHaveLength(count)
  })

  it('StrictMode 挂载卸载干净：无残留滚动通知', async () => {
    const seen: Array<[string, ChatScrollSnapshot]> = []
    await act(async () => {
      root.render(
        createElement(StrictMode, null,
          createElement(ChatMessageList, {
            messages: makeMessages(3),
            threadId: 'strict',
            resolveMarkProposal: () => {},
            onScrollSnapshot: (id, snap) => { seen.push([id, snap]) },
          }),
        ),
      )
    })
    await act(async () => {
      root.unmount()
    })
    skipUnmount = true
    container.dispatchEvent(new Event('scroll', { bubbles: true }))
    window.dispatchEvent(new Event('scroll'))
    expect(seen).toHaveLength(0)
  })

  it('根 DOM 透传：asChild 外壳注入的 onContextMenu 落在根 div', async () => {
    const onContextMenu = vi.fn()
    await act(async () => {
      root.render(
        createElement(ChatMessageList, {
          messages: makeMessages(2),
          threadId: 't1',
          resolveMarkProposal: () => {},
          onContextMenu,
        }),
      )
    })
    const rootDiv = container.querySelector('[data-acp-probe="message-list"]')?.parentElement
    expect(rootDiv?.className).toContain('flex-1')
    await act(async () => {
      rootDiv!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    })
    expect(onContextMenu).toHaveBeenCalledTimes(1)
  })

  it('空态渲染宿主传入的 emptyState', async () => {
    await renderList({ messages: [], emptyState: createElement('p', null, '开始与 Tester 对话') })
    expect(container.textContent).toContain('开始与 Tester 对话')
    expect(loadMoreButton()).toBeNull()
  })

  it('孤立审批只出现一次，不重复', async () => {
    await renderList({
      messages: makeMessages(2),
      pendingPermission: { requestId: 7, toolCallId: 'ghost-tool', summary: '需要批准', options: [] },
    })
    expect(container.querySelectorAll('[data-testid="agent-permission-card"]')).toHaveLength(1)
  })

  it('流式追加不抢冻结窗口，回到底部句柄恢复跟随', async () => {
    const listRef = createRef<ChatMessageListHandle>()
    const frozen: ChatScrollSnapshot = { scrollTop: 123, pinned: false, windowStart: 2, windowCount: 10 }
    const renderGrown = async (msgs: ChatMessage[]) => {
      await act(async () => {
        root.render(
          createElement(ChatMessageList, {
            messages: msgs,
            threadId: 't1',
            resolveMarkProposal: () => {},
            initialScroll: frozen,
            ref: listRef,
          }),
        )
      })
    }
    await renderGrown(makeMessages(12))
    // happy-dom 无排版：手动给几何量并派发滚动，进入离底冻结 [m03..m12]
    const el = viewport()
    Object.defineProperty(el, 'scrollHeight', { value: 3000, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 500, configurable: true })
    el.scrollTop = 123
    await act(async () => {
      el.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
    // 明确上滑意图后新提问到达：冻结窗口不移位，新消息被截住
    await act(async () => {
      viewport().dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 }))
    })
    await renderGrown([...makeMessages(12), { id: 'm13', role: 'agent', text: '流式回答m13', streaming: true, createdAt: 2000 } as ChatMessage])
    expect(container.textContent).not.toContain('流式回答m13')
    // 经句柄回到底部：窗口恢复底锚，新消息可见
    await act(async () => {
      listRef.current?.scrollToBottom()
    })
    expect(container.textContent).toContain('流式回答m13')
    const btn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('回到底部'))
    expect(btn).toBeDefined()
  })
  it('首次恢复直接显示保存窗口，不等待 scroll 事件', async () => {
    await renderList({ initialScroll: { scrollTop: 500, pinned: false, windowStart: 2, windowCount: 5 } })
    expect(container.textContent).toContain('正文m03')
    expect(container.textContent).toContain('正文m07')
    expect(container.textContent).not.toContain('正文m12')
  })

  it('上翻后主动发送新提问恢复最新窗口', async () => {
    const initialScroll = { scrollTop: 500, pinned: false, windowStart: 2, windowCount: 5 }
    await renderList({ initialScroll })
    const el = viewport()
    Object.defineProperty(el, 'scrollHeight', { value: 3000, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 500, configurable: true })
    el.scrollTop = 500
    await act(async () => {
      el.dispatchEvent(new Event('scroll', { bubbles: true }))
      el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -100 }))
    })
    await renderList({ initialScroll, messages: [...makeMessages(12), {
      id: 'm13', role: 'user', text: '主动新提问', createdAt: 2000,
    }] })
    expect(container.textContent).toContain('主动新提问')
  })

  it('卸载取消已排队的历史分页帧', async () => {
    await renderList()
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(98765)
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    try {
      viewport().dispatchEvent(new Event('scroll', { bubbles: true }))
      expect(raf).toHaveBeenCalled()
      await act(async () => { root.unmount() })
      skipUnmount = true
      expect(cancel).toHaveBeenCalledWith(98765)
    } finally {
      raf.mockRestore()
      cancel.mockRestore()
    }
  })

})
