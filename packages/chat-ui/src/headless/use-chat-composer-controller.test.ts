// @vitest-environment happy-dom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatComposerController, type ChatComposerControllerOptions } from './use-chat-composer-controller.js'

;(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

describe('controlled composer', () => {
  let host: HTMLDivElement, root: Root
  let controller: ReturnType<typeof useChatComposerController>
  const send = vi.fn(), change = vi.fn(), stop = vi.fn()
  function Harness(props: ChatComposerControllerOptions) {
    controller = useChatComposerController(props)
    return createElement('textarea', { ref: controller.textareaRef, defaultValue: props.value })
  }
  async function mount(props: Partial<ChatComposerControllerOptions> = {}) {
    await act(async () => root.render(createElement(Harness, { value: 'draft', onValueChange: change, onSubmit: send, onStop: stop, ...props })))
  }
  beforeEach(() => {
    vi.resetAllMocks()
    host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  })
  afterEach(() => { act(() => root.unmount()); host.remove() })
  it('sends controlled value once and asks the owner to clear only after acceptance', async () => {
    await mount()
    expect(controller!.submit()).toBe(true)
    expect(send).toHaveBeenCalledExactlyOnceWith('draft')
    expect(change).toHaveBeenCalledExactlyOnceWith('')
    send.mockReturnValue(false); change.mockClear()
    expect(controller!.submit()).toBe(false)
    expect(change).not.toHaveBeenCalled()
  })
  it('guards disabled/running/blank and permits attachment-only payloads', async () => {
    for (const props of [{ disabled: true }, { running: true }, { value: '  ' }]) {
      await mount(props); expect(controller!.canSend).toBe(false); expect(controller!.submit()).toBe(false)
    }
    expect(send).not.toHaveBeenCalled()
    await mount({ value: '', hasAttachments: true }); expect(controller!.submit()).toBe(true)
    expect(send).toHaveBeenCalledExactlyOnceWith('')
  })
  it('stop remains available during a run even when sending is disabled', async () => {
    await mount(); controller!.stop(); expect(stop).not.toHaveBeenCalled()
    await mount({ running: true, disabled: true }); controller!.stop()
    expect(stop).toHaveBeenCalledTimes(1); expect(send).not.toHaveBeenCalled()
  })
  it('focuses the current input at its end and cancels pending focus on unmount', async () => {
    const callbacks = new Map<number, FrameRequestCallback>(); let id = 0
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(fn => { callbacks.set(++id, fn); return id })
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(n => { callbacks.delete(n) })
    await mount(); controller!.focusEnd(); controller!.focusEnd()
    expect(callbacks.size).toBe(1)
    callbacks.get(id)!(0)
    expect(document.activeElement).toBe(host.querySelector('textarea'))
    expect(host.querySelector('textarea')!.selectionStart).toBe(5)
    controller!.focusEnd()
    act(() => root.unmount())
    expect(cancel).toHaveBeenCalledWith(id)
    root = createRoot(host)
    vi.restoreAllMocks()
  })
})
