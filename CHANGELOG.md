# 更新日志

记录 montree-chat 各包（`@yitom/*`，锁步发布）的主要变更。

## [未发布]

## [0.1.26] - 2026-10-22

- **chat-ui：`ChatMarkdown` 不再覆盖外层链接拦截**：此前每个 `ChatMarkdown` 都用自己的（未传时为空）`onLinkClick` 包一层 Provider，把 `ChatMessageList` 传入的宿主拦截覆盖掉，导致经列表接入的宿主收不到链接点击、webview 就地导航。现在未传时继承外层。新增单测。
- **chat-core：批注提议快照按 toolCallId 关联**：`attachMarkProposalsToCurrentTurn` 支持 `toolCallId`（参数或快照 JSON 的 `toolCallId` / `_meta.toolCallId`），只挂到同一调用、无匹配不乱挂；无 id 时优先已回显同一结果的调用，最后才退回最新一条，并行多次提议不再串卡。新增单测。
- 全部 `@yitom/*` 同步升级到 0.1.26。

## [0.1.25] - 2026-10-22

- **chat-ui：聊天气泡内批注提议「采用并保存」写库并带上用户改稿**：`ChatMessageBubble` / `ChatMessageList` 新增 `onAdoptMarkProposal(proposal, note)` 与 `onMarkProposalError`。`note` 是用户在卡片里编辑后的文本；写库成功才落定 adopted，失败保持待确认并回传错误。批量列表采用时同样使用改后的批注。新增单测。
- 全部 `@yitom/*` 同步升级到 0.1.25。

## [0.1.24] - 2026-10-22

- **contracts · 新增快照资源 `text-propose`**：`MontreeSnapshotResource` 并入 `'text-propose'`（Montree AI 修改建议：Agent 提议的文本修改先待用户审阅），桌面端不再需要类型断言。

## [0.1.23] - 2026-10-21

- **chat-ui · 流式结束不再替换已显示正文**：Streamdown 只要全文出现脚注 `[^x]` 就把整篇退化为单块，回答尾部一到脚注，前面所有块都会以新 key 重挂载（DOM 被替换、动画重放、选区丢失）。新增 `parseMarkdownIntoStableBlocks`：脚注之前的块保持原索引，只把首个含脚注的块到文末合并，脚注引用与定义仍同块配对。
- **chat-ui · 上滑看历史时发送不抢滚动**：恢复用户上翻意图跟踪（可信滚轮/触摸），离底阅读时发送新消息不再拉回底部，只把冻结窗口向后扩到最新让新提问可见；回到底部、向下滚到底或点「回到底部」后恢复跟随。
