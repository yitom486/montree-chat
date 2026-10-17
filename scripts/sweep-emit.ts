import { readdirSync, statSync, unlinkSync, existsSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

// 删除 src/ 下与 .ts/.tsx 同名的构建残留（.js/.js.map/.d.ts/.d.ts.map），
// 无 .ts 同胞的文件一律保留并列出人工确认。
const GEN_EXTS = ['.js', '.js.map', '.d.ts', '.d.ts.map']
function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue
      walk(p)
      continue
    }
    for (const ext of GEN_EXTS) {
      if (name.endsWith(ext)) {
        const base = basename(name, ext)
        const siblingTs = existsSync(join(dir, base + '.ts')) || existsSync(join(dir, base + '.tsx'))
        if (siblingTs) {
          unlinkSync(p)
        } else {
          console.log('KEEP (no ts sibling):', p)
        }
        break
      }
    }
  }
}
walk(join(process.cwd(), 'packages'))
console.log('sweep done')
