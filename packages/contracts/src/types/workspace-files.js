/** 跨宿主 copy/move 拒绝文案（用户显式导入/导出是独立语义） */
export const CROSS_WORKSPACE_MOVE_MESSAGE = '跨工作区复制/移动不支持，请用导出到本机后再导入目标工作区';
/**
 * 同宿主断言：跨宿主 copy/move 明确不支持，不得用 Windows cp 偷渡。
 * 纯函数；返回 false 时调用方以 UNSUPPORTED_OPERATION 失败。
 */
export function assertSameWorkspaceId(fromWorkspaceId, toWorkspaceId) {
    return fromWorkspaceId === toWorkspaceId;
}
/**
 * 远端事件代际过滤（渲染端用）：事件自带 generation 且与当前代际不同即过期。
 * 任一缺失视为有效（兼容无代际的本机旧推送；严格版见主进程 workspace-bindings）。
 */
export function isStaleGenerationEvent(eventGeneration, currentGeneration) {
    if (eventGeneration === undefined || currentGeneration === undefined)
        return false;
    return eventGeneration !== currentGeneration;
}
//# sourceMappingURL=workspace-files.js.map