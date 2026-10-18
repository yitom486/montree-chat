# @yitom/chat-ui

聊天渲染 UI 层：**无头 hooks + 默认样式组件**。不 import ACP 传输/session，不读宿主 store；所有交互经回调回宿主，再由宿主进 ACP。

## 从其他项目接入

### 选择接入层

| 需求 | 使用方式 |
|---|---|
| 只渲染 Markdown | `ChatMarkdown`；轻入口用 `@yitom/chat-ui/lazy` 的 `ChatMarkdownLazy` |
| 直接要一个能用的输入框 | `ChatComposer`：自增高 textarea、IME 防误触、Enter 发送、发送/停止；发送链路与工具区经 props 接入 |
| 自备消息、输入框和请求链路 | `ChatMessageList`：受控消息列表，包含历史分页、滚动恢复、工作记录、气泡与审批展示 |
| 自定义列表布局 | 单独组合 `ChatMessageBubble`、`ChatActivityGroup`，或用 `useChatTimeline` 自绘 |
| 同时需要线程 store、发送/取消及 ACP 映射 | 再接 `@yitom/chat-session`，见 [会话包说明](../chat-session/README.md) |

UI 包不依赖 Montree 的 Zustand store、IPC、Electron 或认证实现，也不主动调用模型。消息结构使用 `@yitom/chat-core` 的 `ChatMessage`；已有其他消息格式时由消费方转换。章节、批注和工具结果使用 SDK 的业务契约，通过可选槽位与回调接入，不要求复制 Montree 的阅读器。

`chat-session` 的 `ChatPanel` 是另一种包含输入框的现成组合，不是 Montree 壳的完整替代品；它不等于本节的 `ChatMessageList`，不要据此假定两者具有相同的历史窗口/滚动接口。

### 安装与版本

以下示例对应已发布的 `0.1.16`；React 对等依赖实际要求为 `^19.2.8`。

```bash
bun add @yitom/chat-ui@0.1.16 @yitom/chat-core@0.1.16 react@^19.2.8 react-dom@^19.2.8
```

默认组件使用 Tailwind 4。项目尚未配置时，按项目构建工具接入 Tailwind，再安装动画样式依赖：

```bash
bun add -d tailwindcss tw-animate-css
```

如果同时消费 `contracts`、`reader-core`、`annotations`、`chat-core`、`chat-ui`、`chat-session`，将实际消费的家族包统一到同一版本；已有项目可沿用根 README 的六包 overrides 策略，避免 branded 类型出现多份实例。只用 UI 不必手动安装全部六包，运行时依赖由包管理器处理。

### 样式与容器

引入一次包的皮肤与动效（关键帧、九格加载器、正文排版都在里面）：

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "streamdown/styles.css";
@import "katex/dist/katex.min.css";
@import "@yitom/chat-ui/styles.css";
@source "../node_modules/@yitom/chat-ui/dist";
```

`@source` 路径相对于该 CSS 文件，monorepo/hoist 布局需调整到实际安装目录。没有扫描包的 dist，会丢失工具卡、状态和按钮等 Tailwind 类。

`styles.css` 只是**形态与动效**，颜色仍然来自宿主主题：它消费 shadcn 语义变量（`--foreground`、`--muted-foreground`、`--border`、`--card`、`--muted`、`--primary`）并带兜底值，宿主没配主题时也不会出现隐形文字。规则包在 `@layer components`，宿主的 Tailwind utilities 永远优先，需要改样式直接加类名或在后面覆盖。动效节奏由 `--chat-motion-enter`、`--chat-motion-shimmer`、`--chat-motion-pixel` 控制。

默认组件还需要消费方提供 shadcn 风格的语义主题（例如 `background`、`foreground`、`card`、`popover`、`primary`、`secondary`、`muted`、`accent`、`border`、`input`、`ring` 及相应前景色）。包自带形态与动效（`styles.css`），但**不替宿主决定配色**，`theme="dark"` 也不会替宿主切换这些 CSS 变量。已有 shadcn/Tailwind 主题可以直接复用。正文排版（`.markdown-preview`/`.agent-md`）已随 `styles.css` 提供默认值，宿主需要不同字体或密度时再覆盖即可。

列表外层必须有确定高度，并允许 flex 子项收缩，例如下例中的 `h-[480px] min-h-0`，否则不会形成内部滚动区域。列表自己创建 assistant-ui runtime/provider，无需再为它创建另一套消息镜像。

### 最小受控消息列表

```tsx
import { useState } from 'react'
import { ChatMessageList, type ChatScrollSnapshot } from '@yitom/chat-ui'
import type { ChatMessage } from '@yitom/chat-core'

const initialMessages: ChatMessage[] = [
  { id: 'u1', role: 'user', text: '你好', createdAt: 1 },
  { id: 'a1', role: 'agent', text: '你好，有什么可以帮你？', createdAt: 2 },
]

export function ExampleChat() {
  const threadId = 'example-thread'
  const [messages] = useState(initialMessages)
  const [scrollByThread, setScrollByThread] = useState<Record<string, ChatScrollSnapshot>>({})

  return (
    <div className="flex h-[480px] min-h-0 flex-col">
      <ChatMessageList
        key={threadId}
        threadId={threadId}
        messages={messages}
        theme="light"
        prompting={false}
        pendingPermission={null}
        initialScroll={scrollByThread[threadId]}
        onScrollSnapshot={(id, snapshot) => {
          setScrollByThread(previous => ({ ...previous, [id]: snapshot }))
        }}
        resolveMarkProposal={() => { /* 本示例没有批注提议；接入该功能时替换为真实更新 */ }}
        emptyState={<p>开始新对话</p>}
      />
    </div>
  )
}
```

本例只展示 UI，不包含发送或模型连接。实际项目把自己的消息源、运行态和输入框接进来；追加正文和工具状态时以新数组/对象更新 props，不原地修改消息。流式消息使用 `streaming: true`，完成后清除；`prompting` 表示整个回合是否仍进行中。

切换线程时必须改变列表的 React `key`，按线程重建内部窗口与恢复状态；`initialScroll` 仅用于该次挂载初始化。快照回调的 `id` 是产生快照的线程，宿主按这个 id 保存，不能临时读取当前活动线程。示例只保存到内存；跨重载恢复需接宿主存储，跨窗口也由宿主自行划分作用域。高频快照在大型应用中可写入无订阅者的存储或由宿主合并保存，避免重绘整个页面。

### 开箱组件

除了消息列表，下面这些组件可以直接用，宿主只接业务回调：

| 组件 | 用途 | 关键 props |
|---|---|---|
| `ChatMessageList` | 消息区：历史窗口、贴底跟滚、工作记录、审批、回到底部 | `messages` / `threadId` / `prompting` / `renderMessageFooter` / `emptyState` |
| `ChatComposer` | 输入区：自增高、IME 防误触、Enter 发送、发送/停止 | `value` / `onValueChange` / `onSubmit` / `running` / `onStop` / `toolbarStart` / `renderActions` |
| `ChatPanelHeader` | 顶栏骨架：标题 + 状态行 + 右侧操作 | `title` / `status` / `subtitle` / `actions` |
| `ChatStatusBadge` | 状态胶囊：连接/就绪/进行中/回退/失败 | `tone` / `label` / `pulse` / `icon` / `title` |
| `ChatEmptyState` | 空态卡片：图标 + 标题 + 说明 + 提示 + 操作 | `title` / `description` / `hint` / `action` / `icon` |
| `ChatHistoryMenu` | 会话历史弹层：列表 + 新建 + 压缩/分叉/归档 | `entries` / `onSelect` / `onCreate` / `onCompact` / `onFork` / `onArchive` / `footer` |
| `ChatSettingsMenu` | 会话参数弹层：分组单选（审批、思考深度等） | `settings`（`{ id, label, value, options, onChange }[]`）/ `nonDefault` / `open` |

**`ChatComposer`**：`running` 只切换停止按钮与占位文案，**不阻止发送**（生成中允许追加引导）；需要硬拦截时传 `disabled`。`onSubmit` 返回 `false` 会保留草稿。`toolbarStart` 放模型/参数选择器，`renderActions` 放额外动作（如「加入下一轮队列」），发送与停止按钮由组件自己渲染。

**`ChatStatusBadge`**：四个 tone 分别是 `neutral`（未连接/进行中）、`positive`（已连接/就绪）、`warning`（回退/降级）、`danger`（失败）。`pulse` 给呼吸点，`icon` 可替换圆点。语义由宿主判断，组件只管呈现。

**`ChatHistoryMenu`**：`entries` 只需 `{ id, title, subtitle?, timestamp? }`；没传的回调对应的行内按钮不会渲染，因此也能当只读历史用。`onRefresh` 在打开弹层时触发。`footer` 放「保留新会话」这类开关。

**`ChatSettingsMenu`**：每个分组是「当前值 + 选项数组 + onChange」，组件不认任何业务概念（审批策略、思考档都由宿主定义）。选项用单选行而不是嵌套下拉——弹层已是一层浮层，再套 Select 会有焦点与层级问题；2–5 个短选项点一下即可。选择后弹层不关闭，方便连续改多项。

组合起来就是一个完整面板：

```tsx
import {
  ChatPanelHeader, ChatStatusBadge, ChatMessageList, ChatComposer, ChatEmptyState,
} from '@yitom/chat-ui'

export function ChatPanelShell({ connected, messages, threadId, draft, setDraft, send, busy, stop }) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border/60 bg-card">
      <ChatPanelHeader
        title="助手"
        status={<ChatStatusBadge tone={connected ? 'positive' : 'neutral'} label={connected ? '已连接' : '未连接'} />}
        subtitle="模型与轨道信息由宿主决定"
      />
      <ChatMessageList
        threadId={threadId}
        messages={messages}
        prompting={busy}
        resolveMarkProposal={() => {}}
        emptyState={<ChatEmptyState title="开始新对话" description="描述你的问题，或直接提问。" />}
      />
      <ChatComposer
        className="p-3 pt-1.5"
        value={draft}
        onValueChange={setDraft}
        onSubmit={(text) => { void send(text); return true }}
        running={busy}
        onStop={stop}
      />
    </div>
  )
}
```

### 业务槽位与操作

| 接口 | 消费方职责 |
|---|---|
| `pendingPermission` + `onPermissionRespond(optionId)` | 展示待审批数据；响应回传自己的权限服务，完成后更新待审批状态。仅传数据不会自动批准工具 |
| `renderBusinessResult(message, options)` | 渲染产品自己的工具结果，或组合包内图表/HTML/React/生成式卡片；列表默认不替宿主执行这些业务 |
| `renderPlanCard(message)` | 提供计划卡内容；不传时不渲染该业务槽 |
| `onGenerativeSubmit` / `onChapterPlanSelect` | 将卡片选择交给宿主，校验线程/会话后决定发送或导航 |
| `resolveMarkProposal` / 恢复与定位回调 | 宿主更新批注、导航或存储；不使用这些消息时无需接阅读器 |
| `onEditMessage` | 将用户原文回填自己的输入框，后续发送由宿主决定 |
| `renderMessageFooter(message)` | 在每条气泡下方追加宿主内容（朗读按钮、来源标签）；`message.id` 即宿主原始消息 id，返回空值该条不占位，整个插槽不传时 DOM 与旧行为逐字一致 |
| `ref: ChatMessageListHandle` | `scrollToBottom()` 回到底部并恢复跟随；可供宿主右键菜单调用 |
| `contentRef` / `bottomRef` / 根 DOM props | 获取正文容器/底部哨兵；接入选区、右键和自己的样式或事件 |

需要替换整个工作记录组时可用 `renderWorkLog`，不传则复用默认 `ChatActivityGroup`；逐条追加宿主内容用 `renderMessageFooter`。公开接口与完整字段以包导出的 `ChatMessageListProps`、`ChatMessage` 和各卡片 Props 为准，不依赖私有 `dist/ui/*` 路径。

下方“结构”和迁移清单保留了提取来源及历史阶段说明，消费方接入优先以上述公开入口和当前类型声明为准。


## 结构

- `ui/chat-markdown.tsx`：`ChatMarkdown`（自宿主 `AgentMarkdown` 整搬改名；主题经 `theme` prop 传入，`resolveMermaidTheme` 随搬；`streamdown/styles.css` 由消费方引入，库内无 CSS 副作用）。
- `ui/chat-markdown.lazy.tsx`：`ChatMarkdownLazy` + `ChatMarkdownFallback`（轻入口，仅 react + 包内 `cn`；宿主经 `@yitom/chat-ui/lazy` 子路径静态引用，重模块走 `React.lazy` 分块，不进首屏）。
- `ui/md-normalize.ts`（私有，不进 barrel）：`normalizeLatexDelimiters`（自 `@/lib/editor/latex-delimiters`）+ `normalizeRawSvgDataUriImages`（自 `@/lib/editor/markdown`），纯函数整搬。
- `ui/agent-permission-card`：`AgentPermissionCard`（自宿主 `AgentPermissionCard` 整搬；`pending` 作纯数据 prop，领取+发送改为必填 `onRespond` 回宿主；视觉复用包内 `BuiApprovalCard`）。
- `ui/tool-approval-slot`：`ToolApprovalSlot`（自宿主 `ToolApprovalSlot` 整搬；`pending` 改 prop 输入并透传 `onRespond`，命中判定 `toolMessageNeedsApproval` 逐字保留）。
- `ui/BuiMessage`：`BuiMessage`（用户右气泡 / 助手轻表面 / 系统居中；`cn` 改包内，余逐字）。
- `ui/BuiThinking`：`BuiThinking` + `BuiThinkingRow/Props`（受控 Thinking 头 + 时间线；内嵌 `BeuiThinkingShimmer` 经同包相对引用）。
- `ui/BeuiStreamingResponse`：`BeuiStreamingResponse`（streaming/complete 外壳；零依赖，逐字）。
- `ui/BeuiCitations`：`BeuiCitations` + `BeuiCitationItem`（折叠结构化来源；`cn` 改包内，余逐字）。
- `ui/BeuiAgentActivity`：`BeuiAgentActivity` + `BeuiActivityRow` + `BeuiActivityStatus`（过程表面；`cn` 改包内）。
- `ui/chat-activity-group.tsx` / `.test.ts`：`ChatActivityGroup` + `ChatWorkLogItem` + `ChatActivityGroupProps`（工作记录编排；运行中只显示最新工具、真实进度/耗时摘要、手动折叠跨 chunk 保留、落定收起一次后可展开全历史；工具详情复用包内 `ToolStateIcon`/`AgentToolCallCard`，审批/恢复/批注/主题/导航均经 props，业务与计划经渲染槽；不读宿主 store/API）。
- `ui/BeuiAgentProgress`：`BeuiAgentProgress` + `BeuiThinkingShimmer`（宿主计时经 props 传入；逐字）。
- `ui/AgentChatItem`：`AgentChatItem/Body` + 变体/语气类型 + 列宽常量（`Message` 壳与 DEV 布局探针改引包内私有复刻，余逐字）。
- `ui/AgentLoadingState`：`AgentLoadingState` + `currentRunStatus` + `useElapsedSeconds`（`AcpChatMessage` 即 core 的 `ChatMessage`，合并单包引用）。
- `ui/BuiApprovalCard`：`BuiApprovalCard` + `BuiApprovalOption`（`Button` 改引包内私有复刻，余逐字）。
- `ui/agent-message-bubble`：`ChatMessageBubble`（自宿主 `AgentMessageBubble` 整搬改名；`resolveMarkProposal` 必填去 store fallback、`pendingPermission` 改 prop、`onDismissProposedMark` 回宿主；M3c 收敛全部 R4（ToolCallCard/ResultEntry/ChapterMarkPlanCard/ProposeMark* 改包内相对，`GenerativeSubmitPayload` 改 `@yitom/chat-ui` 待 M3d barrel，stays 的 `ToolBusinessResult/AgentPlanCard` 改为可选 `renderBusinessResult/renderPlanCard` 槽、`hasBusinessResult` 改包内私有守卫；M4 主题 prop 化（`theme?: ChatMarkdownTheme`，缺省 `light`，宿主 `AgentMessageList/AgentActivityGroup/AnnotationNoteDialog` 传 `theme`，R4 清零）；`cn` 改包内、`AcpChatMessage` 即 core 的 `ChatMessage`，余逐字）。
- `ui/artifact-frame`：`ArtifactFrame` + `buildArtifactDocument/newArtifactMountId` + 隔离常量（自宿主 `tools/ArtifactFrame` 整搬；sandbox/CSP/来源+挂载 ID+2KiB 白名单/高度钳制逐字；`stripHostileHtmlHead` 与 `registerThemeParticipant/ThemeTransitionTarget` 包内复刻，`useArtifactZoom` 改同包相对）。
- `ui/artifact-zoom-surface`：`ArtifactZoomSurface` + `useArtifactZoom`（自宿主 `tools/ArtifactZoomSurface` 整搬；`Button` 改包内 `./button`，`Dialog` 改包内 `./dialog`，余逐字）。
- `ui/html-artifact-card`：`HtmlArtifactCard` + `ArtifactPreviewDialog/sanitizeArtifactFileName`（自宿主 `tools/HtmlArtifactCard` 整搬；`theme→colorScheme` prop、`fileApi.exportHtml+toast→onExport` 回调 prop；`Button/Dialog/cn/result-card/ArtifactFrame/ZoomSurface` 改包内相对）。
- `ui/component-ui-card`：`ComponentUiCard` + `GenerativeSubmitPayload/buildGenerativeSubmitTexts`（自宿主 `generative/ComponentUiCard` 整搬；`ArtifactZoomSurface/Button/cn/result-card` 改包内相对，`GenerativeUIRender` 保留）。
- `ui/component-ui-card.lazy`：`ComponentUiCardLazy`（自宿主 `generative/ComponentUiCard.lazy` 整搬；包内互引一律相对，懒块改 `./component-ui-card`）。
- `ui/react-artifact-card`：`ReactArtifactCard` + 内联高度/超时常量 + `ReactBuildStatus`（自宿主 `generative/ReactArtifactCard` 整搬；编译→`onCompile(source,css)`（`Result` 透传，编译器留主进程）、导出→`onExport(html,title)` 回调 props；`Button/result-card/cn/ArtifactFrame/ZoomSurface` 改包内相对，`isToolActiveStatus` 改 `chat-core`）。
- `ui/chapter-comparison-card`：`ChapterComparisonCard`（自宿主 `tools/ChapterComparisonCard` 整搬；`Button/result-card/cn` 改包内，`BeuiCitations` 改同包相对，余逐字）。
- `ui/agent-tool-call-card`：`AgentToolCallCard` + `MarkProposalFailureGuide/Code`（自宿主 `tools/AgentToolCallCard` 整搬；`pending` 改 prop（包内 `AgentApprovalPending` 全量结构）+ `onRespond` 回宿主，恢复操作改 `onRecoverChapter/onPromptSelectText` + `navFlatIndex`（分类纯函数包内复刻），业务卡改可选 `businessResultSlot`；`AgentChatItem`/`ToolApprovalSlot`/`Button` 改包内相对，`AgentDiffPreview`/`ai-elements/tool` 改包内私有复刻，`toolMessageNeedsApproval/isProposeMarkToolTitle/toToolDisplayModel` 改 `chat-core`，余逐字）。
- `ui/agent-result-entry`：`AgentResultEntry`（自宿主 `tools/AgentResultEntry` 整搬；`AgentChatItem/ToolCallCard` 改包内相对，`GenerativeSubmitPayload` 改 `@yitom/chat-ui` 待 M3d barrel，`ToolBusinessResult` 改可选 `businessResultSlot`，内卡 store props 透传；余逐字）。
- `ui/result-card`：`RESULT_CARD_SHELL/HEADER/ICON/SUMMARY` + `resultCardClassName`（自宿主 `tools/result-card` 整搬；`cn` 改包内，余逐字；M3c 公开进 barrel，M3d present 卡改包内相对引用）。
- `ui/diagram-viewer-card`：`DiagramViewerCard` + `DiagramPayload/VisualStep/Props` + `DiagramMermaidTheme`（自宿主 `tools/DiagramViewerCard` 整搬；间接 `MermaidBlock` 主题依赖改为可选 `renderMermaid(source)` 槽 + 可选 `mermaidTheme` 透传 prop，不复制 `MermaidBlock`；`Button/result-card/cn` 改包内相对，余逐字）。
- `ui/propose-mark-chat-block`：`ProposeMarkChatBlock/BlockList` + `ResolveMarkProposal`（自宿主 `propose/ProposeMarkChatBlock` 整搬；去 adopt fallback（`onAdopt/onDismiss/onResolved` 透传、`adoptProposedMark/toast` 移宿主经 `onError/onToast/onBatchAdopted` 回调，缺省静默）；`AgentChatItem`/`ProposeMarkCard`（包内私有复刻去 store）/`Button`/`cn` 改包内相对，余逐字）。
- `ui/chapter-mark-plan-card`：`ChapterMarkPlanCard` + `ChapterMarkPlanSelectPayload`（自宿主 `propose/ChapterMarkPlanCard` 整搬；`AgentChatItem` 改包内相对，`cn` 改包内，余逐字）。
- `ui/dialog.tsx`（私有，不进 barrel）：宿主 `components/ui/dialog` 的包内复刻（`cn` 改包内，另改引包内 `./button`；仅供本批 present 卡使用）。
- `ui/tool-shell.tsx` / `ui/agent-diff-preview.tsx` / `ui/propose-mark-card.tsx` / `ui/business-result-guard.ts`（私有，不进 barrel）：宿主 `ai-elements/tool`、`tools/AgentDiffPreview`、`propose/ProposeMarkCard`（去 store/toast 改回调）、`tools/ToolBusinessResult` 纯守卫（`hasBusinessResult/isUnparsablePresentResult` + 5 解析）的包内复刻（`cn/Button` 改包内，类型改 `chat-core`/`annotations`/`contracts`；仅供本批工具卡/气泡使用）。
- `ui/message-shell.tsx` / `ui/button.tsx` / `ui/layout-probe.ts` / `ui/dev-log.ts`（私有，不进 barrel）：宿主 `ai-elements/message`、`ui/button`、`lib/agent/acp-layout-probe`、`lib/agent/acp-dev-log` 的包内复刻（`cn` 改包内；`message-shell` 另以 `from` 内联联合替代 `ai` 类型导入）。宿主 `AgentActivityGroup` 适配器已随 C6 删除，工作记录渲染统一由包内 `ChatMessageList` 默认挂载 `ChatActivityGroup`。
- `headless/`：`useChatTimeline`、`useToolDisplay`（内联引用派生用 core 的 `planInlinePresent`/`splitInlinePresent`）、`chat-history-window`（`sliceChatWindow` 纯切片 + `CHAT_HISTORY_INITIAL_COUNT/PAGE_STEP` + `resolveScrollViewport` + `ChatScrollSnapshot`）——只返回“渲染什么”。文字显现统一由 Streamdown 原生动画负责。
- `ui/` 默认组件（决定“长什么样”，均经 barrel 导出；替换粒度见“无头/自定义”一节）：`ChatMarkdown`、`ChatMessageBubble`、`ChatActivityGroup`、`ChatMessageList`（受控列表容器：assistant-ui runtime/viewport、历史窗口与分页、时间线/气泡编排、贴底跟滚/上滑保持/滚动恢复、回到底部、运行状态行；宿主传消息/线程 id/运行态/快照初值与 `onScrollSnapshot`/业务槽位）、工具卡（`AgentToolCallCard`/`AgentResultEntry`/`DiagramViewerCard`/比较/审计/推荐卡）、审批（`AgentPermissionCard` + `ToolApprovalSlot`）、present 四件套（`ChapterComparisonCard`/`ComponentUiCard`/`ReactArtifactCard`/`HtmlArtifactCard` + 共享 `ArtifactFrame`）、提议块。宿主 `AgentMessageList` 只剩 store 订阅、快照落盘与业务接线。
- 回调（包内不调 `sendPrompt`，交互经回调回宿主再进 ACP；签名见“回调表”一节）：`resolveMarkProposal`、`pendingPermission`、`onDismissProposedMark`、`onPermissionRespond`、`onRespond`、`onCompile`、`onExport`、`onSubmit`、`onLocate`、`renderMermaid`、`renderBusinessResult`、`renderPlanCard`、`onEditMessage`、`onScrollSnapshot`（列表滚动快照，首参绑定线程 id）、`onQuote` 等引用类能力仍仅宿主侧（右键外壳留宿主）。

## 私有复刻清单（M4 定案，不删宿主文件）

原则：包永远不依赖宿主（R5），以下 11 个私有模块（不进 barrel）维持包内复刻现状；宿主原件无论是否仍被他处使用，一律保留不删。

- `ui/message-shell.tsx` ← `components/ai-elements/message`：宿主现 0 引用（孤儿），但宿主版依赖 `ai` 类型 + `@/lib/utils`（包引即 R4/R5）；包内以 `from` 内联联合去 `ai` 依赖，仅供 `AgentChatItem`。
- `ui/button.tsx` ← `components/ui/button`：宿主 80+ 引用（editor/data/quiz/shared/office/reader/layout 全域，聊天之外广泛使用）；包内 `cn` 改 `./cn`，仅供 `BuiApprovalCard` 等 present 卡。
- `ui/layout-probe.ts` ← `lib/agent/acp-layout-probe`：宿主仍被 `AgentMessageList` 调用；包内 `acpDevLog` 改 `./dev-log`，仅供 `AgentChatItem` DEV 探针。
- `ui/dev-log.ts` ← `lib/agent/acp-dev-log`：宿主仍被 `useAcpSession`/`useMontreeSnapshotHost`/`chat-slice`/`mark-proposal-dev-log` 广泛使用；包内逐字，仅供 `./layout-probe`。
- `ui/dialog.tsx` ← `components/ui/dialog`：宿主 14 处对话框仍用（AgentAuth/Provider、RemoteConnect、DiagramModal、Quiz、Settings 等，聊天之外广泛使用）；包内 `cn`/`Button` 改包内相对，仅供 `artifact-zoom-surface`/`html-artifact-card`。
- `ui/tool-shell.tsx` ← `components/ai-elements/tool`：包内 `cn` 改 `./cn`，供 `agent-tool-call-card` 与 `chat-activity-group` 共用工具状态图标及外壳。
- `ui/agent-diff-preview.tsx` ← `components/agent/tools/AgentDiffPreview`：宿主现 0 引用（已迁包后孤儿，保留不删）；包内类型改 `chat-core`（`ChatToolDiff`/`buildSimpleDiffLines`），仅供 `agent-tool-call-card`。
- `ui/propose-mark-card.tsx` ← `components/agent/propose/ProposeMarkCard`：宿主现 0 直接引用但保留 store/toast 版（`adoptProposedMark`/`dismissProposedMark`/`sonner` 包禁入）；包内去 fallback 改 `onAdopt`/`onDismiss`/`onResolved`/`onError`/`onToast` 回调，仅供 `propose-mark-chat-block`。
- `ui/business-result-guard.ts` ← `components/agent/tools/ToolBusinessResult` 纯守卫：宿主组件仍被 `AgentMessageList`/`AgentActivityGroup` 作 `businessResultSlot` 使用；包内仅复刻纯 `hasBusinessResult`/`isUnparsablePresentResult` + 5 解析（无 store/api/toast），仅供 `agent-message-bubble` 分流。
- `ui/cn.ts` ← `lib/utils` 的 `cn`：宿主 90+ 引用全域使用；包内同实现（`clsx` + `tailwind-merge`）避免 `@/`（R4），全包共用。
- `ui/md-normalize.ts` ← `lib/editor/latex-delimiters` + `lib/editor/markdown`：宿主仍被编辑器 `renderMarkdown`/`markdownParser` 与 `agent-markdown` 使用；包内仅取两纯函数（裁掉 `patchStreamingMathDelimiters`），仅供 `chat-markdown`，不读 store。

## 留在宿主、不进包

主进程 Sucrase 编译 React artifact、IPC `api/*`、workspace store、滚动落盘、中文文案、BeUI/Beautiful UI 视觉 copy（MIT 署名随包时再处理）、Electron 打包白名单。

## 门禁

- 本包是 monorepo 内**唯一允许 react** 的 `packages/*`（`lint:deps` R3 白名单，见 `scripts/check-deps.ts`）。
- 仍禁 electron / `node:` / `@/` / `apps/desktop`（R1/R2/R4/R5 无豁免）。
- 首屏预算不放宽：UI 入口必须懒加载（`check:bundle`）。

## 用法指南（外部 App 接入）

前提：调用方已用 `@yitom/acp-client` 建会话并持有 ACP 事件流。本包不碰 ACP 原语，只吃归一化后的 `ChatMessage[]`；ACP 原字段到本模型的映射发生在宿主 adapter（M4），包内不做。

### 1. 安装与版本要求

依赖关系（`private:true` 孵化期，毕业 M6 前仅 monorepo 内 workspace 引用）：

- `@yitom/chat-core`：纯 TS 显示模型与分组映射，`chat-ui` 强依赖它；外部 App 直接依赖它拿类型与纯函数。
- `@yitom/chat-ui`：本包，唯一允许 react 的包；另依赖 `@yitom/contracts`（present 四 kind 类型、`COMPONENT_UI_MAX_SUBMIT_BYTES`、`REACT_ARTIFACT_*` 常量、`Result`/`AppError`）与 `@yitom/annotations`（`ProposedMark`、`ChapterMarkPlanEntry` 等提议类型会出现在 props 中，消费方需一并安装）。
- peer：`react` / `react-dom` 均为 `^19.2.8`（抄包 `package.json` 原值，大版本不对不保证行为）。

CSS（M6 前临时方案，CSS 分发 M6 定）：

- `chat-markdown.tsx` 内联 `import 'streamdown/styles.css'`：消费方构建器须能处理包内 CSS import（Vite/webpack 默认可，Node 直跑不可）。
- KaTeX 样式：数学插件随包声明 `katex` 依赖；样式表现状由宿主全局样式表首行引入（`markdown-preview.css` 第一行即 `katex.min.css`），包内不自带；外部 App 在 M6 前需自行引入等价 KaTeX 样式，M6 随包 CSS 分发一并解决。
- 宿主全局样式（主题变量、`.agent-md`、动效、滚动条）现状仍在宿主全局样式表内，包不自带；外部 App 在 M6 前需自备等价 token，否则视觉降级为裸结构。

Tailwind（M4 教训，必须做）：Tailwind v4 自动扫描只覆盖渲染根，包内独用类会被 tree-shake（实例：比较卡容器查询类在构建产物中为 0 条，E2E 列数断言挂）。消费方须在全局样式加 `@source` 指向包源码目录，写法与宿主全局样式中的 streamdown 先例同式（路径按消费方相对位置调整，指向 `chat-ui` 的源码目录与 streamdown 的 dist JS 两处）。

主题：`ChatMarkdownTheme`（`'light' | 'dark' | 'sepia'`，与宿主 `AppTheme` 三态同形，定义在 `chat-markdown.tsx`）经 `theme` prop 逐层透传（`ChatMarkdownProps.theme`、`ChatMessageBubbleProps.theme`，缺省均为 `light`）。artifact 侧用另一套同形类型 `ThemeTransitionTarget`（定义在 `artifact-frame.tsx`，`HtmlArtifactCardProps.colorScheme` 经 postMessage 同步帧内主题）。mermaid 主题映射为纯函数 `resolveMermaidTheme`（sepia 取 neutral，见 `chat-markdown.tsx`）。双集合桥接语义：包内主题参与者集合与宿主集合相互隔离，宿主过渡函数须在约 160ms race 内同驱导出的 `notifyArtifactThemeParticipants`（参与者经 `registerArtifactThemeParticipant` 登记，均为单数形），否则带 requestId 的回执路径成死代码（M4 真回归，已修）。

### 2. 数据流三步

第一步：acp-client 事件 → 归一化 `ChatMessage`（宿主 adapter 做，包内不做）。字段表（定义在 `chat-message.ts`）：

| 本模型字段 | 说明 |
|---|---|
| `id` / `role`（`user \| agent \| thought \| tool \| plan \| system`）/ `text` | 身份与正文；`thought` 为思考过程，`plan` 卡走 `renderPlanCard` 槽 |
| `streaming` / `createdAt` / `updatedAt` | 流式态与计时来源；落定未知残留不得推断成功 |
| `attachments`（`AcpMessageAttachment[]`） | 用户消息附件摘要，不含 base64 |
| `toolCallId` / `toolKind` / `toolStatus` / `toolTitle` / `toolContentText` / `toolDiffs` / `toolLocations` / `turnEnded` | 工具卡全量输入；`toolStatus` 为 ACP 原状态，展示终态由 `toToolDisplayModel` 判定 |
| `planEntries`（`AcpPlanEntry[]`） | plan 卡数据 |
| `markProposal` / `markProposalStatus` / `markProposals[]` / `chapterMarkPlan[]` | 提议块数据：单提议（promote 前在 tool）与批量提议（promote 后挂 agent 下方） |
| `presentResult`（contracts 的 `MontreePresentResult`） | `montree_present` 四 kind，由 enrich 挂载，卡片分发只认它 |
| `steps[]`（`{ num, title, desc, anchorId? }`） | 交互经纬流转分步卡，锚点穿透为包内 DOM 行为，不经回调 |

第二步：`useChatTimeline` 分组 + `useToolDisplay` 状态；默认气泡把原文直接交给 Streamdown 的原生动画，不叠加截字队列。headless Hook 均不读 store：

- `useChatTimeline(messages, { pendingToolCallId?, visibleIds?, scopeKey?, nowMs? })`：按真实 user 边界切回合，同一回合普通过程合并为一条 `work-log`（含 `toolCallCount` / `hiddenToolCallCount` / `completedCount` / `lastEvent` / 计数与 `durationLabel`）；待审批、失败、未去重提议、富结果各自提升为单条 `message`；输出 `ChatTimelineItem`（`{ kind: 'message' } | { kind: 'work-log' }`）。
- `useToolDisplay(message, { needsApproval? })`：返回 `ToolDisplayModel`（7 终态 × 11 resultKind，见功能清单），审批优先于一切普通状态。

第三步：按 timeline 渲染与回调回宿主再进 ACP。文本/用户/思考走 `ChatMessageBubble`，`work-log` 走 `ChatActivityGroup`，富业务走 `AgentResultEntry` / 各 present 卡，正文走 `ChatMarkdown`。回调表（概念名 → 实际签名，去向为包模块文件名）：

| 任务概念名 | 实际 prop 与签名 | 去向文件 |
|---|---|---|
| onApprove | `onRespond(optionId: string \| null) => void`（必填，跨卡幂等由宿主实现保证） | `agent-permission-card.tsx`、`tool-approval-slot.tsx` |
| onApprove（工具卡/气泡透传） | `onRespond?` / `onPermissionRespond?(optionId: string \| null) => void` | `agent-tool-call-card.tsx`、`agent-message-bubble.tsx` |
| onSubmitSelection | `onSubmit?(payload: GenerativeSubmitPayload) => void \| Promise<void>` | `component-ui-card.tsx`、`react-artifact-card.tsx` |
| onSubmitSelection（气泡透传） | `onGenerativeSubmit?(payload: GenerativeSubmitPayload) => void` | `agent-message-bubble.tsx`、`agent-result-entry.tsx` |
| onLocate | `onLocateChapter?(flatIndex: number, excerpt?: string) => void` | `component-ui-card.tsx`、`chapter-comparison-card.tsx` |
| onLocate（图表） | `onHighlightAnchor?(anchorExcerpt: string) => void`、`onPinToDoc?(payload: DiagramPayload) => void`、`onSaveAsKnowledgeCard?(payload: DiagramPayload) => Promise<boolean> \| boolean` | `diagram-viewer-card.tsx` |
| onResolveProposal | `ResolveMarkProposal = (proposalId: string, status) => void`；单块 `onAdopt?(note)` / `onDismiss?()` / `onResolved?(status)` / `onNoteChange?` / `onError?` / `onToast?`；批量 `onAdopt?(proposalId, note)` / `onDismiss?(proposalId)` / `onResolved?(proposalId, status)` / `onError?` / `onBatchAdopted?(count)` | `propose-mark-chat-block.tsx` |
| onResolveProposal（气泡） | `resolveMarkProposal`（必填，无 store fallback）＋ `onDismissProposedMark?() => void`（落定后清草稿） | `agent-message-bubble.tsx` |
| onEdit | `onEditMessage?(text: string) => void`（用户消息“拿回输入框续改”，无分支重写语义；缺省不渲染按钮） | `agent-message-bubble.tsx` |
| onQuote | 宿主侧，无包内回调（右键外壳与引用草稿留宿主） | ——（宿主 `AgentMessageList` 侧 `AgentContextMenu`） |
| onRespond | 同 onApprove 行 | 同 onApprove 行 |
| onCompile | `onCompile?(source: string, css?: string) => Promise<Result<string, AppError>>`（编译器留主进程；缺省卡内报“编译器未注入”） | `react-artifact-card.tsx` |
| onExport（html 卡） | `onExport?() => void`（宿主实现原保存加 toast，取消静默） | `html-artifact-card.tsx` |
| onExport（react 卡） | `onExport?(html: string, title: string) => void`（与 html 卡签名不同，注意区分） | `react-artifact-card.tsx` |
| onDismissProposedMark | `onDismissProposedMark?() => void` | `agent-message-bubble.tsx` |
| renderMermaid | `renderMermaid?(source: string) => ReactNode`（不复制宿主渲染块；缺省降级源码 `pre`）＋ `mermaidTheme?` 透传（现状为接收但内部未启用，M6 清理） | `diagram-viewer-card.tsx` |
| renderBusinessResult | `renderBusinessResult?(message, opts: { threadId?, prompting?, onGenerativeSubmit? }) => ReactNode`；工具卡/结果入口侧为已求值节点 `businessResultSlot?: ReactNode` | `agent-message-bubble.tsx`、`chat-activity-group.tsx`、`agent-tool-call-card.tsx`、`agent-result-entry.tsx` |
| renderPlanCard | `renderPlanCard?(message) => ReactNode`（`role: 'plan'` 唯一渲染出口；缺省渲染空） | `agent-message-bubble.tsx`、`chat-activity-group.tsx` |

其余透传回调（同槽文件内）：章计划 `onSelectChapter?(payload: ChapterMarkPlanSelectPayload)`（`chapter-mark-plan-card.tsx`，气泡侧透传名为 `onChapterPlanSelect`）；工具失败恢复 `onRecoverChapter?(flatIndex?)` / `onPromptSelectText?()` / `navFlatIndex?`（`agent-tool-call-card.tsx`，气泡透传）；artifact 桥接 `onBridgeMessage?(msg: ArtifactBridgeMessage)`（`artifact-frame.tsx`）；预览对话框 `onOpenChange` / 内层 `onExport`（`html-artifact-card.tsx`）。

### 3. 最小可跑示例（伪代码，只用 barrel 真实符号）

`ChatMessageList` 受控列表：宿主传包 feed 消息、稳定线程 id、运行态与快照回调，业务槽位按需注入；右键外壳与落盘留宿主。

```tsx
import { ChatMessageList } from '@yitom/chat-ui';
import type { ChatMessage } from '@yitom/chat-core';
import type { ChatMarkdownTheme } from '@yitom/chat-ui';

function ChatView({ messages, theme }: { messages: ChatMessage[]; theme: ChatMarkdownTheme }) {
  return (
    <ChatMessageList
      messages={messages}
      threadId="thread-1"
      theme={theme}
      resolveMarkProposal={(id, status) => {/* 回宿主写库 */}}
      pendingPermission={null}
      onScrollSnapshot={(id, snapshot) => {/* 回宿主按线程落盘 */}}
    />
  );
}
```

### 4. 无头 / 自定义

- 三槽：`renderBusinessResult`（宿主业务卡注入；缺省不渲染）、`renderPlanCard`（plan 卡唯一出口）、`renderMermaid`（图表渲染器注入；缺省源码 `pre`，复制/步骤行为不变）。
- present 四件套各自替换粒度：`ChapterComparisonCard` / `ComponentUiCard`（另有 `ComponentUiCardLazy` 轻入口）/ `ReactArtifactCard` / `HtmlArtifactCard`（另有 `ArtifactPreviewDialog` 可单独复用对话框）均可绕过气泡单独挂载；`ArtifactFrame` 可独立使用（`buildArtifactDocument(source, mountId)` 纯函数组装受控文档，`newArtifactMountId()` 发挂载 ID）；`ChatMarkdown` / `ChatMarkdownLazy`（子路径轻入口，仅 react 加包内样式合并）可单独用于纯文本流。
- 全自研 UI 可行：只依赖 `chat-core`（模型加分组加映射）与三个 headless hook，自写渲染层；交互仍经上述回调回宿主进 ACP，包内不调发送。

## 功能清单（按 barrel 模块分组）

凡盘点标 stays 的一律写“宿主侧”，包内不虚构。

- headless（`use-chat-timeline.ts`）：回合分组；能力：user 边界切回合、普通过程并入 `work-log`、审批/失败/富结果提升单条；关键语义：输入只读、key 按作用域加回合稳定、计数含窗口外。
- headless（`chat-history-window.ts`）：历史窗口与视口定位；能力：`sliceChatWindow` 纯切片（贴底取末尾/冻结窗口不移位/越界钳制）、`CHAT_HISTORY_INITIAL_COUNT/PAGE_STEP`（初 5 步 5）、`resolveScrollViewport`（assistant-ui 视口优先，否则最近纵向滚动祖先）、`ChatScrollSnapshot`；关键语义：无 store 无持久化，快照线程绑定由调用方保证。
- 列表容器（`chat-message-list.tsx`）：`ChatMessageList` 加 `ChatMessageListHandle`（`scrollToBottom`）；能力：assistant-ui runtime/provider/viewport、历史窗口与分页、时间线/气泡编排、贴底跟滚/上滑保持/滚动恢复、回到底部按钮、运行状态行、孤立审批兜底；关键语义：只吃消息加线程 id 加运行态加快照回调加业务槽位，根 DOM props 透传（`asChild` 右键外壳兼容），监听/计时/rAF 卸载清理。
- headless（`use-tool-display.ts`）：工具展示映射；能力：单条消息映射 `ToolDisplayModel`；关键语义：审批优先，落定残留未知不推断成功。
- 富文本（`chat-markdown.tsx`）：Streamdown 单实例渲染；原生字符 `fadeIn`（150ms、字符间隔 8ms、排队上限 320ms），无额外块淡入或截字队列；代码/图表/公式不拆字，完成态无动画包装，减少动态效果沿宿主 CSS 生效。其余 code、mermaid、math、cjk、GFM、脚注与微插件保留；静态配置模块级提升保块 memo，mermaid 主题随 `theme` 翻转重绘。
- 富文本消毒（`chat-markdown.tsx` 加 core 的 `markdown-plugins.ts`、`url-policy.ts`）：链接白名单加消毒表；能力：`sanitizeAgentUrl` 统一清洗链接与图片源，裸 script/iframe 剥离，details/summary/kbd 放行；关键语义：raw 先转元素再按表剥离，货币美元符号转义先于 LaTeX 规范。
- 富文本轻入口（`chat-markdown.lazy.tsx`）：`ChatMarkdownLazy` 加 `ChatMarkdownFallback`；关键语义：经子路径静态引用、`React.lazy` 分块，不进首屏。
- 气泡壳（`BuiMessage.tsx`、`AgentChatItem.tsx`）：用户右气泡、助手轻表面、系统居中三件套；关键语义：纯展示壳，`streaming` 只换外衣不换结构。
- 思想链（`BuiThinking.tsx`、`BeuiAgentActivity.tsx`、`BeuiAgentProgress.tsx`、`BeuiStreamingResponse.tsx`、`BeuiCitations.tsx`）：受控思考头、过程表面、计时、流式外壳、引用来源；关键语义：展开态受控、计时由调用方传 `elapsedSeconds`、引用为折叠结构化来源。
- 加载态（`AgentLoadingState.tsx`）：`AgentLoadingState` 加 `currentRunStatus` 加 `useElapsedSeconds`；关键语义：空流式期占位，避免闪烁切换。
- 审批（`agent-permission-card.tsx`、`BuiApprovalCard.tsx`、`tool-approval-slot.tsx`）：卡加槽；能力：选项卡渲染、命中当前 pending 的工具才挂载、放折叠容器外；关键语义：同卡防重、跨卡幂等由宿主 `onRespond` 保证、无选项时兜底为允许/拒绝两项（孤儿兜底）。
- 消息气泡（`agent-message-bubble.tsx`）：`ChatMessageBubble`；能力：按 role 分发全部消息（system/user/thought/tool/agent 正文、提议、章计划、steps、内嵌 present 槽）；关键语义：`resolveMarkProposal` 必填去 fallback、`pendingPermission` 改 prop、富结果经 `renderBusinessResult` 槽、plan 经 `renderPlanCard` 槽。
- 工作记录（`chat-activity-group.tsx`）：`ChatActivityGroup`；能力：最新工具固定行、完整进度与失败/取消/未知计数、按需工具详情、思考和计划；关键语义：手动选择跨增量保留、落定只收起一次，主题与业务操作经 props，不依赖应用状态。
- 工具状态机（`agent-tool-call-card.tsx` 加 core 的 `tool-display-model.ts`）：`AgentToolCallCard`；能力：7 终态（`awaiting-approval/pending/in-progress/completed/failed/cancelled/unknown`）× 11 resultKind（diagram/cross-reference/content-audit/chapter-suggestion/chapter-comparison/html-artifact/component-ui/react-artifact/diff/text/none）；关键语义：落定自动收起、审批槽外挂、提议失败分类走 `navFlatIndex` 纯函数。
- 结果入口（`agent-result-entry.tsx`）：`AgentResultEntry`；能力：富业务紧凑过程行加独立业务卡，单次调用只渲染一处；关键语义：业务卡经 `businessResultSlot` 注入，store 改 props 透传。
- 结果卡底座（`result-card.ts`）：常量加 `resultCardClassName`；关键语义：四 present 卡统一壳。
- 图表卡（`diagram-viewer-card.tsx`）：`DiagramViewerCard`；能力：流转步骤/概览/Mermaid 三视图、紧凑入口、定位/钉入/存卡回调；关键语义：渲染经 `renderMermaid` 槽，缺省源码 `pre`。
- 提议块（`propose-mark-chat-block.tsx`）：`ProposeMarkChatBlock` 加 `BlockList` 加 `ResolveMarkProposal`；能力：单条采用/驳回、批量勾选采用、落定回调化；关键语义：去 adopt fallback，缺回调时仅落定不写库，toast 经 `onToast/onError/onBatchAdopted` 回宿主。
- 章计划卡（`chapter-mark-plan-card.tsx`）：`ChapterMarkPlanCard` 加 `ChapterMarkPlanSelectPayload`；能力：章级建议点选；关键语义：载荷自带可直接发送的 `promptText`/`displayText`。
- present 隔离底座（`artifact-frame.tsx`）：`ArtifactFrame` 加 `buildArtifactDocument` 加 `newArtifactMountId`；能力：sandbox 仅 `allow-scripts`、宿主 CSP 前置、`base`/全 `meta` 剥离、来源加挂载 ID 加 2KiB 白名单校验、高度钳制（120–1200px）加 300ms 限频加 2px 微差忽略；关键语义：调用方 key 按结果 ID 加挂载 ID 稳定，源码展开不得重建帧。
- present 主题桥（`artifact-frame.tsx`）：`registerArtifactThemeParticipants` 加 `notifyArtifactThemeParticipants`；关键语义：包内集合与宿主集合隔离，宿主过渡函数同驱，单参与者异常不牵连。
- present 放大表面（`artifact-zoom-surface.tsx`）：`ArtifactZoomSurface` 加 `useArtifactZoom`；关键语义：全屏门户容器，Esc 经桥接关闭。
- present 之比较卡（`chapter-comparison-card.tsx`）：`ChapterComparisonCard`；能力：章级对比加引用加定位；关键语义：定位经 `onLocateChapter` 回宿主。
- present 之交互界面卡（`component-ui-card.tsx`）：`ComponentUiCard`（另有 lazy 件）加 `GenerativeSubmitPayload` 加 `buildGenerativeSubmitTexts`；能力：白名单组件渲染、选择态本地 state、8KiB 提交上限、未知组件跳过、错误边界；关键语义：提交与定位只经回调，不直发模型不执行任意代码。
- present 之 React 卡（`react-artifact-card.tsx`）：`ReactArtifactCard` 加 `ReactBuildStatus`；能力：构建/编译/恢复/加载/就绪/编译失败/运行失败七态、源码查看、导出、重跑、框内分析请求确认链路；关键语义：编译经 `onCompile`（主进程 Sucrase 留宿主），加载 30s 超时只报失败不声称中止。
- present 之 HTML 卡（`html-artifact-card.tsx`）：`HtmlArtifactCard` 加 `ArtifactPreviewDialog` 加 `sanitizeArtifactFileName`；能力：内联预览、对话框预览（关闭卸载、重开 nonce 重置）、源码查看、导出；关键语义：主题经 `colorScheme`、导出经 `onExport`，脚本报错不触发保存。
- 宿主侧（不进包）：`AgentMessageList` 宿主薄适配（store 订阅、快照落盘、空态/usage 文案、业务槽位与回调、右键外壳）、`ToolBusinessResult`（文档归属校验、导航、落库、Query 失效编排；纯解析函数已在 core，卡组装留 adapter）、plan 卡（经 `renderPlanCard` 槽由宿主注入）。宿主 `AgentActivityGroup` 适配器与 `stick-to-bottom` 已随 C6 退出（前者由包 `ChatMessageList` 默认渲染代替，后者整搬为包 `headless/chat-history-window`）。

## 消费方接入（npm 独立仓新增）

- 原语：`ui/button.tsx` 与 `ui/dialog.tsx` 已由 Radix 切到 Base UI（`@base-ui-components/react`，`asChild` 改走 `render`，wrapper 层翻译，调用方零改动；`data-[state=…]` 改为 `data-[open|closed]`）。
- 样式：包内 Tailwind 类需消费方扫描本包（`@source` 指到 `node_modules/@yitom/chat-ui/dist`），`streamdown/styles.css` 与 KaTeX CSS 需消费方引入一次（库本身不带 CSS 副作用 import，Node 直跑安全）；弹窗进出场动画类（`animate-in/fade-in-0/zoom-in-95` 等）需消费方装 `tw-animate-css`（或等价 keyframes）。
- 对等依赖：`react`/`react-dom` 为 peer（`^19.2.8`）；其余运行时依赖随包安装。

## 协议对接（ACP SDK 为唯一真源）

- 本包不手写协议字段：所有 `session/update` 的识别与分发以官方
  `@agentclientprotocol/sdk` 的 `SessionUpdate` 联合类型为准；`ingest/acp-events.ts`
  的 `STD_SESSION_UPDATE_KIND` 单表 + 穷尽 switch，SDK 新增协议成员而无 case
  时编译直接报错（`AssertSdkCovered`），不可能再静默丢。
- 厂商扩展（定居标记/复数 config/tool 内容分块）显式隔离在 switch 之外，
  与标准成员互不干扰；未知 kind 有文本按旧兼容走 agent、无文本丢弃并上报。
- 因此 UI 层看到的每一种 loading/思考/工具/计划状态，都能反查到某一条
  协议更新：`currentRunStatus` 的 phase（thinking/tool/composing/waiting/approval）
  与 `agent_thought_chunk` / `tool_call*` / 进展消息一一对应，无“凭空状态”。

## Controlled composer

headless/use-chat-composer-controller.ts exports useChatComposerController: controlled draft, send/stop guards, attachment-only eligibility, and cancellable focus-to-end. The host supplies payload validation and attachment callbacks. Return false from onSubmit to preserve the draft. The hook has no key/composition listeners; the visual textarea remains the sole IME/Enter owner, preventing duplicate sends. No store or transport dependency.
