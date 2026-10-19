import { describe, expect, it } from 'vitest'
import {
  ChatMessageList,
  ChatComposer,
  ChatPanel,
  ok,
  err,
  DEFAULT_ACP_RUNTIME_ID,
} from './index.js'
import * as contracts from './contracts.js'
import * as readerCore from './reader-core.js'
import * as annotations from './annotations.js'
import * as chatCore from './chat-core.js'
import * as chatUi from './chat-ui.js'
import * as chatSession from './chat-session.js'

describe('@yitom/chat umbrella package', () => {
  it('exports core UI components and helpers from main entry', () => {
    expect(ChatMessageList).toBeDefined()
    expect(ChatComposer).toBeDefined()
    expect(ChatPanel).toBeDefined()
    expect(ok(123)).toEqual({ ok: true, value: 123 })
    expect(err({ code: 'ERR', message: 'fail' })).toEqual({
      ok: false,
      error: { code: 'ERR', message: 'fail' },
    })
    expect(DEFAULT_ACP_RUNTIME_ID).toBeDefined()
  })

  it('exports submodules properly', () => {
    expect(contracts.CONTRACTS_SCAFFOLD).toBe('contracts')
    expect(readerCore.READER_CORE_SCAFFOLD).toBe('reader-core:contracts')
    expect(annotations.DEFAULT_TOMBSTONE_TTL_MS).toBeDefined()
    expect(chatCore.CHAT_CORE_SCAFFOLD).toBe('chat-core')
    expect(chatUi.CHAT_UI_SCAFFOLD).toBe('chat-ui')
    expect(chatSession.createChatSessionStore).toBeDefined()
  })
})
