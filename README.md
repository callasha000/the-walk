# The Walk at Norwalk Dashboard

Interactive Next.js dashboard for a source-backed, approximate 3D module visualization.

## PDF Assets

The module detail panel uses rendered PNGs from `Module ID & Tranche Breakdown - Overall & By Level.pdf`.

Generate them with:

```bash
pnpm generate:pdf-assets
```

The script writes images to `public/generated/pdf-pages/`. It uses PyMuPDF, so if your default `python` does not have it installed, run:

```bash
python -m pip install pymupdf
```

The generated 3D geometry is approximate. Module IDs, unit codes, levels, tranches, and source page references are derived from the Module ID PDF where practical.
