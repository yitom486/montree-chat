import type { ReactNode } from 'react'
import { GitFork, History, Minimize2, Trash2 } from 'lucide-react'
import { Popover as PopoverPrimitive } from '@base-ui-components/react/popover'
import { cn } from './cn.js'

/** 会话条目的最小形状：宿主把自己的会话 DTO 映射成它即可。 */
export interface ChatHistoryEntry {
  id: string
  /** 主标题；缺省由宿主给 preview 或 id 片段 */
  title: string
  /** 次行说明；不传则显示时间 */
  subtitle?: string
  /** 秒级时间戳；与 `subtitle` 二选一即可 */
  timestamp?: number
}

export interface ChatHistoryMenuProps {
  entries: ChatHistoryEntry[]
  /** 当前会话 id，高亮显示 */
  activeId?: string
  /** 选中某条会话 */
  onSelect: (id: string) => void
  /** 新建会话；不传则不渲染「新建」 */
  onCreate?: () => void
  /** 打开弹层时刷新列表（宿主拉取最新会话） */
  onRefresh?: () => void
  /** 行内操作；不传则对应按钮不渲染 */
  onCompact?: (id: string) => void
  onFork?: (id: string) => void
  onArchive?: (id: string) => void
  /** 行内操作进行中：禁用按钮，避免重复提交 */
  busy?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** 头部标题，默认「会话」 */
  title?: string
  createLabel?: string
  emptyText?: string
  /** 底部附加区（如「保留新会话」开关） */
  footer?: ReactNode
  /** 触发器图形与无障碍名 */
  triggerIcon?: ReactNode
  triggerLabel?: string
  align?: 'start' | 'center' | 'end'
  className?: string
}

function formatTimestamp(entry: ChatHistoryEntry): string | undefined {
  if (entry.subtitle) return entry.subtitle
  if (entry.timestamp) return new Date(entry.timestamp * 1000).toLocaleString()
  return undefined
}

/**
 * 会话历史弹层：列表 + 新建 + 行内压缩/分叉/归档。
 *
 * 纯展示 + 回调：会话怎么存、压缩/分叉/归档做什么全部由宿主决定；
 * 没传对应回调的操作按钮不会渲染，因此也适合"只读历史"场景。
 */
export function ChatHistoryMenu({
  entries,
  activeId,
  onSelect,
  onCreate,
  onRefresh,
  onCompact,
  onFork,
  onArchive,
  busy = false,
  open,
  onOpenChange,
  title = '会话',
  createLabel = '新建',
  emptyText = '暂无保留的会话',
  footer,
  triggerIcon,
  triggerLabel = '会话历史',
  align = 'end',
  className,
}: ChatHistoryMenuProps) {
  const hasRowActions = Boolean(onCompact || onFork || onArchive)
  return (
    <PopoverPrimitive.Root
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      <PopoverPrimitive.Trigger
        aria-label={triggerLabel}
        title={triggerLabel}
        onClick={() => onRefresh?.()}
        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {triggerIcon ?? <History className="size-3.5" />}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={6} align={align} className="z-50 outline-none">
          <PopoverPrimitive.Popup
            data-slot="chat-history-menu"
            className={cn(
              'z-50 w-72 rounded-xl border border-border/70 bg-popover p-2 text-popover-foreground shadow-xl outline-none',
              className,
            )}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              {onCreate ? (
                <button
                  type="button"
                  className="cursor-pointer text-xs text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={onCreate}
                >
                  {createLabel}
                </button>
              ) : null}
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto">
              {entries.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground/70">{emptyText}</p>
              ) : (
                entries.map((entry) => {
                  const meta = formatTimestamp(entry)
                  const active = entry.id === activeId
                  return (
                    <div
                      key={entry.id}
                      data-active={active ? '' : undefined}
                      className={cn(
                        'flex items-start gap-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60',
                        active && 'bg-muted/60',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(entry.id)}
                        className="min-w-0 flex-1 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <p className="truncate text-xs text-foreground">{entry.title}</p>
                        {meta ? <p className="truncate text-xs text-muted-foreground">{meta}</p> : null}
                      </button>
                      {hasRowActions ? (
                        <div className="flex shrink-0 items-center">
                          {onCompact ? (
                            <button
                              type="button"
                              aria-label="压缩上下文"
                              title="压缩上下文"
                              disabled={busy}
                              onClick={() => onCompact(entry.id)}
                              className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground outline-none transition-colors hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Minimize2 className="size-3" />
                            </button>
                          ) : null}
                          {onFork ? (
                            <button
                              type="button"
                              aria-label="分叉会话"
                              title="分叉会话"
                              disabled={busy}
                              onClick={() => onFork(entry.id)}
                              className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground outline-none transition-colors hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <GitFork className="size-3" />
                            </button>
                          ) : null}
                          {onArchive ? (
                            <button
                              type="button"
                              aria-label="归档会话"
                              title="归档会话"
                              disabled={busy}
                              onClick={() => onArchive(entry.id)}
                              className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground outline-none transition-colors hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>

            {footer ? (
              <div className="mt-2 border-t border-border/60 px-1 pt-2 text-xs text-muted-foreground">{footer}</div>
            ) : null}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
