import type { ReactNode } from 'react'
import { cn } from './cn.js'

export interface ChatPanelHeaderProps {
  /** 主标题（如「日语导师」） */
  title: ReactNode
  /** 标题同行右侧的状态区：通常放 `ChatStatusBadge` */
  status?: ReactNode
  /** 次行说明：轨道、模型、会话保留等 */
  subtitle?: ReactNode
  /** 右对齐操作区：历史、新会话、清屏、关闭 */
  actions?: ReactNode
  className?: string
}

/**
 * 面板顶栏骨架：标题 + 状态行 + 右侧操作。
 * 只负责布局与间距；状态语义由宿主编排（谁连接、谁就绪、本轮是否失败）。
 */
export function ChatPanelHeader({ title, status, subtitle, actions, className }: ChatPanelHeaderProps) {
  return (
    <header
      className={cn(
        'flex shrink-0 items-start justify-between gap-2 border-b border-border/60 px-3 py-2.5',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-serif text-sm font-semibold tracking-tight text-foreground">{title}</span>
          {status}
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-0.5">{actions}</div> : null}
    </header>
  )
}
