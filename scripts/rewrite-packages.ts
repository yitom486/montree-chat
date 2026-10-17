import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const VERSION = '0.1.0'

for (const name of readdirSync(join(root, 'packages'))) {
  const file = join(root, 'packages', name, 'package.json')
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  delete pkg.private
  pkg.version = VERSION
  for (const [k, v] of Object.entries(pkg.dependencies ?? {})) {
    if (v === 'workspace:*') pkg.dependencies[k] = `^${VERSION}`
  }
  const exportsMap: Record<string, unknown> = pkg.exports ?? { '.': './src/index.ts' }
  const nextExports: Record<string, unknown> = {}
  for (const [sub, target] of Object.entries(exportsMap)) {
    if (typeof target !== 'string' || target === './package.json') {
      nextExports[sub] = target
      continue
    }
    // ./src/x.(ts|tsx) -> {types: ./dist/x.d.ts, default: ./dist/x.js}；通配符逐段映射
    const dist = target
      .replace('./src/', './dist/')
      .replace(/\.tsx?$/, (m) => (m === '.tsx' ? '.js' : '.js'))
    const dts = dist.replace(/\.js$/, '.d.ts')
    nextExports[sub] = { types: dts, default: dist }
  }
  pkg.exports = nextExports
  pkg.main = './dist/index.js'
  pkg.types = './dist/index.d.ts'
  pkg.files = ['dist', 'README.md']
  pkg.scripts = { ...(pkg.scripts ?? {}), build: 'tsc -p tsconfig.build.json' }
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
  console.log('rewrote', name)
}
