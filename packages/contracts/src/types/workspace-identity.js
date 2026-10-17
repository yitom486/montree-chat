/** 本机工作区固定身份（单窗口单本机工作区；远端 id 由 B/D 阶段分配）。 */
export const LOCAL_WORKSPACE_ID = 'local';
export function isLocalWorkspaceId(workspaceId) {
    return !workspaceId || workspaceId === LOCAL_WORKSPACE_ID;
}
/** 取路径末段（不依赖 node:path，供 contracts 纯函数使用）。 */
function baseNameOf(path) {
    const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '');
    const idx = normalized.lastIndexOf('/');
    return idx >= 0 ? normalized.slice(idx + 1) : normalized;
}
/** 构造本机工作区描述符（target 置空；远端绝对 root 永不进 renderer 拼接）。 */
export function makeLocalWorkspaceDescriptor(rootPath) {
    const trimmed = rootPath.trim();
    return {
        id: LOCAL_WORKSPACE_ID,
        kind: 'local',
        target: '',
        rootLabel: trimmed,
        displayName: baseNameOf(trimmed) || trimmed,
    };
}
/**
 * 构造 WSL 远端工作区描述符（纯函数；发行版/远端根由调用方经动态探测得出）。
 * id 形如 `wsl:Ubuntu:/home/u/blog`（见 workspace.ts），同一 id 在会话表内
 * 共享同一远端宿主连接，多窗口按 refcount 共用（T7）。
 */
export function makeWslWorkspaceDescriptor(distro, linuxRoot) {
    const name = distro.trim();
    const root = linuxRoot.trim().replace(/\\/g, '/').replace(/\/+$/, '') || '/';
    return {
        id: `wsl:${name}:${root}`,
        kind: 'wsl',
        target: name,
        rootLabel: root,
        displayName: baseNameOf(root) || root,
    };
}
/**
 * 归一化工作区相对 POSIX 路径：反斜杠转正斜杠，去掉前导 `./` 与 `/`，
 * 折叠重复斜杠。空串保持空串（调用方判定根）。
 */
export function normalizeWorkspaceRelativePath(input) {
    const posix = input.replace(/\\/g, '/').trim();
    const collapsed = posix.replace(/\/+/g, '/');
    const withoutDot = collapsed.replace(/^(\.\/)+/, '');
    return withoutDot.replace(/^\/+/, '');
}
/** 构造文档身份（同一 relativePath 在不同 workspaceId 下是不同文档）。 */
export function makeDocumentRef(workspaceId, relativePath) {
    return {
        workspaceId: workspaceId.trim() || LOCAL_WORKSPACE_ID,
        relativePath: normalizeWorkspaceRelativePath(relativePath),
    };
}
/**
 * 文档缓存键：local 沿用裸相对路径/绝对路径（历史行为零变化），
 * 非 local 加 `workspaceId::` 前缀防串（T7：两工作区同相对路径隔离）。
 */
export function documentRefKey(ref) {
    if (isLocalWorkspaceId(ref.workspaceId))
        return ref.relativePath;
    return `${ref.workspaceId}::${ref.relativePath}`;
}
/** 解析 documentRefKey；非法返回 null（不抛，调用方降级处理）。 */
export function parseDocumentRefKey(key) {
    if (!key)
        return null;
    const sep = key.indexOf('::');
    if (sep <= 0)
        return { workspaceId: LOCAL_WORKSPACE_ID, relativePath: key };
    return {
        workspaceId: key.slice(0, sep),
        relativePath: key.slice(sep + 2),
    };
}
export function isSameDocumentRef(a, b) {
    return a.workspaceId === b.workspaceId && a.relativePath === b.relativePath;
}
/**
 * 通用作用域键（draft 草稿、fileStates、document-tool registry 共用同一规则）：
 * local/空沿用裸键（回归零变化），其余加 `workspaceId::` 前缀。
 */
export function scopeDocumentKey(key, workspaceId) {
    if (isLocalWorkspaceId(workspaceId))
        return key;
    return `${workspaceId}::${key}`;
}
//# sourceMappingURL=workspace-identity.js.map