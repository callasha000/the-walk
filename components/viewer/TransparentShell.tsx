"use client";

import { Box, Edges } from "@react-three/drei";

type ShellMass = {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  opacity: number;
};

const shellMasses: ShellMass[] = [
  {
    name: "garage podium",
    position: [-0.6, -0.34, 0.2],
    size: [10.8, 0.5, 5.6],
    color: "#6f7f7d",
    opacity: 0.16,
  },
  {
    name: "north residential bar",
    position: [-0.2, 2.0, -3.45],
    size: [9.4, 4.9, 1.38],
    color: "#f4f0e9",
    opacity: 0.12,
  },
  {
    name: "east residential bar",
    position: [3.92, 2.0, 0.05],
    size: [1.6, 4.9, 7.7],
    color: "#f4f0e9",
    opacity: 0.12,
  },
  {
    name: "west affordable bar",
    position: [-0.65, 2.0, 1.92],
    size: [9.9, 4.9, 1.38],
    color: "#f4f0e9",
    opacity: 0.1,
  },
  {
    name: "south edge bar",
    position: [5.35, 2.0, -1.2],
    size: [1.28, 4.9, 5.8],
    color: "#e9eef0",
    opacity: 0.14,
  },
];

export function TransparentShell() {
  return (
    <group>
      {shellMasses.map((mass) => (
        <Box key={mass.name} args={mass.size} position={mass.position}>
          <meshPhysicalMaterial
            color={mass.color}
            opacity={mass.opacity}
            transparent
            roughness={0.22}
            metalness={0.02}
            transmission={0.12}
            depthWrite={false}
          />
          <Edges color="rgba(255,255,255,0.42)" lineWidth={1} />
        </Box>
      ))}
    </group>
  );
}
