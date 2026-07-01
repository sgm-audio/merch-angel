# Routing Rules

The classifier determines which images get vector-traced and which get
embedded as raster. Rules are evaluated in order (first match wins).

## Default rules

| Rule | Pattern | Route | Notes |
|---|---|---|---|
| Existing SVG | `*.svg` | skip | Pass-through |
| Mockup wall | `*_mockupwhitewall.*` | embed_  | Art in a room mockup — raster preserve |
| Mockup website | `*_mockup_website.*` | embed | Same pattern |
| Website variant | `*_website.*` | embed | Same pattern |
| Phone photos | `phones_*.*` | embed | Photographic, won't trace cleanly |
| Face artwork | `a[1-4]*.*` | trace | Portrait illustrations |
| Diagrams | `diagramblack*.*`, `diagramwhite*.*` | trace | Binary mode (greyscale auto-detected) |
| Untitled art | `untitled*.*`, `untitled-*.*` | trace | Square/tall art pieces |
| Mockup-sized art | `*mockupsized*.*` | trace | True artwork at print size |
| **Default** | Anything else | trace | Vector-first pipeline |

## Extending

Future: `merch-angel.config.ts` will allow custom patterns:

```ts
export default {
  patterns: [
    { match: '*_lineart.*', route: 'trace', binary: true },
    { match: '*_photo.*',   route: 'embed' },
  ]
}
```

## Greyscale detection

Before tracing, the pipeline checks mean HSL saturation via ImageMagick.
If saturation < 0.05, the image is traced in `binary` mode — monochrome
paths, 10–100× smaller file size, better for screen printing.
