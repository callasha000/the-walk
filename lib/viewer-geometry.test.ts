import { describe, expect, it } from "vitest";
import { modules } from "@/data/modules";
import { getModuleRenderPosition } from "./viewer-geometry";

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
