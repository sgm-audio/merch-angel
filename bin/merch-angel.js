#!/usr/bin/env bun
// merch-angel — thin entry wrapper
import('../src/cli.ts').catch((e) => {
  console.error(e)
  process.exit(1)
})
