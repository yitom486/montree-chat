import { describe, expect, it } from 'vitest'
import { toProposedMark } from '@yitom/annotations'
import { PRESENT_SCHEMA_VERSION } from '@yitom/contracts'
import type { ChatFeedEvent, ChatMarkProposal, ChatMessage } from '@yitom/chat-core'
import { createChatSessionStore } from './store.js'
import type { ChatStoragePort, ChatThread } from './types.js'

function harness() {
  let n = 0
  let t = 1000
  return {
    createId: (role: string) => `${role}-${n++}`,
    now: () => t++,
  }
}

function mockStorage(): ChatStoragePort & { saved: unknown[] } {
  const saved: unknown[] = []
  return {
    saved,
    load: () => null,
    save: (snapshot) => {
      saved.push(snapshot)
    },
  }
}

function threadOf(store: ReturnType<typeof createChatSessionStore>, id: string) {
  const thread = store.getState().threads.find((t) => t.id === id)
  if (!thread) throw new Error(`missing thread ${id}`)
  return thread
}

function pendingFallback(): ChatMarkProposal {
  return {
    proposal: toProposedMark({ id: 'p1', excerpt: '摘', note: 'x', source: 'agent' }),
    status: 'pending',
  }
}

describe('dispatchFeedEvent 显式目标隔离', () => {
  it('写非 active 线程：active/运行时/审批/模型不动，只通知一次', () => {
    const storage = mockStorage()
    const store = createChatSessionStore({ ...harness(), storage })
    const activeId = store.getState().activeThreadId!
    const otherId = store.ensureHostThread('host-b', 'codex-acp')
    expect(otherId).not.toBe(activeId)
    store.requestPermission({ requestId: 7, summary: '批一下', options: [] })
    store.selectModel('m1')
    const modelBefore = { ...store.getState().modelConfig }
    expect(modelBefore.modelId).toBe('m1')
    let notified = 0
    store.subscribe(() => {
      notified += 1
    })
    const savedBefore = storage.saved.length

    store.dispatchFeedEvent(otherId, { type: 'text-chunk', role: 'agent', text: 'hi' })

    expect(store.getState().activeThreadId).toBe(activeId)
    expect(threadOf(store, activeId).feed.messages).toHaveLength(0)
    expect(threadOf(store, otherId).feed.messages.map((m) => m.text)).toEqual(['hi'])
    expect(store.getState().modelConfig).toEqual(modelBefore)
    expect(store.getState().pendingPermission?.requestId).toBe(7)
    expect(notified).toBe(1)
    expect(storage.saved.length).toBe(savedBefore + 1)
  })

  it('无效目标（未知 id/空串/非字符串）无任何副作用', () => {
    const storage = mockStorage()
    const store = createChatSessionStore({ ...harness(), storage })
    let notified = 0
    store.subscribe(() => {
      notified += 1
    })
    const before = store.getState()
    const savedBefore = storage.saved.length

    store.dispatchFeedEvent('no-such-thread', { type: 'text-chunk', role: 'agent', text: 'x' })
    store.dispatchFeedEvent('', { type: 'text-chunk', role: 'agent', text: 'x' })
    store.dispatchFeedEvent(undefined as unknown as string, { type: 'text-chunk', role: 'agent', text: 'x' })

    expect(store.getState()).toBe(before)
    expect(notified).toBe(0)
    expect(storage.saved.length).toBe(savedBefore)
  })

  it('畸形事件直接丢弃：null/无 type/非字符串 type/未知 type 不污染 feed', () => {
    const storage = mockStorage()
    const store = createChatSessionStore({ ...harness(), storage })
    const id = store.getState().activeThreadId!
    store.appendUser('q')
    let notified = 0
    store.subscribe(() => {
      notified += 1
    })
    const savedBefore = storage.saved.length
    const messagesBefore = threadOf(store, id).feed.messages

    const malformed = [
      null,
      {},
      { type: 42 },
      Object.assign([], { type: 'begin-reply' }),
      Object.assign(() => {}, { type: 'begin-reply' }),
      { type: 'no-such-event', text: 'x' },
    ] as unknown as ChatFeedEvent[]
    for (const event of malformed) store.dispatchFeedEvent(id, event)

    expect(threadOf(store, id).feed.messages).toBe(messagesBefore)
    expect(threadOf(store, id).feed.messages.map((m) => m.text)).toEqual(['q'])
    expect(notified).toBe(0)
    expect(storage.saved.length).toBe(savedBefore)
  })
})

describe('dispatchFeedEvent 事件语义', () => {
  it('text-chunk 三角色各自成泡并合并', () => {
    const store = createChatSessionStore(harness())
    const id = store.getState().activeThreadId!
    store.dispatchFeedEvent(id, { type: 'text-chunk', role: 'agent', text: 'A' })
    store.dispatchFeedEvent(id, { type: 'text-chunk', role: 'agent', text: 'B' })
    store.dispatchFeedEvent(id, { type: 'text-chunk', role: 'thought', text: '想' })
    store.dispatchFeedEvent(id, { type: 'text-chunk', role: 'user', text: 'U' })
    const roles = threadOf(store, id).feed.messages.map((m) => [m.role, m.text] as const)
    // user-chunk 无对应 ingest 方法，通用入口是唯一写入路径
    expect(roles).toEqual([
      ['agent', 'AB'],
      ['thought', '想'],
      ['user', 'U'],
    ])
  })

  it('tool-call 的 proposalFallback 落到末条 agent，对照 ingestToolCall 丢弃', () => {
    const viaDispatch = createChatSessionStore(harness())
    const viaIngest = createChatSessionStore(harness())
    for (const store of [viaDispatch, viaIngest]) {
      store.appendUser('q')
      store.beginReply()
      store.ingestTextChunk('ans')
      store.finishTurn()
    }
    const id = viaDispatch.getState().activeThreadId!
    const call = { toolCallId: 't1', title: '读文件', kind: 'read', status: 'completed' as const }
    viaDispatch.dispatchFeedEvent(id, { type: 'tool-call', call, proposalFallback: pendingFallback() })
    viaIngest.ingestToolCall(call)

    const agentsWithProposal = (store: typeof viaDispatch) =>
      threadOf(store, store.getState().activeThreadId!).feed.messages.filter((m) =>
        (m.markProposals ?? []).some((e) => e.proposal.id === 'p1'),
      )
    expect(agentsWithProposal(viaDispatch)).toHaveLength(1)
    expect(agentsWithProposal(viaIngest)).toHaveLength(0)
  })

  it('tool-chunk 合并正文且携带 fallback，对照 ingestToolChunk 只合并不带提议', () => {
    const viaDispatch = createChatSessionStore(harness())
    const viaIngest = createChatSessionStore(harness())
    for (const store of [viaDispatch, viaIngest]) {
      store.appendUser('q')
      store.beginReply()
      store.ingestTextChunk('ans')
      store.finishTurn()
      store.ingestToolCall({ toolCallId: 't1', title: '读', kind: 'read', status: 'in_progress' })
    }
    const id = viaDispatch.getState().activeThreadId!
    viaDispatch.dispatchFeedEvent(id, { type: 'tool-chunk', toolCallId: 't1', text: '+more', proposalFallback: pendingFallback() })
    viaIngest.ingestToolChunk('t1', '+more')

    const toolOf = (store: typeof viaDispatch) =>
      threadOf(store, store.getState().activeThreadId!).feed.messages.find(
        (m) => m.role === 'tool' && m.toolCallId === 't1',
      )!
    expect(toolOf(viaDispatch).toolContentText).toContain('+more')
    expect(toolOf(viaIngest).toolContentText).toContain('+more')
    const proposalsOf = (store: typeof viaDispatch) =>
      threadOf(store, store.getState().activeThreadId!).feed.messages.flatMap((m) => m.markProposals ?? [])
    expect(proposalsOf(viaDispatch).some((e) => e.proposal.id === 'p1')).toBe(true)
    expect(proposalsOf(viaIngest)).toHaveLength(0)
  })

  it('plan 建单例卡，plan-remove 删除；空 feed 上 plan-remove 零通知', () => {
    const store = createChatSessionStore(harness())
    const id = store.getState().activeThreadId!
    let notified = 0
    store.subscribe(() => {
      notified += 1
    })
    store.dispatchFeedEvent(id, { type: 'plan-remove' })
    expect(notified).toBe(0)

    const entries = [{ content: '做', status: 'in_progress' as const }]
    store.dispatchFeedEvent(id, { type: 'plan', entries, active: true })
    expect(threadOf(store, id).feed.messages.some((m) => m.role === 'plan')).toBe(true)
    store.dispatchFeedEvent(id, { type: 'plan-remove' })
    expect(threadOf(store, id).feed.messages.some((m) => m.role === 'plan')).toBe(false)
  })

  it('finish-turn 普通收尾置 turnSettled，settle:false 只冻结不收尾', () => {
    const settled = createChatSessionStore(harness())
    const light = createChatSessionStore(harness())
    for (const store of [settled, light]) {
      store.beginReply()
      store.ingestTextChunk('ans')
    }
    const settledId = settled.getState().activeThreadId!
    const lightId = light.getState().activeThreadId!
    settled.dispatchFeedEvent(settledId, { type: 'finish-turn' })
    light.dispatchFeedEvent(lightId, { type: 'finish-turn', settle: false })

    expect(threadOf(settled, settledId).feed.turnSettled).toBe(true)
    const lightFeed = threadOf(light, lightId).feed
    expect(lightFeed.turnSettled).toBe(false)
    expect(lightFeed.messages.every((m) => !m.streaming)).toBe(true)
  })

  it('finish-turn 透传 proposalFallback 并只产生一次通知和落盘', () => {
    const storage = mockStorage()
    const store = createChatSessionStore({ ...harness(), storage })
    const id = store.getState().activeThreadId!
    store.appendUser('q')
    store.beginReply()
    store.ingestTextChunk('ans')
    let notified = 0
    store.subscribe(() => { notified += 1 })
    const savedBefore = storage.saved.length
    store.dispatchFeedEvent(id, { type: 'finish-turn', proposalFallback: pendingFallback() })
    expect(threadOf(store, id).feed.messages.flatMap((message) => message.markProposals ?? []).some((entry) => entry.proposal.id === 'p1')).toBe(true)
    expect(notified).toBe(1)
    expect(storage.saved.length).toBe(savedBefore + 1)
  })

  it('rollback-turn 只删 keepIds 之外的 agent/thought，工具与用户保留', () => {
    const viaDispatch = createChatSessionStore(harness())
    const viaIngest = createChatSessionStore(harness())
    const setup = (store: typeof viaDispatch) => {
      store.appendUser('q')
      store.beginReply()
      store.ingestTextChunk('good')
      store.finishTurn()
      store.beginReply()
      store.ingestTextChunk('bad')
      store.ingestToolCall({ toolCallId: 't9', title: '跑', kind: 'run', status: 'completed' })
    }
    setup(viaDispatch)
    setup(viaIngest)
    const keepOf = (store: typeof viaDispatch) =>
      threadOf(store, store.getState().activeThreadId!).feed.messages.slice(0, 2).map((m) => m.id)
    const did = viaDispatch.getState().activeThreadId!
    const iid = viaIngest.getState().activeThreadId!
    viaDispatch.dispatchFeedEvent(did, { type: 'rollback-turn', keepIds: keepOf(viaDispatch) })
    viaIngest.rollbackFailedTurn(keepOf(viaIngest))

    for (const [store, sid] of [
      [viaDispatch, did],
      [viaIngest, iid],
    ] as const) {
      const roles = threadOf(store, sid).feed.messages.map((m) => m.role)
      expect(roles).toEqual(['user', 'agent', 'tool'])
      expect(threadOf(store, sid).feed.messages[1]!.text).toBe('good')
    }
  })

  it('同序列下通用入口与 ingest 方法 feed 等价', () => {
    const viaDispatch = createChatSessionStore(harness())
    const viaIngest = createChatSessionStore(harness())
    const did = viaDispatch.getState().activeThreadId!
    viaDispatch.dispatchFeedEvent(did, { type: 'user-append', text: 'q' })
    viaDispatch.dispatchFeedEvent(did, { type: 'begin-reply' })
    viaDispatch.dispatchFeedEvent(did, { type: 'text-chunk', role: 'agent', text: 'a' })
    viaDispatch.dispatchFeedEvent(did, { type: 'text-chunk', role: 'thought', text: 't' })
    viaDispatch.dispatchFeedEvent(did, {
      type: 'tool-call',
      call: { toolCallId: 't1', title: '读', kind: 'read', status: 'completed' },
    })
    viaDispatch.dispatchFeedEvent(did, {
      type: 'plan',
      entries: [{ content: '做', status: 'done' as const }],
      active: false,
    })
    viaDispatch.dispatchFeedEvent(did, { type: 'finish-turn' })

    viaIngest.appendUser('q')
    viaIngest.beginReply()
    viaIngest.ingestTextChunk('a')
    viaIngest.ingestThoughtChunk('t')
    viaIngest.ingestToolCall({ toolCallId: 't1', title: '读', kind: 'read', status: 'completed' })
    viaIngest.ingestPlan([{ content: '做', status: 'done' as const }], false)
    viaIngest.finishTurn()

    expect(threadOf(viaDispatch, did).feed).toEqual(
      threadOf(viaIngest, viaIngest.getState().activeThreadId!).feed,
    )
  })
})

describe('历史导入保留与后续事件隔离', () => {
  function richThread(id: string): ChatThread {
    const messages: ChatMessage[] = [
      {
        id: 'u-1',
        role: 'user',
        text: '读这章',
        createdAt: 1,
        attachments: [
          { id: 'a1', kind: 'image', name: 'p.png', mimeType: 'image/png', previewUrl: 'blob:preview' },
        ],
      },
      {
        id: 'a-1',
        role: 'agent',
        text: '好',
        createdAt: 2,
        markProposal: toProposedMark({ id: 'p0', excerpt: 'e', note: 'n', source: 'agent' }),
        markProposalStatus: 'pending',
        markProposals: [
          {
            proposal: toProposedMark({ id: 'p0', excerpt: 'e', note: 'n', source: 'agent' }),
            status: 'pending',
            toolCallId: 't0',
          },
        ],
        chapterMarkPlan: [{ id: 'c1', flatIndex: 2, title: '第三章', reason: '干货', status: 'pending' }],
        presentResult: {
          schemaVersion: PRESENT_SCHEMA_VERSION,
          kind: 'html-artifact',
          id: 'r1',
          title: '小应用',
          html: '<p>x</p>',
        },
      },
      {
        id: 't-1',
        role: 'tool',
        toolCallId: 't0',
        toolKind: 'propose',
        toolStatus: 'completed',
        toolTitle: '提议',
        text: '{}',
        createdAt: 3,
        toolDiffs: [{ path: 'f.md', oldText: 'a', newText: 'b' }],
        toolLocations: [{ path: 'f.md', line: 3 }],
        toolInputSummary: { title: 'in', kind: 'read' },
      },
    ]
    return { id, hostThreadId: 'host-rich', runtimeId: 'codex-acp', title: '旧会话', feed: { messages, turnSettled: true } }
  }

  it('syncHostThread 整线程替换：id/附件/提议/业务扩展原样保留', () => {
    const store = createChatSessionStore(harness())
    const rich = richThread('pkg-rich')
    store.syncHostThread(rich)
    const got = threadOf(store, 'pkg-rich')
    expect(got.feed.messages).toEqual(rich.feed.messages)
    expect(got.feed.messages.map((m) => m.id)).toEqual(['u-1', 'a-1', 't-1'])
    expect(got.feed.messages[0]!.attachments?.[0]?.previewUrl).toBe('blob:preview')
    expect(got.feed.messages[1]!.markProposals?.[0]?.proposal.id).toBe('p0')
    expect(got.feed.messages[1]!.chapterMarkPlan?.[0]?.title).toBe('第三章')
    expect(got.feed.messages[1]!.presentResult?.id).toBe('r1')
    expect(got.feed.turnSettled).toBe(true)
  })

  it('reconcileHostThreads 迁入权威历史并保留字段，未知目标仍无副作用', () => {
    const store = createChatSessionStore(harness())
    const rich = richThread('pkg-rich')
    store.reconcileHostThreads([rich], 'host-rich')
    expect(store.getState().activeThreadId).toBe('pkg-rich')
    expect(threadOf(store, 'pkg-rich').feed.messages.map((m) => m.id)).toEqual(['u-1', 'a-1', 't-1'])
    const before = store.getState()
    store.dispatchFeedEvent('missing', { type: 'text-chunk', role: 'agent', text: 'x' })
    expect(store.getState()).toBe(before)
  })

  it('稀疏工具状态更新保留导入消息的业务字段', () => {
    const store = createChatSessionStore(harness())
    const rich = richThread('pkg-rich')
    const oldTool = rich.feed.messages[2]!
    const importedTool = {
      ...oldTool,
      attachments: rich.feed.messages[0]!.attachments,
      presentResult: rich.feed.messages[1]!.presentResult,
      vendorContext: { source: 'legacy-import' },
    }
    rich.feed.messages[2] = importedTool
    store.syncHostThread(rich)
    store.dispatchFeedEvent('pkg-rich', { type: 'tool-call', call: { toolCallId: 't0', status: 'failed' } })
    const updated = threadOf(store, 'pkg-rich').feed.messages.find((message) => message.id === 't-1')!
    expect(updated).toMatchObject({
      id: 't-1', toolStatus: 'failed', vendorContext: { source: 'legacy-import' },
      attachments: importedTool.attachments, presentResult: importedTool.presentResult,
    })
    expect(updated.toolDiffs).toEqual(oldTool.toolDiffs)
    expect(updated.toolLocations).toEqual(oldTool.toolLocations)
    expect(importedTool.toolStatus).toBe('completed')
  })

  it('后续通用事件只动目标线程：导入线程对象引用不变，未改动字段保留', () => {
    const store = createChatSessionStore(harness())
    const rich = richThread('pkg-rich')
    store.syncHostThread(rich)
    const otherId = store.ensureHostThread('host-other', 'codex-acp')
    const richBefore = threadOf(store, 'pkg-rich')

    store.dispatchFeedEvent(otherId, { type: 'text-chunk', role: 'agent', text: 'hi' })
    expect(threadOf(store, 'pkg-rich')).toBe(richBefore)

    // 目标线程内工具更新：id/提议保留、正文合并
    store.dispatchFeedEvent('pkg-rich', { type: 'tool-chunk', toolCallId: 't0', text: '+tail' })
    const tool = threadOf(store, 'pkg-rich').feed.messages.find((m) => m.id === 't-1')!
    expect(tool.toolContentText).toContain('+tail')
    expect(tool.toolCallId).toBe('t0')
    expect(threadOf(store, 'pkg-rich').feed.messages.find((m) => m.id === 'a-1')!.markProposals).toHaveLength(1)
  })
})
