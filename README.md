# The Walk at Norwalk Dashboard

Interactive Next.js dashboard for a source-backed, approximate 3D module visualization.

## Run The App

```bash
pnpm install
pnpm generate:module-coordinates
pnpm generate:pdf-assets
pnpm dev
```

Useful verification commands:

```bash
pnpm lint
pnpm test:run
pnpm build
```

## Module Data

Module metadata lives in `data/modules.ts`.

The data uses real module IDs and unit codes extracted from `Module ID & Tranche Breakdown - Overall & By Level.pdf`. Levels, tranches, source pages, and unit codes are source-derived where practical. Module x/z positions are calibrated from PDF text-label coordinates generated into `data/module-coordinates.ts`.

The level 6 source text layer contains one apparent OCR/text extraction omission where `M211` appears as `M21`; the data corrects it to `M211` based on the level 6 sequence and unit code.

## PDF Assets

The module detail panel uses rendered PNGs from `Module ID & Tranche Breakdown - Overall & By Level.pdf`.

Generate or refresh them with:

```bash
pnpm generate:pdf-assets
```

The script writes images to `public/generated/pdf-pages/`. It uses PyMuPDF, so if your default `python` does not have it installed, run:

```bash
python -m pip install pymupdf
```

## Source-Derived Vs Approximate

Source-derived:

- module IDs
- unit codes
- level numbers
- tranche IDs and colors
- source PDF page references
- full-sheet 2D PDF previews

Approximate:

- 3D shell massing
- module dimensions
- garage/not-in-scope context massing

The A301 axon PDF and exterior rendering image are visual references for massing, material tone, and presentation. The dashboard does not claim BIM-level dimensional accuracy.

## Future GLB/IFC Replacement

The procedural model is isolated in `components/viewer/TransparentShell.tsx`, `components/viewer/ModuleBox.tsx`, and `data/modules.ts`. A future GLB/IFC workflow can replace the shell and module coordinates while keeping the filters, tranche legend, selection state, and detail panel intact.
