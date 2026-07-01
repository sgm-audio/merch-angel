import { describe, expect, it } from 'bun:test'
import { stripWhiteBackground } from '../src/pipeline/bg-strip'

describe('stripWhiteBackground', () => {
  it('removes white pixels from corners', () => {
    // 4x4 image: all white pixels
    const buf = Buffer.alloc(4 * 4 * 4, 255) // RGBA all white
    const result = stripWhiteBackground(buf, 4, 4)

    // Corner pixel should be transparent
    expect(result[3]).toBe(0) // alpha at pixel (0,0)
  })

  it('preserves non-white pixels', () => {
    // 4x4: white bg with a red pixel in the middle
    const buf = Buffer.alloc(4 * 4 * 4, 255)
    // Pixel at (2,2) — red
    const idx = (2 * 4 + 2) * 4
    buf[idx] = 255     // R
    buf[idx + 1] = 0   // G
    buf[idx + 2] = 0   // B
    buf[idx + 3] = 255 // A

    const result = stripWhiteBackground(buf, 4, 4)

    // Red pixel should still be opaque
    const ri = (2 * 4 + 2) * 4
    expect(result[ri]).toBe(255)
    expect(result[ri + 1]).toBe(0)
    expect(result[ri + 2]).toBe(0)
    expect(result[ri + 3]).toBe(255)
  })

  it('preserves near-white but non-white pixels beyond threshold', () => {
    // 4x4: pixels with value 252 should be kept (distance=3 > threshold=2)
    // Buffer.alloc(byte) fills EVERY channel including alpha with 252
    const buf = Buffer.alloc(4 * 4 * 4, 252)
    const result = stripWhiteBackground(buf, 4, 4)
    const i = (0 * 4 + 0) * 4
    // Alpha stays 252 (unchanged — pixel wasn't near enough to white)
    expect(result[i + 3]).toBe(252)
  })

  it('removes pixels within threshold of white', () => {
    // 4x4: pixels with value 254 should be removed (distance=1 <= 2)
    const buf = Buffer.alloc(4 * 4 * 4, 254)
    const result = stripWhiteBackground(buf, 4, 4)
    expect(result[3]).toBe(0) // transparent
  })

  it('handles single-row image', () => {
    const buf = Buffer.alloc(10 * 1 * 4, 255)
    const result = stripWhiteBackground(buf, 10, 1)
    // All should be transparent
    for (let i = 0; i < 10; i++) {
      expect(result[i * 4 + 3]).toBe(0)
    }
  })
})
