import { describe, expect, it } from "vitest";
import type { BuildingModule } from "@/data/module-types";
import { modules as projectModules } from "@/data/modules";
import { filterModules, getPdfPageImagePath, getTrancheMeta } from "./module-helpers";

const modules: BuildingModule[] = [
  {
    id: "M1",
    unitCode: "DB1M-LH2",
    level: 1,
    tranche: 4,
    buildingZone: "Market Rate South Wing",
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
    buildingZone: "Market Rate East Wing",
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
    buildingZone: "Market Rate North Wing",
    position: [2, 0, 0],
    size: [1, 1, 1],
    sourcePage: 3,
    notes: "sample",
  },
  {
    id: "M238",
    unitCode: "K7M-S5",
    level: 7,
    tranche: 1,
    buildingZone: "Market Rate North Wing",
    position: [3, 0, 0],
    size: [0.4, 1, 1.3],
    sourcePage: 8,
    notes: "sample",
  },
  {
    id: "M228",
    unitCode: "A7M-K2W",
    level: 7,
    tranche: 1,
    buildingZone: "Market Rate West Wing",
    position: [4, 0, 0],
    size: [1.3, 1, 0.4],
    sourcePage: 8,
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
    ).toHaveLength(5);
  });

  it("filters by building section zone", () => {
    expect(
      filterModules(modules, {
        level: 1,
        tranches: [],
        zones: ["Market Rate East Wing"],
      }).map((module) => module.id),
    ).toEqual(["M254"]);
  });

  it("filters by the market rate west wing zone", () => {
    expect(
      filterModules(modules, {
        level: 1,
        tranches: [],
        zones: ["Market Rate West Wing"],
        showAllLevels: true,
      }).map((module) => module.id),
    ).toEqual(["M228"]);
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

describe("project module data", () => {
  it("covers levels 1 through 7", () => {
    expect(new Set(projectModules.map((module) => module.level))).toEqual(
      new Set([1, 2, 3, 4, 5, 6, 7]),
    );
  });

  it("has required metadata and geometry for every module", () => {
    for (const buildingModule of projectModules) {
      expect(buildingModule.id).toMatch(/^M\d+$/);
      expect(buildingModule.unitCode.length).toBeGreaterThan(2);
      expect(buildingModule.level).toBeGreaterThanOrEqual(1);
      expect(buildingModule.level).toBeLessThanOrEqual(7);
      expect([1, 2, 3, 4]).toContain(buildingModule.tranche);
      expect(buildingModule.buildingZone.length).toBeGreaterThan(0);
      expect(buildingModule.position).toHaveLength(3);
      expect(buildingModule.size).toHaveLength(3);
      expect(buildingModule.sourcePage).toBe(buildingModule.level + 1);
    }
  });

  it("includes known PDF-derived module IDs", () => {
    expect(projectModules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "M1", unitCode: "DB1M-LH2", level: 1 }),
        expect.objectContaining({
          id: "M254",
          unitCode: "AA1M-S3M-KB1",
          level: 1,
        }),
        expect.objectContaining({ id: "M499", unitCode: "DB7M-S4W", level: 7 }),
      ]),
    );
  });

  it("maps display zones from tranche assignments with the M1 and M2 exception", () => {
    for (const buildingModule of projectModules) {
      if (buildingModule.id === "M1" || buildingModule.id === "M2") {
        expect(buildingModule.buildingZone).toBe("Market Rate South Wing");
      } else if (buildingModule.tranche === 4) {
        expect(buildingModule.buildingZone).toBe("Residential Affordable");
      } else if (buildingModule.tranche === 3) {
        expect(buildingModule.buildingZone).toBe("Market Rate South Wing");
      } else if (buildingModule.tranche === 2) {
        expect(buildingModule.buildingZone).toBe("Market Rate East Wing");
      } else if (buildingModule.tranche === 1 && buildingModule.size[2] > buildingModule.size[0]) {
        expect(buildingModule.buildingZone).toBe("Market Rate North Wing");
      } else {
        expect(buildingModule.buildingZone).toBe("Market Rate West Wing");
      }
    }
  });

  it("swaps known market rate north and west wing module assignments", () => {
    expect(projectModules.find((module) => module.id === "M238")?.buildingZone).toBe(
      "Market Rate North Wing",
    );
    expect(projectModules.find((module) => module.id === "M228")?.buildingZone).toBe(
      "Market Rate West Wing",
    );
  });
});
