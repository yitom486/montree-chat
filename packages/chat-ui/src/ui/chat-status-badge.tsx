import type { ReactNode } from 'react'
import { cn } from './cn.js'

export type ChatStatusTone = 'neutral' | 'positive' | 'warning' | 'danger'

export interface ChatStatusBadgeProps {
  /** 语义色调：连接/就绪=positive，进行中=neutral+脉冲，回退=warning，失败=danger */
  tone?: ChatStatusTone
  label: ReactNode
  /** 悬停详情（错误原因、能力说明等） */
  title?: string
  /** 进行中呼吸灯；尊重 prefers-reduced-motion */
  pulse?: boolean
  /** 可选前置图标（如钥匙、警告） */
  icon?: ReactNode
  className?: string
}

const TONE_TEXT: Record<ChatStatusTone, string> = {
  neutral: 'text-muted-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
}

const TONE_DOT: Record<ChatStatusTone, string> = {
  neutral: 'bg-muted-foreground',
  positive: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
}

/** 状态胶囊：连接态、就绪态、本轮健康度统一用它，避免每个宿主各写一套颜色分支。 */
export function ChatStatusBadge({
  tone = 'neutral',
  label,
  title,
  pulse = false,
  icon,
  className,
}: ChatStatusBadgeProps) {
  return (
    <span
      title={title}
      data-tone={tone}
      className={cn('inline-flex items-center gap-1 text-xs whitespace-nowrap', TONE_TEXT[tone], className)}
    >
      {icon ?? (
        <span
          aria-hidden
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            TONE_DOT[tone],
            pulse && 'animate-pulse motion-reduce:animate-none',
          )}
        />
      )}
      {label}
    </span>
  )
}
