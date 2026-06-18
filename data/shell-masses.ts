import {
  registerSheetPoint,
  registerSheetRect,
  sheetCalibration,
} from "@/data/geometry-calibration";
import type { TrancheId } from "@/data/module-types";
import { moduleCoordinates } from "@/data/module-coordinates";
import { levels, modules } from "@/data/modules";

export type ShellRect = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type ShellPoint = {
  x: number;
  y: number;
};

type ShellMassBase = {
  name: string;
  height: number;
  yCenter: number;
  color: string;
  opacity: number;
};

export type RectShellMass = ShellMassBase & {
  rect: ShellRect;
  footprint?: never;
  outlineOnly?: false;
};

export type FootprintShellMass = ShellMassBase & {
  footprint: ShellPoint[];
  rect?: never;
  outlineOnly: true;
};

export type ShellMass = RectShellMass | FootprintShellMass;

type ShellFootprint = {
  zone: string;
  rect: ShellRect;
  color: string;
  opacity: number;
};

const moduleHeight = 0.56;
const residentialHeight = (levels.length - 1) * sheetCalibration.levelHeight + moduleHeight;
const residentialYCenter = ((levels.length - 1) * sheetCalibration.levelHeight) / 2;
const twoLevelHeight = sheetCalibration.levelHeight + moduleHeight;
const twoLevelYCenter = sheetCalibration.levelHeight / 2;
const mergeTolerance = 6;
const shellPadding = 2;

const trancheShellStyles: Record<TrancheId, { color: string; opacity: number }> = {
  1: { color: "#f4f0e9", opacity: 0.1 },
  2: { color: "#eef0f4", opacity: 0.11 },
  3: { color: "#f1f4ee", opacity: 0.1 },
  4: { color: "#edf3f4", opacity: 0.12 },
};

export const shellMasses: ShellMass[] = [
  {
    name: "podium envelope",
    rect: registerSheetRect(1, { xMin: 786.8, xMax: 1902.3, yMin: 1127.9, yMax: 1918.1 }),
    height: 0.55,
    yCenter: -0.34,
    color: "#6f7f7d",
    opacity: 0.14,
  },
  {
    name: "market rate pavilion not-in-scope outline",
    footprint: registerSheetFootprint(1, [
      { x: 1013.8, y: 821.7 },
      { x: 1156.3, y: 821.7 },
      { x: 1156.3, y: 769.4 },
      { x: 1255.0, y: 769.4 },
      { x: 1255.0, y: 761.2 },
      { x: 1401.8, y: 761.2 },
      { x: 1401.8, y: 956.6 },
      { x: 1255.3, y: 977.7 },
      { x: 1254.6, y: 977.9 },
      { x: 1254.6, y: 953.9 },
      { x: 1160.7, y: 953.9 },
      { x: 1160.7, y: 957.3 },
      { x: 1013.5, y: 977.7 },
    ]),
    height: twoLevelHeight,
    yCenter: twoLevelYCenter,
    color: "#d9e6ea",
    opacity: 0,
    outlineOnly: true,
  },
  ...buildResidentialShellMasses(),
];

function buildResidentialShellMasses(): ShellMass[] {
  return mergeFootprints(levelOneFootprints())
    .sort((left, right) =>
      left.zone.localeCompare(right.zone) ||
      left.rect.yMin - right.rect.yMin ||
      left.rect.xMin - right.rect.xMin,
    )
    .map((footprint, index) => ({
      name: `${footprint.zone} shell ${index + 1}`,
      rect: footprint.rect,
      height: residentialHeight,
      yCenter: residentialYCenter,
      color: footprint.color,
      opacity: footprint.opacity,
    }));
}

function levelOneFootprints(): ShellFootprint[] {
  return modules
    .filter((module) => module.level === 1)
    .map((module) => {
      const coordinate = moduleCoordinates[module.id];
      const style = trancheShellStyles[module.tranche];

      return {
        zone: module.buildingZone,
        rect: padRect(
          registerSheetRect(module.level, {
            xMin: coordinate.sheetXMin,
            xMax: coordinate.sheetXMax,
            yMin: coordinate.sheetYMin,
            yMax: coordinate.sheetYMax,
          }),
        ),
        color: style.color,
        opacity: style.opacity,
      };
    });
}

function padRect(rect: ShellRect): ShellRect {
  return {
    xMin: rect.xMin - shellPadding,
    xMax: rect.xMax + shellPadding,
    yMin: rect.yMin - shellPadding,
    yMax: rect.yMax + shellPadding,
  };
}

function registerSheetFootprint(level: number, footprint: ShellPoint[]): ShellPoint[] {
  return footprint.map((point) => {
    const registeredPoint = registerSheetPoint(level, point.x, point.y);

    return {
      x: registeredPoint.sheetX,
      y: registeredPoint.sheetY,
    };
  });
}

function mergeFootprints(footprints: ShellFootprint[]): ShellFootprint[] {
  const merged = [...footprints];
  let pair = findMergePair(merged);

  while (pair) {
    const [leftIndex, rightIndex] = pair;
    const left = merged[leftIndex];
    const right = merged[rightIndex];

    merged.splice(rightIndex, 1);
    merged[leftIndex] = {
      ...left,
      rect: unionRect(left.rect, right.rect),
    };

    pair = findMergePair(merged);
  }

  return merged;
}

function findMergePair(footprints: ShellFootprint[]): [number, number] | null {
  for (let leftIndex = 0; leftIndex < footprints.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < footprints.length; rightIndex += 1) {
      if (canMerge(footprints[leftIndex], footprints[rightIndex])) {
        return [leftIndex, rightIndex];
      }
    }
  }

  return null;
}

function canMerge(left: ShellFootprint, right: ShellFootprint): boolean {
  if (left.zone !== right.zone) {
    return false;
  }

  const sameYSpan = spansMatch(
    left.rect.yMin,
    left.rect.yMax,
    right.rect.yMin,
    right.rect.yMax,
  );
  const sameXSpan = spansMatch(
    left.rect.xMin,
    left.rect.xMax,
    right.rect.xMin,
    right.rect.xMax,
  );

  return (
    (sameYSpan && rangesTouch(left.rect.xMin, left.rect.xMax, right.rect.xMin, right.rect.xMax)) ||
    (sameXSpan && rangesTouch(left.rect.yMin, left.rect.yMax, right.rect.yMin, right.rect.yMax))
  );
}

function spansMatch(
  leftMin: number,
  leftMax: number,
  rightMin: number,
  rightMax: number,
): boolean {
  return (
    Math.abs(leftMin - rightMin) <= mergeTolerance &&
    Math.abs(leftMax - rightMax) <= mergeTolerance
  );
}

function rangesTouch(
  leftMin: number,
  leftMax: number,
  rightMin: number,
  rightMax: number,
): boolean {
  const gap = Math.max(leftMin, rightMin) - Math.min(leftMax, rightMax);

  return gap <= mergeTolerance;
}

function unionRect(left: ShellRect, right: ShellRect): ShellRect {
  return {
    xMin: Math.min(left.xMin, right.xMin),
    xMax: Math.max(left.xMax, right.xMax),
    yMin: Math.min(left.yMin, right.yMin),
    yMax: Math.max(left.yMax, right.yMax),
  };
}
