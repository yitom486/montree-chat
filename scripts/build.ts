import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

// 按依赖拓扑逐包 tsc emit（dist 结构与 src 逐字对应，exports 映射成立）。
const order = ['contracts', 'reader-core', 'annotations', 'chat-core', 'chat-ui', 'chat-session']
for (const name of order) {
  console.log(`building ${name}…`)
  const r = spawnSync('bunx', ['tsc', '-b', join(process.cwd(), 'packages', name, 'tsconfig.build.json')], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (r.status !== 0) {
    console.error(`build failed: ${name}`)
    process.exit(r.status ?? 1)
  }
}
console.log('build ok')
