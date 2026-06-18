import type { Vector3Tuple } from "@/data/module-types";

export const viewerCameraSettings = {
  cameraPosition: [13.5, 9.5, 24] as Vector3Tuple,
  cameraFov: 44,
  controlsTarget: [0.35, 2.15, 0.15] as Vector3Tuple,
  minDistance: 4,
  maxDistance: 78,
  fogNear: 28,
  fogFar: 92,
  gridArgs: [24, 36] as [number, number],
  gridFadeDistance: 44,
};
