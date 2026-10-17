/**
 * WSL 路径识别与 Windows / Linux 路径双向转换工具（跨进程纯逻辑，不依赖 Node 特性）。
 */
export interface ParsedWslPath {
    isWsl: boolean;
    distro?: string;
    linuxPath?: string;
}
/**
 * 判断给定路径是否为 Windows 下访问 WSL 的 UNC 路径。
 * 支持 //wsl.localhost/<distro> 与 //wsl$/<distro> 两种标准前缀。
 */
export declare function isWslPath(path: string): boolean;
/**
 * 解析 WSL UNC 路径，提取其关联的发行版名称与 Linux 内部绝对路径。
 * 例：
 *   \\\\wsl.localhost\\Ubuntu\\home\\user\\blog -> { isWsl: true, distro: 'Ubuntu', linuxPath: '/home/user/blog' }
 *   \\\\wsl$\\Debian -> { isWsl: true, distro: 'Debian', linuxPath: '/' }
 */
export declare function parseWslPath(path: string): ParsedWslPath;
/**
 * 将 Windows 路径转换为 Linux 可消费的原生路径：
 * 1. WSL 路径（\\\\wsl.localhost\\Ubuntu\\home\\user）-> 原生 Linux 路径（/home/user）
 * 2. Windows 盘符路径（C:\\Users\\user 或 D:/notes）-> /mnt/c/Users/user 或 /mnt/d/notes
 */
export declare function windowsToLinuxPath(winPath: string): string;
/**
 * 将 Linux 路径转换为 Windows 下可直接访问的 UNC 路径或盘符路径：
 * 1. /mnt/c/Users/user -> C:\\Users\\user
 * 2. /home/user/blog + Ubuntu -> \\\\wsl.localhost\\Ubuntu\\home\\user\\blog
 */
export declare function linuxToWindowsPath(linuxPath: string, distro?: string): string;
/**
 * 规范化工作区路径：去除首尾空格与多余尾部斜杠，统一正斜杠表示（支持本地盘符与 WSL UNC）。
 */
export declare function normalizeWorkspaceRoot(path?: string | null): string | undefined;
/**
 * 判断两个工作区路径是否代表同一工作区。
 * - 兼顾本地 Windows 盘符大小写差异（如 C:/blog 与 c:\blog）
 * - 兼顾 WSL UNC 路径的两种标准形式（//wsl.localhost/Ubuntu/blog 与 //wsl$/Ubuntu/blog）
 */
export declare function isSameWorkspace(a?: string | null, b?: string | null): boolean;
//# sourceMappingURL=wsl-path.d.ts.map