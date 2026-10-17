/** 跨进程可用的轻量路径工具（不依赖 Node path） */
export declare function dirname(filePath: string): string;
/** 取路径最后一段；同时识别 `/` 与 `\\`，避免 Linux CI 上 Windows 路径解析失败 */
export declare function basename(filePath: string): string;
export declare function joinPath(dir: string, fileName: string): string;
//# sourceMappingURL=path.d.ts.map