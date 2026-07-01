# Contributing

## Quick start

```bash
git clone https://github.com/scottmills306/merch-angel
cd merch-angel
bun install
bun run src/cli.ts doctor    # confirm deps
```

## Commit messages

Conventional Commits enforced by commitlint:

```
feat(tracer): add binary mode threshold auto-detect
fix(embedder): handle oversized PNGs without OOM
docs(readme): clarify vtracer license terms
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
`test`, `build`, `ci`, `chore`, `revert`.

## Before opening a PR

```bash
bun run lint          # Biome — zero errors
bun run typecheck     # TypeScript — zero errors
bun test              # All pass
bun run src/cli.ts doctor  # All checks green
```

## Release

Done via Changesets. After merging to main, run:

```bash
bunx changeset
bunx changeset version
git add -A && git commit -m "chore: version bump"
git push --follow-tags
```

GitHub Actions picks up the tag and publishes to npm with provenance.
