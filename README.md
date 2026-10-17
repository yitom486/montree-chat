# montree-chat

Montree 聊天 SDK：ACP 协议契约、批注/阅读器复用逻辑与聊天渲染 UI 的独立仓库。
从 `montree` 主仓 `packages/` 整体迁出（历史留在主仓，本仓从 0.1.0 起独立版本）。

## 包

| 包 | 说明 |
|---|---|
| `@montree/contracts` | 协议契约：类型/错误/IPC 通道（纯类型 + 轻逻辑） |
| `@montree/reader-core` | 阅读器纯逻辑（EPUB/PDF 导航、选区、批注几何） |
| `@montree/annotations` | 批注纯逻辑（marks/提议/Anki 导出输入） |
| `@montree/chat-core` | 聊天纯逻辑：feed 归约、时间线分组、工具展示映射（零 React） |
| `@montree/chat-ui` | 聊天渲染 UI：Streamdown 正文、气泡、工作记录、artifact 卡（Base UI 原语，见包 README 消费方接入） |
| `@montree/chat-session` | 会话绑定：线程 store、ACP 事件 ingest、ChatPanel |

依赖闭包自洽：对外只需 `react`/`react-dom` peer（`^19`）。

## 开发

```bash
bun install
bun run typecheck   # 全包类型检查（@montree/* 经 tsconfig paths 指源码）
bun run test        # vitest 全包（同上，见 vitest.config.ts）
bun run build       # tsc project-references 逐包 emit 到 dist（拓扑序）
```

## 发版

```bash
git tag pkg-v0.1.0 && git push origin pkg-v0.1.0
```

`publish.yml` 构建后逐包 `npm publish --access public --provenance`，已存在版本自动跳过。
首次发版前需在仓库 Secrets 配 `NPM_TOKEN`，`@montree` scope 需开通（E404 确认空闲）。
