import { describe, expect, it } from 'vitest'
import { parseMarkdownIntoBlocks } from 'streamdown'
import { parseMarkdownIntoStableBlocks } from './md-blocks.js'

const head = '# 流式报告\n\n首段中文正文。\n\n表格如下：\n\n| 甲 | 乙 |\n|---|---|\n| 1 | 2 |\n\n'
const tail = '尾段收束。脚注[^1]\n\n[^1]: 脚注证据内容'

describe('parseMarkdownIntoStableBlocks', () => {
  it('无脚注时与 Streamdown 默认分块一致', () => {
    expect(parseMarkdownIntoStableBlocks(head)).toEqual(parseMarkdownIntoBlocks(head))
  })

  it('脚注到达后，之前的块保持同一索引与内容（流式不重挂载）', () => {
    const before = parseMarkdownIntoStableBlocks(head)
    const after = parseMarkdownIntoStableBlocks(head + tail)
    expect(before.length).toBeGreaterThan(1)
    expect(after.slice(0, before.length)).toEqual(before)
    // 脚注引用与定义在同一块里，配对不丢
    expect(after[after.length - 1]).toContain('[^1]')
    expect(after[after.length - 1]).toContain('[^1]:')
    expect(after.join('')).toBe(head + tail)
  })

  it('全文从脚注开头时退化为单块', () => {
    const md = '见[^a]\n\n[^a]: 定义'
    expect(parseMarkdownIntoStableBlocks(md)).toEqual([md])
  })
})
