import { describe, expect, it } from 'bun:test'
import { classify, Route } from '../src/pipeline/classifier'
import type { FileEntry } from '../src/utils/paths'

function mkEntry(baseName: string, ext: string, relPath?: string): FileEntry {
  const name = `${baseName}${ext}`
  return {
    fullPath: `/tmp/${name}`,
    relPath: relPath || name,
    baseName,
    ext,
    size: 1000,
  }
}

describe('classifier', () => {
  it('skips existing SVG files', () => {
    const result = classify([mkEntry('existing', '.svg')])
    expect(result[0].route).toBe(Route.Skip)
  })

  it('traces mockupsized artwork', () => {
    const result = classify([mkEntry('concreteangel_cb_ver2_mockupsized', '.png')])
    expect(result[0].route).toBe(Route.Trace)
  })

  it('embeds mockupwhitewall', () => {
    const result = classify([mkEntry('website_concreteangel_cb_ver2_mockupwhitewall', '.png')])
    expect(result[0].route).toBe(Route.Embed)
    expect(result[0].outputName).toContain('_with_mockup')
  })

  it('embeds _website files', () => {
    const result = classify([mkEntry('diagramblack_website', '.png')])
    expect(result[0].route).toBe(Route.Embed)
    expect(result[0].outputName).toContain('_with_mockup')
  })

  it('embeds phones_ prefixed files', () => {
    const result = classify([mkEntry('phones_madelinelanc', '.JPG')])
    expect(result[0].route).toBe(Route.Embed)
  })

  it('traces face artwork a1-a4', () => {
    const results = classify([
      mkEntry('a1', '.jpg'),
      mkEntry('a2', '.jpg'),
      mkEntry('a3', '.jpg'),
      mkEntry('a4', '.jpg'),
    ])
    for (const r of results) expect(r.route).toBe(Route.Trace)
  })

  it('traces a1 with parenthetical suffix', () => {
    const result = classify([mkEntry('a1 (1)', '.jpg')])
    expect(result[0].route).toBe(Route.Trace)
  })

  it('traces diagrams', () => {
    const results = classify([
      mkEntry('diagramblack_website', '.png'),  // embed takes priority
      mkEntry('diagramwhite_notwebsite', '.png'),
    ])
    // The diagramblack has _website → embed
    // The diagramwhite doesn't → trace
    expect(results[0].route).toBe(Route.Embed)
    expect(results[1].route).toBe(Route.Trace)
  })

  it('traces untitled art', () => {
    const result = classify([mkEntry('untitled-4 copy', '.jpg')])
    expect(result[0].route).toBe(Route.Trace)
  })

  it('defaults unknown files to trace', () => {
    const result = classify([mkEntry('some_random_artwork', '.png')])
    expect(result[0].route).toBe(Route.Trace)
  })

  it('returns correct output naming for trace', () => {
    const result = classify([mkEntry('myart_mockupsized', '.png')])
    expect(result[0].outputName).toBe('myart_mockupsized.svg')
  })

  it('returns correct output naming for embed', () => {
    const result = classify([mkEntry('mockup_website', '.png')])
    expect(result[0].outputName).toBe('mockup_website_with_mockup.svg')
  })

  it('handles mixed batch', () => {
    const entries = [
      mkEntry('art1_mockupsized', '.png'),
      mkEntry('art2_mockupwhitewall', '.png'),
      mkEntry('existing', '.svg'),
      mkEntry('phones_shot', '.jpg'),
      mkEntry('diagram_website', '.png'),
    ]
    const results = classify(entries)
    expect(results.map((r) => r.route)).toEqual([
      Route.Trace,
      Route.Embed,
      Route.Skip,
      Route.Embed,
      Route.Embed,
    ])
  })
})
