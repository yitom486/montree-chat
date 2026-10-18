import { createContext, useContext, type ReactNode } from 'react'

export interface ChatUiContextValue {
  /**
   * 外链点击拦截。返回 `true` 表示宿主已处理（组件会 `preventDefault`）；
   * 返回 `false` 或 `undefined` 时保留浏览器默认行为。
   *
   * 桌面宿主（Tauri / Electron）必须接管：否则 webview 会就地导航。
   */
  onLinkClick?: (href: string) => boolean | void
}

const ChatUiContext = createContext<ChatUiContextValue>({})

/** 为子树提供聊天 UI 的宿主能力（目前只有外链拦截）。 */
export function ChatUiProvider({ value, children }: { value: ChatUiContextValue; children: ReactNode }) {
  return <ChatUiContext.Provider value={value}>{children}</ChatUiContext.Provider>
}

/** 读取宿主能力；没有 Provider 时返回空对象，行为与未接入时一致。 */
export function useChatUiContext(): ChatUiContextValue {
  return useContext(ChatUiContext)
}
