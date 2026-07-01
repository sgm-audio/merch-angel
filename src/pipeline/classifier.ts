// merch-angel classifier — filename → route decision
// Rules documented in docs/ROUTING.md. Extendable via config in future.

import type { FileEntry } from '../utils/paths'

export enum Route {
  /** Vector trace via vtracer */
  Trace = 'trace',
  /** Base64 PNG embedded in SVG (mockups, photos) */
  Embed = 'embed',
  /** Pass through (already SVG) */
  Skip = 'skip',
}

export interface ClassifiedFile extends FileEntry {
  route: Route
  outputName: string
  reason: string
}

export function classify(entries: FileEntry[]): ClassifiedFile[] {
  return entries.map((f) => {
    const name = f.baseName.toLowerCase()

    // Skip existing SVGs
    if (f.ext === '.svg')
      return { ...f, route: Route.Skip, outputName: `${f.baseName}.svg`, reason: 'already svg' }

    // Embedded-raster routes: mockups and photos
    const embedPatterns = ['_mockupwhitewall', '_mockup_website', '_website']
    for (const p of embedPatterns) {
      if (name.includes(p)) {
        return {
          ...f,
          route: Route.Embed,
          outputName: `${f.baseName}_with_mockup.svg`,
          reason: `filename matches '${p}' — mockup/photo route`,
        }
      }
    }

    // Phones / photographic content — embed as-raster
    if (name.startsWith('phones_')) {
      return {
        ...f,
        route: Route.Embed,
        outputName: `${f.baseName}_with_mockup.svg`,
        reason: 'detected photographic content (phones_ prefix)',
      }
    }

    // Artwork (a1, a2, a3, a4 faces) — always trace
    if (/^a[1-4](\s*\(\d+\))?$/.test(name)) {
      return {
        ...f,
        route: Route.Trace,
        outputName: `${f.baseName}.svg`,
        reason: 'face artwork — vector trace',
      }
    }

    // Diagrams
    if (name.includes('diagramblack') || name.includes('diagramwhite')) {
      return {
        ...f,
        route: Route.Trace,
        outputName: `${f.baseName}.svg`,
        reason: 'diagram — vector trace',
      }
    }

    // Untitled art
    if (name.startsWith('untitled') || name.startsWith('untitled-')) {
      return {
        ...f,
        route: Route.Trace,
        outputName: `${f.baseName}.svg`,
        reason: 'untitled artwork — vector trace',
      }
    }

    // _mockupsized → true artwork
    if (name.includes('_mockupsized') || name.includes('mockupsized')) {
      return {
        ...f,
        route: Route.Trace,
        outputName: `${f.baseName}.svg`,
        reason: 'mockupsized artwork — vector trace',
      }
    }

    // Default: trace. Merch pipeline should be vector-first.
    return {
      ...f,
      route: Route.Trace,
      outputName: `${f.baseName}.svg`,
      reason: 'default vector-first route',
    }
  })
}

export function classifySummary(classified: ClassifiedFile[]): string {
  const counts: Record<Route, number> = { trace: 0, embed: 0, skip: 0 }
  for (const c of classified) counts[c.route]++
  return `classified ${classified.length} files:\n  → trace  ${counts.trace}\n  → embed  ${counts.embed}\n  → skip   ${counts.skip}`
}
