import { describe, expect, it } from "vitest";
import { modules } from "@/data/modules";
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
});

function byTranche(modulesToFilter: BuildingModule[], tranche: TrancheId) {
  return modulesToFilter.filter((module) => module.tranche === tranche);
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
