import { describe, expect, it, vi } from 'vitest'
import { createChatTurnController, type ChatTurnOperation } from './turn-controller.js'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function operation(overrides: Partial<ChatTurnOperation<string, string>> = {}): ChatTurnOperation<string, string> {
  return {
    prepare: vi.fn(() => 'thread-a'), isCurrent: () => true,
    execute: vi.fn(async () => 'ok'), onResult: vi.fn(), onError: vi.fn(), ...overrides,
  }
}

describe('createChatTurnController', () => {
  it('locks synchronously before prepare, including two concurrent callers', async () => {
    const controller = createChatTurnController()
    const ready = deferred<string>()
    const op = operation({ prepare: vi.fn(() => ready.promise) })
    const first = controller.send(op)
    expect(await controller.send(op)).toBe(false)
    expect(op.prepare).toHaveBeenCalledTimes(1)
    ready.resolve('thread-a')
    expect(await first).toBe(true)
    expect(op.execute).toHaveBeenCalledTimes(1)
    expect(op.onResult).toHaveBeenCalledWith('thread-a', 'ok')
  })

  it('checks identity after preparing; never sends to a replaced target', async () => {
    const controller = createChatTurnController()
    const ready = deferred<string>()
    let current = true
    const op = operation({ prepare: () => ready.promise, isCurrent: () => current })
    const first = controller.send(op)
    current = false
    ready.resolve('thread-a')
    expect(await first).toBe(false)
    expect(op.execute).not.toHaveBeenCalled()
    expect(await controller.send(operation())).toBe(true)
  })

  it.each(['thread', 'runtime', 'session'])('late result after %s replacement has no business effects', async () => {
    const controller = createChatTurnController()
    const result = deferred<string>()
    let current = true
    const op = operation({ execute: () => result.promise, isCurrent: () => current })
    const first = controller.send(op)
    await Promise.resolve()
    current = false
    result.resolve('late')
    await first
    expect(op.onResult).not.toHaveBeenCalled()
    expect(op.onError).not.toHaveBeenCalled()
    expect(await controller.send(operation())).toBe(true)
  })

  it('prepare failure releases the lock for retry and reports failure', async () => {
    const controller = createChatTurnController()
    const error = new Error('connect rejected')
    const op = operation({ prepare: async () => { throw error } })
    expect(await controller.send(op)).toBe(false)
    expect(op.onError).toHaveBeenCalledWith(null, error)
    expect(await controller.send(operation())).toBe(true)
  })

  it('transport rejection releases the lock and reports failure against its target', async () => {
    const controller = createChatTurnController()
    const error = new Error('transport rejected')
    const op = operation({ execute: async () => { throw error } })
    expect(await controller.send(op)).toBe(false)
    expect(op.onError).toHaveBeenCalledWith('thread-a', error)
    expect(await controller.send(operation())).toBe(true)
  })

  it('stale rejected transport never reports into the new target', async () => {
    const controller = createChatTurnController()
    const result = deferred<string>()
    let current = true
    const op = operation({ execute: () => result.promise, isCurrent: () => current })
    const first = controller.send(op)
    await Promise.resolve()
    current = false
    result.reject(new Error('old transport'))
    await first
    expect(op.onError).not.toHaveBeenCalled()
  })

  it('cancel runs while send awaits, deduplicates separately and invalidates late send', async () => {
    const controller = createChatTurnController()
    const sent = deferred<string>()
    const cancelled = deferred<string>()
    const sendOp = operation({ execute: () => sent.promise })
    const cancelOp = operation({ execute: vi.fn(() => cancelled.promise), onResult: () => controller.invalidateSend() })
    const sending = controller.send(sendOp)
    const cancelling = controller.cancel(cancelOp)
    expect(await controller.cancel(cancelOp)).toBe(false)
    cancelled.resolve('cancelled')
    await cancelling
    expect(cancelOp.execute).toHaveBeenCalledTimes(1)
    sent.resolve('late')
    await sending
    expect(sendOp.onResult).not.toHaveBeenCalled()
    expect(await controller.send(operation())).toBe(true)
  })

  it('cancel response cannot finish a new target, rejection can be retried', async () => {
    const controller = createChatTurnController()
    const result = deferred<string>()
    let current = true
    const op = operation({ execute: () => result.promise, isCurrent: () => current })
    const cancelling = controller.cancel(op)
    await Promise.resolve()
    current = false
    result.resolve('cancelled')
    await cancelling
    expect(op.onResult).not.toHaveBeenCalled()
    const errorOp = operation({ execute: async () => { throw new Error('cancel failed') } })
    await controller.cancel(errorOp)
    expect(errorOp.onError).toHaveBeenCalledOnce()
    expect(await controller.cancel(operation())).toBe(true)
  })

  it('callback exceptions cannot leave the controller locked', async () => {
    const controller = createChatTurnController()
    await expect(controller.send(operation({ onResult: () => { throw new Error('result failed') }, onError: () => { throw new Error('report failed') } }))).rejects.toThrow('report failed')
    expect(await controller.send(operation())).toBe(true)
  })

  it('confirmed stop frees the send slot while the old transport is pending; its finally cannot unlock the next send', async () => {
    const controller = createChatTurnController()
    const oldResult = deferred<string>()
    const nextResult = deferred<string>()
    const old = controller.send(operation({ execute: () => oldResult.promise }))
    await Promise.resolve()
    controller.invalidateSend()
    const nextOp = operation({ execute: vi.fn(() => nextResult.promise) })
    const next = controller.send(nextOp)
    await Promise.resolve()
    expect(nextOp.execute).toHaveBeenCalledOnce()
    oldResult.resolve('old finally')
    await old
    const blocked = operation({ onBusy: vi.fn() })
    expect(await controller.send(blocked)).toBe(false)
    expect(blocked.onBusy).toHaveBeenCalledOnce()
    expect(blocked.prepare).not.toHaveBeenCalled()
    nextResult.resolve('ok')
    await next
    expect(await controller.send(operation())).toBe(true)
  })

  it('a stale prepared identity can release its pending flight while a session being connected is allowed to finish', async () => {
    const controller = createChatTurnController()
    const oldResult = deferred<string>()
    let current = true
    const old = controller.send(operation({ execute: () => oldResult.promise, isCurrent: () => current }))
    await Promise.resolve()
    current = false
    controller.invalidateSendIfStale()
    const ready = deferred<string>()
    const nextOp = operation({ prepare: () => ready.promise })
    const next = controller.send(nextOp)
    controller.invalidateSendIfStale()
    ready.resolve('new session')
    expect(await next).toBe(true)
    expect(nextOp.execute).toHaveBeenCalledOnce()
    oldResult.resolve('old')
    await old
  })

  it('a hanging cancel for an old target does not block stopping the replacement target', async () => {
    const controller = createChatTurnController()
    const oldResult = deferred<string>()
    const nextResult = deferred<string>()
    let current = true
    const old = controller.cancel(operation({ execute: () => oldResult.promise, isCurrent: () => current }))
    await Promise.resolve()
    current = false
    const nextOp = operation({ execute: vi.fn(() => nextResult.promise) })
    const next = controller.cancel(nextOp)
    await Promise.resolve()
    expect(nextOp.execute).toHaveBeenCalledOnce()
    oldResult.resolve('old finally')
    await old
    expect(await controller.cancel(operation())).toBe(false)
    nextResult.resolve('ok')
    await next
  })

  it('late cancel from a completed turn cannot stop the next send on the same session', async () => {
    const controller = createChatTurnController()
    const first = deferred<string>()
    const stopping = deferred<string>()
    const next = deferred<string>()
    const sending = controller.send(operation({ execute: () => first.promise }))
    await Promise.resolve()
    const cancelOp = operation({ execute: () => stopping.promise })
    const cancelling = controller.cancel(cancelOp)
    await Promise.resolve()
    first.resolve('end_turn')
    await sending
    const second = controller.send(operation({ execute: () => next.promise }))
    await Promise.resolve()
    stopping.resolve('cancelled')
    await cancelling
    expect(cancelOp.onResult).not.toHaveBeenCalled()
    next.resolve('end_turn')
    await second
  })
})
