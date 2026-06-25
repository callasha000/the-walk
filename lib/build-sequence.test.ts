import { describe, expect, it } from "vitest";
import type { BuildingModule } from "@/data/module-types";
import { modules } from "@/data/modules";
import {
  BUILD_SEQUENCE_FALL_DURATION_DAYS,
  createBuildSequence,
  getFinalRenderingProgress,
  getModuleBuildProgress,
} from "./build-sequence";

function makeModule(
  id: string,
  installDate: string | null,
  productionSequence: number | null,
): BuildingModule {
  return {
    ...modules[0],
    id,
    matrix: {
      ...modules[0].matrix,
      module: id,
      productionSequence,
      yard: {
        ...modules[0].matrix.yard,
        inspectionDate: installDate,
      },
      shipping: {
        ...modules[0].matrix.shipping,
        arrivalDate: installDate,
        shippingDate: installDate,
      },
    },
  };
}

describe("build sequence playback data", () => {
  it("sorts modules by install date, then production sequence, then module id", () => {
    const sequence = createBuildSequence([
      makeModule("M12", "2026-01-05", 3),
      makeModule("M10", "2026-01-03", 2),
      makeModule("M11", "2026-01-03", 1),
      makeModule("M9", "2026-01-04", null),
    ]);

    expect(sequence.steps.map((step) => step.module.id)).toEqual([
      "M11",
      "M10",
      "M9",
      "M12",
    ]);
    expect(sequence.steps.map((step) => step.dayIndex)).toEqual([0, 0, 1, 2]);
    expect(sequence.steps[0].staggerOffsetDays).toBe(0);
    expect(sequence.steps[1].staggerOffsetDays).toBeGreaterThan(0);
    expect(sequence.installDurationDays).toBe(2);
  });

  it("reports pending, falling, installed, and final rendering progress", () => {
    const sequence = createBuildSequence([
      makeModule("M1", "2026-01-01", 1),
      makeModule("M2", "2026-01-02", 2),
    ]);
    const firstStep = sequence.steps[0];

    expect(getModuleBuildProgress(firstStep, -0.1).state).toBe("pending");

    const falling = getModuleBuildProgress(
      firstStep,
      BUILD_SEQUENCE_FALL_DURATION_DAYS / 2,
    );
    expect(falling.state).toBe("falling");
    expect(falling.fallProgress).toBeGreaterThan(0);
    expect(falling.fallProgress).toBeLessThan(1);

    expect(
      getModuleBuildProgress(firstStep, BUILD_SEQUENCE_FALL_DURATION_DAYS + 0.1)
        .state,
    ).toBe("installed");
    expect(getFinalRenderingProgress(sequence, sequence.installCompleteDay)).toBe(0);
    expect(getFinalRenderingProgress(sequence, sequence.totalDurationDays)).toBe(1);
  });
});
