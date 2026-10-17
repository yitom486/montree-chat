/**
 * 统一内容审计契约（P0 已入库 PDF source='book-index'；P2.1 编辑器内存
 * source='editor-buffer'）。公开命名不绑定 PDF：未来 pdf-native /
 * workspace-file 复用同一命中结构。Agent 不得提交 fingerprint、路径、
 * SQL 或正则，查询一律绑定当前打开文档（渲染端快照侧绑定）。
 */
/** 检索词至少有效字符数（FTS trigram 短词查不到，保持一致） */
export const CONTENT_AUDIT_MIN_QUERY_CHARS = 3;
/** 单次最多返回条数 */
export const CONTENT_AUDIT_MAX_HITS = 10;
/** 单条正文上限（字符）；超长保留命中附近片段 */
export const CONTENT_AUDIT_HIT_TEXT_BUDGET = 1200;
/** 全部命中文本总预算（字符）；信封另留余量 */
export const CONTENT_AUDIT_RESPONSE_TEXT_BUDGET = 7800;
/** limit：缺省 10；必须为 1–10 整数，否则返回 null（调用方报 INVALID_ARGUMENT） */
export function parseContentAuditLimit(value) {
    if (value === undefined || value === null)
        return CONTENT_AUDIT_MAX_HITS;
    if (typeof value !== 'number' || !Number.isInteger(value))
        return null;
    if (value < 1 || value > CONTENT_AUDIT_MAX_HITS)
        return null;
    return value;
}
/** 有效检索词：去空白后至少 3 个字符（按码点计），否则返回 null */
export function normalizeContentAuditQuery(value) {
    if (typeof value !== 'string')
        return null;
    const query = value.trim();
    if ([...query].length < CONTENT_AUDIT_MIN_QUERY_CHARS)
        return null;
    return query;
}
function findLiteralOccurrences(textLower, needleLower) {
    const at = [];
    if (!needleLower)
        return at;
    let from = 0;
    for (;;) {
        const index = textLower.indexOf(needleLower, from);
        if (index < 0)
            return at;
        at.push(index);
        from = index + needleLower.length;
    }
}
/**
 * 命中位置：以返回文本中的全部字面命中计算（大小写不敏感，原文不改写）。
 * 多处命中一律 multiple；单处看是否贴着首尾（首尾纯空白容忍）。
 */
export function resolveContentAuditMatchPosition(text, query) {
    const occurrences = findLiteralOccurrences(text.toLowerCase(), query.toLowerCase());
    if (occurrences.length > 1)
        return 'multiple';
    if (occurrences.length === 0)
        return 'middle';
    const at = occurrences[0] ?? 0;
    const leading = /^\s*/.exec(text)?.[0].length ?? 0;
    const trailing = /\s*$/.exec(text)?.[0].length ?? 0;
    const atStart = at <= leading;
    const atEnd = at + [...query].length >= text.length - trailing;
    if (atStart && atEnd)
        return 'start';
    if (atStart)
        return 'start';
    if (atEnd)
        return 'end';
    return 'middle';
}
/**
 * 以首个命中为中心截取 budget 字符窗口；命中必在窗内。
 * 短文本原样返回 truncated=false。
 */
export function windowContentAuditText(text, query, budget) {
    if (text.length <= budget)
        return { text, truncated: false };
    const safeBudget = Math.max([...query].length, 1);
    const at = text.toLowerCase().indexOf(query.toLowerCase());
    const anchor = at < 0 ? 0 : at;
    let start = Math.max(0, anchor - Math.floor((budget - Math.min(safeBudget, budget)) / 2));
    let end = start + budget;
    if (end > text.length) {
        end = text.length;
        start = Math.max(0, end - budget);
    }
    return { text: text.slice(start, end), truncated: start > 0 || end < text.length };
}
//# sourceMappingURL=content-audit.js.map