# Architecture

merch-angel is a single-Bun-binary CLI with a pipeline of ordered transforms.

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
│  scanner  │───→│classifier │───→│manifest  │───→│ executor │───→ SVGs
│listImages │    │Route enum │    │ CSV +    │    │ tracer / │
│recursive  │    │by pattern │    │ dry-run  │    │ embedder │
└──────────┘    └───────────┘    └──────────┘    └──────────┘
                                                      │
                                               ┌──────┴──────┐
                                               │ verify      │
                                               │ XML checks  │
                                               │ size limits │
                                               └──────┬──────┘
                                                      │
                                               ┌──────┴──────┐
                                               │ preview     │
                                               │ Playwright  │
                                               │ gallery     │
                                               └─────────────┘
```

## Traced vs Embedded

**Vector trace** — vtracer CLI (or imagetracerjs fallback):
- `mode=spline` for full-color art
- `mode=binary` for greyscale/line art
- Tuned params: `speckle_filter=8`, `color_precision=6`, `corner_threshold=60`

**Embedded raster** — ImageMagick resize → base64 PNG → `<svg><image>`:
- Matches the `a1 (1).svg` convention already used in Concrete Angel Prints
- White-bg removal via flood-fill from the four corners
- Max long edge: 3000 px (Shopify DTG-friendly)

## Classifier rules

See [ROUTING.md](./ROUTING.md) for the full rule matrix. The classifier
is a pure-function mapper from `FileEntry → Route`. No side effects.
Easily tested.

## Gallery

Bun's built-in HTTP server serves SVG files from a directory. The gallery
HTML renders each SVG inside three `backdrop` DIVs (white, dark, heather)
to simulate print-on-demand backgrounds. No build step — the HTML is
generated and served inline.
