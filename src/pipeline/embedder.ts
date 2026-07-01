// merch-angel embedder — wraps raster as base64 PNG in <svg> shell
// Matches existing a1 (1).svg convention: <svg><image href="data:..."/></svg>

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { stripWhiteBackground } from './bg-strip'

interface EmbedOptions {
  /** Maximum long edge in px (default 3000 — Shopify-friendly) */
  maxDim?: number
  /** Strip near-white background (default true for color images) */
  stripBg?: boolean
}

const DEFAULT_OPTIONS: EmbedOptions = {
  // ponytail: 2000px cap keeps embedded SVGs under ~5 MB base64,
  // well within Shopify's 20 MB limit. Bump via --max-dim if needed.
  maxDim: 2000,
  stripBg: true,
}

/**
 * Convert a raster image to an SVG shell with embedded base64 PNG.
 * Output is a valid SVG with base64-encoded PNG inside <image> tag.
 * Returns true on success.
 */
export function embedImage(inputPath: string, outputPath: string, options?: EmbedOptions): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Step 1: Resize input to RGBA PNG at target max dimension
  const tmpPng = outputPath.replace('.svg', '.tmp.png')

  const resize = spawnSync('magick', [
    inputPath,
    '-resize', `${opts.maxDim}x${opts.maxDim}>`,
    '-alpha', 'on',
    tmpPng,
  ], { timeout: 60000 })

  if (resize.status !== 0) {
    console.error(`embedder: ImageMagick resize failed for ${inputPath}`)
    console.error(resize.stderr.toString().slice(0, 500))
    return false
  }

  // Get dimensions
  const id = spawnSync('magick', [tmpPng, '-format', '%w %h', 'info:'], { timeout: 10000 })
  let w = 600, h = 900
  if (id.status === 0) {
    const p = id.stdout.toString().trim().split(' ')
    w = Number(p[0]) || w
    h = Number(p[1]) || h
  }

  // Step 2: Optionally strip white background
  if (opts.stripBg) {
    const raw = spawnSync('magick', [tmpPng, '-depth', '8', 'rgba:-'], { timeout: 30000 })
    if (raw.status === 0) {
      const stripped = stripWhiteBackground(raw.stdout, w, h)
      const tmpRaw = outputPath.replace('.svg', '.tmp.raw')
      writeFileSync(tmpRaw, stripped)
      const tmpStripped = outputPath.replace('.svg', '.tmp-stripped.png')
      spawnSync('magick', [
        '-size', `${w}x${h}`, '-depth', '8', `rgba:${tmpRaw}`,
        tmpStripped,
      ], { timeout: 30000 })
      // Clean raw temp
      try { spawnSync('rm', [tmpRaw]) } catch { /* ignore */ }

      if (existsSync(tmpStripped)) {
        const data = readFileSync(tmpStripped)
        const base64 = data.toString('base64')
        try { spawnSync('rm', [tmpStripped]) } catch { /* ignore */ }
        writeSvg(outputPath, w, h, base64)
        try { spawnSync('rm', [tmpPng]) } catch { /* ignore */ }
        return true
      }
    }
  }

  // Step 3: Embed without stripping
  const data = readFileSync(tmpPng)
  const base64 = data.toString('base64')
  writeSvg(outputPath, w, h, base64)
  try { spawnSync('rm', [tmpPng]) } catch { /* ignore */ }
  return true
}

function writeSvg(outputPath: string, w: number, h: number, base64: string): void {
  const svg = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    '<svg xmlns="http://www.w3.org/2000/svg"',
    '     xmlns:svg="http://www.w3.org/2000/svg"',
    '     version="1.1"',
    `     width="${w}px" height="${h}px"`,
    `     viewBox="0 0 ${w} ${h}">`,
    '  <defs>',
    '  </defs>',
    `  <image id="raster0" x="0" y="0" width="${w}" height="${h}"`,
    '         opacity="1.000000"',
    `         href="data:image/png;base64,${base64}" />`,
    '</svg>',
    '',
  ].join('\n')
  writeFileSync(outputPath, svg, 'utf-8')
}
