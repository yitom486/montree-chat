import { describe, expect, it } from 'vitest'
import { animationPresetForFps, normalizeFps } from './stream-animation.js'

describe('流式动画预设（动态帧率选档）', () => {
  it('归一化到物理标准档位', () => {
    expect(normalizeFps(59.94)).toBe(60)
    expect(normalizeFps(119.88)).toBe(120)
    expect(normalizeFps(143.9)).toBe(144)
    expect(normalizeFps(29.5)).toBe(30)
  })

  it('缺省（测不出）走默认档，与旧硬编码一致', () => {
    expect(animationPresetForFps(null)).toEqual({
      animation: 'fadeIn', sep: 'char', duration: 150, stagger: 8, maxBacklogMs: 320,
    })
  })

  it('高刷收紧级联，低端放宽', () => {
    expect(animationPresetForFps(120)).toMatchObject({ stagger: 6, maxBacklogMs: 240 })
    expect(animationPresetForFps(60)).toMatchObject({ stagger: 8, maxBacklogMs: 320 })
    expect(animationPresetForFps(30)).toMatchObject({ stagger: 12, maxBacklogMs: 200 })
  })
})
