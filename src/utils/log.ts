// merch-angel logger — concrete-branded, terse, no rainbow chalk
// ponytail: stdout is the UI; no log level framework, no winston

const brand = '\x1b[38;5;245m■\x1b[0m' // neutral gray block

export enum Level {
  Info = 'info',
  Ok = 'ok',
  Warn = 'warn',
  Error = 'error',
  Debug = 'debug',
}

function fmt(level: Level, msg: string): string {
  const sym =
    level === 'ok'
      ? '\x1b[1;32m✓\x1b[0m'
      : level === 'warn'
        ? '\x1b[33m⚠\x1b[0m'
        : level === 'error'
          ? '\x1b[1;31m✗\x1b[0m'
          : level === 'debug'
            ? '\x1b[2m…\x1b[0m'
            : '\x1b[2m∙\x1b[0m'
  return `${brand} ${sym} ${msg}`
}

export function info(msg: string): void {
  console.log(fmt(Level.Info, msg))
}
export function ok(msg: string): void {
  console.log(fmt(Level.Ok, msg))
}
export function warn(msg: string): void {
  console.error(fmt(Level.Warn, msg))
}
export function error(msg: string): void {
  console.error(fmt(Level.Error, msg))
}
export function debug(msg: string): void {
  if (process.env.DEBUG) console.log(fmt(Level.Debug, msg))
}

export function banner(version: string): void {
  console.log(`\x1b[38;5;245m
  ─── merch-angel ${version} ───
  Image → SVG · concrete-grade
\x1b[0m`)
}

export function summary(
  _total: number,
  traced: number,
  embedded: number,
  skipped: number,
  errors: number,
  outDir: string,
): void {
  console.log(
    `\n${brand} done. ${traced} traced · ${embedded} embedded · ${skipped} skipped · ${errors} failed`,
  )
  if (errors === 0) ok(`output → ${outDir}`)
}
