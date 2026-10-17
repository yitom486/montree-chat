/** 编辑器支持的 Markdown 相关扩展名（不含点） */
export const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'txt'];
/** 只读阅读器支持的扩展名（不含点） */
export const READER_EXTENSIONS = ['pdf', 'epub', 'mobi', 'azw3', 'azw'];
/** 结构化数据与日志支持的扩展名（不含点） */
export const DATA_EXTENSIONS = ['csv', 'tsv', 'json', 'log'];
/** Office 套件支持的扩展名（不含点） */
export const OFFICE_EXTENSIONS = ['docx', 'xlsx', 'pptx'];
/** HTML 网页与静态文档支持的扩展名（不含点） */
export const HTML_EXTENSIONS = ['html', 'htm'];
/** 带点号的扩展名集合，用于工作区扫描 */
export const MARKDOWN_EXTENSION_SET = new Set(MARKDOWN_EXTENSIONS.map((ext) => `.${ext}`));
export const READER_EXTENSION_SET = new Set(READER_EXTENSIONS.map((ext) => `.${ext}`));
export const DATA_EXTENSION_SET = new Set(DATA_EXTENSIONS.map((ext) => `.${ext}`));
export const OFFICE_EXTENSION_SET = new Set(OFFICE_EXTENSIONS.map((ext) => `.${ext}`));
export const HTML_EXTENSION_SET = new Set(HTML_EXTENSIONS.map((ext) => `.${ext}`));
export const ALL_DOCUMENT_EXTENSIONS = [
    ...MARKDOWN_EXTENSIONS,
    ...READER_EXTENSIONS,
    ...DATA_EXTENSIONS,
    ...OFFICE_EXTENSIONS,
    ...HTML_EXTENSIONS,
];
/** 工作区扫描支持的扩展名展示（带点） */
export const SUPPORTED_WORKSPACE_EXTENSION_LABEL = ALL_DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`).join(' / ');
//# sourceMappingURL=extensions.js.map