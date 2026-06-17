"use client";

import { Environment, Grid, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import type { BuildingModule } from "@/data/module-types";
import { ModuleBox } from "./ModuleBox";
import { TransparentShell } from "./TransparentShell";

type BuildingViewerProps = {
  modules: BuildingModule[];
  selectedModuleId: string | null;
  showShell: boolean;
  showWireframe: boolean;
  exploded: boolean;
  onSelectModule: (module: BuildingModule) => void;
};

export function BuildingViewer({
  modules,
  selectedModuleId,
  showShell,
  showWireframe,
  exploded,
  onSelectModule,
}: BuildingViewerProps) {
  const [hoveredModuleId, setHoveredModuleId] = useState<string | null>(null);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      className="h-full w-full"
    >
      <color attach="background" args={["#11161a"]} />
      <fog attach="fog" args={["#11161a", 12, 26]} />

      <PerspectiveCamera makeDefault position={[8.5, 6.2, 8.8]} fov={42} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxDistance={18}
        minDistance={4}
        target={[0.5, 2.1, -0.5]}
      />

      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 8, 5]} intensity={2.1} castShadow />
      <directionalLight position={[-5, 4, -6]} intensity={0.65} />

      <Suspense fallback={null}>
        <Environment preset="city" />
        <group position={[0, 0.25, 0]}>
          {showShell && <TransparentShell />}
          {modules.map((module) => (
            <ModuleBox
              key={module.id}
              module={module}
              selected={module.id === selectedModuleId}
              hovered={module.id === hoveredModuleId}
              showWireframe={showWireframe}
              exploded={exploded}
              onSelect={onSelectModule}
              onHover={(hovered) => setHoveredModuleId(hovered?.id ?? null)}
            />
          ))}
        </group>
        <Grid
          args={[13, 13]}
          cellSize={0.8}
          cellThickness={0.4}
          cellColor="#31404a"
          sectionSize={3.2}
          sectionThickness={0.9}
          sectionColor="#536879"
          fadeDistance={18}
          fadeStrength={1}
          position={[0, -0.64, 0]}
        />
      </Suspense>
    </Canvas>
  );
}
