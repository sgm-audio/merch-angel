// merch-angel doctor — post-install smoke check

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { error, info, ok, warn } from '../utils/log'

interface DoctorResult {
  tool: string
  status: 'ok' | 'warn' | 'fail'
  message: string
}

export function doctor(): { exitCode: number; results: DoctorResult[] } {
  const results: DoctorResult[] = []

  // 1. Bun runtime check
  if (process.versions.bun) {
    results.push({ tool: 'Bun', status: 'ok', message: `v${process.versions.bun}` })
  } else {
    results.push({ tool: 'Bun', status: 'fail', message: 'not running under Bun' })
  }

  // 2. ImageMagick check
  try {
    const magick = spawnSync('magick', ['--version'], { timeout: 5000 })
    if (magick.status === 0) {
      const ver = magick.stdout.toString().split('\n')[0]?.trim() || 'found'
      results.push({ tool: 'ImageMagick', status: 'ok', message: ver })
    } else {
      results.push({ tool: 'ImageMagick', status: 'fail', message: 'not found in PATH' })
    }
  } catch {
    results.push({ tool: 'ImageMagick', status: 'fail', message: 'could not execute' })
  }

  // 3. vtracer binary
  const pkgRoot = resolve(import.meta.dir, '..', '..')
  const vtracerPaths = [
    resolve(pkgRoot, '.vtracer-binary', 'vtracer'),
    resolve(process.cwd(), 'node_modules', '.bin', 'vtracer'),
    resolve(process.cwd(), '.vtracer-binary', 'vtracer'),
    'vtracer',
  ]
  let vtracerFound = false
  for (const p of vtracerPaths) {
    try {
      const vt = spawnSync(p, ['--version'], { timeout: 5000 })
      if (vt.status === 0) {
        const ver = vt.stdout.toString().trim() || 'found'
        results.push({ tool: 'vtracer', status: 'ok', message: `${ver} (${p})` })
        vtracerFound = true
        break
      }
    } catch {}
  }
  if (!vtracerFound) {
    results.push({
      tool: 'vtracer',
      status: 'warn',
      message: 'binary not found — fallback engine will be used (lower quality)',
    })
  }

  // 4. imagetracerjs (npm dep)
  try {
    require.resolve('imagetracerjs')
    results.push({ tool: 'imagetracerjs', status: 'ok', message: 'available (fallback engine)' })
  } catch {
    results.push({
      tool: 'imagetracerjs',
      status: 'fail',
      message: 'not installed — run bun install',
    })
  }

  // 5. Output directory writable
  try {
    const tmp = resolve(process.cwd(), 'output', '.doctor-test')
    const { mkdirSync, writeFileSync } = require('node:fs')
    mkdirSync(resolve(process.cwd(), 'output'), { recursive: true })
    writeFileSync(tmp, '', 'utf-8')
    const { unlinkSync } = require('node:fs')
    unlinkSync(tmp)
    results.push({ tool: 'output dir', status: 'ok', message: 'writable' })
  } catch {
    results.push({ tool: 'output dir', status: 'warn', message: 'check permissions on ./output/' })
  }

  // Print
  let fails = 0
  for (const r of results) {
    if (r.status === 'ok') ok(`  ${r.tool}: ${r.message}`)
    else if (r.status === 'warn') warn(`  ${r.tool}: ${r.message}`)
    else {
      error(`  ${r.tool}: ${r.message}`)
      fails++
    }
  }

  const exitCode = fails > 0 ? 1 : 0
  info(
    `\n${results.length} checks · ${results.filter((r) => r.status === 'ok').length} ok · ${results.filter((r) => r.status === 'warn').length} warn · ${fails} fail`,
  )
  return { exitCode, results }
}
