import type { ReactNode } from 'react'
import { cn } from './cn.js'

export interface ChatEmptyStateProps {
  /** 顶部图形（品牌标识、图标）；缺省不渲染 */
  icon?: ReactNode
  /** 主标题，如「开始与 Agent 对话」 */
  title: ReactNode
  /** 说明文案 */
  description?: ReactNode
  /** 补充提示（能力范围、快捷键等） */
  hint?: ReactNode
  /** 可选主操作按钮 */
  action?: ReactNode
  className?: string
}

/**
 * 空态卡片：没消息时的引导区。
 * 虚线卡片 + 居中三段文案，不绑业务；图标、操作由宿主传入。
 */
export function ChatEmptyState({ icon, title, description, hint, action, className }: ChatEmptyStateProps) {
  return (
    <div
      data-slot="chat-empty-state"
      className={cn(
        'flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center',
        className,
      )}
    >
      {icon ? <div className="text-muted-foreground/60">{icon}</div> : null}
      <p className="text-sm font-medium text-foreground/85">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {hint ? <p className="max-w-sm text-[11px] leading-relaxed text-muted-foreground/80">{hint}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
