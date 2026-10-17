/**
 * 记忆卡片复习态的跨进程契约（[2]-02b 落库，UI 批接线）。
 *
 * 快照口径与 Anki 导出一致（有批注→basic，无批注→cloze），见
 * `apps/desktop/electron/services/flashcards-db.ts` 的 `deriveFlashcard`。
 * `id`恒等于来源 `ReadingMark.id`，渲染端按 id 与内存 marks join 出
 * 章节名/书名/deepLink 等展示字段。
 */
export {};
//# sourceMappingURL=flashcard.js.map