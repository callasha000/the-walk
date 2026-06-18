# Calibrated Building Geometry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the misaligned procedural module strips with calibrated positions derived from the Module ID PDF level sheets.

**Architecture:** Keep module IDs and unit codes source-derived, but add a build-time/generated coordinate map from each level sheet's module label positions. Convert PDF page coordinates to centered 3D x/z positions, then derive shell/context masses from the calibrated module extents instead of fixed generic boxes.

**Tech Stack:** Next.js, TypeScript, Vitest, React Three Fiber, PyMuPDF for coordinate extraction.

---

### Task 1: Extract Coordinates

**Files:**
- Create: `scripts/extract-module-coordinates.py`
- Create: `data/module-coordinates.ts`

**Steps:**
1. Use PyMuPDF word extraction on pages 2-8 of `Module ID & Tranche Breakdown - Overall & By Level.pdf`.
2. Match words shaped like `M<number>`.
3. Exclude title block, legends, and callouts by keeping only coordinates in the plan drawing region.
4. For duplicate module IDs on one page, choose the candidate closest to its known tranche/zone drawing area.
5. Emit a TypeScript map keyed by module ID with `sheetX`, `sheetY`, `level`, and `sourcePage`.

### Task 2: Test Geometry Mapping

**Files:**
- Modify: `lib/viewer-geometry.test.ts`
- Modify: `data/modules.ts`

**Steps:**
1. Write failing tests that assert known Level 1 relationships from the PDF:
   - Green/Tranche 3 modules sit below the upper pink wing.
   - Blue/Tranche 4 modules sit to the right of the green strip.
   - Upper pink/Tranche 1 and vertical magenta/Tranche 2 are separated from the lower garage modules.
2. Run tests and confirm they fail against the current strip geometry.
3. Implement coordinate-based positions and rerun tests.

### Task 3: Rebuild Shell And Camera

**Files:**
- Modify: `components/viewer/TransparentShell.tsx`
- Modify: `components/viewer/BuildingViewer.tsx`

**Steps:**
1. Replace fixed shell boxes with calibrated mass zones that match the PDF plan clusters.
2. Move the default camera farther out so all masses read as one project.
3. Keep orbit controls and existing selection/filter UX unchanged.

### Task 4: Verify

**Commands:**

```bash
pnpm lint
pnpm test:run
pnpm build
```

Browser checks:

- Default all-level view no longer appears as a continuous rectangular/courtyard block.
- Level 1 view visually matches the PDF relationship: upper L, vertical magenta wing, green garage-top strip, blue east edge.
- Clicking a module still updates the side panel.
