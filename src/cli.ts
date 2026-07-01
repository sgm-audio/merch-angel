#!/usr/bin/env bun
// merch-angel — Image → Shopify-ready SVG batch pipeline

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command } from 'commander'
import { convert } from './commands/convert'
import { doctor } from './commands/doctor'
import { preview } from './commands/preview'
import { verify } from './commands/verify'
import { banner } from './utils/log'
import { info } from './utils/log'

// Version from package.json
function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))
    return pkg.version || '0.1.0'
  } catch {
    return '0.1.0'
  }
}

const version = getVersion()

const program = new Command()

program
  .name('merch-angel')
  .description('Image → Shopify-ready SVG batch pipeline. Brand-grade vectors without the bloat.')
  .version(version, '-v, --version')
  .hook('preAction', () => banner(version))

// convert
program
  .command('convert')
  .description('Convert images in a directory to Shopify-ready SVGs')
  .requiredOption('-s, --src <path>', 'source directory containing images')
  .requiredOption('-o, --out <path>', 'output directory for generated SVGs')
  .option('-n, --dry-run', 'plan only — no files written')
  .option('-f, --force-fallback', 'use JS fallback engine instead of vtracer')
  .option('--vtracer-path <path>', 'path to vtracer binary')
  .option('--no-strip-bg', 'disable white background stripping')
  .action(async (opts) => {
    const result = await convert({
      src: opts.src,
      out: opts.out,
      dryRun: opts.dryRun || false,
      forceFallback: opts.forceFallback || false,
      vtracerPath: opts.vtracerPath,
      stripBg: opts.stripBg,
    })
    process.exit(result.exitCode)
  })

// verify
program
  .command('verify')
  .description('Verify generated SVGs are well-formed and within size limits')
  .requiredOption('-d, --dir <path>', 'directory containing SVGs to verify')
  .option('--max-size <bytes>', 'warn if SVG exceeds this size in bytes', String(10 * 1024 * 1024))
  .action((opts) => {
    const result = verify({ dir: opts.dir, maxSize: Number(opts.maxSize) })
    process.exit(result.exitCode)
  })

// preview
program
  .command('preview')
  .description('Serve a browser gallery of produced SVGs')
  .requiredOption('-d, --dir <path>', 'directory containing SVGs to preview')
  .option('-p, --port <number>', 'port for the gallery server', String(7465))
  .action(async (opts) => {
    await preview({ dir: opts.dir, port: Number(opts.port) })
  })

// doctor
program
  .command('doctor')
  .description('Check system dependencies and readiness')
  .action(() => {
    const result = doctor()
    process.exit(result.exitCode)
  })

program.parse(process.argv)
