// merch-angel white-background stripper
// Flood-fills near-white pixels from the four corners to transparent.
// Tight 2px tolerance preserves anti-aliased edges but kills flat studio walls.

const WHITE_THRESHOLD = 2 // max per-channel distance from pure white

function distFromWhite(r: number, g: number, b: number): number {
  return Math.max(Math.abs(r - 255), Math.abs(g - 255), Math.abs(b - 255))
}

function isNearWhite(r: number, g: number, b: number): boolean {
  return distFromWhite(r, g, b) <= WHITE_THRESHOLD
}

interface Pixel { x: number; y: number }

/**
 * Remove near-white background from a flat-background image.
 * Uses a BFS flood-fill starting from the four corner regions.
 * Returns a new RGBA Buffer where white-ish background pixels → alpha=0.
 *
 * ponytail: BFS flood-fill is simplest correct algo for this.
 * Upgrade to ML-based background removal if corner-flood misses organic edges.
 */
export function stripWhiteBackground(
  data: Buffer,
  width: number,
  height: number,
): Buffer {
  const out = Buffer.from(data) // clone
  const visited = new Uint8Array(width * height)

  // ponytail: 4-corner starting points — works for centered-art-on-white,
  // fails for images with white objects touching the edge.
  const queue: Pixel[] = []

  function push(x: number, y: number) {
    const idx = y * width + x
    if (visited[idx]) return
    visited[idx] = 1
    queue.push({ x, y })
  }

  // Seed from all four edges
  const margin = 2
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < margin; y++) { push(x, y); push(x, height - 1 - y) }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < margin; x++) { push(x, y); push(width - 1 - x, y) }
  }

  while (queue.length > 0) {
    const { x, y } = queue.pop()!
    const i = (y * width + x) * 4
    const r = out[i], g = out[i + 1], b = out[i + 2]

    if (!isNearWhite(r, g, b)) continue

    // Make transparent
    out[i] = r
    out[i + 1] = g
    out[i + 2] = b
    out[i + 3] = 0

    // Push neighbours
    if (x > 0) push(x - 1, y)
    if (x < width - 1) push(x + 1, y)
    if (y > 0) push(x, y - 1)
    if (y < height - 1) push(x, y + 1)
  }

  return out
}
