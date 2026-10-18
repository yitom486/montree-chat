// @vitest-environment happy-dom
// `ChatComposer` 形态与键盘语义：Enter 发送、Shift+Enter 换行、IME 不误发、停止按钮。
import { act, createElement, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatComposer } from '@yitom/chat-ui'

;(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

function Harness({ onSubmit, running = false, onStop }: {
  onSubmit: (value: string) => void | boolean
  running?: boolean
  onStop?: () => void
}) {
  const [value, setValue] = useState('')
  return createElement(ChatComposer, {
    value,
    onValueChange: setValue,
    onSubmit,
    running,
    ...(onStop ? { onStop } : {}),
  })
}

describe('ChatComposer 输入区', () => {
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

  function textarea(): HTMLTextAreaElement {
    const el = container.querySelector('textarea')
    if (!(el instanceof HTMLTextAreaElement)) throw new Error('textarea 缺失')
    return el
  }

  async function type(value: string) {
    await act(async () => {
      const el = textarea()
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
      setter?.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  function press(key: string, init: KeyboardEventInit = {}) {
    textarea().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
  }

  it('Enter 发送并清空草稿', async () => {
    const onSubmit = vi.fn()
    await act(async () => {
      root.render(createElement(Harness, { onSubmit }))
    })
    await type('你好')
    await act(async () => {
      press('Enter')
    })
    expect(onSubmit).toHaveBeenCalledWith('你好')
    expect(textarea().value).toBe('')
  })

  it('Shift+Enter 换行不发送', async () => {
    const onSubmit = vi.fn()
    await act(async () => {
      root.render(createElement(Harness, { onSubmit }))
    })
    await type('第一行')
    await act(async () => {
      press('Enter', { shiftKey: true })
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('输入法组合中 Enter 不发送', async () => {
    const onSubmit = vi.fn()
    await act(async () => {
      root.render(createElement(Harness, { onSubmit }))
    })
    await type('にほんご')
    await act(async () => {
      press('Enter', { isComposing: true })
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('空白草稿不可发送', async () => {
    const onSubmit = vi.fn()
    await act(async () => {
      root.render(createElement(Harness, { onSubmit }))
    })
    const send = container.querySelector('button[aria-label="发送"]') as HTMLButtonElement
    expect(send.disabled).toBe(true)
  })

  it('运行中显示停止并回调 onStop', async () => {
    const onStop = vi.fn()
    await act(async () => {
      root.render(createElement(Harness, { onSubmit: () => {}, running: true, onStop }))
    })
    const stop = container.querySelector('button[aria-label="停止生成"]') as HTMLButtonElement
    expect(stop).not.toBeNull()
    await act(async () => {
      stop.click()
    })
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it('运行中仍可追加引导（Enter 发送）', async () => {
    const onSubmit = vi.fn()
    await act(async () => {
      root.render(createElement(Harness, { onSubmit, running: true, onStop: () => {} }))
    })
    await type('补充一句')
    await act(async () => {
      press('Enter')
    })
    expect(onSubmit).toHaveBeenCalledWith('补充一句')
  })
})
