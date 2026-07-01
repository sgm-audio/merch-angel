import { existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { extname, join, relative, resolve } from 'path'

export interface FileEntry {
  fullPath: string
  relPath: string
  baseName: string
  ext: string
  size: number
}

// ponytail: simple list + stat, no async overhead
export function listImages(srcDir: string): FileEntry[] {
  const abs = resolve(srcDir)
  if (!existsSync(abs)) throw new Error(`directory not found: ${srcDir}`)

  const entries: FileEntry[] = []
  function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      const s = statSync(full)
      if (s.isDirectory()) { walk(full); continue }
      if (!isImageExt(name)) continue
      entries.push({
        fullPath: full,
        relPath: relative(abs, full),
        baseName: name.replace(/\.[^.]+$/, ''),
        ext: extname(name).toLowerCase(),
        size: s.size,
      })
    }
  }
  walk(abs)
  return entries
}

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff', '.tif'])

export function isImageExt(name: string): boolean {
  return IMAGE_EXTS.has(extname(name).toLowerCase())
}

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}
