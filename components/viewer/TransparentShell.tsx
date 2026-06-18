"use client";

import { Box, Edges, Line } from "@react-three/drei";
import { useMemo } from "react";
import { DoubleSide, Shape, Vector2 } from "three";
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

  return (
    <Box
      args={modelMass.size}
      position={modelMass.position}
      raycast={() => null}
    >
      <meshPhysicalMaterial
        color={mass.color}
        opacity={mass.opacity}
        transparent
        roughness={0.22}
        metalness={0.02}
        transmission={0.12}
        depthWrite={false}
      />
      <Edges color="#d9e6ea" lineWidth={1} />
    </Box>
  );
}

function ShellFootprintOutline({ mass }: { mass: FootprintShellMass }) {
  const bottomY = mass.yCenter - mass.height / 2;
  const topY = mass.yCenter + mass.height / 2;
  const closedFootprint = [...mass.footprint, mass.footprint[0]];
  const bottomLine = closedFootprint.map((point) => shellPointToModelPoint(point, bottomY));
  const topLine = closedFootprint.map((point) => shellPointToModelPoint(point, topY));
  const footprintShape = useMemo(() => {
    const [firstPoint, ...remainingPoints] = mass.footprint.map((point) => {
      const [x, , z] = sheetPointToModelPosition(point.x, point.y, 1);

      return new Vector2(x, z);
    });
    const shape = new Shape();

    shape.moveTo(firstPoint.x, firstPoint.y);
    remainingPoints.forEach((point) => shape.lineTo(point.x, point.y));
    shape.closePath();

    return shape;
  }, [mass.footprint]);
  const lineOpacity = Math.max(mass.opacity, 0.62);

  return (
    <group>
      <mesh position={[0, bottomY, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <shapeGeometry args={[footprintShape]} />
        <meshBasicMaterial
          color={mass.color}
          opacity={mass.opacity}
          transparent
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, topY, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <shapeGeometry args={[footprintShape]} />
        <meshBasicMaterial
          color={mass.color}
          opacity={mass.opacity}
          transparent
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Line
        points={bottomLine}
        color={mass.color}
        lineWidth={1.2}
        opacity={lineOpacity}
        transparent
      />
      <Line
        points={topLine}
        color={mass.color}
        lineWidth={1.2}
        opacity={lineOpacity}
        transparent
      />
      {mass.footprint.map((point) => (
        <Line
          key={`${point.x}:${point.y}`}
          points={[shellPointToModelPoint(point, bottomY), shellPointToModelPoint(point, topY)]}
          color={mass.color}
          lineWidth={1.2}
          opacity={lineOpacity}
          transparent
        />
      ))}
    </group>
  );
}

function shellPointToModelPoint(point: ShellPoint, y: number): Vector3Tuple {
  const [x, , z] = sheetPointToModelPosition(point.x, point.y, 1);

  return [x, y, z];
}
