import { describe, expect, it } from "vitest";
import { viewerCameraSettings } from "@/components/viewer/viewer-settings";
import { moduleCoordinates } from "@/data/module-coordinates";
import { modules } from "@/data/modules";
import { shellMasses } from "@/data/shell-masses";
import { getModuleRenderPosition } from "./viewer-geometry";
import type { BuildingModule, TrancheId } from "@/data/module-types";

describe("viewer geometry helpers", () => {
  it("keeps module position unchanged when levels are not exploded", () => {
    expect(getModuleRenderPosition(modules[0], false)).toEqual(modules[0].position);
  });

  it("adds a level-based vertical offset when levels are exploded", () => {
    const levelFourModule = modules.find((module) => module.level === 4);

    expect(levelFourModule).toBeDefined();
    expect(getModuleRenderPosition(levelFourModule!, true)[1]).toBeCloseTo(
      levelFourModule!.position[1] + 0.9,
    );
  });
});

describe("calibrated plan geometry", () => {
  const levelOneModules = modules.filter((module) => module.level === 1);

  it("places the blue east edge below the green garage-top strip on level 1", () => {
    const tranche3 = byTranche(levelOneModules, 3);
    const tranche4 = byTranche(levelOneModules, 4);

    expect(average(tranche4, "z")).toBeGreaterThan(average(tranche3, "z"));
  });

  it("keeps the vertical magenta wing above the lower green strip on level 1", () => {
    const tranche2 = byTranche(levelOneModules, 2);
    const tranche3 = byTranche(levelOneModules, 3);

    expect(max(tranche2, "z")).toBeLessThan(min(tranche3, "z"));
  });

  it("places the magenta wing east of the upper pink wing on level 1", () => {
    const tranche1 = byTranche(levelOneModules, 1);
    const tranche2 = byTranche(levelOneModules, 2);

    expect(max(tranche2, "x")).toBeGreaterThan(max(tranche1, "x"));
  });

  it("uses PDF-derived module footprints instead of a fixed module size", () => {
    const uniqueFootprints = new Set(
      levelOneModules.map((module) => `${module.size[0].toFixed(2)}:${module.size[2].toFixed(2)}`),
    );

    expect(uniqueFootprints.size).toBeGreaterThan(10);
  });

  it("scales sample module footprints from the PDF outline rectangles", () => {
    const m1 = byId("M1");
    const m254 = byId("M254");
    const m378 = byId("M378");
    const m390 = byId("M390");

    expect(m378.size[0]).toBeGreaterThan(0.4);
    expect(m378.size[0]).toBeLessThan(0.5);
    expect(m378.size[2]).toBeGreaterThan(1.25);
    expect(m378.size[2]).toBeLessThan(1.4);

    expect(m390.size[0]).toBeGreaterThan(m378.size[0] + 0.05);
    expect(m390.size[2]).toBeGreaterThan(m378.size[2] + 0.25);

    expect(m254.size[0]).toBeGreaterThan(2.2);
    expect(m254.size[2]).toBeGreaterThan(0.35);
    expect(m254.size[2]).toBeLessThan(0.5);

    expect(m1.size[2]).toBeGreaterThan(1);
  });
});

describe("viewer framing", () => {
  it("allows zooming out far enough to compare level 1 with the PDF plan", () => {
    expect(viewerCameraSettings.maxDistance).toBeGreaterThanOrEqual(60);
  });
});

describe("transparent shell geometry", () => {
  it("derives residential shell masses that cover the PDF module outline extents", () => {
    expect(shellMasses.length).toBeGreaterThan(10);

    expect(shellCovers("M104")).toBe(true);
    expect(shellCovers("M254")).toBe(true);
    expect(shellCovers("M378")).toBe(true);
    expect(shellCovers("M16")).toBe(true);
  });
});

function byTranche(modulesToFilter: BuildingModule[], tranche: TrancheId) {
  return modulesToFilter.filter((module) => module.tranche === tranche);
}

function byId(moduleId: string) {
  const foundModule = modules.find((candidate) => candidate.id === moduleId);

  expect(foundModule).toBeDefined();
  return foundModule!;
}

function average(modulesToMeasure: BuildingModule[], axis: "x" | "z") {
  const index = axis === "x" ? 0 : 2;

  return (
    modulesToMeasure.reduce((total, module) => total + module.position[index], 0) /
    modulesToMeasure.length
  );
}

function max(modulesToMeasure: BuildingModule[], axis: "x" | "z") {
  const index = axis === "x" ? 0 : 2;

  return Math.max(...modulesToMeasure.map((module) => module.position[index]));
}

function min(modulesToMeasure: BuildingModule[], axis: "x" | "z") {
  const index = axis === "x" ? 0 : 2;

  return Math.min(...modulesToMeasure.map((module) => module.position[index]));
}

function shellCovers(moduleId: string) {
  const coordinate = moduleCoordinates[moduleId];

  return shellMasses.some(
    (mass) =>
      mass.height > 1 &&
      mass.rect.xMin <= coordinate.sheetXMin &&
      mass.rect.xMax >= coordinate.sheetXMax &&
      mass.rect.yMin <= coordinate.sheetYMin &&
      mass.rect.yMax >= coordinate.sheetYMax,
  );
}
