# Architectural 3D Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a polished Next.js TypeScript dashboard with an interactive approximate 3D architectural module viewer for The Walk at Norwalk.

**Architecture:** Scaffold a Next.js App Router project with Tailwind CSS, then add source-driven module data, pure filtering/path helpers, generated PDF page assets, and client-only React Three Fiber viewer components. The 3D scene maps over module data and keeps procedural shell geometry isolated so it can be replaced by a future GLB/IFC model.

**Tech Stack:** Next.js App Router, TypeScript, pnpm, Tailwind CSS, React Three Fiber, three, @react-three/drei, lucide-react, Vitest, Testing Library, PyMuPDF via Python for PDF page rendering.

---

### Task 1: Scaffold The App

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`

**Step 1: Generate the scaffold**

Run:

```bash
pnpm dlx create-next-app@latest . --ts --tailwind --eslint --app --src-dir false --import-alias "@/*" --use-pnpm --no-turbopack
```

Expected: Next.js app files are created in the repository.

**Step 2: Install dashboard dependencies**

Run:

```bash
pnpm add three @react-three/fiber @react-three/drei lucide-react clsx
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Expected: dependencies are added to `package.json`.

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml app next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs
git commit -m "chore: scaffold next dashboard app"
```

### Task 2: Add Test Harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `test/setup.ts`

**Step 1: Write test configuration**

Add `test`, `test:watch`, and `test:run` scripts to `package.json`. Configure Vitest with `jsdom`, React plugin support through Vite defaults where needed, `@testing-library/jest-dom`, and aliases for `@/*`.

**Step 2: Run tests to establish baseline**

Run:

```bash
pnpm test:run
```

Expected: PASS with no tests found only if Vitest is configured to pass with no tests, or a clean baseline after adding a trivial setup test if needed.

**Step 3: Commit**

```bash
git add package.json vitest.config.ts test/setup.ts
git commit -m "test: add vitest harness"
```

### Task 3: Add Module Types And Failing Helper Tests

**Files:**
- Create: `data/module-types.ts`
- Create: `lib/module-helpers.test.ts`

**Step 1: Write failing tests**

Test the desired pure behaviors:

```ts
import { describe, expect, it } from "vitest";
import { filterModules, getPdfPageImagePath, getTrancheMeta } from "./module-helpers";
import type { BuildingModule } from "@/data/module-types";

const modules: BuildingModule[] = [
  { id: "M1", unitCode: "DB1M-LH2", level: 1, tranche: 4, buildingZone: "Market Rate East", position: [0, 0, 0], size: [1, 1, 1], sourcePage: 2, notes: "sample" },
  { id: "M254", unitCode: "AA1M-S3M-KB1", level: 1, tranche: 2, buildingZone: "Market Rate North", position: [1, 0, 0], size: [1, 1, 1], sourcePage: 2, notes: "sample" },
  { id: "M118", unitCode: "A2M-K2W", level: 2, tranche: 1, buildingZone: "Affordable West", position: [2, 0, 0], size: [1, 1, 1], sourcePage: 3, notes: "sample" },
];

describe("module helpers", () => {
  it("filters by level and tranche", () => {
    expect(filterModules(modules, { level: 1, tranches: [2] }).map((module) => module.id)).toEqual(["M254"]);
  });

  it("keeps all levels when showAllLevels is true", () => {
    expect(filterModules(modules, { level: 1, tranches: [], showAllLevels: true })).toHaveLength(3);
  });

  it("returns tranche metadata", () => {
    expect(getTrancheMeta(3)).toMatchObject({ label: "Tranche 3" });
  });

  it("builds generated PDF page image paths", () => {
    expect(getPdfPageImagePath(7)).toBe("/generated/pdf-pages/module-id-level-6.png");
  });
});
```

Run:

```bash
pnpm test:run lib/module-helpers.test.ts
```

Expected: FAIL because `lib/module-helpers.ts` does not exist.

### Task 4: Implement Module Helpers

**Files:**
- Create: `lib/module-helpers.ts`
- Modify: `data/module-types.ts`

**Step 1: Write minimal implementation**

Add the `BuildingModule`, `TrancheId`, `ViewerFilters`, and tranche metadata types. Implement `filterModules`, `getTrancheMeta`, and `getPdfPageImagePath`.

**Step 2: Run tests**

Run:

```bash
pnpm test:run lib/module-helpers.test.ts
```

Expected: PASS.

**Step 3: Commit**

```bash
git add data/module-types.ts lib/module-helpers.ts lib/module-helpers.test.ts
git commit -m "feat: add module filtering helpers"
```

### Task 5: Add Source-Backed Module Data

**Files:**
- Create: `data/modules.ts`
- Modify: `lib/module-helpers.test.ts`

**Step 1: Write failing data integrity tests**

Add tests that assert:

- `modules` contains levels 1 through 7.
- Every module has an ID, unit code, level, tranche, source page, position, and size.
- Tranche IDs are only `1 | 2 | 3 | 4`.
- A known PDF-derived ID such as `M1` and `M254` exists.

Run:

```bash
pnpm test:run lib/module-helpers.test.ts
```

Expected: FAIL because `data/modules.ts` does not exist.

**Step 2: Implement data**

Create representative source-backed module data across levels 1-7. Use real IDs and unit codes extracted from the Module ID PDF. Use approximate positions and sizes grouped into zones: `Affordable West`, `Market Rate North`, `Market Rate East`, `Market Rate South`, and `Garage Context`.

**Step 3: Run tests**

Run:

```bash
pnpm test:run lib/module-helpers.test.ts
```

Expected: PASS.

**Step 4: Commit**

```bash
git add data/modules.ts lib/module-helpers.test.ts
git commit -m "feat: add source-backed module data"
```

### Task 6: Add PDF Asset Generation

**Files:**
- Create: `scripts/extract-pdf-assets.py`
- Create: `public/generated/pdf-pages/.gitkeep`
- Modify: `package.json`
- Modify: `README.md`

**Step 1: Write script**

Create a Python script using PyMuPDF to render all pages from `Module ID & Tranche Breakdown - Overall & By Level.pdf` to:

- `public/generated/pdf-pages/module-id-overall.png`
- `public/generated/pdf-pages/module-id-level-1.png`
- ...
- `public/generated/pdf-pages/module-id-level-7.png`

**Step 2: Add package script**

Add:

```json
"generate:pdf-assets": "python scripts/extract-pdf-assets.py"
```

If `python` does not resolve to the bundled runtime, document the direct bundled Python path in README.

**Step 3: Run asset generation**

Run:

```bash
pnpm generate:pdf-assets
```

Expected: eight PNG files are created under `public/generated/pdf-pages/`.

**Step 4: Commit**

```bash
git add scripts/extract-pdf-assets.py public/generated/pdf-pages package.json README.md
git commit -m "feat: generate PDF page assets"
```

### Task 7: Build Dashboard State And Controls

**Files:**
- Create: `components/dashboard/ViewerToolbar.tsx`
- Create: `components/dashboard/TrancheLegend.tsx`
- Create: `components/dashboard/UnitDetailPanel.tsx`
- Modify: `app/page.tsx`

**Step 1: Write failing component tests**

Add focused tests for:

- Level chips call selection handler.
- Tranche legend renders all four tranche labels and colors.
- Unit detail panel renders selected module metadata and source confidence.

Run:

```bash
pnpm test:run
```

Expected: FAIL because components do not exist.

**Step 2: Implement components**

Build compact dashboard controls with lucide icons, accessible buttons, stable dimensions, and responsive panel behavior.

**Step 3: Run tests**

Run:

```bash
pnpm test:run
```

Expected: PASS.

**Step 4: Commit**

```bash
git add components/dashboard app/page.tsx
git commit -m "feat: add dashboard controls and detail panel"
```

### Task 8: Build 3D Viewer Components

**Files:**
- Create: `components/viewer/BuildingViewer.tsx`
- Create: `components/viewer/ModuleBox.tsx`
- Create: `components/viewer/TransparentShell.tsx`
- Modify: `app/page.tsx`

**Step 1: Write smoke test**

Add a client component smoke test or helper-level tests for viewer props where WebGL mocking is practical. If jsdom WebGL is too brittle, keep automated tests on state/data and verify viewer behavior manually in browser.

**Step 2: Implement viewer**

Use `Canvas`, `PerspectiveCamera`, `OrbitControls`, ambient/directional lighting, contact shadows if stable, and mapped `ModuleBox` components. Add hover tooltip, click selection, selected highlighting, optional wireframe, translucent shell toggle, and exploded-level offset.

**Step 3: Run tests**

Run:

```bash
pnpm test:run
```

Expected: PASS.

**Step 4: Commit**

```bash
git add components/viewer app/page.tsx
git commit -m "feat: add interactive 3d building viewer"
```

### Task 9: Polish Layout And Documentation

**Files:**
- Modify: `app/globals.css`
- Modify: `app/page.tsx`
- Modify: `README.md`

**Step 1: Polish UI**

Tune theme, spacing, responsive layout, panel glass effect, button states, and typography. Keep the app dense and dashboard-like rather than marketing-page-like.

**Step 2: Complete README**

Document:

- `pnpm install`
- `pnpm generate:pdf-assets`
- `pnpm dev`
- `pnpm lint`
- `pnpm test:run`
- module data location
- PDF asset usage
- approximate vs source-derived behavior
- future GLB/IFC replacement path

**Step 3: Commit**

```bash
git add app README.md
git commit -m "docs: document dashboard workflow"
```

### Task 10: Final Verification

**Files:**
- No file edits expected unless verification finds an issue.

**Step 1: Run full verification**

Run:

```bash
pnpm lint
pnpm test:run
pnpm build
```

Expected: all commands pass.

**Step 2: Start dev server**

Run:

```bash
pnpm dev
```

Expected: app starts on a local port.

**Step 3: Browser verification**

Open the app and verify:

- The dashboard loads.
- The 3D building is visible, not blank.
- Orbit controls rotate/pan/zoom.
- Shell and wireframe toggles work.
- Level and tranche filters work.
- Clicking a module updates the side panel.
- PDF preview image appears in the panel.
- Layout remains usable on desktop and narrower viewport widths.

**Step 4: Commit any fixes**

If fixes are needed:

```bash
git add <changed-files>
git commit -m "fix: address dashboard verification issues"
```
