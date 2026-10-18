import type { ReactNode } from 'react'
import { Settings2 } from 'lucide-react'
import { Popover as PopoverPrimitive } from '@base-ui-components/react/popover'
import { cn } from './cn.js'

export interface ChatSettingOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ChatSetting {
  /** 分组唯一 id（用于 aria 与测试） */
  id: string
  /** 分组名，如「审批」「思考深度」 */
  label: string
  /** 当前值 */
  value: string
  options: ChatSettingOption[]
  onChange: (value: string) => void
  /** 分组禁用（如运行时未就绪、尚无可用选项） */
  disabled?: boolean
  /** 分组下方的补充说明（如「运行时默认」「待确认」） */
  hint?: ReactNode
}

export interface ChatSettingsMenuProps {
  settings: ChatSetting[]
  /** 弹层标题，默认「会话参数」 */
  title?: string
  /** 标题下的说明，默认「设置仅影响后续发送的消息」 */
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** 有非默认值时在触发器右上角显示提示点 */
  nonDefault?: boolean
  disabled?: boolean
  /** 触发器无障碍名，默认「会话设置」 */
  triggerLabel?: string
  align?: 'start' | 'center' | 'end'
  className?: string
}

/**
 * 会话参数弹层：若干「单选组」。
 *
 * 用单选行而不是嵌套下拉：弹层本身已是一层浮层，再套 Select 会带来焦点与层级问题；
 * 2–5 个短选项用单选行点一下就完成，少一次点击。
 * 选择后**不关闭**弹层，方便一次改多项。
 */
export function ChatSettingsMenu({
  settings,
  title = '会话参数',
  description = '设置仅影响后续发送的消息',
  open,
  onOpenChange,
  nonDefault = false,
  disabled = false,
  triggerLabel = '会话设置',
  align = 'start',
  className,
}: ChatSettingsMenuProps) {
  return (
    <PopoverPrimitive.Root
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      <PopoverPrimitive.Trigger
        aria-label={triggerLabel}
        title={triggerLabel}
        disabled={disabled}
        className="relative inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Settings2 className="size-3.5" />
        {nonDefault && !open ? (
          <span aria-hidden className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
        ) : null}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={8} align={align} className="z-50 outline-none">
          <PopoverPrimitive.Popup
            data-slot="chat-settings-menu"
            className={cn(
              'z-50 w-72 space-y-3 rounded-xl border border-border/70 bg-popover p-3 text-popover-foreground shadow-xl outline-none',
              className,
            )}
          >
            <div>
              <p className="text-xs font-medium text-foreground">{title}</p>
              {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
            </div>

            {settings.map((setting) => (
              <div
                key={setting.id}
                role="radiogroup"
                aria-label={setting.label}
                aria-disabled={setting.disabled ? true : undefined}
                className="space-y-1"
              >
                <span className="block px-0.5 text-xs text-muted-foreground">{setting.label}</span>
                <div className="space-y-0.5">
                  {setting.options.map((option) => {
                    const checked = option.value === setting.value
                    const optionDisabled = Boolean(setting.disabled || option.disabled)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        disabled={optionDisabled}
                        onClick={() => setting.onChange(option.value)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs outline-none transition-colors',
                          'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                          checked ? 'bg-muted text-foreground' : 'text-muted-foreground',
                          optionDisabled && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            'size-1.5 shrink-0 rounded-full',
                            checked ? 'bg-primary' : 'bg-border',
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
                {setting.hint ? (
                  <p className="px-0.5 text-[11px] leading-4 text-muted-foreground/80">{setting.hint}</p>
                ) : null}
              </div>
            ))}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
