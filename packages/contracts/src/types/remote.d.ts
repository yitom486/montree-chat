import type { OpenFolderResult } from './file';
import type { WorkspaceDescriptor } from './workspace';
import type { WindowWorkspaceStatus } from './workspace-identity';
export interface WslDistroInfo {
    name: string;
    isDefault: boolean;
}
export interface RemoteDirectoryEntry {
    name: string;
    isDirectory: boolean;
    size?: number;
    mtimeMs?: number;
}
export interface RemoteBrowseResult {
    distro: string;
    currentPath: string;
    parentPath: string | null;
    entries: RemoteDirectoryEntry[];
}
export interface SshConfigHost {
    host: string;
    hostname?: string;
    user?: string;
    port?: number;
}
/** WSL 连接请求（发行版 + root 选择复用 listWslDistros/getWslHome） */
export interface RemoteWslConnectPayload {
    distro: string;
    /** 省略时取该发行版远端 $HOME（动态探测，不写死路径） */
    linuxRoot?: string;
}
export interface RemoteWslBrowsePayload {
    /** 省略时浏览连接根 */
    dirPath?: string;
}
export interface RemoteWslStatPayload {
    filePath: string;
}
/** 打开远端工作区请求（发行版 + Ubuntu 内绝对根；连接归属调用窗口） */
export interface RemoteOpenWslWorkspacePayload {
    distro: string;
    linuxPath: string;
}
/** 打开远端工作区结果（描述符/代际/状态 + 远端初始文件树） */
export interface RemoteOpenWslWorkspaceResult {
    descriptor: WorkspaceDescriptor;
    generation: number;
    status: WindowWorkspaceStatus;
    folder: OpenFolderResult;
}
//# sourceMappingURL=remote.d.ts.map