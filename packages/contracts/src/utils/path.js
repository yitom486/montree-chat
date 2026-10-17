/** 跨进程可用的轻量路径工具（不依赖 Node path） */
export function dirname(filePath) {
    const index = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    if (index <= 0)
        return filePath;
    return filePath.slice(0, index);
}
/** 取路径最后一段；同时识别 `/` 与 `\\`，避免 Linux CI 上 Windows 路径解析失败 */
export function basename(filePath) {
    const index = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    if (index < 0)
        return filePath;
    return filePath.slice(index + 1);
}
export function joinPath(dir, fileName) {
    const sep = dir.includes('\\') ? '\\' : '/';
    return dir.endsWith(sep) || dir.endsWith('/') || dir.endsWith('\\')
        ? `${dir}${fileName}`
        : `${dir}${sep}${fileName}`;
}
//# sourceMappingURL=path.js.map