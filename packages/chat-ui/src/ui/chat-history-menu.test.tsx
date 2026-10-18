// @vitest-environment happy-dom
// 会话历史弹层：列表、空态、选中、新建与行内操作。全部走回调，不依赖宿主。
import { act, createElement, Fragment } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatHistoryMenu, type ChatHistoryEntry } from '@yitom/chat-ui'

;(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// Base UI 浮层需要布局观测，happy-dom 没有：给个空实现即可（不改产品代码）
if (!(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver) {
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

const entries: ChatHistoryEntry[] = [
  { id: 's1', title: '日语助词辨析', timestamp: 1_700_000_000 },
  { id: 's2', title: '英语长难句', subtitle: '昨天' },
]

describe('ChatHistoryMenu 会话历史', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  function popup(): HTMLElement | null {
    return document.querySelector('[data-slot="chat-history-menu"]')
  }

  async function render(props: Record<string, unknown>) {
    await act(async () => {
      root.render(
        createElement(ChatHistoryMenu, { entries, onSelect: () => {}, open: true, ...props } as never),
      )
    })
  }

  it('打开后列出条目与时间/说明', async () => {
    await render({})
    const node = popup()
    expect(node).not.toBeNull()
    expect(node!.textContent).toContain('日语助词辨析')
    expect(node!.textContent).toContain('英语长难句')
    expect(node!.textContent).toContain('昨天')
  })

  it('空列表显示空态文案', async () => {
    await render({ entries: [], emptyText: '还没有会话' })
    expect(popup()?.textContent).toContain('还没有会话')
  })

  it('点击条目回调 onSelect，点击新建回调 onCreate', async () => {
    const onSelect = vi.fn()
    const onCreate = vi.fn()
    await render({ onSelect, onCreate })
    const node = popup()!
    const item = Array.from(node.querySelectorAll('button')).find((b) => b.textContent?.includes('日语助词辨析'))
    await act(async () => {
      item!.click()
    })
    expect(onSelect).toHaveBeenCalledWith('s1')

    const create = Array.from(node.querySelectorAll('button')).find((b) => b.textContent === '新建')
    await act(async () => {
      create!.click()
    })
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it('未提供行内回调时不渲染压缩/分叉/归档', async () => {
    await render({})
    const node = popup()!
    expect(node.querySelector('button[aria-label="压缩上下文"]')).toBeNull()
    expect(node.querySelector('button[aria-label="归档会话"]')).toBeNull()
  })

  it('行内操作回调各自带条目 id', async () => {
    const onCompact = vi.fn()
    const onFork = vi.fn()
    const onArchive = vi.fn()
    await render({ onCompact, onFork, onArchive })
    const node = popup()!
    for (const [label, spy] of [
      ['压缩上下文', onCompact],
      ['分叉会话', onFork],
      ['归档会话', onArchive],
    ] as const) {
      const buttons = node.querySelectorAll<HTMLButtonElement>(`button[aria-label="${label}"]`)
      expect(buttons.length).toBe(entries.length)
      await act(async () => {
        buttons[0]!.click()
      })
      expect(spy).toHaveBeenCalledWith('s1')
    }
  })

  it('busy 时禁用行内操作，底部插槽照常渲染', async () => {
    const onArchive = vi.fn()
    await render({ onArchive, busy: true, footer: createElement(Fragment, null, '保留新会话') })
    const node = popup()!
    const archive = node.querySelector<HTMLButtonElement>('button[aria-label="归档会话"]')!
    expect(archive.disabled).toBe(true)
    expect(node.textContent).toContain('保留新会话')
  })
})
