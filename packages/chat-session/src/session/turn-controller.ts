/** The host owns identity and business effects; this controller only sequences async work. */
export interface ChatTurnOperation<T, R> {
  prepare(): T | null | Promise<T | null>
  isCurrent(target: T): boolean
  execute(target: T): Promise<R>
  onResult(target: T, result: R): void
  onError(target: T | null, error: unknown): void
  onBusy?(): void
}

export interface ChatTurnController {
  send<T, R>(operation: ChatTurnOperation<T, R>): Promise<boolean>
  cancel<T, R>(operation: ChatTurnOperation<T, R>): Promise<boolean>
  /** A confirmed cancellation invalidates the still-pending send response. */
  invalidateSend(): void
  /** Session changes may invalidate a prepared target; connecting preparation has none yet. */
  invalidateSendIfStale(): void
}

export function createChatTurnController(): ChatTurnController {
  let sending = false
  let cancelling = false
  let sendGeneration = 0
  let cancelGeneration = 0
  let sendIsCurrent: (() => boolean) | null = null
  let cancelIsCurrent: (() => boolean) | null = null
  const invalidateSend = () => { sendGeneration += 1; sending = false; sendIsCurrent = null }

  async function run<T, R>(kind: 'send' | 'cancel', operation: ChatTurnOperation<T, R>): Promise<boolean> {
    if (kind === 'cancel' && cancelling && cancelIsCurrent && !cancelIsCurrent()) cancelling = false
    if (kind === 'send' ? sending : cancelling) { operation.onBusy?.(); return false }
    if (kind === 'send') sending = true
    else cancelling = true
    const ownerSendGeneration = sendGeneration
    const generation = kind === 'send' ? ++sendGeneration : ++cancelGeneration
    let target: T | null = null
    const current = () => target !== null && operation.isCurrent(target) &&
      (kind === 'send' ? generation === sendGeneration : generation === cancelGeneration && ownerSendGeneration === sendGeneration)
    try {
      target = await operation.prepare()
      if (!current()) return false
      if (kind === 'send') sendIsCurrent = current
      else cancelIsCurrent = current
      const result = await operation.execute(target!)
      if (current()) operation.onResult(target!, result)
      return true
    } catch (error) {
      // prepare failures have no target yet; the host also guards its initial identity.
      if ((target === null && generation === (kind === 'send' ? sendGeneration : cancelGeneration)) || current()) operation.onError(target, error)
      return false
    } finally {
      if (kind === 'send' && generation === sendGeneration) { sending = false; sendIsCurrent = null }
      if (kind === 'cancel' && generation === cancelGeneration) { cancelling = false; cancelIsCurrent = null }
    }
  }

  return {
    send: operation => run('send', operation),
    cancel: operation => run('cancel', operation),
    invalidateSend,
    invalidateSendIfStale: () => { if (sendIsCurrent && !sendIsCurrent()) invalidateSend() },
  }
}
