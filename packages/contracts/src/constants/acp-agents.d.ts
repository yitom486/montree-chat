import type { AcpRuntimeInfo } from '../types/acp';
/**
 * 默认 Codex ACP 适配器 npm 包。
 * 选型：`@agentclientprotocol/codex-acp`（官方 / Codex App Server）。
 * 勿用已归档的 `@zed-industries/codex-acp`（见计划「运行时包选型」）。
 */
export declare const CODEX_ACP_NPM_PACKAGE: '@agentclientprotocol/codex-acp';
/** Claude ACP 适配器 npm 包（官方 Agent Client Protocol 组织） */
export declare const CLAUDE_ACP_NPM_PACKAGE: '@agentclientprotocol/claude-agent-acp';
/** DeepSeek Harness ACP 服务 npm 包 */
export declare const DEEPSEEK_DSH_NPM_PACKAGE: '@deepseek-ai/dsh';
/** agy 桥 npm 包（Antigravity CLI → ACP） */
export declare const AGY_ACP_NPM_PACKAGE: '@yitom/agy-acp-map';
/** 已弃用：仅作迁移对照 / 测试断言，禁止作为默认 spawn 目标 */
export declare const LEGACY_ZED_CODEX_ACP_NPM_PACKAGE: '@zed-industries/codex-acp';
export declare const DEFAULT_ACP_RUNTIME_ID = "codex-acp";
/** 内置 Agent 运行时模板；不打包进安装程序，用户自备 bunx / 官方二进制 / Key */
export declare const BUILTIN_ACP_RUNTIMES: readonly AcpRuntimeInfo[];
export declare function findBuiltinAcpRuntime(id: string): AcpRuntimeInfo | undefined;
//# sourceMappingURL=acp-agents.d.ts.map