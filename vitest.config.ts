import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// 单测解析 @yitom/* 到源码（与 tsconfig paths 同表；发版 dist 不影响单测）。
const src = (p: string) => fileURLToPath(new URL(`./packages/${p}`, import.meta.url))
export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: [
      { find: '@yitom/contracts/core', replacement: `${src('contracts/src/core')}` },
      { find: '@yitom/contracts/types', replacement: `${src('contracts/src/types')}` },
      { find: '@yitom/chat-ui/lazy', replacement: `${src('chat-ui/src/ui/chat-markdown.lazy.tsx')}` },
      { find: /^@montree\/contracts$/, replacement: `${src('contracts/src/index.ts')}` },
      { find: /^@montree\/reader-core$/, replacement: `${src('reader-core/src/index.ts')}` },
      { find: /^@montree\/annotations$/, replacement: `${src('annotations/src/index.ts')}` },
      { find: /^@montree\/chat-core$/, replacement: `${src('chat-core/src/index.ts')}` },
      { find: /^@montree\/chat-ui$/, replacement: `${src('chat-ui/src/index.ts')}` },
      { find: /^@montree\/chat-session$/, replacement: `${src('chat-session/src/index.ts')}` },
    ],
  },
})
