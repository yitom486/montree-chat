/**
 * PDF OCR 缓存与组件状态。
 * 用 fileFingerprint 当缓存键（文件内容变了旧缓存自动失效），不要只用路径。
 */
export const PDF_OCR_SCALE_OPTIONS = [1.5, 2, 2.5];
export const DEFAULT_PDF_OCR_SCALE = 2;
/** 目录页固定清晰档：仅 5 页左右，提清成本可忽略，正文仍走用户档 */
export const DEFAULT_PDF_TOC_SCALE = 2.5;
/** 目录页探测固定低清档：只做范围建议，正式识别仍走 2.5 清晰档 */
export const DEFAULT_PDF_TOC_DETECT_SCALE = 1.5;
export const PDF_OCR_SCALE_OPTION_LABELS = [
    { value: 1.5, label: '快速' },
    { value: 2, label: '标准' },
    { value: 2.5, label: '清晰' },
];
/** 目录缓存版本；只用于标记新旧，不再作为丢弃依据（旧版走 legacy 评估） */
export const PDF_OCR_TOC_CACHE_VERSION = 7;
//# sourceMappingURL=ocr.js.map