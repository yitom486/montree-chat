// @vitest-environment happy-dom
// 会话参数弹层：分组单选、回调、禁用态、非默认提示点。全部回调驱动，不含业务概念。
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatSettingsMenu, type ChatSetting } from '@yitom/chat-ui'

;(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

if (!(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver) {
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

function makeSettings(overrides: Partial<ChatSetting> = {}): ChatSetting[] {
  return [
    {
      id: 'approval',
      label: '审批',
      value: 'never',
      options: [
        { value: 'never', label: '自动批准' },
        { value: 'on-request', label: '按需询问' },
      ],
      onChange: () => {},
      ...overrides,
    },
    {
      id: 'effort',
      label: '思考深度',
      value: 'auto',
      options: [
        { value: 'auto', label: '运行时默认' },
        { value: 'high', label: '高' },
      ],
      onChange: () => {},
    },
  ]
}

describe('ChatSettingsMenu 会话参数', () => {
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
    return document.querySelector('[data-slot="chat-settings-menu"]')
  }

  async function render(props: Record<string, unknown>) {
    await act(async () => {
      root.render(createElement(ChatSettingsMenu, { settings: makeSettings(), open: true, ...props } as never))
    })
  }

  it('渲染标题、说明与分组选项', async () => {
    await render({})
    const node = popup()
    expect(node).not.toBeNull()
    expect(node!.textContent).toContain('会话参数')
    expect(node!.textContent).toContain('设置仅影响后续发送的消息')
    expect(node!.textContent).toContain('审批')
    expect(node!.textContent).toContain('按需询问')
    expect(node!.textContent).toContain('思考深度')
  })

  it('当前值标记 aria-checked，点击切换回调', async () => {
    const onChange = vi.fn()
    await render({ settings: makeSettings({ onChange }) })
    const node = popup()!
    const radios = Array.from(node.querySelectorAll('[role="radio"]')) as HTMLElement[]
    const current = radios.find((r) => r.textContent?.includes('自动批准'))!
    expect(current.getAttribute('aria-checked')).toBe('true')

    const next = radios.find((r) => r.textContent?.includes('按需询问'))!
    await act(async () => {
      next.click()
    })
    expect(onChange).toHaveBeenCalledWith('on-request')
  })

  it('分组禁用时选项全部不可点', async () => {
    const onChange = vi.fn()
    await render({ settings: makeSettings({ disabled: true, onChange }) })
    const radios = Array.from(popup()!.querySelectorAll('[role="radio"]')) as HTMLButtonElement[]
    const approval = radios.filter((r) => r.textContent?.includes('批准') || r.textContent?.includes('询问'))
    expect(approval.length).toBeGreaterThan(0)
    expect(approval.every((r) => r.disabled)).toBe(true)
  })

  it('分组 hint 渲染在选项下方', async () => {
    await render({ settings: makeSettings({ hint: '运行时未探测到可用档位' }) })
    expect(popup()!.textContent).toContain('运行时未探测到可用档位')
  })

  it('非默认值且关闭时显示提示点', async () => {
    await act(async () => {
      root.render(createElement(ChatSettingsMenu, { settings: makeSettings(), nonDefault: true } as never))
    })
    const trigger = container.querySelector('button[aria-label="会话设置"]')!
    expect(trigger.querySelector('span[aria-hidden="true"]')).not.toBeNull()
  })
})
