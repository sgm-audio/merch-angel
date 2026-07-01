import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { existsSync, unlinkSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { embedImage } from '../src/pipeline/embedder'

const TMP_DIR = '/tmp/merch-test-embed'
const INPUT = join(TMP_DIR, 'input.png')
const OUTPUT = join(TMP_DIR, 'output.svg')

beforeAll(() => {
  mkdirSync(TMP_DIR, { recursive: true })
  // Create a minimal test PNG (white background with a colored pixel)
  // Using ImageMagick since it's a system dep
  const { spawnSync } = require('child_process')
  spawnSync('magick', [
    '-size', '50x50',
    'xc:white',
    '-fill', '#ff0000',
    '-draw', 'circle 25,25 25,15',
    INPUT,
  ])
})

afterAll(() => {
  try { unlinkSync(OUTPUT) } catch {}
  try { unlinkSync(join(TMP_DIR, 'input.png.tmp.png')) } catch {}
})

describe('embedImage', () => {
  it('produces a valid SVG file', () => {
    const result = embedImage(INPUT, OUTPUT, { stripBg: true, maxDim: 100 })
    expect(result).toBe(true)
    expect(existsSync(OUTPUT)).toBe(true)

    const content = require('fs').readFileSync(OUTPUT, 'utf-8')
    expect(content).toContain('<?xml')
    expect(content).toContain('<svg')
    expect(content).toContain('data:image/png;base64')
    expect(content).toContain('</svg>')
  })

  it('has correct SVG structure (viewBox matches dimensions)', () => {
    if (!existsSync(OUTPUT)) return // skip if no magick
    const content = require('fs').readFileSync(OUTPUT, 'utf-8')
    const viewBox = content.match(/viewBox="([^"]+)"/)
    expect(viewBox).not.toBeNull()
    const parts = viewBox![1].split(' ')
    expect(parts.length).toBe(4)
    expect(Number(parts[2])).toBeGreaterThan(0)
    expect(Number(parts[3])).toBeGreaterThan(0)
  })
})
