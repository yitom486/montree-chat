// @vitest-environment happy-dom
// 空态组件：三段文案与操作槽位按需渲染。
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ChatEmptyState } from '@yitom/chat-ui'

;(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

describe('ChatEmptyState 空态', () => {
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

  it('渲染标题与说明，可选段落缺省不占位', async () => {
    await act(async () => {
      root.render(createElement(ChatEmptyState, { title: '开始与 Agent 对话' }))
    })
    expect(container.textContent).toContain('开始与 Agent 对话')
    expect(container.querySelectorAll('p').length).toBe(1)
  })

  it('图标、提示与操作按传入渲染', async () => {
    await act(async () => {
      root.render(
        createElement(ChatEmptyState, {
          title: '开始对话',
          description: '点击右上角连接运行时',
          hint: 'Enter 发送 · Shift+Enter 换行',
          action: createElement('button', { type: 'button' }, '连接'),
        }),
      )
    })
    expect(container.textContent).toContain('点击右上角连接运行时')
    expect(container.textContent).toContain('Shift+Enter 换行')
    const action = container.querySelector('button')
    expect(action?.textContent).toBe('连接')
  })
})
