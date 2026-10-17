import { useCallback, useEffect, useRef } from 'react'

/** Controlled composer state only; the visual textarea owns its sole IME/Enter handler. */
export interface ChatComposerControllerOptions {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  running?: boolean
  hasAttachments?: boolean
  /** Return false when payload validation rejects the send; keep the draft intact. */
  onSubmit: (value: string) => boolean | void
  onStop: () => void
}

/** No transport, attachments, store, or keyboard listener: hosts provide those through callbacks. */
export function useChatComposerController({
  value, onValueChange, disabled = false, running = false,
  hasAttachments = false, onSubmit, onStop,
}: ChatComposerControllerOptions) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const focusFrame = useRef<number | null>(null)
  const canSend = !disabled && !running && (value.trim().length > 0 || hasAttachments)
  const submit = useCallback(() => {
    if (!canSend) return false
    if (onSubmit(value) === false) return false
    onValueChange('')
    return true
  }, [canSend, onSubmit, onValueChange, value])
  const stop = useCallback(() => {
    if (running) onStop()
  }, [running, onStop])
  const focusEnd = useCallback(() => {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current)
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null
      const input = textareaRef.current
      if (!input || input.disabled) return
      input.focus({ preventScroll: true })
      try { input.setSelectionRange(input.value.length, input.value.length) } catch { /* Unsupported selection. */ }
    })
  }, [])
  useEffect(() => () => {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current)
  }, [])
  return { canSend, submit, stop, textareaRef, focusEnd }
}
