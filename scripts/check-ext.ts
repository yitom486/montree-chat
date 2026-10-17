import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// 发版产物为原生 ESM：源码相对 import 必须带扩展名（.js/.json/.css），
// 否则外部 Node/vitest-external 解析失败。CI 门禁，零例外。
const RE = /(from\s*|import\s*\(\s*|export\s+[^;]*?\s+from\s*)(['"])(\.[^'"]+)\2/g
let bad = 0
function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { walk(p); continue }
    if ((!name.endsWith('.ts') && !name.endsWith('.tsx')) || name.endsWith('.d.ts')) continue
    const text = readFileSync(p, 'utf8')
    for (const m of text.matchAll(RE)) {
      const spec = m[3]
      if (!/\.(js|mjs|cjs|json|css|svg|png)$/.test(spec)) {
        console.error(`extensionless: ${p}: ${spec}`)
        bad += 1
      }
    }
  }
}
walk(join(process.cwd(), 'packages'))
if (bad > 0) { console.error(`${bad} extensionless imports`); process.exit(1) }
console.log('ext check ok')
