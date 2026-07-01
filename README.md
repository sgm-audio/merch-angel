<p align="center">
  <img src="https://raw.githubusercontent.com/scottmills306/merch-angel/main/docs/merch-angel.svg" width="120" alt="merch-angel">
</p>

<h1 align="center">merch-angel</h1>

<p align="center">
  Image → Shopify-ready SVG batch pipeline.<br>
  Brand-grade vectors without the bloat.
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/merch-angel?style=flat&color=%232a2a28" alt="npm">
  <img src="https://github.com/scottmills306/merch-angel/actions/workflows/ci.yml/badge.svg" alt="CI">
  <img src="https://img.shields.io/npm/l/merch-angel?style=flat&color=%232a2a28" alt="MIT">
  <img src="https://img.shields.io/badge/Bun-%3E%3D1.3.0-%23f9f3e3?style=flat" alt="Bun">
</p>

---

## Install

```bash
bun install -g github:scottmills306/merch-angel
bun pm trust merch-angel
```

Two lines. Postinstall pulls the `vtracer` binary for your platform, verifies
the SHA256, and links the CLI. No Docker, no Python, no system Rust, no npm account.

**Prerequisites:** [Bun](https://bun.sh) ≥1.3.0, [ImageMagick](https://imagemagick.org) (`magick`).

## Quickstart

```bash
merch-angel convert ~/Downloads/My-Artwork
```

That's it. Reads every PNG, JPG, JPEG, GIF, BMP, WebP, TIFF in the folder,
outputs SVGs to `~/Downloads/My-Artwork-merch/`. No flags.

## How it works

| File name contains … | Route | Output |
|---|---|---|
| `_mockupsized` | **Vector trace** via vtracer | `<name>.svg` — clean infinite-scale paths |
| `_mockupwhitewall`, `_mockup_website`, `_website` | **Embedded raster** | `<name>_with_mockup.svg` — base64 PNG in SVG shell |
| `phones_*` | **Embedded raster** | photo-friendly, white bg stripped |
| `a1.jpg`, `a2.jpg`, … | **Vector trace** | face artwork, full color |
| `diagramblack`, `diagramwhite` | **Vector trace** | binary mode (tiny files) |
| `*.svg` already | **Skipped** | left untouched |

Smart defaults:
- Greyscale images auto-detect → binary vtracer mode (10–100× smaller output)
- White backgrounds stripped from color files (transparent on dark shirts)
- Mockup layouts kept alongside, never swapped in by mistake

## Commands

```
merch-angel convert <folder>     Convert — auto-creates <folder>-merch/
merch-angel preview <folder>     Gallery — localhost:7465
merch-angel verify <folder>      Check — well-formed + size limits
merch-angel doctor               Check deps
merch-angel --version            Show version
```

### Options (all optional)

`merch-angel convert`:
```
<folder>               Source folder of images             [positional]
-o, --out <dir>        Output folder (default: <folder>-merch/)
-n, --dry-run          Just show what would happen
-f, --force-fallback   Use JS engine instead of vtracer
--vtracer-path <path>  Custom vtracer binary
--no-strip-bg          Keep original backgrounds
```

## Gallery preview

```bash
merch-angel convert ./art
merch-angel preview ./art-merch/
# → http://localhost:7465
```

Each SVG rendered against white, dark, and heather backdrops — so you see
exactly how it'll look on a black tee before uploading.

## Verification

```bash
merch-angel verify ./output
```

Checks every SVG for:
- Well-formed XML, valid `<svg>` root
- No rogue `<script>` tags
- File size within Shopify's 24 MB limit
- Embedded raster payload size (warns if excessive)

## What gets downloaded

Postinstall fetches [`vtracer`](https://github.com/vertex-lab/vtracer)
(binary only, GPL-3.0 upsteam license) from the official GitHub release
at the pinned version. SHA256 verified. If the download fails — proxy,
air-gapped, offline — `merch-angel` falls back to a pure-JS engine
(`imagetracerjs`) with no native dependencies. Lower quality but works.

## Install from GitHub (no npm account needed)

```bash
bun install -g github:scottmills306/merch-angel
bun pm trust merch-angel
```

Bun fetches the source directly from GitHub, links the CLI, and the
postinstall script downloads vtracer. No npm, no registry, no account.

## Requirements

| Tool | Required | Notes |
|---|---|---|
| Bun ≥1.3.0 | ✓ | Runtime |
| ImageMagick `magick` | ✓ | Resize, format detection, pre-process |
| vtracer binary | optional | Downloaded postinstall; pure-JS fallback built-in |

## Legal

**You must own the rights to every image you convert.** merch-angel is a
file format tool, not a content license. Using it on images you don't own
or don't have commercial rights to is copyright infringement — and
print-on-demand platforms will ban you for it.

→ [Full terms of use](TERMS.md)

## License

MIT © [SGM Studios / Scott Mills](https://github.com/scottmills306)

---

*merch-angel is a tool for creators who care about how their art prints.*

