import { parseMarkdownIntoBlocks } from 'streamdown'

const FOOTNOTE_MARK = /\[\^/g
// 同长度占位（私用区字符），只为让 Streamdown 的分块器看不到脚注，不改变任何块边界与偏移
const PLACEHOLDER = '[\uE000'

/**
 * 脚注友好的分块：Streamdown 只要全文出现 `[^x]` 就把整篇退化成单块，
 * 流式中途一旦到达脚注，之前已显示的每个块都会以新 key 整体重挂载（正文 DOM 被替换、
 * 动画重放、选区丢失）。这里把脚注所在位置之前的块保持独立（key/索引不变），
 * 只把「首个含脚注引用或定义的块」到文末合并成一块，脚注引用与定义仍在同一次解析里配对。
 */
export function parseMarkdownIntoStableBlocks(markdown: string): string[] {
  if (!markdown.includes('[^')) return parseMarkdownIntoBlocks(markdown)
  const masked = markdown.replace(FOOTNOTE_MARK, PLACEHOLDER)
  const maskedBlocks = parseMarkdownIntoBlocks(masked)
  if (maskedBlocks.join('') !== masked) return [markdown]
  const blocks: string[] = []
  let offset = 0
  for (const block of maskedBlocks) {
    blocks.push(markdown.slice(offset, offset + block.length))
    offset += block.length
  }
  const firstFootnote = blocks.findIndex((block) => block.includes('[^'))
  if (firstFootnote < 0) return blocks
  return [...blocks.slice(0, firstFootnote), blocks.slice(firstFootnote).join('')]
}
