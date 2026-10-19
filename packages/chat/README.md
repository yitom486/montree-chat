# @yitom/chat

Montree 聊天与阅读器 SDK 统一出口包（Umbrella Package）。

将 protocol contracts、reader-core、annotations、chat-core、chat-ui、chat-session 六大模块统一收拢，彻底解决多包版本锁步与多实例冲突。

## 安装

```bash
bun add @yitom/chat
```

对等依赖（若使用 UI 组件）：
```bash
bun add react@^19.2.0 react-dom@^19.2.0
```

## 子路径导入（环境解耦）

- `@yitom/chat`：开箱即用的通用 Agent 聊天组件（`ChatMessageList`, `ChatComposer`, `ChatPanel`）与常用数据类型。
- `@yitom/chat/contracts`：协议契约、类型与结果模型（零 React，适用 Node / Electron 主进程）。
- `@yitom/chat/reader-core`：阅读器导航、选区与排版纯逻辑。
- `@yitom/chat/annotations`：批注纯逻辑。
- `@yitom/chat/chat-core`：聊天状态机、时间线归约、工具映射（零 React 纯逻辑）。
- `@yitom/chat/chat-ui`：聊天渲染 UI 组件库（React 19 + Tailwind 4）。
- `@yitom/chat/styles.css`：自带的皮肤、关键帧动效与 Markdown 排版样式。
- `@yitom/chat/chat-session`：线程 store、ACP 事件处理与会话面板。

