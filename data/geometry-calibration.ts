import type { Vector3Tuple } from "@/data/module-types";

export const sheetCalibration = {
  centerX: 1360,
  centerY: 1000,
  scale: 0.01,
  levelHeight: 0.72,
};

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
  rect: { xMin: number; xMax: number; yMin: number; yMax: number },
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
