/**
 * `ChatMessageList`（C6，自宿主 `ThreadMessageList` 整搬改名）。
 * 通用列表编排：assistant-ui runtime/provider/viewport、可见历史窗口与分页、
 * 时间线/气泡编排、贴底跟滚/上翻保持/滚动恢复、回到底部按钮、运行状态行。
 * 只吃 `ChatMessage[]` + 稳定线程身份 + 运行状态 + 滚动快照初值/变更通知 +
 * 可选业务渲染槽位；不读任何宿主 store/IPC/reader/持久化键，不 import `@/`。
 * 快照落盘由宿主经 `onScrollSnapshot` 执行，回调携带绑定线程 id，
 * 不在延迟回调里临时读活动线程（快速切换后不会写进新线程）。
 */
import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'
import { ArrowDown } from 'lucide-react'
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  useExternalStoreRuntime,
} from '@assistant-ui/react'
import { planInlinePresent, timelineRendersInlineApproval } from '@yitom/chat-core'
import type { ChatMessage } from '@yitom/chat-core'
import { useChatTimeline } from '../headless/use-chat-timeline.js'
import {
  CHAT_HISTORY_INITIAL_COUNT,
  CHAT_HISTORY_PAGE_STEP,
  resolveScrollViewport,
  sliceChatWindow,
  type ChatScrollSnapshot,
} from '../headless/chat-history-window.js'
import { ChatMessageBubble } from './agent-message-bubble.js'
import { ChatActivityGroup, type ChatWorkLogItem } from './chat-activity-group.js'
import { AgentLoadingState, currentRunStatus } from './AgentLoadingState.js'
import { AgentPermissionCard, type AgentApprovalPending } from './agent-permission-card.js'
import { AGENT_CHAT_COL_CLASS } from './AgentChatItem.js'
import { ChatUiProvider } from './chat-ui-context.js'
import { logAcpLayoutProbe } from './layout-probe.js'
import { cn } from './cn.js'

/** 业务透传（与 `ChatMessageBubble` 同名同义，宿主原值直传）。 */
type ChatMessageListBubbleContext = Omit<Pick<ComponentProps<typeof ChatMessageBubble>,
  | 'resolveMarkProposal'
  | 'pendingPermission'
  | 'theme'
  | 'navFlatIndex'
  | 'onPermissionRespond'
  | 'onDismissProposedMark'
  | 'onRecoverChapter'
  | 'onPromptSelectText'
  | 'onChapterPlanSelect'
  | 'onEditMessage'
  | 'threadId'
  | 'prompting'
  | 'onGenerativeSubmit'
  | 'renderBusinessResult'
  | 'renderPlanCard'
>, 'pendingPermission'> & {
  /** 当前待审批（无则 null；缺省 null） */
  pendingPermission?: AgentApprovalPending | null
}

export interface ChatMessageListProps extends ChatMessageListBubbleContext, HTMLAttributes<HTMLDivElement> {
  /** 包权威 feed 消息（宿主经 `useAcpActiveMessages` 等订阅后传入） */
  messages: ChatMessage[]
  /**
   * 稳定线程身份：时间线 `scopeKey`、滚动快照绑定、气泡 `threadId` 均用此值。
   * 宿主切线程时改 `key` 重挂载（与旧 `ThreadMessageList` 一致），迟到回调仍带旧 id。
   */
  threadId: string
  /** 回合进行中（宿主 `prompting` 直传；缺省 false） */
  prompting?: boolean
  /**
   * 线程用量后缀文案（如“已用 8.3k tokens”，宿主 `formatUsageText` 计算后传入；
   * 只在 thinking/composing 相且有值时显示；缺省不显示）。
   */
  usageText?: string
  /** 滚动快照初值（宿主按线程记忆传入；无则贴底） */
  initialScroll?: ChatScrollSnapshot | null
  /** 滚动快照变更通知（宿主落盘；首参即绑定线程 id） */
  onScrollSnapshot?: (threadId: string, snapshot: ChatScrollSnapshot) => void
  /** 外部消息容器 ref（宿主右键选区/布局探针共用；缺省包内自持） */
  contentRef?: Ref<HTMLDivElement>
  /** 底部哨兵 ref（外部滚动定位契约；缺省包内自持） */
  bottomRef?: Ref<HTMLDivElement>
  /** 空态（宿主品牌标识/认证提示/运行时名；无消息时渲染；缺省空） */
  emptyState?: ReactNode
  /**
   * 工作记录渲染槽（缺省包内 `ChatActivityGroup` + 同组业务透传；
   * 仅当宿主需要替换整组渲染时传入）。
   */
  renderWorkLog?: (group: ChatWorkLogItem, running: boolean) => ReactNode
  /**
   * 每条消息气泡下方追加的宿主内容（朗读按钮、来源标签等）。缺省不渲染，
   * DOM 与未提供时一致（不新增包裹层）。`message.id` 即宿主原始消息 id，
   * 宿主可据此回查自己的数据；空内容时返回 `null` 即可不占位。
   */
  renderMessageFooter?: (message: ChatMessage) => ReactNode
  /**
   * 外链点击拦截：返回 `true` 表示宿主已处理（组件 `preventDefault`），返回 `false` 保留默认。
   * 桌面宿主（Tauri / Electron）必须接管，否则 webview 会就地导航。
   */
  onLinkClick?: (href: string) => boolean | void
  // 其余未知 props（`className/style/onContextMenu/data-*` 等）透传根容器：
  // 右键外壳 `asChild` 经 Slot 把 `onContextMenu` 注入直接子节点，
  // 宿主传包组件作子节点时由此落在根 div，行为与旧裸 div 一致。
}

export interface ChatMessageListHandle {
  /** 回到底部并恢复跟随（宿主右键“回到底部”等经此调用） */
  scrollToBottom: () => void
}

function assignRef(ref: Ref<HTMLDivElement> | undefined, el: HTMLDivElement | null) {
  if (!ref) return
  if (typeof ref === 'function') {
    ref(el)
    return
  }
  ;(ref as RefObject<HTMLDivElement | null>).current = el
}

export const ChatMessageList = memo(function ChatMessageList(
  props: ChatMessageListProps & { ref?: Ref<ChatMessageListHandle> },
) {
  const {
    messages,
    threadId,
    prompting = false,
    pendingPermission = null,
    usageText,
    initialScroll,
    onScrollSnapshot,
    contentRef: contentRefProp,
    bottomRef: bottomRefProp,
    emptyState,
    renderWorkLog,
    renderMessageFooter,
    onLinkClick,
    ref,
    resolveMarkProposal,
    theme,
    navFlatIndex,
    onPermissionRespond,
    onDismissProposedMark,
    onRecoverChapter,
    onPromptSelectText,
    onChapterPlanSelect,
    onEditMessage,
    onGenerativeSubmit,
    renderBusinessResult,
    renderPlanCard,
    // 根 DOM 透传：右键外壳 `asChild` 经 Slot 把 `onContextMenu` 等注入直接子节点，
    // 此处铺根 div（className 与内部合并），行为与旧裸 div 一致。
    className: rootClassName,
    ...rootDomProps
  } = props
  const bubbleContext = {
    resolveMarkProposal,
    theme,
    navFlatIndex,
    onPermissionRespond,
    onDismissProposedMark,
    onRecoverChapter,
    onPromptSelectText,
    onChapterPlanSelect,
    onEditMessage,
    onGenerativeSubmit,
    renderBusinessResult,
    renderPlanCard,
  }
  const [nowMs, setNowMs] = useState(() => Date.now())
  // 宿主能力经 context 下传：气泡、工具卡里渲染的 Markdown 都能拿到外链拦截
  const uiContext = useMemo(() => ({ ...(onLinkClick ? { onLinkClick } : {}) }), [onLinkClick])
  const streamingAny = messages.some((m) => m.streaming) || prompting
  const runStatus = currentRunStatus(messages, pendingPermission != null, prompting)
  // 底部状态行显隐：有可见流式内容（思考/带文本回答）时让位；
  // 空占位（首包未到的 agent 空壳）只在 thinking 相让位给底部行（气泡自身返回 null），
  // 工具运行/组织回答等阶段气泡自带状态行，底部行让位，避免双行。
  const streamingContent = messages.some((m) => m.streaming && (m.role === 'thought' || (m.role === 'agent' && m.text.trim())))
  const emptyPlaceholder = messages.some((m) => m.streaming && m.role === 'agent' && !m.text.trim())
  const showRunStatusRow = prompting && !streamingContent && (runStatus.phase === 'thinking' || !emptyPlaceholder)
  const runStartedAt = messages.findLast(message => message.role === 'user')?.createdAt
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentInnerRef = useRef<HTMLDivElement | null>(null)
  const isNearBottomRef = useRef(initialScroll?.pinned !== false)
  const onScrollSnapshotRef = useRef(onScrollSnapshot)
  onScrollSnapshotRef.current = onScrollSnapshot
  const initialScrollRef = useRef(initialScroll)

  const setContentRef = useCallback((el: HTMLDivElement | null) => {
    contentInnerRef.current = el
    assignRef(contentRefProp, el)
  }, [contentRefProp])

  const checkNearBottom = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const near = distance <= 96
    isNearBottomRef.current = near
    // 离底时冻结当前窗口；重新贴底才跟随新消息。
    setChatWindow((prev) => {
      const start = near ? null : prev.start ?? Math.max(0, messagesLengthRef.current - prev.count)
      return start === prev.start ? prev : { ...prev, start }
    })
    // 滚动快照即通知宿主落盘：离底/贴底翻转不依赖后续 scroll 事件
    //（无位移滚轮、程序化滚动可能无事件，导致历史恢复读不到）。
    // 高频但宿主侧无订阅者重渲染，落盘由宿主 persist 节流合并。
    // 携带绑定线程 id，不临时读活动线程：切线程后本实例迟到回调仍写旧线程。
    onScrollSnapshotRef.current?.(threadId, {
      scrollTop: el.scrollTop,
      pinned: near,
      windowStart: near ? null : windowRef.current.start ?? Math.max(0, messagesLengthRef.current - windowRef.current.count),
      windowCount: windowRef.current.count,
    })
  }, [threadId])

  // chunk 与正文高度变化交给 Viewport 的 autoScroll，避免两套跟滚互相抢位置。

  // 新发送提问或进入思考：重置贴底并滚到底部
  const lastUserMsgId = useMemo(
    () => messages.findLast((m) => m.role === 'user')?.id,
    [messages],
  )
  const prevUserMsgIdRef = useRef(lastUserMsgId)
  useEffect(() => {
    if (lastUserMsgId && lastUserMsgId !== prevUserMsgIdRef.current) {
      // 新提问属于用户主动开始的新回合，恢复最新窗口。
      isNearBottomRef.current = true
      setChatWindow((prev) => (prev.start !== null ? { ...prev, start: null } : prev))
      const el = viewportRef.current
      if (el) {
        const reduceMotion =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? 'instant' : 'smooth' })
      }
    }
    prevUserMsgIdRef.current = lastUserMsgId
  }, [lastUserMsgId])

  useEffect(() => {
    if (prompting && isNearBottomRef.current) {
      const el = viewportRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
  }, [prompting])

  // 初次装载：有离底快照则恢复位置，否则贴底。
  // 用被动 effect：子级视口自身的挂载置底先跑，本级后跑才盖得住；
  // 挂载后 rAF 再补一次，防懒加载块撑高后的跟滚。
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const saved = initialScrollRef.current
    if (!saved || saved.pinned !== false) {
      el.scrollTop = el.scrollHeight
      return
    }
    el.scrollTop = saved.scrollTop
    // 挂载后下一帧再设一次：子级 autoScroll 与懒加载块撑高都可能抢置底，
    // 用户一帧内无法操作，无条件补设是安全的。
    const frame = requestAnimationFrame(() => {
      const target = viewportRef.current
      if (target) target.scrollTop = saved.scrollTop
    })
    return () => cancelAnimationFrame(frame)
  }, [threadId])

  const handleScrollToBottom = useCallback(() => {
    isNearBottomRef.current = true
    setChatWindow((prev) => (prev.start !== null ? { ...prev, start: null } : prev))
    const el = viewportRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [])

  useImperativeHandle(ref, () => ({ scrollToBottom: handleScrollToBottom }), [handleScrollToBottom])

  // 历史分页窗：初次只看末尾 N 条，上滑向前加载
  const [chatWindow, setChatWindow] = useState<{ start: number | null; count: number }>(() => {
    const saved = initialScroll
    return {
      start: saved?.pinned === false ? saved.windowStart ?? null : null,
      count:
        saved?.windowCount && Number.isSafeInteger(saved.windowCount)
          ? Math.max(CHAT_HISTORY_INITIAL_COUNT, Math.min(300, saved.windowCount))
          : CHAT_HISTORY_INITIAL_COUNT,
    }
  })
  const windowRef = useRef(chatWindow)
  windowRef.current = chatWindow
  const messagesLengthRef = useRef(messages.length)
  messagesLengthRef.current = messages.length

  // 转换为 assistant-ui Runtime 消息
  const convertedMessages = useMemo(() => {
    return messages.map((m) => ({
      id: m.id,
      role: m.role === 'user' ? ('user' as const) : m.role === 'system' ? ('system' as const) : ('assistant' as const),
      content: [{ type: 'text' as const, text: m.text || '' }],
    }))
  }, [messages])

  const runtime = useExternalStoreRuntime({
    messages: convertedMessages,
    convertMessage: (m) => m,
    isRunning: streamingAny,
    onNew: async () => {},
    onCancel: async () => {},
  })

  const visibleMessages = useMemo(() => {
    // 流式更新不能覆盖用户的历史窗口；贴底、主动发送或回底操作才恢复底锚。
    return sliceChatWindow(messages, isNearBottomRef.current ? null : chatWindow.start, chatWindow.count)
  }, [messages, chatWindow])
  const remainingOlder = messages.length - visibleMessages.length

  const preserveRef = useRef<{ height: number; top: number } | null>(null)

  const loadMore = useCallback(() => {
    const total = messagesLengthRef.current
    const w = windowRef.current
    const base = w.start ?? Math.max(0, total - w.count)
    if (base <= 0 && total <= w.count) return
    const el = contentInnerRef.current
    const viewport = viewportRef.current ?? resolveScrollViewport(el) ?? el?.parentElement
    if (viewport) {
      preserveRef.current = { height: viewport.scrollHeight, top: viewport.scrollTop }
    }
    isNearBottomRef.current = false
    setChatWindow({
      start: Math.max(0, base - CHAT_HISTORY_PAGE_STEP),
      count: w.count + CHAT_HISTORY_PAGE_STEP,
    })
  }, [])
  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore

  // 前补导致内容增高：paint 前恢复偏移
  const windowKey = `${chatWindow.start ?? 'end'}-${chatWindow.count}-${messages.length}`
  useLayoutEffect(() => {
    const preserved = preserveRef.current
    if (!preserved) return
    preserveRef.current = null
    const el = contentInnerRef.current
    const viewport = viewportRef.current ?? resolveScrollViewport(el) ?? el?.parentElement
    if (!viewport) return
    viewport.scrollTop = preserved.top + (viewport.scrollHeight - preserved.height)
  }, [windowKey])

  const inlinePresent = useMemo(() => planInlinePresent(messages, new Set(visibleMessages.map(m => m.id))), [messages, visibleMessages])

  const visibleIds = useMemo(() => new Set(visibleMessages.map((m) => m.id)), [visibleMessages])
  const timeline = useChatTimeline(messages, {
    pendingToolCallId: pendingPermission?.toolCallId,
    nowMs,
    visibleIds,
    scopeKey: threadId ?? 'default',
  })

  // 滑到顶部自动向前补（懒加载）
  useEffect(() => {
    const el = contentInnerRef.current
    if (!el) return
    const scroller = viewportRef.current ?? resolveScrollViewport(el) ?? el.parentElement?.parentElement ?? el.parentElement
    if (!scroller) return
    let frame: number | null = null
    const onScroll = (e?: Event) => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(() => {
        frame = null
        const target = (e?.target || e?.currentTarget || scroller) as HTMLElement
        const st = typeof target?.scrollTop === 'number' ? target.scrollTop : scroller.scrollTop
        const sh = typeof target?.scrollHeight === 'number' ? target.scrollHeight : scroller.scrollHeight
        const ch = typeof target?.clientHeight === 'number' ? target.clientHeight : scroller.clientHeight
        if (st > 200) return
        if (sh > 0 && ch > 0 && sh <= ch) return
        loadMoreRef.current()
      })
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [])

  const pendingOrphan =
    pendingPermission != null &&
    !timelineRendersInlineApproval(timeline, pendingPermission.toolCallId)

  useEffect(() => {
    if (!prompting) return
    setNowMs(Date.now())
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [prompting])

  const prevStreamingAny = useRef(streamingAny)

  useEffect(() => {
    const flipped = prevStreamingAny.current !== streamingAny
    prevStreamingAny.current = streamingAny
    const id = window.requestAnimationFrame(() => {
      logAcpLayoutProbe(contentInnerRef.current, {
        tag: 'ChatMessageList',
        role: 'list',
        streaming: streamingAny,
        force: flipped,
      })
    })
    return () => window.cancelAnimationFrame(id)
  }, [messages, streamingAny])

  return (
    <ChatUiProvider value={uiContext}>
    <div className={cn('relative min-h-0 min-w-0 flex-1', rootClassName)} {...rootDomProps}>
      <AssistantRuntimeProvider runtime={runtime}>
        <ThreadPrimitive.Root className="flex-1 flex flex-col min-h-0 h-full">
          <ThreadPrimitive.Viewport
            ref={viewportRef}
            data-testid="chat-viewport"
            autoScroll
            scrollToBottomOnInitialize={false}
            scrollToBottomOnRunStart={false}
            scrollToBottomOnThreadSwitch={false}
            onScroll={checkNearBottom}
            className="flex-1 overflow-y-auto overflow-x-hidden p-3 [scrollbar-gutter:stable]"
          >
            <div
              ref={setContentRef}
              data-acp-probe="message-list"
              className={cn('flex flex-col gap-3 min-w-0 max-w-full', AGENT_CHAT_COL_CLASS)}
            >
              {messages.length === 0 && emptyState ? <>{emptyState}</> : null}

              {remainingOlder > 0 ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    data-testid="chat-load-more"
                    onClick={() => loadMore()}
                    className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer shadow-xs"
                  >
                    加载更早消息（还剩 {remainingOlder} 条）
                  </button>
                </div>
              ) : null}

              {timeline.map((item) => {
                if (item.kind === 'work-log') {
                  const running =
                    item.turnKey ===
                      (lastUserMsgId
                        ? `turn:${threadId}:${lastUserMsgId}`
                        : `prefix:${threadId ?? 'default'}`) &&
                    (streamingAny || item.isActive)
                  return renderWorkLog ? (
                    <div key={item.key}>{renderWorkLog(item, running)}</div>
                  ) : (
                    <ChatActivityGroup
                      key={item.key}
                      group={item}
                      running={running}
                      resolveMarkProposal={resolveMarkProposal}
                      pendingPermission={pendingPermission}
                      navFlatIndex={navFlatIndex}
                      theme={theme}
                      onDismissProposedMark={onDismissProposedMark}
                      onPermissionRespond={onPermissionRespond}
                      onRecoverChapter={onRecoverChapter}
                      onPromptSelectText={onPromptSelectText}
                      onChapterPlanSelect={onChapterPlanSelect}
                      onEditMessage={onEditMessage}
                      threadId={threadId}
                      prompting={prompting}
                      onGenerativeSubmit={onGenerativeSubmit}
                      renderBusinessResult={renderBusinessResult}
                      renderPlanCard={renderPlanCard}
                    />
                  )
                }

                const bubble = (
                  <ChatMessageBubble
                    key={item.key}
                    message={item.message}
                    inlinePresentSlots={inlinePresent.slotsByMessage.get(item.message.id)}
                    suppressPresentResult={inlinePresent.claimedToolIds.has(item.message.id)}
                    runStatus={runStatus}
                    resolveMarkProposal={resolveMarkProposal}
                    pendingPermission={pendingPermission}
                    onDismissProposedMark={onDismissProposedMark}
                    onPermissionRespond={(optionId) => {
                      onPermissionRespond?.(optionId)
                    }}
                    onRecoverChapter={onRecoverChapter}
                    onPromptSelectText={onPromptSelectText}
                    navFlatIndex={navFlatIndex}
                    renderBusinessResult={renderBusinessResult}
                    renderPlanCard={renderPlanCard}
                    onChapterPlanSelect={onChapterPlanSelect}
                    threadId={threadId}
                    prompting={prompting}
                    onGenerativeSubmit={onGenerativeSubmit}
                    onEditMessage={onEditMessage}
                    theme={theme}
                  />
                )
                // 未提供插槽时直接返回气泡本身：DOM 与旧行为逐字一致，不多包一层。
                if (!renderMessageFooter) return bubble
                const messageFooter = renderMessageFooter(item.message)
                if (!messageFooter) return bubble
                return (
                  <div
                    key={item.key}
                    className={cn('flex min-w-0 max-w-full flex-col', AGENT_CHAT_COL_CLASS)}
                  >
                    {bubble}
                    <div data-slot="chat-message-footer" className="min-w-0 max-w-full px-1">
                      {messageFooter}
                    </div>
                  </div>
                )
              })}

              {showRunStatusRow ? (
                <AgentLoadingState label={runStatus.label} awaitingApproval={runStatus.phase === 'approval'} seconds={runStartedAt ? Math.max(0, Math.floor((nowMs - runStartedAt) / 1000)) : null} usageText={usageText} />
              ) : null}

              {pendingOrphan && pendingPermission ? (
                <AgentPermissionCard
                  pending={pendingPermission}
                  onRespond={(optionId) => onPermissionRespond?.(optionId)}
                />
              ) : null}

              <div ref={bottomRefProp} />
            </div>

            <ThreadPrimitive.ViewportFooter className="sticky bottom-0 z-10 flex justify-center pointer-events-none h-0 overflow-visible">
              <ThreadPrimitive.ScrollToBottom asChild>
                <button
                  type="button"
                  aria-label="回到底部"
                  title="回到底部"
                  onClick={handleScrollToBottom}
                  className="absolute bottom-3 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/90 backdrop-blur text-xs text-muted-foreground hover:text-primary hover:border-primary/40 shadow-md transition-all cursor-pointer disabled:invisible disabled:pointer-events-none"
                >
                  <ArrowDown className="size-3.5" />
                  回到底部
                </button>
              </ThreadPrimitive.ScrollToBottom>
            </ThreadPrimitive.ViewportFooter>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </AssistantRuntimeProvider>
    </div>
    </ChatUiProvider>
  )
})
