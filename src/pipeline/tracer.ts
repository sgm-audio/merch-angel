// merch-angel tracer — vtracer-powered vectorization
// Primary: vtracer CLI binary (downloaded postinstall, verified by shasum)
// Fallback: imagetracerjs (pure JS, lower quality, no native deps)

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface TraceOptions {
  /** vtracer binary path */
  vtracerPath?: string
  /** Force binary mode for greyscale */
  binary?: boolean
  /** Color precision (0–10, default 6) */
  colorPrecision?: number
  /** Corner threshold (0–100, default 60) */
  cornerThreshold?: number
  /** Speckle filter (0–inf, default 8) */
  speckleFilter?: number
  /** Use JS fallback even if vtracer is available */
  forceFallback?: boolean
}

const DEFAULT_OPTIONS: TraceOptions = {
  colorPrecision: 6,
  cornerThreshold: 60,
  speckleFilter: 8,
}

function findVtracer(): string | null {
  // Check relative to package root (global install / symlink), then CWD, then PATH
  const pkgRoot = resolve(import.meta.dir, '..', '..')
  const candidates = [
    resolve(pkgRoot, '.vtracer-binary', 'vtracer'),
    resolve(process.cwd(), 'node_modules', '.bin', 'vtracer'),
    resolve(process.cwd(), '.vtracer-binary', 'vtracer'),
    'vtracer',
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
    // Try with .exe on windows
    const cExe = `${c}.exe`
    if (existsSync(cExe)) return cExe
  }
  return null
}

/**
 * Trace a raster image to SVG vector paths.
 * Returns true on success, false on failure.
 *
 * vtracer CLI interface: `vtracer --input in.png --output out.svg [options]`
 * imagetracerjs fallback: uses ImageTracerJS library.
 */
export function traceImage(inputPath: string, outputPath: string, options?: TraceOptions): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const vtracerPath = opts.vtracerPath || findVtracer()

  if (vtracerPath && !opts.forceFallback) {
    return traceWithVtracer(vtracerPath, inputPath, outputPath, opts)
  }

  // Fallback: imagetracerjs via subprocess with Bun
  console.warn(`[tracer] vtracer not available, using JS fallback for ${inputPath}`)
  return traceWithFallback(inputPath, outputPath, opts)
}

function traceWithVtracer(bin: string, input: string, output: string, opts: TraceOptions): boolean {
  // ponytail: vtracer CLI is stable; we shell out + capture exit code
  const args = [
    '--input',
    input,
    '--output',
    output,
    '--colormode',
    opts.binary ? 'binary' : 'spline',
    '--color_precision',
    String(opts.colorPrecision),
    '--corner_threshold',
    String(opts.cornerThreshold),
    '--filter_speckle',
    String(opts.speckleFilter),
  ]

  const result = spawnSync(bin, args, { timeout: 120000 })

  if (result.status !== 0) {
    const stderr = result.stderr?.toString().slice(0, 1000) || 'unknown error'
    console.error(`[tracer] vtracer failed on ${input}: ${stderr}`)
    return false
  }

  return true
}

function traceWithFallback(input: string, output: string, opts: TraceOptions): boolean {
  try {
    // Use imagetracerjs via a temporary Bun script
    // ponytail: inline script avoids a separate file dependency
    const script = `
      const ImageTracer = require('imagetracerjs');
      ImageTracer.imageToSVG('${input.replace(/\\/g, '\\\\')}',
        (svg) => {
          require('fs').writeFileSync('${output.replace(/\\/g, '\\\\')}', svg, 'utf-8');
        },
        {
          ltres: 1,
          qtres: 1,
          blurRadius: 0,
          colorsampling: ${opts.binary ? 0 : 1},
          numberofcolors: ${opts.binary ? 2 : Math.max(2, Math.round((opts.colorPrecision || 6) * 4))},
          scale: 1,
          smooth_roundness: 0.5,
        }
      );
    `
    const result = spawnSync('node', ['-e', script], { timeout: 60000 })
    if (result.status !== 0) {
      console.error(
        `[tracer] imagetracerjs fallback failed: ${result.stderr?.toString().slice(0, 500)}`,
      )
      return false
    }
    return true
  } catch (err) {
    console.error(`[tracer] fallback error: ${err}`)
    return false
  }
}

/**
 * Check if an image appears to be greyscale (single channel or all
 * channels identical per pixel). Returns true for near-greyscale.
 */
export function isGreyscale(inputPath: string): boolean {
  try {
    const magick = spawnSync(
      'magick',
      [inputPath, '-colorspace', 'HSL', '-format', '%[mean]', 'info:'],
      {
        timeout: 10000,
      },
    )
    if (magick.status !== 0) return false

    // Approximate: if mean saturation is very low, it's greyscale
    const saturation = Number.parseFloat(magick.stdout.toString().trim())
    // ponytail: saturation < 0.05 in HSL mean → greyscale
    return saturation < 0.05
  } catch {
    return false
  }
}
