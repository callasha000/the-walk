"use client";

import { Box, Edges, Environment, Grid, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { Vector3Tuple } from "@/data/module-types";
import {
  getModuleBuildProgress,
  type BuildSequence,
  type BuildSequenceStep,
} from "@/lib/build-sequence";
import { getTrancheMeta } from "@/lib/module-helpers";
import { getModuleRenderPosition } from "@/lib/viewer-geometry";
import { TransparentShell } from "./TransparentShell";
import { viewerCameraSettings } from "./viewer-settings";

type BuildSequenceViewerProps = {
  sequence: BuildSequence;
  elapsedDays: number;
  finalRenderingProgress: number;
};

export function BuildSequenceViewer({
  sequence,
  elapsedDays,
  finalRenderingProgress,
}: BuildSequenceViewerProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      className="h-full w-full"
    >
      <color attach="background" args={["#10161b"]} />
      <fog
        attach="fog"
        args={["#10161b", viewerCameraSettings.fogNear, viewerCameraSettings.fogFar]}
      />

      <PerspectiveCamera
        makeDefault
        position={[16, 11, 25] as Vector3Tuple}
        fov={43}
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxDistance={viewerCameraSettings.maxDistance}
        minDistance={viewerCameraSettings.minDistance}
        target={viewerCameraSettings.controlsTarget}
      />

      <ambientLight intensity={0.72} />
      <directionalLight position={[5, 10, 5]} intensity={2.2} />
      <directionalLight position={[-8, 5, -7]} intensity={0.75} />

      <Suspense fallback={null}>
        <Environment preset="city" />
        <group position={[0, 0.25, 0]}>
          <TransparentShell />
          {sequence.steps.map((step) => (
            <AnimatedModuleBox
              key={step.module.id}
              elapsedDays={elapsedDays}
              finalRenderingProgress={finalRenderingProgress}
              step={step}
            />
          ))}
        </group>
        <Grid
          args={viewerCameraSettings.gridArgs}
          cellSize={0.8}
          cellThickness={0.4}
          cellColor="#31404a"
          sectionSize={3.2}
          sectionThickness={0.9}
          sectionColor="#536879"
          fadeDistance={viewerCameraSettings.gridFadeDistance}
          fadeStrength={1}
          position={[0, -0.64, 0]}
        />
      </Suspense>
    </Canvas>
  );
}

function AnimatedModuleBox({
  step,
  elapsedDays,
  finalRenderingProgress,
}: {
  step: BuildSequenceStep;
  elapsedDays: number;
  finalRenderingProgress: number;
}) {
  const progress = getModuleBuildProgress(step, elapsedDays);

  if (progress.state === "pending") {
    return null;
  }

  const buildingModule = step.module;
  const tranche = getTrancheMeta(buildingModule.tranche);
  const settledPosition = getModuleRenderPosition(buildingModule, false);
  const easedProgress = easeOutCubic(progress.fallProgress);
  const dropHeight = 7.5 + buildingModule.level * 0.5;
  const settlingBounce =
    progress.state === "falling"
      ? Math.sin(easedProgress * Math.PI) * 0.08
      : 0;
  const position: Vector3Tuple = [
    settledPosition[0],
    settledPosition[1] + (1 - easedProgress) * dropHeight + settlingBounce,
    settledPosition[2],
  ];
  const fadeToRendering = 1 - finalRenderingProgress * 0.42;
  const opacity =
    progress.state === "falling"
      ? (0.28 + easedProgress * 0.52) * fadeToRendering
      : 0.7 * fadeToRendering;
  const isFalling = progress.state === "falling";

  return (
    <Box args={buildingModule.size} position={position} raycast={() => null}>
      <meshStandardMaterial
        color={tranche.color}
        emissive={isFalling ? tranche.color : "#000000"}
        emissiveIntensity={isFalling ? 0.18 : 0}
        opacity={opacity}
        roughness={0.46}
        transparent
      />
      {isFalling ? <Edges color="#f8ffff" lineWidth={1.4} /> : null}
    </Box>
  );
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}
