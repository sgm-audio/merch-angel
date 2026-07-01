#!/usr/bin/env bun
// merch-angel — Image → Shopify-ready SVG batch pipeline
// Usage: merch-angel convert <folder>

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command } from 'commander'
import { convert } from './commands/convert'
import { doctor } from './commands/doctor'
import { preview } from './commands/preview'
import { verify } from './commands/verify'
import { banner } from './utils/log'

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(import.meta.dir, '..', 'package.json'), 'utf-8'))
    return pkg.version || '0.1.0'
  } catch { return '0.1.0' }
}

const version = getVersion()
const program = new Command()

program
  .name('merch-angel')
  .description('Image → Shopify-ready SVG batch pipeline. Brand-grade vectors without the bloat.')
  .version(version, '-v, --version')
  .hook('preAction', () => banner(version))

// convert <folder> [options]
program
  .command('convert')
  .description('Convert images to Shopify-ready SVGs')
  .argument('<folder>', 'folder containing images')
  .option('-o, --out <dir>', 'output directory (default: <folder>-merch/)')
  .option('-n, --dry-run', 'just show what would happen')
  .option('-f, --force-fallback', 'use JS engine instead of vtracer')
  .option('--vtracer-path <path>', 'custom vtracer binary')
  .option('--no-strip-bg', 'keep white backgrounds')
  .action(async (folder, opts) => {
    const result = await convert({
      src: folder,
      out: opts.out,
      dryRun: opts.dryRun || false,
      forceFallback: opts.forceFallback || false,
      vtracerPath: opts.vtracerPath,
      stripBg: opts.stripBg,
    })
    process.exit(result.exitCode)
  })

// verify <folder>
program
  .command('verify')
  .description('Check SVGs are well-formed and within size limits')
  .argument('<folder>', 'folder with SVGs to check')
  .option('--max-size <bytes>', 'size warning threshold', String(20 * 1024 * 1024))
  .action((folder, opts) => {
    process.exit(verify({ dir: folder, maxSize: Number(opts.maxSize) }).exitCode)
  })

// preview <folder>
program
  .command('preview')
  .description('Browser gallery of produced SVGs')
  .argument('<folder>', 'folder with SVGs to show')
  .option('-p, --port <number>', 'port for gallery', String(7465))
  .action(async (folder, opts) => {
    await preview({ dir: folder, port: Number(opts.port) })
  })

// doctor
program
  .command('doctor')
  .description('Check system deps are ready')
  .action(() => process.exit(doctor().exitCode))

program.parse(process.argv)
