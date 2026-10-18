# montree-chat

Montree 聊天 SDK：ACP 协议契约、批注/阅读器复用逻辑与聊天渲染 UI 的独立仓库。
从 `montree` 主仓 `packages/` 整体迁出（历史留在主仓，本仓从 0.1.0 起独立版本）。

## 包

| 包 | 说明 |
|---|---|
| `@yitom/contracts` | 协议契约：类型/错误/IPC 通道（纯类型 + 轻逻辑） |
| `@yitom/reader-core` | 阅读器纯逻辑（EPUB/PDF 导航、选区、批注几何） |
| `@yitom/annotations` | 批注纯逻辑（marks/提议/Anki 导出输入） |
| `@yitom/chat-core` | 聊天纯逻辑：feed 归约、时间线分组、工具展示映射（零 React） |
| `@yitom/chat-ui` | 聊天渲染 UI：Streamdown 正文、气泡、工作记录、artifact 卡（Base UI 原语，见包 README 消费方接入） |
| `@yitom/chat-session` | 会话绑定：线程 store、ACP 事件 ingest、ChatPanel |

依赖闭包自洽：对外只需 `react`/`react-dom` peer（`^19.2.8`）。

## 在其他项目使用

- [UI 接入指南](packages/chat-ui/README.md#从其他项目接入)：安装、Tailwind/主题、受控列表示例、滚动恢复和业务槽位。
- [会话接入说明](packages/chat-session/README.md)：线程状态、存储/传输端口、异步回合与可选 ChatPanel。
- 渲染组件不依赖 Montree 宿主/Electron；模型请求、认证和业务副作用由消费方接入。只渲染消息时可单独消费 chat-ui。

## 开发

```bash
bun install
bun run typecheck   # 全包类型检查（@yitom/* 经 tsconfig paths 指源码）
bun run test        # vitest 全包（同上，见 vitest.config.ts）
bun run build       # tsc project-references 逐包 emit 到 dist（拓扑序）
```

## 发版

```bash
git tag pkg-v0.1.0 && git push origin pkg-v0.1.0
```

`publish.yml` 构建后逐包 `npm publish --access public --provenance`，已存在版本自动跳过。
首次发版前需在仓库 Secrets 配 `NPM_TOKEN`，`@yitom` scope 需开通。

## 发版纪律（锁步）

六包同版本号一起发（`0.1.x` 对齐），禁止单独发某一个包。原因：branded nominal 类型
（如 `ChapterKey` 的 `unique symbol`）要求消费树里每个包只有一个副本；版本一旦错开，
包管理器就会装出 `0.1.0` 与 `0.1.1` 两份实例，类型直接互斥。消费方（主仓）用
`overrides` 把六包钉到同一版本，发版后记得同步改那边的 overrides。
