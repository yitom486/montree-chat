/**
 * 聊天历史窗口与滚动视口定位（C6，自宿主 `apps/desktop/src/lib/agent/stick-to-bottom.ts` 整搬）。
 * `sliceChatWindow` 纯切片 + 分页常量 + `resolveScrollViewport` DOM 定位；
 * 不读 store、不碰持久化、不 import `@/`，快照落盘由宿主经列表 `onScrollSnapshot` 执行。
 */

/** 历史分页：初次只看末尾，向上滚动 PAGE_STEP 条向前补。 */
export const CHAT_HISTORY_INITIAL_COUNT = 5
export const CHAT_HISTORY_PAGE_STEP = 5

/**
 * 滚动快照：落盘与恢复的最小结构。
 * 线程绑定由调用方保证——列表把绑定的 `threadId` 随每次 `onScrollSnapshot` 回传，
 * 宿主按该 id 落盘，不在延迟回调里临时读当前活动线程。
 */
export interface ChatScrollSnapshot {
  scrollTop: number
  pinned: boolean
  windowStart?: number | null
  windowCount?: number
}

export function resolveScrollViewport(
  contentEl: HTMLElement | null | undefined,
): HTMLElement | null {
  if (!contentEl) return null
  // assistant-ui ThreadPrimitive.Viewport 结构优先
  const threadViewport = contentEl.closest('[data-assistant-ui-thread-viewport]')
  if (threadViewport instanceof HTMLElement) return threadViewport
  // 向上找到最近的纵向滚动祖先
  let ancestor = contentEl.parentElement
  while (ancestor) {
    const style = getComputedStyle(ancestor)
    if (/(auto|scroll)/.test(style.overflowY)) return ancestor
    ancestor = ancestor.parentElement
  }
  // 无排版环境（happy-dom 单测）回落到直接父级
  const parent = contentEl.parentElement
  return parent instanceof HTMLElement ? parent : null
}

/**
 * 聊天可见窗口切片（纯函数）。
 * - start 为 null：贴底锚定，取末尾 count 条（新消息自然进入视野）；
 * - start 为数字：冻结窗口 [start, start+count)，新消息到来不移位（供未贴底时保持位置）。
 * 越界钳制；总量不足返回全部。
 */
export function sliceChatWindow<T>(messages: T[], start: number | null, count: number): T[] {
  if (messages.length <= count || start === null) return messages.slice(-count)
  const clamped = Math.max(0, Math.min(start, messages.length - 1))
  return messages.slice(clamped, clamped + count)
}
