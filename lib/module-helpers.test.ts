import { describe, expect, it } from "vitest";
import type { BuildingModule } from "@/data/module-types";
import { filterModules, getPdfPageImagePath, getTrancheMeta } from "./module-helpers";

const modules: BuildingModule[] = [
  {
    id: "M1",
    unitCode: "DB1M-LH2",
    level: 1,
    tranche: 4,
    buildingZone: "Market Rate East",
    position: [0, 0, 0],
    size: [1, 1, 1],
    sourcePage: 2,
    notes: "sample",
  },
  {
    id: "M254",
    unitCode: "AA1M-S3M-KB1",
    level: 1,
    tranche: 2,
    buildingZone: "Market Rate North",
    position: [1, 0, 0],
    size: [1, 1, 1],
    sourcePage: 2,
    notes: "sample",
  },
  {
    id: "M118",
    unitCode: "A2M-K2W",
    level: 2,
    tranche: 1,
    buildingZone: "Affordable West",
    position: [2, 0, 0],
    size: [1, 1, 1],
    sourcePage: 3,
    notes: "sample",
  },
];

describe("module helpers", () => {
  it("filters by level and tranche", () => {
    expect(
      filterModules(modules, { level: 1, tranches: [2] }).map(
        (module) => module.id,
      ),
    ).toEqual(["M254"]);
  });

  it("keeps all levels when showAllLevels is true", () => {
    expect(
      filterModules(modules, { level: 1, tranches: [], showAllLevels: true }),
    ).toHaveLength(3);
  });

  it("returns tranche metadata", () => {
    expect(getTrancheMeta(3)).toMatchObject({ label: "Tranche 3" });
  });

  it("builds generated PDF page image paths", () => {
    expect(getPdfPageImagePath(7)).toBe(
      "/generated/pdf-pages/module-id-level-6.png",
    );
  });
});
