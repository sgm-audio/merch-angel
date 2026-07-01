# Concrete Angel Prints — merch-angel example

This directory documents the first production run of `merch-angel` against
the Concrete Angel Prints artwork archive.

## Source

```
/var/home/sgm/Downloads/Concrete Angel Prints/
```

~27 files across 5 folders: Concrete Angel, Concrete Angel Beige F,
Concrete Angel Beige M, Concrete Angel Grey, and Faces, plus root-level
files (diagrams, untitled artwork, phone photos).

## Run

```bash
merch-angel convert --src /path/to/Concrete\ Angel\ Prints --out ./output
```

## Output

| Route | Count | Files |
|---|---|---|
| Trace | 11 | Mockupsized artwork + face portraits + diagrams |
| Embed | 13 | Mockup walls + website variants + phone photos |
| Skip | 3 | Existing SVGs + non-image files |

## Results

See `_manifest.csv` for the full routing decision log.
Generated SVGs are in `./output/`.
