"use client";

import { Box, Edges } from "@react-three/drei";
import { sheetRectToModelMass } from "@/data/geometry-calibration";

type ShellMass = {
  name: string;
  rect: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  height: number;
  yCenter: number;
  color: string;
  opacity: number;
};

const shellMasses: ShellMass[] = [
  {
    name: "garage podium",
    rect: { xMin: 780, xMax: 1855, yMin: 1120, yMax: 1940 },
    height: 0.55,
    yCenter: -0.34,
    color: "#6f7f7d",
    opacity: 0.16,
  },
  {
    name: "upper west market-rate wing",
    rect: { xMin: 900, xMax: 1565, yMin: 125, yMax: 560 },
    height: 4.9,
    yCenter: 2.04,
    color: "#f4f0e9",
    opacity: 0.12,
  },
  {
    name: "upper vertical market-rate wing",
    rect: { xMin: 1510, xMax: 1750, yMin: 260, yMax: 1010 },
    height: 4.9,
    yCenter: 2.04,
    color: "#f4f0e9",
    opacity: 0.12,
  },
  {
    name: "lower affordable wing",
    rect: { xMin: 820, xMax: 1630, yMin: 1125, yMax: 1300 },
    height: 4.9,
    yCenter: 2.04,
    color: "#f4f0e9",
    opacity: 0.1,
  },
  {
    name: "east edge wing",
    rect: { xMin: 1630, xMax: 1880, yMin: 1135, yMax: 1935 },
    height: 4.9,
    yCenter: 2.04,
    color: "#e9eef0",
    opacity: 0.14,
  },
  {
    name: "market pavilion context",
    rect: { xMin: 1030, xMax: 1420, yMin: 740, yMax: 1000 },
    height: 1.2,
    yCenter: 0.34,
    color: "#9ba3a1",
    opacity: 0.16,
  },
];

export function TransparentShell() {
  return (
    <group>
      {shellMasses.map((mass) => (
        <ShellBox key={mass.name} mass={mass} />
      ))}
    </group>
  );
}

function ShellBox({ mass }: { mass: ShellMass }) {
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
