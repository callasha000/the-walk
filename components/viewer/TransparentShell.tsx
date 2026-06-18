"use client";

import { Box, Edges, Line } from "@react-three/drei";
import { DoubleSide } from "three";
import {
  sheetPointToModelPosition,
  sheetRectToModelMass,
} from "@/data/geometry-calibration";
import type { Vector3Tuple } from "@/data/module-types";
import {
  shellMasses,
  type FootprintShellMass,
  type RectShellMass,
  type ShellMass,
  type ShellPoint,
} from "@/data/shell-masses";
import {
  buildShellFacadeLines,
  facadeShellVisualStyle,
  type FacadeLine,
} from "@/lib/shell-facade";

export function TransparentShell() {
  return (
    <group>
      {shellMasses.map((mass) => (
        <ShellElement key={mass.name} mass={mass} />
      ))}
    </group>
  );
}

function ShellElement({ mass }: { mass: ShellMass }) {
  if (mass.outlineOnly) {
    return <ShellFootprintOutline mass={mass} />;
  }

  return <ShellBox mass={mass} />;
}

function ShellBox({ mass }: { mass: RectShellMass }) {
  const modelMass = sheetRectToModelMass(mass.rect, mass.height, mass.yCenter);
  const usesFacadeSkin = mass.name !== "podium envelope";

  return (
    <group>
      <Box
        args={modelMass.size}
        position={modelMass.position}
        raycast={() => null}
      >
        <meshPhysicalMaterial
          color={usesFacadeSkin ? facadeShellVisualStyle.fillColor : mass.color}
          opacity={usesFacadeSkin ? facadeShellVisualStyle.fillOpacity : mass.opacity}
          transparent
          roughness={0.36}
          metalness={0.02}
          transmission={usesFacadeSkin ? 0.22 : 0.12}
          depthWrite={false}
          side={DoubleSide}
        />
        <Edges
          color={usesFacadeSkin ? facadeShellVisualStyle.edgeColor : "#d9e6ea"}
          lineWidth={usesFacadeSkin ? 0.8 : 1}
        />
      </Box>

      {usesFacadeSkin && <ShellFacadeOverlay lines={buildShellFacadeLines(modelMass)} />}
    </group>
  );
}

function ShellFacadeOverlay({ lines }: { lines: FacadeLine[] }) {
  return (
    <group>
      {lines.map((line, index) => (
        <Line
          key={`${line.kind}:${index}`}
          points={line.points}
          color={line.color}
          lineWidth={line.lineWidth}
          opacity={line.opacity}
          transparent
          depthWrite={false}
        />
      ))}
    </group>
  );
}

function ShellFootprintOutline({ mass }: { mass: FootprintShellMass }) {
  const bottomY = mass.yCenter - mass.height / 2;
  const topY = mass.yCenter + mass.height / 2;
  const closedFootprint = [...mass.footprint, mass.footprint[0]];
  const bottomLine = closedFootprint.map((point) => shellPointToModelPoint(point, bottomY));
  const topLine = closedFootprint.map((point) => shellPointToModelPoint(point, topY));

  return (
    <group>
      <Line points={bottomLine} color={mass.color} lineWidth={1.2} />
      <Line points={topLine} color={mass.color} lineWidth={1.2} />
      {mass.footprint.map((point) => (
        <Line
          key={`${point.x}:${point.y}`}
          points={[shellPointToModelPoint(point, bottomY), shellPointToModelPoint(point, topY)]}
          color={mass.color}
          lineWidth={1.2}
        />
      ))}
    </group>
  );
}

function shellPointToModelPoint(point: ShellPoint, y: number): Vector3Tuple {
  const [x, , z] = sheetPointToModelPosition(point.x, point.y, 1);

  return [x, y, z];
}
