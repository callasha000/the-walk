"use client";

import { Box, Edges, Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { BuildingModule } from "@/data/module-types";
import { getTrancheMeta } from "@/lib/module-helpers";
import { getModuleRenderPosition } from "@/lib/viewer-geometry";

type ModuleBoxProps = {
  module: BuildingModule;
  selected: boolean;
  hovered: boolean;
  showWireframe: boolean;
  exploded: boolean;
  onSelect: (module: BuildingModule) => void;
  onHover: (module: BuildingModule | null) => void;
};

export function ModuleBox({
  module,
  selected,
  hovered,
  showWireframe,
  exploded,
  onSelect,
  onHover,
}: ModuleBoxProps) {
  const tranche = getTrancheMeta(module.tranche);
  const position = getModuleRenderPosition(module, exploded);
  const opacity = selected ? 0.95 : hovered ? 0.82 : 0.58;

  const handleSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(module);
  };

  return (
    <group>
      <Box
        args={module.size}
        position={position}
        onClick={handleSelect}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(module);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onHover(null);
        }}
      >
        <meshStandardMaterial
          color={tranche.color}
          emissive={selected ? tranche.color : "#000000"}
          emissiveIntensity={selected ? 0.22 : 0}
          opacity={opacity}
          roughness={0.48}
          transparent
        />
        {(showWireframe || selected || hovered) && (
          <Edges
            color={selected ? "#ffffff" : hovered ? "#e9f7ff" : "#1f2937"}
            lineWidth={selected ? 2.2 : 1}
          />
        )}
      </Box>

      {hovered && (
        <Html position={[position[0], position[1] + 0.55, position[2]]} center>
          <div className="pointer-events-none rounded-md border border-white/15 bg-black/80 px-2 py-1 text-[11px] font-semibold text-white shadow-lg">
            {module.id}
          </div>
        </Html>
      )}
    </group>
  );
}
