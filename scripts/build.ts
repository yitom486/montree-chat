import { spawnSync } from 'node:child_process'
import { copyFileSync } from 'node:fs'
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
  // chat-ui 自带的皮肤与动效是纯 CSS，tsc 不处理，单独拷进 dist（exports 用 ./styles.css 暴露）
  if (name === 'chat-ui') {
    copyFileSync(
      join(process.cwd(), 'packages', 'chat-ui', 'src', 'styles.css'),
      join(process.cwd(), 'packages', 'chat-ui', 'dist', 'styles.css'),
    )
    console.log('copied chat-ui styles.css → dist/styles.css')
  }
}
console.log('build ok')
