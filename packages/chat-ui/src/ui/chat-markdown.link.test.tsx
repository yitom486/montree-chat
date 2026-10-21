// @vitest-environment happy-dom
// Markdown 外链拦截：桌面宿主必须能接管，否则 webview 会就地导航。
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatMarkdown, ChatUiProvider } from '@yitom/chat-ui'

;(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

describe('ChatMarkdown 外链', () => {
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

  async function render(props: Record<string, unknown>) {
    await act(async () => {
      root.render(createElement(ChatMarkdown, { text: '[示例](https://example.com/a)', streaming: false, ...props }))
    })
  }

  function clickAnchor(): boolean {
    const anchor = container.querySelector('a')
    if (!anchor) throw new Error('没有渲染出链接')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    return anchor.dispatchEvent(event)
  }

  it('宿主接管时阻止默认行为并收到 href', async () => {
    const onLinkClick = vi.fn(() => true)
    await render({ onLinkClick })
    const notPrevented = clickAnchor()
    expect(onLinkClick).toHaveBeenCalledWith('https://example.com/a')
    expect(notPrevented).toBe(false)
  })

  it('宿主返回 false 时保留默认行为', async () => {
    const onLinkClick = vi.fn(() => false)
    await render({ onLinkClick })
    const notPrevented = clickAnchor()
    expect(onLinkClick).toHaveBeenCalledTimes(1)
    expect(notPrevented).toBe(true)
  })

  it('未提供拦截时行为与旧版一致', async () => {
    await render({})
    const notPrevented = clickAnchor()
    expect(notPrevented).toBe(true)
  })

  it('未传 onLinkClick 时继承外层 ChatUiProvider（不被空值覆盖）', async () => {
    const onLinkClick = vi.fn(() => true)
    await act(async () => {
      root.render(createElement(ChatUiProvider, { value: { onLinkClick }, children: createElement(ChatMarkdown, { text: '[示例](https://example.com/a)', streaming: false }) }))
    })
    const notPrevented = clickAnchor()
    expect(onLinkClick).toHaveBeenCalledWith('https://example.com/a')
    expect(notPrevented).toBe(false)
  })
})
