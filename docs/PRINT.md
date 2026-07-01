# Print-on-Demand Notes

## File format recommendations

### DTG / Digital Print (Printful, Printify, Gelato)

SVG is accepted for proofing on most platforms, but the actual print file
should be a high-resolution PNG. SVG rasterizes at screen resolution
in-browser and may lose fine detail on larger prints.

**Best practice workflow:**

1. `merch-angel convert` to produce vector SVGs for proofing
2. Export final print files as 4500×5400 px PNG at 300 DPI with transparent
   background from your design tool (Illustrator, Affinity, Inkscape)
3. Upload the PNG to Shopify via Printful/Printify integration

### Screen printing

SVG vector paths are ideal. Provide the SVG to your screen printer along
with a Pantone color callout.

### Wall art / posters

Vector SVG is preferred. Framed mockup SVGs (`*_with_mockup.svg`) are useful
as listing images but not for the actual print file.

## Size limits

| Platform | SVG max | Notes |
|---|---|---|
| Printful | 24 MB | Accepted for some products |
| Printify | 25 MB | Upload through UI |
| Shopify | 20 MB | Direct file upload |
| Gelato | 10 MB | SVG accepted |

merch-angel warns at 10 MB (`verify` command) and caps embedded raster SVG
payloads at ~3 MB (3000 px long edge).

## White background stripping

Color images with white/light backgrounds get their background removed
so the art prints directly on the garment color. Greyscale and monochrome
images keep their backgrounds — white ink on black shirts needs a white
underbase, and removing the background would delete the white.

## Product templates

For repeat product uploads, save your Shopify product template with
sku.png art placements. Replace art files per run, re-upload to the
same draft products.
