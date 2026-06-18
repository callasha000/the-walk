import { describe, expect, it } from "vitest";
import {
  buildShellFacadeLines,
  facadeShellVisualStyle,
  type FacadeLineKind,
} from "./shell-facade";

describe("shell facade detailing", () => {
  it("generates A301-inspired facade and roof texture lines while staying translucent", () => {
    const lines = buildShellFacadeLines({
      position: [0, 1.08, 0],
      size: [4, 2.16, 3],
    });

    expect(hasKind(lines, "floor-band")).toBe(true);
    expect(hasKind(lines, "vertical-mullion")).toBe(true);
    expect(hasKind(lines, "accent-rib")).toBe(true);
    expect(hasKind(lines, "roof-hatch")).toBe(true);
    expect(hasKind(lines, "parapet")).toBe(true);

    expect(facadeShellVisualStyle.fillOpacity).toBeGreaterThan(0.12);
    expect(facadeShellVisualStyle.fillOpacity).toBeLessThanOrEqual(0.2);
    expect(Math.max(...lines.map((line) => line.opacity))).toBeLessThanOrEqual(0.48);
  });

  it("keeps floor bands aligned to the module level spacing", () => {
    const lines = buildShellFacadeLines({
      position: [0, 1.08, 0],
      size: [4, 2.16, 3],
    });
    const floorBandYValues = uniqueYValues(lines.filter((line) => line.kind === "floor-band"));

    expect(floorBandYValues).toContain(0.72);
    expect(floorBandYValues).toContain(1.44);
    expect(floorBandYValues).not.toContain(2.16);
  });
});

function hasKind(lines: Array<{ kind: FacadeLineKind }>, kind: FacadeLineKind) {
  return lines.some((line) => line.kind === kind);
}

function uniqueYValues(lines: ReturnType<typeof buildShellFacadeLines>) {
  return Array.from(
    new Set(
      lines
        .flatMap((line) => line.points.map((point) => point[1]))
        .map((value) => Number(value.toFixed(2))),
    ),
  );
}
