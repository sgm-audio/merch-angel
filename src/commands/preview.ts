// merch-angel preview — Playwright-backed SVG gallery
// Serves produced SVGs on localhost:7465 with white/black/heather backdrops

import { readdirSync, readFileSync, existsSync } from 'fs'
import { join, resolve, extname } from 'path'
import { info, ok, error as logError } from '../utils/log'

interface PreviewOptions {
  dir: string
  port?: number
}

const DEFAULT_PORT = 7465

export async function preview(options: PreviewOptions): Promise<void> {
  const svgDir = resolve(options.dir)
  const port = options.port || DEFAULT_PORT

  if (!existsSync(svgDir)) {
    logError(`directory not found: ${svgDir}`)
    process.exit(1)
  }

  const svgFiles = readdirSync(svgDir)
    .filter((f) => extname(f).toLowerCase() === '.svg')
    .sort()

  if (svgFiles.length === 0) {
    logError(`no SVG files found in ${svgDir}`)
    process.exit(1)
  }

  ok(`found ${svgFiles.length} SVGs in ${svgDir}`)

  // Build an index of SVG paths + file sizes
  const svgIndex = svgFiles.map((name) => {
    const fullPath = join(svgDir, name)
    const content = readFileSync(fullPath, 'utf-8')
    return {
      name,
      size: content.length,
      // Extract dimensions from viewBox or width/height
      dims: extractDims(content),
    }
  })

  // Generate the gallery HTML
  const html = generateGalleryHtml(svgIndex, svgDir)

  // Serve with Bun
  // ponytail: Bun.serve() for zero-dep static file server + inline gallery
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url)

      // API endpoint
      if (url.pathname === '/api/svgs') {
        return new Response(JSON.stringify(svgIndex), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Serve SVG files
      if (url.pathname.startsWith('/svgs/')) {
        const name = url.pathname.slice('/svgs/'.length)
        const filePath = join(svgDir, name)
        if (existsSync(filePath) && extname(name).toLowerCase() === '.svg') {
          const content = readFileSync(filePath, 'utf-8')
          return new Response(content, {
            headers: { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*' },
          })
        }
        return new Response('Not found', { status: 404 })
      }

      // Gallery HTML
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    },
    error(err) {
      return new Response(`<!doctype html><pre>Error: ${err.message}</pre>`, {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      })
    },
  })

  console.log(`\n  merch-angel preview gallery\n  http://localhost:${port}\n`)
  info('press Ctrl+C to stop')

  // Keep the process alive
  await Bun.sleep(Infinity)
}

function extractDims(svg: string): string {
  const viewBox = svg.match(/viewBox="([^"]+)"/)
  if (viewBox) return viewBox[1]
  const w = svg.match(/width="(\d+)"/)
  const h = svg.match(/height="(\d+)"/)
  if (w && h) return `0 0 ${w[1]} ${h[1]}`
  return 'unknown'
}

function generateGalleryHtml(svgs: Array<{ name: string; size: number; dims: string }>, _dir: string): string {
  const cards = svgs
    .map(
      (s) => `
    <div class="card" data-name="${s.name}">
      <div class="backdrops">
        <div class="backdrop white"><object data="/svgs/${s.name}" type="image/svg+xml"></object></div>
        <div class="backdrop dark"><object data="/svgs/${s.name}" type="image/svg+xml"></object></div>
        <div class="backdrop heather"><object data="/svgs/${s.name}" type="image/svg+xml"></object></div>
      </div>
      <div class="meta">
        <span class="name">${s.name}</span>
        <span class="dims">${s.dims}</span>
        <span class="size">${(s.size / 1024).toFixed(0)} KB</span>
      </div>
    </div>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>merch-angel preview</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         background: #f4f4f2; color: #2a2a28; padding: 2rem; }
  h1 { font-size: 1.25rem; font-weight: 400; letter-spacing: 0.05em; margin-bottom: 2rem; color: #888; }
  h1 span { color: #2a2a28; font-weight: 700; }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem; }
  .card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .backdrops { display: flex; flex-direction: column; gap: 2px; }
  .backdrop { display: flex; align-items: center; justify-content: center; padding: 1rem; min-height: 160px; }
  .backdrop object { max-width: 100%; max-height: 260px; }
  .backdrop.white { background: #fff; }
  .backdrop.dark { background: #2a2a28; }
  .backdrop.heather { background: #d4d0c8; }
  .meta { display: flex; gap: 1rem; align-items: center; padding: 0.75rem 1rem;
          font-size: 0.8rem; border-top: 1px solid #eee; }
  .meta .name { font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta .dims { color: #888; }
  .meta .size { color: #aaa; font-variant-numeric: tabular-nums; }
  @media (prefers-color-scheme: dark) {
    body { background: #1a1a18; color: #d4d0c8; }
    .card { background: #2a2a28; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
    .backdrop.white { background: #222; }
    .backdrop.heather { background: #3a3830; }
    .meta { border-top-color: #3a3a38; }
  }
</style>
</head>
<body>
<h1><span>merch-angel</span> preview · ${svgs.length} SVGs</h1>
<div class="gallery">${cards}</div>
</body>
</html>`
}
