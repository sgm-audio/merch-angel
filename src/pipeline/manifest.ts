// merch-angel manifest — dry-run planner + CSV export

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { type ClassifiedFile, Route } from './classifier'

export interface ManifestRow {
  source: string
  route: string
  target: string
  reason: string
}

export function writeManifest(classified: ClassifiedFile[], outDir: string): string {
  const rows: ManifestRow[] = classified
    .filter((c) => c.route !== Route.Skip)
    .map((c) => ({
      source: c.relPath,
      route: c.route,
      target: c.outputName,
      reason: c.reason,
    }))

  const header = 'source,route,target,reason'
  const csv = `${[
    header,
    ...rows.map((r) => `"${r.source}","${r.route}","${r.target}","${r.reason}"`),
  ].join('\n')}\n`

  const manifestPath = resolve(outDir, '_manifest.csv')
  writeFileSync(manifestPath, csv, 'utf-8')
  return manifestPath
}
