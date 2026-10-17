/**
 * ACP 跨进程 DTO（精简，不嵌入完整协议 schema）。
 *
 * 设计要点：
 * - 只放 Montree IPC / UI 真正用到的字段；Agent 多出来的键进 Record 透传，避免每次协议小改就改类型。
 * - 用判别联合（phase / outcome / ok / type）让 UI 用 switch 收窄，不要用布尔「又成功又要登录」。
 * - cwd 一律可选：有工作区就用用户目录，没有就主进程沙箱 cwd（纯阅读场景）。
 */
/**
 * load 定居收尾标记（主→渲染，经既有 session/update 通道透传，非 ACP 协议种类）：
 * 定居窗口过期或静默超时时主进程广播一次，渲染端冻结残留 streaming 消息，不碰 prompting。
 * 与主进程 `acp-state` / 渲染 `chat-slice` 约定的同一字面量，改动须两边同步。
 */
export const MONTREE_SETTLE_COMPLETE_KIND = 'montree_settle_complete';
//# sourceMappingURL=acp.js.map