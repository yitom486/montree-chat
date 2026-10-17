/**
 * `montree_present` 呈现结果契约（S2）。
 *
 * Agent 调用本地 present 工具，把“要展示什么”声明成版本化、可校验的
 * 判别联合 JSON；渲染端只展示校验通过的内容，不伪造章号、位置或数据。
 * 校验与展示共用同一解析入口（`parsePresentResult`），两端行为一致。
 */
export const PRESENT_SCHEMA_VERSION = 1;
/** 单个结果序列化 UTF-8 上限（MCP 请求体 256KiB，留封装余量） */
export const PRESENT_MAX_BYTES = 128 * 1024;
/** HTML 源码上限（UTF-8 字节） */
export const PRESENT_MAX_HTML_BYTES = 96 * 1024;
/** 比较卡章节数范围 */
export const PRESENT_COMPARE_MIN_CHAPTERS = 2;
export const PRESENT_COMPARE_MAX_CHAPTERS = 6;
/** 比较卡最多条目数 */
export const PRESENT_COMPARE_MAX_ITEMS = 30;
/** 标题/单字段上限（字符） */
export const PRESENT_MAX_TITLE_CHARS = 200;
export const PRESENT_MAX_TEXT_CHARS = 2000;
/**
 * React artifact 挂载占位（不含引号）：主进程编译模板以 `"__MONTREE_MOUNT_ID__"`
 * 字面量发出渲染确认，渲染端按本次挂载 ID 做 JSON 字面量替换后送显。
 * 未替换的导出文件里它只是无监听者的普通字符串，不影响离线运行。
 */
export const REACT_ARTIFACT_MOUNT_TOKEN = '__MONTREE_MOUNT_ID__';
import { COMPONENT_UI_MAX_BYTES, validateComponentUiSpec, } from './component-ui';
/** FNV-1a 32bit（两端同实现；稳定 ID 基础） */
export function presentResultHash(canonical) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < canonical.length; i += 1) {
        hash ^= canonical.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}
/** 同一输入重放得到同一 ID；更新复用结果 ID（调用方传回即复用）。 */
export function presentResultId(kind, canonical) {
    return `present-${kind}-${presentResultHash(`${kind}${canonical}`)}`;
}
export function presentUtf8Bytes(text) {
    return new TextEncoder().encode(text).length;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function asTrimmedString(value, maxChars) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > maxChars)
        return null;
    return trimmed;
}
function asOptionalText(value, maxChars) {
    if (value === undefined || value === null)
        return undefined;
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    if (!trimmed)
        return undefined;
    return trimmed.slice(0, maxChars);
}
function asFlatIndex(value) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0)
        return undefined;
    return value;
}
function parseChapterRef(row) {
    if (!isRecord(row))
        return null;
    const key = asTrimmedString(row.key, 120);
    const label = asTrimmedString(row.label, PRESENT_MAX_TITLE_CHARS);
    if (!key || !label)
        return null;
    const flatIndex = asFlatIndex(row.flatIndex);
    return flatIndex === undefined ? { key, label } : { key, label, flatIndex };
}
function parseComparisonItem(row, chapterKeys) {
    if (!isRecord(row))
        return null;
    const id = asTrimmedString(row.id, 120);
    const dimension = asTrimmedString(row.dimension, PRESENT_MAX_TITLE_CHARS);
    const chapterKey = typeof row.chapterKey === 'string' ? row.chapterKey : '';
    if (!id || !dimension || !chapterKeys.has(chapterKey))
        return null;
    const excerpt = asOptionalText(row.excerpt, PRESENT_MAX_TEXT_CHARS);
    const note = asOptionalText(row.note, PRESENT_MAX_TEXT_CHARS);
    const flatIndex = asFlatIndex(row.flatIndex);
    return {
        id,
        dimension,
        chapterKey,
        ...(excerpt !== undefined ? { excerpt } : {}),
        ...(note !== undefined ? { note } : {}),
        verified: row.verified === true,
        ...(flatIndex === undefined ? {} : { flatIndex }),
    };
}
/**
 * 解析并校验呈现结果；失败返回 null（调用方保留可读失败/原始详情，
 * 不使整条消息崩溃）。未知 kind 与 schemaVersion !== 1 一律拒绝。
 */
export function parsePresentResult(value) {
    const input = typeof value === 'string' ? tryParseJson(value) : value;
    if (!isRecord(input))
        return null;
    if (input.schemaVersion !== PRESENT_SCHEMA_VERSION)
        return null;
    if (typeof input.id !== 'string' || !input.id.trim() || input.id.length > 160)
        return null;
    const title = asTrimmedString(input.title, PRESENT_MAX_TITLE_CHARS);
    if (!title)
        return null;
    const documentLabel = asOptionalText(input.documentLabel, PRESENT_MAX_TITLE_CHARS);
    const documentFingerprint = typeof input.documentFingerprint === 'string' && input.documentFingerprint.trim()
        ? input.documentFingerprint.trim().slice(0, 500)
        : undefined;
    const summary = asOptionalText(input.summary, PRESENT_MAX_TEXT_CHARS);
    const base = {
        schemaVersion: PRESENT_SCHEMA_VERSION,
        id: input.id.trim(),
        title,
        ...(summary !== undefined ? { summary } : {}),
        ...(documentFingerprint !== undefined ? { documentFingerprint } : {}),
        ...(documentLabel !== undefined ? { documentLabel } : {}),
    };
    if (input.kind === 'chapter-comparison') {
        if (base.documentFingerprint === undefined)
            return null;
        if (!Array.isArray(input.chapters))
            return null;
        if (input.chapters.length < PRESENT_COMPARE_MIN_CHAPTERS ||
            input.chapters.length > PRESENT_COMPARE_MAX_CHAPTERS) {
            return null;
        }
        const chapters = [];
        const keys = new Set();
        for (const row of input.chapters) {
            const parsed = parseChapterRef(row);
            if (!parsed || keys.has(parsed.key))
                return null;
            keys.add(parsed.key);
            chapters.push(parsed);
        }
        if (!Array.isArray(input.items) || input.items.length > PRESENT_COMPARE_MAX_ITEMS) {
            return null;
        }
        const items = [];
        const seenIds = new Set();
        for (const row of input.items) {
            const parsed = parseComparisonItem(row, keys);
            if (!parsed || seenIds.has(parsed.id))
                return null;
            seenIds.add(parsed.id);
            items.push(parsed);
        }
        return { ...base, kind: 'chapter-comparison', chapters, items };
    }
    if (input.kind === 'react-artifact') {
        if (typeof input.source !== 'string' || !input.source.trim() || presentUtf8Bytes(input.source) > PRESENT_MAX_HTML_BYTES)
            return null;
        if (input.css !== undefined && (typeof input.css !== 'string' || presentUtf8Bytes(input.css) > 16 * 1024))
            return null;
        return { ...base, kind: 'react-artifact', source: input.source, ...(typeof input.css === 'string' ? { css: input.css } : {}) };
    }
    if (input.kind === 'html-artifact') {
        if (typeof input.html !== 'string' || !input.html.trim())
            return null;
        if (presentUtf8Bytes(input.html) > PRESENT_MAX_HTML_BYTES)
            return null;
        if (input.inline !== undefined && typeof input.inline !== 'boolean')
            return null;
        return { ...base, kind: 'html-artifact', html: input.html, ...(input.inline !== undefined ? { inline: input.inline } : {}) };
    }
    if (input.kind === 'component-ui') {
        if (base.documentFingerprint === undefined)
            return null;
        if (!Array.isArray(input.chapters))
            return null;
        if (input.chapters.length < 1 ||
            input.chapters.length > PRESENT_COMPARE_MAX_CHAPTERS) {
            return null;
        }
        const chapters = [];
        const keys = new Set();
        for (const row of input.chapters) {
            const parsed = parseChapterRef(row);
            if (!parsed || keys.has(parsed.key))
                return null;
            keys.add(parsed.key);
            chapters.push(parsed);
        }
        if (typeof input.ui !== 'object' || input.ui === null)
            return null;
        if (validateComponentUiSpec(input.ui) !== null)
            return null;
        if (presentUtf8Bytes(JSON.stringify(input.ui)) > COMPONENT_UI_MAX_BYTES)
            return null;
        const submitLabel = asOptionalText(input.submitLabel, PRESENT_MAX_TITLE_CHARS);
        return {
            ...base,
            kind: 'component-ui',
            chapters,
            ui: input.ui,
            ...(submitLabel !== undefined ? { submitLabel } : {}),
        };
    }
    return null;
}
function tryParseJson(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
/** 信封整体上限；超限返回错误文案（调用方明确报错，不静默截断）。 */
export function presentResultSizeError(result) {
    if (presentUtf8Bytes(JSON.stringify(result)) > PRESENT_MAX_BYTES) {
        return `呈现结果超过 ${PRESENT_MAX_BYTES / 1024}KiB 上限，请减少章节/条目或精简内容后重试`;
    }
    return null;
}
//# sourceMappingURL=present-result.js.map