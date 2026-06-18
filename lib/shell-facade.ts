import { sheetCalibration } from "@/data/geometry-calibration";
import type { Vector3Tuple } from "@/data/module-types";

export type FacadeLineKind =
  | "accent-rib"
  | "floor-band"
  | "parapet"
  | "roof-hatch"
  | "vertical-mullion";

export type FacadeLine = {
  kind: FacadeLineKind;
  points: [Vector3Tuple, Vector3Tuple];
  color: string;
  opacity: number;
  lineWidth: number;
};

export type ShellModelMass = {
  position: Vector3Tuple;
  size: Vector3Tuple;
};

export const facadeShellVisualStyle = {
  fillColor: "#d7d9d2",
  fillOpacity: 0.18,
  edgeColor: "#f2f0e8",
  edgeOpacity: 0.44,
  floorBandColor: "#1b1714",
  floorBandOpacity: 0.36,
  mullionColor: "#241d19",
  mullionOpacity: 0.3,
  accentColor: "#8b6049",
  accentOpacity: 0.46,
  roofHatchColor: "#f3eee5",
  roofHatchOpacity: 0.34,
};

const defaultBaySpacing = 0.46;
const roofHatchSpacing = 1.1;
const roofHatchRun = 1.35;
const surfaceOffset = 0.012;

export function buildShellFacadeLines(modelMass: ShellModelMass): FacadeLine[] {
  const bounds = modelBounds(modelMass);

  return [
    ...buildFloorBands(bounds),
    ...buildVerticalMullions(bounds),
    ...buildAccentRibs(bounds),
    ...buildParapet(bounds),
    ...buildRoofHatch(bounds),
  ];
}

function buildFloorBands(bounds: ModelBounds): FacadeLine[] {
  const lines: FacadeLine[] = [];

  for (
    let y = bounds.minY + sheetCalibration.levelHeight;
    y < bounds.maxY - 0.02;
    y += sheetCalibration.levelHeight
  ) {
    const roundedY = roundCoordinate(y);

    lines.push(
      facadeLine("floor-band", [bounds.minX, roundedY, bounds.minZ - surfaceOffset], [
        bounds.maxX,
        roundedY,
        bounds.minZ - surfaceOffset,
      ]),
      facadeLine("floor-band", [bounds.minX, roundedY, bounds.maxZ + surfaceOffset], [
        bounds.maxX,
        roundedY,
        bounds.maxZ + surfaceOffset,
      ]),
      facadeLine("floor-band", [bounds.minX - surfaceOffset, roundedY, bounds.minZ], [
        bounds.minX - surfaceOffset,
        roundedY,
        bounds.maxZ,
      ]),
      facadeLine("floor-band", [bounds.maxX + surfaceOffset, roundedY, bounds.minZ], [
        bounds.maxX + surfaceOffset,
        roundedY,
        bounds.maxZ,
      ]),
    );
  }

  return lines;
}

function buildVerticalMullions(bounds: ModelBounds): FacadeLine[] {
  const lines: FacadeLine[] = [];

  for (let x = bounds.minX + defaultBaySpacing; x < bounds.maxX - 0.02; x += defaultBaySpacing) {
    const roundedX = roundCoordinate(x);
    lines.push(
      facadeLine("vertical-mullion", [roundedX, bounds.minY, bounds.minZ - surfaceOffset], [
        roundedX,
        bounds.maxY,
        bounds.minZ - surfaceOffset,
      ]),
      facadeLine("vertical-mullion", [roundedX, bounds.minY, bounds.maxZ + surfaceOffset], [
        roundedX,
        bounds.maxY,
        bounds.maxZ + surfaceOffset,
      ]),
    );
  }

  for (let z = bounds.minZ + defaultBaySpacing; z < bounds.maxZ - 0.02; z += defaultBaySpacing) {
    const roundedZ = roundCoordinate(z);
    lines.push(
      facadeLine("vertical-mullion", [bounds.minX - surfaceOffset, bounds.minY, roundedZ], [
        bounds.minX - surfaceOffset,
        bounds.maxY,
        roundedZ,
      ]),
      facadeLine("vertical-mullion", [bounds.maxX + surfaceOffset, bounds.minY, roundedZ], [
        bounds.maxX + surfaceOffset,
        bounds.maxY,
        roundedZ,
      ]),
    );
  }

  return lines;
}

function buildAccentRibs(bounds: ModelBounds): FacadeLine[] {
  const accentSpacing = defaultBaySpacing * 4;
  const lines: FacadeLine[] = [];

  for (let x = bounds.minX; x <= bounds.maxX + 0.02; x += accentSpacing) {
    const roundedX = Math.min(roundCoordinate(x), bounds.maxX);
    lines.push(
      facadeLine("accent-rib", [roundedX, bounds.minY, bounds.minZ - surfaceOffset * 1.5], [
        roundedX,
        bounds.maxY,
        bounds.minZ - surfaceOffset * 1.5,
      ]),
      facadeLine("accent-rib", [roundedX, bounds.minY, bounds.maxZ + surfaceOffset * 1.5], [
        roundedX,
        bounds.maxY,
        bounds.maxZ + surfaceOffset * 1.5,
      ]),
    );
  }

  for (let z = bounds.minZ; z <= bounds.maxZ + 0.02; z += accentSpacing) {
    const roundedZ = Math.min(roundCoordinate(z), bounds.maxZ);
    lines.push(
      facadeLine("accent-rib", [bounds.minX - surfaceOffset * 1.5, bounds.minY, roundedZ], [
        bounds.minX - surfaceOffset * 1.5,
        bounds.maxY,
        roundedZ,
      ]),
      facadeLine("accent-rib", [bounds.maxX + surfaceOffset * 1.5, bounds.minY, roundedZ], [
        bounds.maxX + surfaceOffset * 1.5,
        bounds.maxY,
        roundedZ,
      ]),
    );
  }

  return lines;
}

function buildParapet(bounds: ModelBounds): FacadeLine[] {
  const y = bounds.maxY + surfaceOffset;

  return [
    facadeLine("parapet", [bounds.minX, y, bounds.minZ], [bounds.maxX, y, bounds.minZ]),
    facadeLine("parapet", [bounds.maxX, y, bounds.minZ], [bounds.maxX, y, bounds.maxZ]),
    facadeLine("parapet", [bounds.maxX, y, bounds.maxZ], [bounds.minX, y, bounds.maxZ]),
    facadeLine("parapet", [bounds.minX, y, bounds.maxZ], [bounds.minX, y, bounds.minZ]),
  ];
}

function buildRoofHatch(bounds: ModelBounds): FacadeLine[] {
  const lines: FacadeLine[] = [];
  const y = bounds.maxY + surfaceOffset * 2;

  for (
    let x = bounds.minX - roofHatchRun;
    x < bounds.maxX + roofHatchRun;
    x += roofHatchSpacing
  ) {
    const startX = Math.max(bounds.minX, x);
    const endX = Math.min(bounds.maxX, x + roofHatchRun);

    if (endX - startX > 0.24) {
      lines.push(
        facadeLine("roof-hatch", [startX, y, bounds.minZ], [endX, y, bounds.maxZ]),
      );
    }
  }

  return lines;
}

type ModelBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

function modelBounds(modelMass: ShellModelMass): ModelBounds {
  const [x, y, z] = modelMass.position;
  const [width, height, depth] = modelMass.size;

  return {
    minX: x - width / 2,
    maxX: x + width / 2,
    minY: y - height / 2,
    maxY: y + height / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  };
}

function facadeLine(
  kind: FacadeLineKind,
  start: Vector3Tuple,
  end: Vector3Tuple,
): FacadeLine {
  const style = styleForKind(kind);

  return {
    kind,
    points: [start, end],
    ...style,
  };
}

function styleForKind(kind: FacadeLineKind) {
  switch (kind) {
    case "accent-rib":
      return {
        color: facadeShellVisualStyle.accentColor,
        opacity: facadeShellVisualStyle.accentOpacity,
        lineWidth: 1.15,
      };
    case "roof-hatch":
      return {
        color: facadeShellVisualStyle.roofHatchColor,
        opacity: facadeShellVisualStyle.roofHatchOpacity,
        lineWidth: 0.75,
      };
    case "parapet":
      return {
        color: facadeShellVisualStyle.edgeColor,
        opacity: facadeShellVisualStyle.edgeOpacity,
        lineWidth: 1.35,
      };
    case "floor-band":
      return {
        color: facadeShellVisualStyle.floorBandColor,
        opacity: facadeShellVisualStyle.floorBandOpacity,
        lineWidth: 0.9,
      };
    case "vertical-mullion":
      return {
        color: facadeShellVisualStyle.mullionColor,
        opacity: facadeShellVisualStyle.mullionOpacity,
        lineWidth: 0.65,
      };
  }
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(4));
}
