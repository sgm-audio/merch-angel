# First run report — Concrete Angel Prints

Produced with `merch-angel` v0.1.0 on 2026-07-01.

## Source

`/var/home/sgm/Downloads/Concrete Angel Prints/` — 38 files across 5 subfolders.

## Command

```bash
merch-angel convert --src "/var/home/sgm/Downloads/Concrete Angel Prints" --out /tmp/merch-output
```

## Results

| Metric | Value |
|---|---|
| Total files found | 38 |
| Vector-traced | 21 |
| Embedded-raster | 17 |
| Failed | **0** |
| Total output size | 126 MB |
| Largest SVG | `untitled-4 copy.svg` (5.5 MB) |
| Smallest SVG | `a4.svg` (408 KB) |
| Total run time | 75 s |
| Pipeline engine | vtracer v0.6.4 (native binary) |

## Verification

- 38 SVGs verified: **38 pass, 0 fail** (well-formed XML, no script tags, within 20 MB size limit)
- No oversized files after 2000 px embedded raster cap

## Preview gallery

![Gallery screenshot](./preview/gallery.png)

The Playwright-backed gallery at `localhost:7465` shows each SVG against
white, dark, and heather backdrops.
