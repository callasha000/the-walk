# PDF-Scaled Module Geometry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the 3D module footprints and transparent building shell use the scaled module outlines from the Module ID PDF instead of fixed procedural box sizes, and allow farther zoom-out for PDF comparison.

**Architecture:** Extend the existing PyMuPDF extraction script so each module ID is matched to its enclosing PDF stroke rectangle, emitting `sheetWidth` and `sheetHeight` with the existing label coordinates. Convert those sheet dimensions through the existing `sheetCalibration.scale`, use them for module box plan dimensions, and derive shell masses from the resulting module footprint groups. Move camera and controls constants into a small settings module so zoom limits are testable.

**Tech Stack:** Next.js, React Three Fiber, Drei OrbitControls, TypeScript, Vitest, PyMuPDF, pnpm.

---

### Task 1: Lock In Expected Geometry

**Files:**
- Modify: `C:\Users\calla\Desktop\the-walk\lib\viewer-geometry.test.ts`
- Create: `C:\Users\calla\Desktop\the-walk\components\viewer\viewer-settings.ts`
- Test: `C:\Users\calla\Desktop\the-walk\lib\viewer-geometry.test.ts`

**Step 1: Write failing tests**

Add tests that assert:
- Level 1 module footprints have meaningful size variation, not the current two hard-coded sizes.
- Known PDF-derived samples have correct relative dimensions:
  - `M378` is a narrow/deep west-wing module.
  - `M390` is wider/deeper than `M378`.
  - `M254` is a wide/shallow magenta module.
  - `M1` has a PDF-derived fallback footprint, not the old generic size.
- Viewer settings allow zooming out to at least `60`.

**Step 2: Run test to verify it fails**

Run: `pnpm.cmd test:run lib/viewer-geometry.test.ts`

Expected: FAIL because current `modules.ts` still returns only fixed sizes and the viewer settings module does not exist yet.

### Task 2: Extract PDF Module Rectangles

**Files:**
- Modify: `C:\Users\calla\Desktop\the-walk\scripts\extract-module-coordinates.py`
- Generated: `C:\Users\calla\Desktop\the-walk\data\module-coordinates.ts`

**Step 1: Implement rectangle matching**

Update the script to:
- Collect module label centers from pages 2-8 as it does now.
- Collect black stroked rectangle candidates from `page.get_drawings()` where `type == "s"`, stroke is black, line width is module-outline weight, dimensions are plausible module sizes, and the rectangle is in the plan region.
- Assign each label to the smallest enclosing rectangle.
- For level 1 `M1`, infer its rectangle from the adjacent blue cell boundary lines because the PDF does not emit a closed stroke rectangle around that label.
- Emit `sheetWidth` and `sheetHeight` in `moduleCoordinates`.
- Fail loudly if any module lacks a rectangle or has implausible dimensions.

**Step 2: Regenerate data**

Run: `pnpm.cmd generate:module-coordinates`

Expected: `data/module-coordinates.ts` is regenerated with 499 entries, each including `sheetWidth` and `sheetHeight`.

### Task 3: Use PDF Footprints In The Viewer

**Files:**
- Modify: `C:\Users\calla\Desktop\the-walk\data\geometry-calibration.ts`
- Modify: `C:\Users\calla\Desktop\the-walk\data\modules.ts`
- Test: `C:\Users\calla\Desktop\the-walk\lib\viewer-geometry.test.ts`

**Step 1: Add conversion helper**

Add `sheetSizeToModelSize(sheetWidth, sheetHeight, height)` or equivalent to convert PDF width/depth to the module `size` tuple.

**Step 2: Replace fixed `sizeFor`**

Use each module coordinate's `sheetWidth` and `sheetHeight` for `[x, y, z]`, with the existing story/module height preserved.

**Step 3: Run test**

Run: `pnpm.cmd test:run lib/viewer-geometry.test.ts`

Expected: PASS for geometry assertions.

### Task 4: Rebuild The Transparent Shell From PDF Geometry

**Files:**
- Create: `C:\Users\calla\Desktop\the-walk\data\shell-masses.ts`
- Modify: `C:\Users\calla\Desktop\the-walk\components\viewer\TransparentShell.tsx`
- Test: `C:\Users\calla\Desktop\the-walk\lib\viewer-geometry.test.ts`

**Step 1: Derive shell masses from module rectangles**

Group modules by wing/tranche and connected footprint, union their PDF rectangles with small padding, and export shell masses as data rather than hand-coded rough boxes.

**Step 2: Update renderer**

Render `shellMasses` from the data file through `sheetRectToModelMass`.

**Step 3: Add and run shell tests**

Assert shell bounds cover the known level 1 module extents, including upper north wing, lower west strip, east edge, and vertical magenta wing.

Run: `pnpm.cmd test:run lib/viewer-geometry.test.ts`

Expected: PASS.

### Task 5: Expand Zoom-Out Range And Verify

**Files:**
- Modify: `C:\Users\calla\Desktop\the-walk\components\viewer\BuildingViewer.tsx`
- Modify: `C:\Users\calla\Desktop\the-walk\components\viewer\viewer-settings.ts`

**Step 1: Use exported settings**

Set camera and OrbitControls from `viewerCameraSettings`, with `maxDistance >= 60`, farther fog, and a larger grid.

**Step 2: Run full verification**

Run:
- `pnpm.cmd lint`
- `pnpm.cmd test:run`
- `pnpm.cmd build`

Expected: all pass.

**Step 3: Browser verification**

Open `http://127.0.0.1:3000`, inspect Level 1 and All Levels, compare module outlines visually against the PDF plan thumbnail, verify shell is full footprint scale, and confirm controls can zoom out farther.

**Step 4: Commit**

Run:
- `git status --short`
- `git add docs/plans/2026-06-18-pdf-scaled-module-geometry.md scripts/extract-module-coordinates.py data/module-coordinates.ts data/geometry-calibration.ts data/modules.ts data/shell-masses.ts components/viewer/TransparentShell.tsx components/viewer/BuildingViewer.tsx components/viewer/viewer-settings.ts lib/viewer-geometry.test.ts`
- `git commit -m "fix: derive module footprints from PDF outlines"`
