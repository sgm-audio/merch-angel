// merch-angel convert — main batch pipeline

import { join, resolve } from 'node:path'
import { classify, classifySummary } from '../pipeline/classifier'
import { Route } from '../pipeline/classifier'
import { embedImage } from '../pipeline/embedder'
import { writeManifest } from '../pipeline/manifest'
import { isGreyscale, traceImage } from '../pipeline/tracer'
import { error, info, error as logError, ok, warn } from '../utils/log'
import { banner as printBanner } from '../utils/log'
import { ensureDir, listImages } from '../utils/paths'

interface ConvertOptions {
  src: string
  out: string
  dryRun?: boolean
  forceFallback?: boolean
  stripBg?: boolean
  vtracerPath?: string
}

export async function convert(
  options: ConvertOptions,
): Promise<{ exitCode: number; manifestPath?: string }> {
  const srcDir = resolve(options.src)
  const outDir = resolve(options.out)

  info(`source: ${srcDir}`)
  info(`output: ${outDir}`)

  // Scan
  const entries = listImages(srcDir)
  if (entries.length === 0) {
    error('no image files found')
    return { exitCode: 2 }
  }
  ok(`found ${entries.length} image files`)

  // Classify
  const classified = classify(entries)
  console.log(`\n${classifySummary(classified)}`)

  // Prepare output
  ensureDir(outDir)

  // Write manifest
  const manifestPath = writeManifest(classified, outDir)
  ok(`manifest → ${manifestPath}`)

  if (options.dryRun) {
    info('dry-run complete. no files converted.')
    return { exitCode: 0, manifestPath }
  }

  // Execute
  let traced = 0
  let embedded = 0
  let skipped = 0
  let errors = 0

  for (const f of classified) {
    const inputPath = f.fullPath
    const outputPath = join(outDir, f.outputName)

    if (f.route === Route.Skip) {
      skipped++
      continue
    }

    if (f.route === Route.Trace) {
      const greyscale = isGreyscale(inputPath)
      const ok = traceImage(inputPath, outputPath, {
        binary: greyscale,
        forceFallback: options.forceFallback,
        vtracerPath: options.vtracerPath,
      })
      if (ok) {
        traced++
        process.stdout.write('\x1b[1A\x1b[2K')
        info(`traced ${f.baseName}${greyscale ? ' (greyscale, binary mode)' : ''}`)
      } else {
        errors++
        warn(`trace failed: ${f.baseName}`)
      }
    } else if (f.route === Route.Embed) {
      // Determine if we should strip bg — skip for greyscale/art that needs white
      const strip =
        options.stripBg !== false &&
        !f.baseName.toLowerCase().includes('grey') &&
        !f.baseName.toLowerCase().includes('grey_')
      const ok = embedImage(inputPath, outputPath, {
        stripBg: strip,
      })
      if (ok) {
        embedded++
        process.stdout.write('\x1b[1A\x1b[2K')
        info(`embedded ${f.baseName}`)
      } else {
        errors++
        warn(`embed failed: ${f.baseName}`)
      }
    }
  }

  // Summary
  printBanner('0.1.0')
  info(`source: ${srcDir}`)
  ok(`total: ${classified.length} files`)
  info(`  traced:   ${traced}`)
  info(`  embedded: ${embedded}`)
  info(`  skipped:  ${skipped}`)
  if (errors > 0) warn(`  errors:   ${errors}`)
  info(`output: ${outDir}`)

  return { exitCode: errors > 0 ? 1 : 0, manifestPath }
}
