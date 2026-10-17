/**
 * 统一内容审计契约（P0 已入库 PDF source='book-index'；P2.1 编辑器内存
 * source='editor-buffer'）。公开命名不绑定 PDF：未来 pdf-native /
 * workspace-file 复用同一命中结构。Agent 不得提交 fingerprint、路径、
 * SQL 或正则，查询一律绑定当前打开文档（渲染端快照侧绑定）。
 */
/** 命中来源；P0 只返回 'book-index'，不得伪造其他来源 */
export type ContentAuditSource = 'book-index' | 'pdf-native' | 'editor-buffer' | 'workspace-file' | 'ebook-section' | 'web-doc';
export type ContentAuditMatchPosition = 'start' | 'end' | 'middle' | 'multiple';
export interface ContentAuditHit {
    source: ContentAuditSource;
    locator: {
        /** PDF 页码（1-indexed）；editor-buffer / ebook-section 不返回，不得伪造 */
        pageNumber?: number;
        /** 章节标题；块无归属时为 null，不得编造 */
        chapterTitle?: string | null;
        /** blocks.id；editor-buffer / ebook-section 不返回 */
        blockId?: number;
        /**
         * workspace-file 才返回相对路径，editor-buffer / ebook-section 不得返回。
         * 永不返回绝对路径与盘符。
         */
        filePath?: string;
        /** editor-buffer / ebook-section：命中所在行（1-based） */
        lineStart?: number;
        /** 在线网页文档 URL */
        url?: string;
        /** 网页文档内标题锚点 */
        headingId?: string;
    };
    text: string;
    textTruncated: boolean;
    matchPosition: ContentAuditMatchPosition;
}
export interface ContentAuditResult {
    query: string;
    /** 精确总命中数；limit 只截断展示，不冒充总数 */
    total: number;
    /** 展示被截断（hits.length < total） */
    truncated: boolean;
    limit: number;
    hits: ContentAuditHit[];
}
/** 检索词至少有效字符数（FTS trigram 短词查不到，保持一致） */
export declare const CONTENT_AUDIT_MIN_QUERY_CHARS = 3;
/** 单次最多返回条数 */
export declare const CONTENT_AUDIT_MAX_HITS = 10;
/** 单条正文上限（字符）；超长保留命中附近片段 */
export declare const CONTENT_AUDIT_HIT_TEXT_BUDGET = 1200;
/** 全部命中文本总预算（字符）；信封另留余量 */
export declare const CONTENT_AUDIT_RESPONSE_TEXT_BUDGET = 7800;
/** limit：缺省 10；必须为 1–10 整数，否则返回 null（调用方报 INVALID_ARGUMENT） */
export declare function parseContentAuditLimit(value: unknown): number | null;
/** 有效检索词：去空白后至少 3 个字符（按码点计），否则返回 null */
export declare function normalizeContentAuditQuery(value: unknown): string | null;
/**
 * 命中位置：以返回文本中的全部字面命中计算（大小写不敏感，原文不改写）。
 * 多处命中一律 multiple；单处看是否贴着首尾（首尾纯空白容忍）。
 */
export declare function resolveContentAuditMatchPosition(text: string, query: string): ContentAuditMatchPosition;
export interface ContentAuditWindow {
    text: string;
    truncated: boolean;
}
/**
 * 以首个命中为中心截取 budget 字符窗口；命中必在窗内。
 * 短文本原样返回 truncated=false。
 */
export declare function windowContentAuditText(text: string, query: string, budget: number): ContentAuditWindow;
//# sourceMappingURL=content-audit.d.ts.map