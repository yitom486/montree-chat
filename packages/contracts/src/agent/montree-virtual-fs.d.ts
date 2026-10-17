/**
 * Montree 虚拟文件：Agent 用 `fs/read_text_file` 读这些路径时，
 * 主进程不落盘读取，而是向渲染进程要一份内存快照。
 *
 * 这样解析结果只存在一份（渲染进程内存），既不重复写盘，也不会被多窗口互相覆盖。
 */
export declare const MONTREE_VIRTUAL_DIR = ".montree/agent";
export declare const MONTREE_VIRTUAL_RESOURCES: readonly ['focused.json', 'toc.json', 'chapter.txt', 'viewport.txt'];
export type MontreeVirtualResource = (typeof MONTREE_VIRTUAL_RESOURCES)[number];
/**
 * 把 Agent 给的路径解析成虚拟资源名；不是虚拟路径时返回 null（走真实磁盘读）。
 * 绝对路径、相对路径、`./` 前缀、Windows 反斜杠都接受。
 */
export declare function parseMontreeVirtualPath(filePath: string, workspaceRoot: string): MontreeVirtualResource | null;
/** 路径落在虚拟目录下，但资源名不认识——用于给 Agent 更准确的报错 */
export declare function isMontreeVirtualDirPath(filePath: string, workspaceRoot: string): boolean;
//# sourceMappingURL=montree-virtual-fs.d.ts.map