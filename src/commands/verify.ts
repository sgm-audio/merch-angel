// merch-angel verify — SVG well-formedness + size threshold check

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { info, error as logError, ok, warn } from '../utils/log'

interface VerifyOptions {
  dir: string
  /** Warn if SVG exceeds this many bytes (default 10 MB) */
  maxSize?: number
}

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024

interface VerifyResult {
  file: string
  valid: boolean
  size: number
  issues: string[]
}

export function verify(options: VerifyOptions): { exitCode: number; results: VerifyResult[] } {
  const dir = resolve(options.dir)
  const maxSize = options.maxSize || DEFAULT_MAX_SIZE

  if (!existsSync(dir)) {
    logError(`directory not found: ${dir}`)
    return { exitCode: 2, results: [] }
  }

  const svgFiles = readdirSync(dir).filter((f) => extname(f).toLowerCase() === '.svg')
  if (svgFiles.length === 0) {
    logError(`no SVG files found in ${dir}`)
    return { exitCode: 2, results: [] }
  }

  info(`verifying ${svgFiles.length} SVGs …`)
  const results: VerifyResult[] = []

  for (const file of svgFiles.sort()) {
    const fullPath = resolve(dir, file)
    const stat = statSync(fullPath)
    const issues: string[] = []

    // Check file size
    if (stat.size > maxSize) {
      issues.push(
        `oversized: ${(stat.size / 1024 / 1024).toFixed(1)} MB (limit ${maxSize / 1024 / 1024} MB)`,
      )
    }

    // Check well-formedness (basic)
    try {
      const content = readFileSync(fullPath, 'utf-8')

      if (!content.trim()) {
        issues.push('empty file')
      } else {
        if (!/<svg[\s>]/.test(content)) issues.push('missing <svg> root element')
        if (/<script[\s>]/.test(content))
          issues.push('contains <script> tag — possible security risk')
        if (content.includes('<!DOCTYPE') && !content.includes('<!DOCTYPE svg')) {
          issues.push('unusual doctype declaration')
        }
      }

      // Check for embedded raster (expected for embed route)
      if (content.includes('data:image/png;base64') && !content.includes('<path')) {
        // SVG is an embedded-raster file — verify the base64 payload
        const match = content.match(/href="data:image\/png;base64,([^"]+)"/)
        if (match) {
          const b64Len = match[1].length
          const approxKb = Math.round((b64Len * 0.75) / 1024)
          if (approxKb > 5000) {
            issues.push(`large embedded raster: ~${(approxKb / 1024).toFixed(1)} MB base64 payload`)
          }
        }
      }

      // Check for embedded raster that's too small — might be empty
      if (content.includes('data:image/png;base64,')) {
        const b64Match = content.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)
        if (b64Match && b64Match[1].length < 50) {
          issues.push('stub embedded raster (very short base64 payload)')
        }
      }
    } catch (err) {
      issues.push(`read error: ${err}`)
    }

    const valid = issues.length === 0
    results.push({ file, valid, size: stat.size, issues })

    if (valid) {
      ok(`${file}  ${(stat.size / 1024).toFixed(0)} KB`)
    } else {
      warn(`${file}  ${(stat.size / 1024).toFixed(0)} KB  → ${issues.join('; ')}`)
    }
  }

  const failures = results.filter((r) => !r.valid)
  const exitCode = failures.length > 0 ? 1 : 0

  info(
    `\n${results.length} verified · ${results.length - failures.length} pass · ${failures.length} fail`,
  )
  return { exitCode, results }
}
