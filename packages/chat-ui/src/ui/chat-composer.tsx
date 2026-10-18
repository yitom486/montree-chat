import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { useChatComposerController } from '../headless/use-chat-composer-controller.js'
import { cn } from './cn.js'

/** 输入框最大高度（约 8 行），超过转内部滚动，避免顶掉消息区。 */
const TEXTAREA_MAX_PX = 168

export interface ChatComposerProps {
  /** 受控草稿 */
  value: string
  onValueChange: (value: string) => void
  /** 返回 false 表示拒绝发送（保留草稿） */
  onSubmit: (value: string) => void | boolean
  /** 运行中「停止」按钮；不传则不渲染停止按钮 */
  onStop?: () => void
  /** 回合进行中：显示停止按钮并切换占位提示。默认 false */
  running?: boolean
  /** 完全禁用输入 */
  disabled?: boolean
  placeholder?: string
  runningPlaceholder?: string
  /** 底栏提示（如运行时能力说明） */
  hint?: ReactNode
  /** 左侧工具区：会话参数、附件、模型选择等 */
  toolbarStart?: ReactNode
  /** 右侧附加动作（发送/停止之前）：如「加入下一轮队列」 */
  renderActions?: () => ReactNode
  className?: string
  'aria-label'?: string
}

/**
 * 开箱即用的输入区：自增高 textarea、IME 防误触、Enter 发送、发送/停止按钮。
 *
 * 只做**形态与交互**：发送链路、模型选择、排队策略全部由宿主经回调与槽位接入。
 * `running` 只影响按钮与文案，**不阻止发送**——生成中允许追加引导；需要硬拦截时
 * 由宿主传 `disabled`。
 */
export function ChatComposer({
  value,
  onValueChange,
  onSubmit,
  onStop,
  running = false,
  disabled = false,
  placeholder = '输入消息，Enter 发送 · Shift+Enter 换行',
  runningPlaceholder = '生成中：Enter 追加引导 · Shift+Enter 换行',
  hint,
  toolbarStart,
  renderActions,
  className,
  'aria-label': ariaLabel = '输入消息',
}: ChatComposerProps) {
  const composingRef = useRef(false)

  // running 不交给控制器：控制器的 running 会封掉 canSend，这里要保留「生成中追加引导」
  const { canSend, submit, textareaRef } = useChatComposerController({
    value,
    onValueChange,
    disabled,
    running: false,
    onSubmit,
    onStop: onStop ?? (() => {}),
  })

  // 自增高：先把高度归零再量 scrollHeight，超过上限转内部滚动
  const autoGrow = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`
  }, [textareaRef])

  useEffect(() => {
    autoGrow()
  }, [value, autoGrow])

  const actions = renderActions?.()

  return (
    <div className={cn('shrink-0', className)}>
      <div className="rounded-2xl border border-border/70 bg-card transition-colors focus-within:border-primary/40">
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          rows={1}
          aria-label={ariaLabel}
          placeholder={running ? runningPlaceholder : placeholder}
          onChange={(event) => onValueChange(event.target.value)}
          onCompositionStart={() => {
            composingRef.current = true
          }}
          onCompositionEnd={() => {
            composingRef.current = false
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) return
            // 三重守卫：组合事件 + isComposing + 229（部分输入法只给 keyCode）
            if (event.nativeEvent.isComposing || composingRef.current) return
            if ((event.nativeEvent as unknown as { keyCode?: number }).keyCode === 229) return
            event.preventDefault()
            submit()
          }}
          className="block max-h-[168px] min-h-[44px] w-full resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />

        <div className="flex flex-wrap items-center gap-1 border-t border-border/60 px-1.5 py-1">
          {toolbarStart}

          <div className="ml-auto flex shrink-0 items-center gap-1">
            {actions}
            {running && onStop ? (
              <button
                type="button"
                aria-label="停止生成"
                title="停止生成"
                onClick={onStop}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/70 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Square className="size-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              aria-label="发送"
              title="发送"
              disabled={!canSend}
              onClick={() => submit()}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {hint ? <p className="mt-1.5 px-1 text-[11px] leading-4 text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
