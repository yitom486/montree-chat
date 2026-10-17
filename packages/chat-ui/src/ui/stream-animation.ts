import { useEffect, useState } from 'react'

export interface StreamAnimationPreset {
  animation: 'fadeIn'
  sep: 'char'
  duration: number
  stagger: number
  maxBacklogMs: number
}

const BASE = { animation: 'fadeIn', sep: 'char' } as const

/**
 * FPS 档位 → 动画预设（纯函数，单测锁定；档位未测出走默认档，与旧硬编码一致）：
 * 高刷收紧级联（跟得上 120Hz 的帧间隔），低端放宽 stagger、收紧 backlog 防拖尾。
 * 注意：动画本体是 CSS keyframes（合成器驱动），这里调的只是级联排布参数，
 * 不是逐帧 JS 吐字——后者已删除，不再需要。
 */
export function animationPresetForFps(fps: number | null): StreamAnimationPreset {
  if (fps != null && fps >= 90) return { ...BASE, duration: 120, stagger: 6, maxBacklogMs: 240 }
  if (fps != null && fps < 45) return { ...BASE, duration: 120, stagger: 12, maxBacklogMs: 200 }
  return { ...BASE, duration: 150, stagger: 8, maxBacklogMs: 320 }
}

/** 实测值就近归一化到物理标准档位（抹平系统抖动）。 */
export function normalizeFps(rawFps: number): number {
  const tiers = [30, 60, 75, 90, 120, 144, 165, 240]
  let closest = 60
  let minDiff = Infinity
  for (const tier of tiers) {
    const diff = Math.abs(rawFps - tier)
    if (diff < minDiff) {
      minDiff = diff
      closest = tier
    }
  }
  return closest
}

/**
 * rAF 微采样测真实刷新率（默认 25 帧，约 200~400ms，一次性）：
 * 无 rAF（SSR/测试）或页面不可见导致测不出时返回 null，调用方走默认档。
 * 多屏拖拽/VRR 场景下每个 ChatMarkdown 挂载测一次（气泡级粒度，不全局缓存，
 * 避免跨屏旧值；开销一次 25 帧，可忽略）。
 */
export function useDisplayFps(sampleFrames = 25): number | null {
  const [fps, setFps] = useState<number | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return
    let cancelled = false
    let count = 0
    let start = 0
    let raf = 0
    const step = (timestamp: number) => {
      if (cancelled) return
      if (!start) start = timestamp
      else count += 1
      if (count >= sampleFrames) {
        const avg = (timestamp - start) / count
        if (avg > 0) setFps(normalizeFps(1000 / avg))
        return
      }
      raf = window.requestAnimationFrame(step)
    }
    raf = window.requestAnimationFrame(step)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(raf)
    }
  }, [sampleFrames])
  return fps
}

/** 系统减少动态效果开关（开则动画预设直接关闭，CSS 级联全停）。 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}
