# Architectural 3D Dashboard Design

## Goal

Build a polished Next.js TypeScript dashboard for The Walk at Norwalk that presents an interactive architectural 3D visualization. The model is a source-backed procedural approximation: the module schedule and level sheets drive IDs, tranches, levels, zones, and source pages, while the A301 axon and exterior rendering guide the shell massing and visual treatment.

## Source Material

- `Module ID & Tranche Breakdown - Overall & By Level.pdf`: source of truth for module IDs, unit codes, levels, tranche colors, per-level tranche counts, and source-page previews.
- `A301_ OVERALL 3D AXON Rev.1.pdf`: visual reference for overall massing, courtyard relationship, podium/garage mass, and roof profile.
- `image-1770055157163.png`: visual reference for exterior palette, facade rhythm, neutral materials, window contrast, and premium presentation.

The generated 3D geometry is not BIM geometry and must be labeled as approximate. The implementation should be easy to replace later with GLB/IFC-derived geometry.

## Recommended Approach

Scaffold a fresh Next.js App Router application in the existing repository using `pnpm`. Use React Three Fiber for the 3D scene, Tailwind CSS for dashboard layout, lucide-react for controls, and a small build-time PDF script to render source pages into PNGs under `public/generated/pdf-pages/`.

This provides the best balance of polish, source linkage, and maintainability. A minimal prototype would be faster but weaker. A brittle crop-based PDF extraction would look more exact in the side panel but would overstate precision without true crop coordinates.

## Product Experience

The first screen is the actual dashboard, not a landing page. The layout uses a full-screen 3D viewer with a compact top/left control surface, a tranche legend, level and tranche filters, and a right-side glass detail panel for the selected module.

Core interactions:

- Rotate, pan, and zoom the building with orbit controls.
- Toggle translucent exterior shell, internal wireframe, selected/all levels, and exploded levels.
- Filter visible modules by level and tranche.
- Hover modules to show a compact module ID tooltip.
- Click a module to select it, visually emphasize it, and update the detail panel.

## 3D Model

The model uses procedural geometry:

- Translucent exterior shells approximate the L-shaped/courtyard building mass and upper residential wings shown in A301.
- Muted garage/not-in-scope podium masses communicate context without implying modular scope.
- Internal module boxes are stacked by level and grouped into plan zones corresponding to the PDF: affordable/green wing, market-rate/pink wings, blue-gray vertical edge wing, and pink/magenta tranche wing.
- Module boxes use tranche colors:
  - Tranche 1: light pink
  - Tranche 2: stronger pink/magenta
  - Tranche 3: light green
  - Tranche 4: light blue-gray

The scene should keep stable dimensions and lightweight geometry. Module rendering maps over data; it is not hard-coded inside the scene.

## Data Model

Create `data/modules.ts` with:

- `id`
- `unitCode`
- `level`
- `tranche`
- `buildingZone`
- `position`
- `size`
- `sourcePage`
- `notes`

Module IDs and unit codes come from the Module ID PDF text layer where practical. Position and size are simplified procedural coordinates that preserve the visual wing/level relationships rather than exact architectural dimensions.

## Detail Panel

When selected, a module detail panel shows:

- Module ID
- Unit code
- Level
- Tranche
- Building zone
- Source page
- Notes and source confidence
- Full rendered level-plan PNG for the source page

The panel must not invent detailed apartment floor plans. If exact crop coordinates are unavailable, it shows the full level sheet and clearly states that the selected module is identified in metadata.

## Asset Pipeline

Add `scripts/extract-pdf-assets.ts` or an equivalent script that renders PDF pages to:

`public/generated/pdf-pages/`

The app reads these generated images lazily in the detail panel. If a local environment cannot render PDFs, the README should explain the command and dependency path.

## Testing And Verification

Use TDD for new behavior where practical:

- Data helpers: filtering by level/tranche, selected-level visibility, tranche metadata lookup, source-page path generation.
- PDF asset script: expected output path generation and page manifest shape.
- UI smoke tests where the chosen scaffold supports them.

Final verification should include:

- `pnpm install`
- `pnpm lint`
- `pnpm test` if configured
- `pnpm build`
- Start the dev server and inspect the app in browser at desktop and mobile-ish widths.

## Future GLB/IFC Replacement

Keep procedural geometry behind component/data boundaries so a real model can replace it later:

- `TransparentShell` can be swapped for a loaded GLB shell.
- `ModuleBox` data can be mapped to BIM element IDs when available.
- Existing filters, selection state, tranche legend, and detail panel should remain unchanged.
