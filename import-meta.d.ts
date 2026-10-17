/// 本仓最小 env 声明（替代 vite/client，避免为两行 import.meta.env 引入整个 vite）。
declare global {
  interface ImportMeta {
    readonly env: Record<string, string | boolean | undefined>
  }
}
export {}
