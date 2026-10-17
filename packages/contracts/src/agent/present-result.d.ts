/**
 * `montree_present` 呈现结果契约（S2）。
 *
 * Agent 调用本地 present 工具，把“要展示什么”声明成版本化、可校验的
 * 判别联合 JSON；渲染端只展示校验通过的内容，不伪造章号、位置或数据。
 * 校验与展示共用同一解析入口（`parsePresentResult`），两端行为一致。
 */
export declare const PRESENT_SCHEMA_VERSION: 1;
/** 单个结果序列化 UTF-8 上限（MCP 请求体 256KiB，留封装余量） */
export declare const PRESENT_MAX_BYTES: number;
/** HTML 源码上限（UTF-8 字节） */
export declare const PRESENT_MAX_HTML_BYTES: number;
/** 比较卡章节数范围 */
export declare const PRESENT_COMPARE_MIN_CHAPTERS = 2;
export declare const PRESENT_COMPARE_MAX_CHAPTERS = 6;
/** 比较卡最多条目数 */
export declare const PRESENT_COMPARE_MAX_ITEMS = 30;
/** 标题/单字段上限（字符） */
export declare const PRESENT_MAX_TITLE_CHARS = 200;
export declare const PRESENT_MAX_TEXT_CHARS = 2000;
/**
 * React artifact 挂载占位（不含引号）：主进程编译模板以 `"__MONTREE_MOUNT_ID__"`
 * 字面量发出渲染确认，渲染端按本次挂载 ID 做 JSON 字面量替换后送显。
 * 未替换的导出文件里它只是无监听者的普通字符串，不影响离线运行。
 */
export declare const REACT_ARTIFACT_MOUNT_TOKEN: '__MONTREE_MOUNT_ID__';
import { type ComponentUiSpec } from './component-ui';
export type PresentResultKind = 'chapter-comparison' | 'html-artifact' | 'component-ui' | 'react-artifact';
export interface PresentResultBase {
    schemaVersion: typeof PRESENT_SCHEMA_VERSION;
    kind: PresentResultKind;
    /** 稳定 ID：同一输入重放不生成新 ID（见 `presentResultId`） */
    id: string;
    title: string;
    summary?: string;
    /**
     * 来源文档指纹（chapter-comparison 必需，定位前校验归属；
     * html-artifact 无文档也可生成，此时缺省，定位不适用）。
     */
    documentFingerprint?: string;
    /** 来源文档展示名（失效引导用，不做校验） */
    documentLabel?: string;
}
export interface PresentChapterRef {
    /** 章节稳定键（与条目 chapterKey 对应） */
    key: string;
    label: string;
    /** 可定位时才有；缺失表示无定位内容 */
    flatIndex?: number;
}
export interface PresentComparisonItem {
    id: string;
    /** 比较维度（如“核心观点”“史料运用”） */
    dimension: string;
    chapterKey: string;
    excerpt?: string;
    note?: string;
    /** 摘录是否在对应章节正文中验证通过；false 不得提供定位入口 */
    verified: boolean;
    flatIndex?: number;
}
export interface PresentChapterComparison extends PresentResultBase {
    kind: 'chapter-comparison';
    chapters: PresentChapterRef[];
    /** 允许为空（卡片显示无数据状态，不算无效） */
    items: PresentComparisonItem[];
}
export interface PresentHtmlArtifact extends PresentResultBase {
    kind: 'html-artifact';
    /** 完整 HTML 源码片段（宿主负责套壳、CSP 与隔离，不在此校验脚本语义） */
    html: string;
    /** 内置 SVG 图表直接在聊天中展示；不改变隔离策略。 */
    inline?: boolean;
}
export interface PresentComponentUi extends PresentResultBase {
    kind: 'component-ui';
    /** 证据绑定章节（1–6 章，先读后呈，不编造摘录） */
    chapters: PresentChapterRef[];
    /**
     * 生成式 UI 树（与官方 GenerativeUISpec 同形，仅白名单组件）。
     * 宿主用官方 GenerativeUIRender 渲染，props 只含 JSON 数据。
     */
    ui: ComponentUiSpec;
    /** 提交按钮兜底文案（树内 Button 仍为准，此处仅无按钮时用） */
    submitLabel?: string;
}
export interface PresentReactArtifact extends PresentResultBase {
    kind: 'react-artifact';
    source: string;
    css?: string;
}
export type MontreePresentResult = PresentChapterComparison | PresentHtmlArtifact | PresentComponentUi | PresentReactArtifact;
/** FNV-1a 32bit（两端同实现；稳定 ID 基础） */
export declare function presentResultHash(canonical: string): string;
/** 同一输入重放得到同一 ID；更新复用结果 ID（调用方传回即复用）。 */
export declare function presentResultId(kind: PresentResultKind, canonical: string): string;
export declare function presentUtf8Bytes(text: string): number;
/**
 * 解析并校验呈现结果；失败返回 null（调用方保留可读失败/原始详情，
 * 不使整条消息崩溃）。未知 kind 与 schemaVersion !== 1 一律拒绝。
 */
export declare function parsePresentResult(value: unknown): MontreePresentResult | null;
/** 信封整体上限；超限返回错误文案（调用方明确报错，不静默截断）。 */
export declare function presentResultSizeError(result: MontreePresentResult): string | null;
//# sourceMappingURL=present-result.d.ts.map