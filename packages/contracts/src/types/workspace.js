/**
 * 远端工作区协议共享类型（A2）。
 *
 * 注意：B2 分支曾误覆盖本文件，现已按仓内全部引用点重建——
 * `workspace-identity.ts`（WorkspaceKind/WorkspaceDescriptor/DocumentRef/
 * WorkspaceConnectionState）、`workspace-core/protocol.ts`（协议版本/方法/
 * 握手）、`remote-server/methods.ts`（文件/搜索/Git 结果）、`remote-server/
 * watch.ts`（监听事件）、`remote-server/server.ts`（握手 limits/并发）、
 * `electron-api.types.ts`（RemoteServer* 接入载荷）。A2 分支请核对
 * §标“待核对”的默认值与载荷形状；行为以服务端实现为准。
 */
/* ================================================================
 * 协议版本与方法（workspace-core/protocol.ts 消费）
 * ================================================================ */
/** 远端工作区协议主版本（major 不一致即拒绝连接） */
export const WORKSPACE_PROTOCOL_MAJOR = 1;
/** 远端工作区协议次版本（minor 仅向前兼容） */
export const WORKSPACE_PROTOCOL_MINOR = 0;
/** 远端服务要求的最低 Node 主版本（B 期明确依赖 Node 22+，不自动 sudo/下载） */
export const WORKSPACE_MIN_NODE_MAJOR = 22;
/**
 * 默认限额。待核对：search* 沿本机 workspace-md-search 语义
 *（200 文件/256KB/100 命中）；其余为重建时的合理初值，A2 请确认。
 */
export const DEFAULT_WORKSPACE_LIMITS = {
    maxFrameBytes: 16 * 1024 * 1024,
    maxTextBytes: 8 * 1024 * 1024,
    maxResourceBytes: 5 * 1024 * 1024,
    searchMaxFiles: 200,
    searchMaxFileBytes: 256 * 1024,
    searchMaxHits: 100,
    maxConcurrent: 4,
    maxInflight: 16,
    requestTimeoutMs: 30_000,
};
//# sourceMappingURL=workspace.js.map