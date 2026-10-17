/** 纯文本/结构化数据格式 */
export type DataDocumentKind = 'csv' | 'tsv' | 'json' | 'log';
/** Office 文档格式 */
export type OfficeDocumentKind = 'docx' | 'xlsx' | 'pptx';
/** 当前打开内容的种类；web 用 http(s) URL 当 path，不是磁盘扩展名 */
export type DocumentKind = 'markdown' | 'pdf' | 'epub' | 'mobi' | 'web' | 'html' | DataDocumentKind | OfficeDocumentKind | 'unknown';
/** 走阅读器而不是 Markdown 编辑器的本地电子书 */
export type ReaderDocumentKind = Extract<DocumentKind, 'pdf' | 'epub' | 'mobi'>;
export declare function isWebDocumentPath(path: string): boolean;
export declare function getFileExtension(filePath: string): string;
export declare function getDocumentKind(filePath: string): DocumentKind;
export declare function isReaderDocumentKind(kind: DocumentKind): kind is ReaderDocumentKind;
export declare function isDataDocumentKind(kind: DocumentKind): kind is DataDocumentKind;
export declare function isOfficeDocumentKind(kind: DocumentKind): kind is OfficeDocumentKind;
export declare function isHtmlDocumentKind(kind: DocumentKind): boolean;
/** 工作区侧栏是否展示该扩展名（Markdown + 阅读器 + 数据表格 + Office + HTML 格式） */
export declare function isWorkspaceFileExtension(extension: string): boolean;
//# sourceMappingURL=document.d.ts.map