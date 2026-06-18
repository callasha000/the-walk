import type { Vector3Tuple } from "@/data/module-types";

export type SheetRect = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export const sheetCalibration = {
  centerX: 1360,
  centerY: 1000,
  scale: 0.01,
  levelHeight: 0.72,
};

export const sheetLevelRegistrationOffsets: Record<number, { x: number; y: number }> = {
  // The level 1 PDF drawing is shifted left by the width of the west
  // not-in-scope bay. Levels above include two modules in that same bay.
  1: { x: 43, y: 0 },
  2: { x: 0, y: 0 },
  3: { x: -0.5, y: 0 },
  4: { x: 1.4, y: 0 },
  5: { x: 0.3, y: 0 },
  6: { x: -1.3, y: 0 },
  7: { x: 2.6, y: 0 },
};

export function registerSheetPoint(
  level: number,
  sheetX: number,
  sheetY: number,
): { sheetX: number; sheetY: number } {
  const offset = sheetLevelRegistrationOffsets[level] ?? { x: 0, y: 0 };

  return {
    sheetX: sheetX + offset.x,
    sheetY: sheetY + offset.y,
  };
}

export function registerSheetRect(level: number, rect: SheetRect): SheetRect {
  const offset = sheetLevelRegistrationOffsets[level] ?? { x: 0, y: 0 };

  return {
    xMin: rect.xMin + offset.x,
    xMax: rect.xMax + offset.x,
    yMin: rect.yMin + offset.y,
    yMax: rect.yMax + offset.y,
  };
}

export function sheetPointToModelPosition(
  sheetX: number,
  sheetY: number,
  level: number,
): Vector3Tuple {
  return [
    (sheetX - sheetCalibration.centerX) * sheetCalibration.scale,
    (level - 1) * sheetCalibration.levelHeight,
    (sheetY - sheetCalibration.centerY) * sheetCalibration.scale,
  ];
}

export function sheetRectToModelMass(
  rect: SheetRect,
  height: number,
  yCenter: number,
): { position: Vector3Tuple; size: Vector3Tuple } {
  const centerX = (rect.xMin + rect.xMax) / 2;
  const centerY = (rect.yMin + rect.yMax) / 2;

  return {
    position: [
      (centerX - sheetCalibration.centerX) * sheetCalibration.scale,
      yCenter,
      (centerY - sheetCalibration.centerY) * sheetCalibration.scale,
    ],
    size: [
      (rect.xMax - rect.xMin) * sheetCalibration.scale,
      height,
      (rect.yMax - rect.yMin) * sheetCalibration.scale,
    ],
  };
}

export function sheetSizeToModelSize(
  sheetWidth: number,
  sheetHeight: number,
  height: number,
): Vector3Tuple {
  return [
    sheetWidth * sheetCalibration.scale,
    height,
    sheetHeight * sheetCalibration.scale,
  ];
}
