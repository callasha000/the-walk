"use client";

import { Box, Edges } from "@react-three/drei";
import { sheetRectToModelMass } from "@/data/geometry-calibration";
import { shellMasses, type ShellMass } from "@/data/shell-masses";

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
