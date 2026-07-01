import { describe, expect, it } from 'bun:test'
import { isGreyscale } from '../src/pipeline/tracer'

describe('isGreyscale', () => {
  it('returns false for non-existent file', () => {
    expect(isGreyscale('/tmp/nonexistent.png')).toBe(false)
  })

  it('returns false for invalid path', () => {
    expect(isGreyscale('')).toBe(false)
  })
})

describe('traceImage', () => {
  it('module exports the function', () => {
    const { traceImage } = require('../src/pipeline/tracer')
    expect(typeof traceImage).toBe('function')
  })
})
