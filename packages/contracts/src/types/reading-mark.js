/**
 * 阅读书签 / 高亮 / 批注的跨阅读器数据契约。
 *
 * 锚点按 format 判别：PDF 有 V1 rect 与 V2 quad；不要把 CFI 塞进 PDF。
 * PDF V2 不只保存一套坐标，而是同时保存三层信息：
 *
 * 1. `quads`：PDF 页面用户空间中的视觉几何，用于在任意缩放、DPR 或旋转
 *    下重新绘制高亮/下划线；
 * 2. `begin` / `end`：PDF.js 文字 item 与字符偏移，用于按文字语义恢复选区；
 * 3. `quote`：选中文本及前后文，用于文字 item 顺序变化时的匹配兜底。
 *
 * `rects` 是 V1 兼容数据：它来自渲染 text layer/root 的归一化 viewport
 * 矩形，适合降级绘制，但不是 PDF 页面用户空间坐标。两套坐标不能直接
 * 比较或混用；绘制时应分别通过对应的 viewport 转换路径处理。
 */
export function toChapterKey(raw) {
    return raw;
}
/** 锚点 href/id 的归一化（与 reader-core normalizeLoadKey 同构；contracts 层零依赖，内联实现）。 */
function normalizeAnchorRef(raw) {
    if (!raw)
        return '';
    return raw.split('#')[0]?.toLowerCase() ?? raw.toLowerCase();
}
/**
 * 锚点规范键：同一段正文的卡片共享同一键，是"一卡一段、一段多卡"绑定关系
 * 在 DB 的体现（`marks.anchor_key` 抽取列 + 索引，去重/联查走索引）。
 * - epub：href（归一化）+ cfiRange/cfi
 * - pdf：page + begin/end（V1 无语义位置时只有 page，同页多卡同键、创建时间区分）
 * - mobi：chapterId（归一化）+ cfi
 * - web：url + headingId
 * 纯函数、无品牌类型，方便 SQL 回填与 TS 写入两侧对口径（见 marks-anchor-binding 单测）。
 */
export function canonicalAnchorKey(anchor) {
    switch (anchor.format) {
        case 'epub':
            return `epub|${normalizeAnchorRef(anchor.href)}|${anchor.cfiRange ?? anchor.cfi ?? ''}`;
        case 'pdf': {
            const begin = anchor.begin ? `${anchor.begin.itemIndex},${anchor.begin.offset}` : '';
            const end = anchor.end ? `${anchor.end.itemIndex},${anchor.end.offset}` : '';
            return `pdf|${anchor.page}|${begin}-${end}`;
        }
        case 'mobi':
            return `mobi|${normalizeAnchorRef(anchor.chapterId)}|${anchor.cfiRange ?? anchor.cfi ?? ''}`;
        case 'web':
            return `web|${anchor.url}|${anchor.headingId ?? ''}`;
    }
}
//# sourceMappingURL=reading-mark.js.map