# montree-chat — 协作与发版约定

六包锁步发布的聊天 SDK。对外只依赖 `react`/`react-dom` peer，组件不读宿主 store、不碰 IPC/Electron。

## 发版

发版只走 GitHub Actions，不要在本机 `npm publish`。

1. **改版本号**：`packages/*/package.json` 六个包同步改成同一版本（`contracts`、`annotations`、`reader-core`、`chat-core`、`chat-ui`、`chat-session`）。版本不一致会让消费方出现多份 branded 类型实例。
2. **本地验绿**：
   ```bash
   bun install
   bun run typecheck     # tsc --noEmit
   bun run test          # vitest run，当前 90 文件 / 706 用例
   bun run build         # 六包 tsc -p tsconfig.build.json
   ```
3. **提交并推 master**，然后打标签推标签触发发布：
   ```bash
   git tag pkg-v0.1.15
   git push origin master
   git push origin pkg-v0.1.15
   ```
4. **监视到绿**：
   ```bash
   gh run list --workflow publish --limit 3
   gh run watch <run-id>
   ```
   `publish.yml` 只监听 `pkg-v*` 标签，在 ubuntu 上 `bun install && bun run build`，再执行 `bun scripts/publish.ts`：逐包比对 `npm view <name>@<version>`，已发布的跳过，因此**重跑标签幂等**，不会重复发同一版本。
5. **发完核对**：`npm view @yitom/chat-ui@<version> version` 逐个确认；消费方升级前不要改动应用侧代码。

失败时先看 `gh run view <run-id> --log-failed`。常见原因：`NPM_TOKEN` secret 过期、某包版本已存在但内容不同（需换版本号而不是覆盖）、六包版本不一致。

标签推上去却没有新工作流时（`gh run list --workflow publish` 里看不到该标签），说明这次 push 事件没被接收：删标签重推即可，`publish.ts` 幂等，已发的包会跳过。

```bash
git push origin :refs/tags/pkg-v0.1.15
git push origin pkg-v0.1.15
```

## 版本与兼容

- 六包版本号必须一致；`chat-ui` 的 peer 要求 `react`/`react-dom` `^19.2.8`。
- 新增公开 prop 属于 minor 变更，删除或改签名必须 major，并在包 README 的接口表同步。
- 组件不引入宿主依赖：业务副作用、认证、模型请求一律经回调回宿主。

## 消费方接入

- `@import "@yitom/chat-ui/styles.css";` 一次即可拿到形态与动效（关键帧、九格加载器、正文排版、动效 token）。宿主**只负责配色**：提供 shadcn 语义变量（`--foreground`/`--muted-foreground`/`--border`/`--card`/`--muted`/`--primary`），不配也有兜底值，不会出现隐形文字。
- `packages/chat-ui/README.md#从其他项目接入`：安装、Tailwind `@source`、必需的主题 token、`ChatMessageList` 受控用法、业务槽位。
- `packages/chat-session/README.md`：线程 store、ACP ingest、异步回合与可选 `ChatPanel`。
- 形态与动效归包，配色归宿主。新增动画时关键帧进 `packages/chat-ui/src/styles.css`（`@layer components`，宿主的 utilities 优先），不要在宿主里复制。

## 0.1.20 变更

- 新增外链拦截：`ChatMarkdown` 与 `ChatMessageList` 接受 `onLinkClick(href)`，返回非 `false` 即由宿主接管并 `preventDefault`。桌面宿主（Tauri/Electron）必须接，否则 webview 会就地导航。
- 新增 `ChatUiProvider` / `useChatUiContext`：列表把宿主能力经 context 下传，气泡与工具卡里的 Markdown 一并生效，宿主只需在列表上传一次。
- 测试 3 条（接管/放行/缺省）。

## 0.1.19 变更

- 新增 `ChatSettingsMenu`：会话参数弹层，`settings` 为「分组 + 当前值 + 选项 + onChange」数组，组件不认审批/思考等业务概念。
- 选项改为单选行（`role="radiogroup"` / `aria-checked`），避免弹层里再套 Select 的焦点与层级问题；选择后不关闭弹层。
- 测试 5 条（渲染、选中态、回调、禁用、hint、非默认提示点）；README 开箱组件表补一行。

## 0.1.18 变更

- 新增 `ChatEmptyState`：空态卡片（图标 / 标题 / 说明 / 提示 / 操作），替代各宿主自写的引导区。
- 新增 `ChatHistoryMenu`：会话历史弹层，条目只要 `{ id, title, subtitle?, timestamp? }`；新建、压缩、分叉、归档全部按回调存在与否渲染，也可当只读列表用；`footer` 放宿主开关。
- README 增加「开箱组件」整节：五个组件的 props 表、语义说明和一份直接可用的面板组合示例。
- 测试：新增 8 条（空态 2、历史弹层 6，含 Base UI 浮层的 happy-dom 兜底写法）。

## 0.1.17 变更

- 新增 `ChatComposer`：自增高 textarea、IME 三重守卫、Enter 发送 / Shift+Enter 换行、发送与停止按钮；`running` 只切换按钮与文案，不阻止「生成中追加引导」；模型选择、会话参数、排队动作经 `toolbarStart` / `renderActions` 槽位接入。带 6 条行为测试。
- 新增 `ChatStatusBadge`：连接/就绪/进行中/回退/失败统一成四档 tone + 呼吸点，宿主不再各写一套颜色分支。
- 新增 `ChatPanelHeader`：标题 + 状态行 + 右侧操作的三段式骨架。
- 目的：宿主只保留业务（谁连接、发什么、怎么排队），形态与键盘语义留在包内。

## 0.1.16 变更

- 新增 `@yitom/chat-ui/styles.css`（`exports["./styles.css"]`）：`fade-slide-in`、`beui-message-in`、`bui-fade-up`、`bui-shimmer-text`、`agent-pixel-pulse` 关键帧、九格像素加载器规则、`.markdown-preview.agent-md` 正文排版、`--chat-motion-*` 节奏 token。此前这些全靠宿主各自复制，漏一个就是「动画不动 / 标签隐形」。
- `BeuiThinkingShimmer`：渐变变量加 `currentColor` 兜底；动效从内联 animation 移到 `.chat-shimmer-text`，节奏可由宿主 token 覆盖。
- `scripts/build.ts` 构建时把 `styles.css` 拷进 `dist`（tsc 不处理 CSS）。


## 0.1.15 变更

- `ChatMessageList` 新增 `renderMessageFooter(message)`：逐条气泡下方追加宿主内容（朗读、来源标签）。`message.id` 即宿主原始消息 id；返回空值该条不占位；**不传时 DOM 与 0.1.14 逐字一致**。
- `agent-md` 正文字号 `12px → 14px`。
- `chat-core`：思考阶段开始时不再把「空回复占位」当成正文边界，修复流式正文被截断到占位消息的问题。
- `chat-session`：导出 `ingest/acp-update-intent`（纯适配层，不改宿主时序）。
