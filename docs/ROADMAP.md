# Roadmap

## v0.1.0 (current)

- [x] Batch convert any image folder to Shopify-ready SVGs
- [x] Vector trace (vtracer) with JS fallback
- [x] Embedded raster for mockups/photos
- [x] White background stripping
- [x] Greyscale auto-detect → binary mode
- [x] Browser gallery preview
- [x] SVG verification
- [x] Doctor smoke test
- [x] GitHub Actions CI
- [x] npm release with provenance

## v0.2.0 (next)

- [ ] Config file (`merch-angel.config.ts`) with custom routing patterns
- [ ] PostScript/AI export for screen printers
- [ ] Batch resize presets (printful-4500, printify-3600, etsy-square)
- [ ] Color palette extraction (top-N colors for screen printing separations)
- [ ] `--watch` mode (re-convert on file change)

## v0.3.0

- [ ] Printful API integration (upload SVGs directly)
- [ ] Printify API integration
- [ ] Shopify REST API integration (add files to products)
- [ ] Shopify GraphQL product creation from templates

## v0.4.0

- [ ] AI background removal (RMBG-2.0 via ONNX — local, no cloud)
- [ ] SVG optimization (clean up vtracer's redundant path nodes)
- [ ] Spot-color separation for screen printing (SVG per color channel)
- [ ] Multi-page TIFF support

## v1.0.0

- [ ] Stable CLI API (no breaking changes from 0.x)
- [ ] 100% test coverage on classifier and embedder
- [ ] First-party CI matrix for Windows
- [ ] Published to Homebrew and Scoop
