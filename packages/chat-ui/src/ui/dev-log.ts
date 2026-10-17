// 宿主 `apps/desktop/src/lib/agent/acp-dev-log.ts` 逐字复刻（私有，不进 barrel；供包内 `./layout-probe` 使用）。
/** 仅开发环境输出的 ACP 诊断日志；生产构建为 no-op。 */

/**
 * 纯函数：把 `import.meta.env` 形态折成布尔（可单测）。
 * 未知/缺失一律按非 DEV 处理——诊断日志宁可少打，不可抛。
 */
export function devFlagFromEnv(env: unknown): boolean {
  if (typeof env !== 'object' || env === null) return false
  return (env as { DEV?: unknown }).DEV === true
}

/**
 * 跨消费形态的 DEV 判定：包以预构建 dist（纯 ESM）发布，非 vite 管线
 * （vitest 不转 node_modules、SSR、其他打包器）直接执行时 `import.meta.env`
 * 不存在，裸读 `.DEV` 会抛——曾致主仓单测 68 个 unhandled errors 拖红发版门禁。
 */
export function isChatUiDev(): boolean {
  const env = (import.meta as unknown as { env?: unknown }).env
  return devFlagFromEnv(env)
}

/** 仅开发环境输出的 ACP 诊断日志；生产构建为 no-op。 */
export function acpDevLog(message: string, data?: unknown): void {
  if (!isChatUiDev()) return
  if (data === undefined) {
    console.info(`[acp-dev] ${message}`)
    return
  }
  console.info(`[acp-dev] ${message}`, data)
}

export function acpDevWarn(message: string, data?: unknown): void {
  if (!isChatUiDev()) return
  if (data === undefined) {
    console.warn(`[acp-dev] ${message}`)
    return
  }
  console.warn(`[acp-dev] ${message}`, data)
}
