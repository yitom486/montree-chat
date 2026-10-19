/**
 * @yitom/chat - 统一出口
 * 包含开箱即用的聊天 UI 组件、会话管理器、核心数据模型及通用契约
 */

// 1. 聊天渲染 UI（完整组件库）
export * from './chat-ui.js'

// 2. 核心状态与数据模型（零 React 纯逻辑）
export * from './chat-core.js'

// 3. 契约基础模型
export {
  type Result,
  ok,
  err,
  type AppError,
  DEFAULT_ACP_RUNTIME_ID,
  isSameWorkspace,
} from './contracts.js'

// 4. 会话管理（排查同名导出后导出核心面板与状态）
export {
  type ChatSessionStore,
  type ChatSessionState,
  type ChatThread,
  type ChatPendingPermission,
  createChatSessionStore,
  useChatSessionStore,
  ChatPanel,
  type ChatPanelProps,
  mapSessionUpdate,
  mapPermissionRequest,
  mapConnectionStatus,
  classifyAcpUpdate,
} from './chat-session.js'
