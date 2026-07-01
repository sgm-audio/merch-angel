# Changelog

All notable changes to merch-angel are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial scaffold: CLI, pipeline, CI/CD, docs
- Batch vector trace via vtracer with JS fallback
- Embedded-raster SVG production for mockups/photos
- White-background stripping for color files
- Greyscale auto-detection → binary vtracer mode
- `merch-angel preview` — browser gallery with Shopify backdrops
- `merch-angel verify` — SVG well-formedness + size checks
- `merch-angel doctor` — post-install dependency smoke test
- GitHub Actions CI: lint, typecheck, test, E2E batch, doctor
- npm release pipeline with provenance attestation
- Dependabot + CodeQL weekly scans

### Notes
- vtracer GPL binary is downloaded postinstall, never bundled.
- SHA256 verification via pinned shasums committed to repo.
