import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// 发布已存在版本则跳过（幂等）：发版用 `git tag pkg-v0.1.0 && git push origin pkg-v0.1.0` 触发。
const root = process.cwd()
for (const name of readdirSync(join(root, 'packages'))) {
  const dir = join(root, 'packages', name)
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const id = `${pkg.name}@${pkg.version}`
  const check = spawnSync('npm', ['view', id, 'version'], { stdio: 'ignore', shell: process.platform === 'win32' })
  if (check.status === 0) {
    console.log(`skip ${id} (already published)`)
    continue
  }
  console.log(`publish ${id}`)
  const pub = spawnSync('npm', ['publish', '--access', 'public', '--provenance'], {
    cwd: dir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env },
  })
  if (pub.status !== 0) process.exit(pub.status ?? 1)
}
console.log('publish ok')
