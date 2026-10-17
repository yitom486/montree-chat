import { DATA_EXTENSION_SET, HTML_EXTENSION_SET, MARKDOWN_EXTENSION_SET, OFFICE_EXTENSION_SET, READER_EXTENSION_SET, } from '../constants/extensions';
export function isWebDocumentPath(path) {
    try {
        const url = new URL(path);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return false;
    }
}
export function getFileExtension(filePath) {
    const index = filePath.lastIndexOf('.');
    if (index === -1)
        return '';
    return filePath.slice(index).toLowerCase();
}
export function getDocumentKind(filePath) {
    if (isWebDocumentPath(filePath))
        return 'web';
    const extension = getFileExtension(filePath);
    if (MARKDOWN_EXTENSION_SET.has(extension))
        return 'markdown';
    if (HTML_EXTENSION_SET.has(extension))
        return 'html';
    if (extension === '.pdf')
        return 'pdf';
    if (extension === '.epub')
        return 'epub';
    if (extension === '.mobi' || extension === '.azw3' || extension === '.azw')
        return 'mobi';
    if (extension === '.csv')
        return 'csv';
    if (extension === '.tsv')
        return 'tsv';
    if (extension === '.json')
        return 'json';
    if (extension === '.log')
        return 'log';
    if (extension === '.docx')
        return 'docx';
    if (extension === '.xlsx')
        return 'xlsx';
    if (extension === '.pptx')
        return 'pptx';
    return 'unknown';
}
export function isReaderDocumentKind(kind) {
    return kind === 'pdf' || kind === 'epub' || kind === 'mobi';
}
export function isDataDocumentKind(kind) {
    return kind === 'csv' || kind === 'tsv' || kind === 'json' || kind === 'log';
}
export function isOfficeDocumentKind(kind) {
    return kind === 'docx' || kind === 'xlsx' || kind === 'pptx';
}
export function isHtmlDocumentKind(kind) {
    return kind === 'html';
}
/** 工作区侧栏是否展示该扩展名（Markdown + 阅读器 + 数据表格 + Office + HTML 格式） */
export function isWorkspaceFileExtension(extension) {
    return (MARKDOWN_EXTENSION_SET.has(extension) ||
        READER_EXTENSION_SET.has(extension) ||
        DATA_EXTENSION_SET.has(extension) ||
        OFFICE_EXTENSION_SET.has(extension) ||
        HTML_EXTENSION_SET.has(extension));
}
//# sourceMappingURL=document.js.map