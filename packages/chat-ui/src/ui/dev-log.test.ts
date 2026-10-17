import { describe, expect, it, vi } from 'vitest'
import { acpDevLog, acpDevWarn, devFlagFromEnv, isChatUiDev } from './dev-log.js'
import { logAcpLayoutProbe } from './layout-probe.js'

describe('DEV 判定跨消费形态（发版门禁回归）', () => {
  it('缺失/异形 env 一律非 DEV，不抛', () => {
    expect(devFlagFromEnv(undefined)).toBe(false)
    expect(devFlagFromEnv(null)).toBe(false)
    expect(devFlagFromEnv(42)).toBe(false)
    expect(devFlagFromEnv({})).toBe(false)
    expect(devFlagFromEnv({ DEV: false })).toBe(false)
    expect(devFlagFromEnv({ DEV: 1 })).toBe(false)
    expect(devFlagFromEnv({ DEV: true })).toBe(true)
  })

  it('isChatUiDev 在当前管线下返回布尔且不抛', () => {
    expect(() => isChatUiDev()).not.toThrow()
    expect(typeof isChatUiDev()).toBe('boolean')
  })

  it('诊断日志与布局探针在任何环境都不抛（非 DEV 直接短路）', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      expect(() => acpDevLog('m')).not.toThrow()
      expect(() => acpDevLog('m', { a: 1 })).not.toThrow()
      expect(() => acpDevWarn('m')).not.toThrow()
      // null 元素 + 非 DEV/无 DOM：只断言不抛，不断言日志行为
      expect(() => logAcpLayoutProbe(null, { tag: 't' })).not.toThrow()
    } finally {
      info.mockRestore()
      warn.mockRestore()
    }
  })
})
