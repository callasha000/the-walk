"use client";

import { Box, Eye, EyeOff, Layers3, Map, SplitSquareVertical, Waypoints } from "lucide-react";
import { clsx } from "clsx";
import { buildingZones, type BuildingZone, type TrancheId } from "@/data/module-types";
import { levels } from "@/data/modules";
import { getBuildingZoneMeta, getTrancheMeta } from "@/lib/module-helpers";

type ViewerToolbarProps = {
  activeLevel: number;
  selectedTranches: TrancheId[];
  selectedZones: BuildingZone[];
  showAllLevels: boolean;
  showShell: boolean;
  showWireframe: boolean;
  exploded: boolean;
  onLevelChange: (level: number) => void;
  onTrancheToggle: (tranche: TrancheId) => void;
  onZoneToggle: (zone: BuildingZone) => void;
  onToggleAllLevels: () => void;
  onToggleShell: () => void;
  onToggleWireframe: () => void;
  onToggleExploded: () => void;
};

const tranches: TrancheId[] = [1, 2, 3, 4];

export function ViewerToolbar({
  activeLevel,
  selectedTranches,
  selectedZones,
  showAllLevels,
  showShell,
  showWireframe,
  exploded,
  onLevelChange,
  onTrancheToggle,
  onZoneToggle,
  onToggleAllLevels,
  onToggleShell,
  onToggleWireframe,
  onToggleExploded,
}: ViewerToolbarProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/25 p-3 shadow-glow backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2">
        {levels.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onLevelChange(level)}
            className={clsx(
              "h-9 min-w-16 rounded-md border px-3 text-xs font-medium transition",
              activeLevel === level && !showAllLevels
                ? "border-cyan-200/70 bg-cyan-200/15 text-cyan-50"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10",
            )}
          >
            Level {level}
          </button>
        ))}
        <IconToggle
          active={showAllLevels}
          label="All levels"
          onClick={onToggleAllLevels}
          icon={<Layers3 size={16} />}
        />
        <IconToggle
          active={showShell}
          label={showShell ? "Hide shell" : "Show shell"}
          onClick={onToggleShell}
          icon={showShell ? <Eye size={16} /> : <EyeOff size={16} />}
        />
        <IconToggle
          active={showWireframe}
          label="Wireframe"
          onClick={onToggleWireframe}
          icon={<Waypoints size={16} />}
        />
        <IconToggle
          active={exploded}
          label="Explode levels"
          onClick={onToggleExploded}
          icon={<SplitSquareVertical size={16} />}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs text-slate-400">
          <Box size={14} />
          Tranche filter
        </span>
        {tranches.map((tranche) => {
          const meta = getTrancheMeta(tranche);
          const selected =
            selectedTranches.length === 0 || selectedTranches.includes(tranche);

          return (
            <button
              key={tranche}
              type="button"
              aria-label={`Filter Tranche ${tranche}`}
              onClick={() => onTrancheToggle(tranche)}
              className={clsx(
                "h-8 rounded-md border px-3 text-xs font-medium transition",
                selected
                  ? "border-white/20 text-white"
                  : "border-white/5 text-slate-500",
              )}
              style={{
                backgroundColor: selected ? meta.softColor : "rgba(255,255,255,0.03)",
              }}
            >
              T{tranche}
            </button>
          );
        })}
        <span className="flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs text-slate-400">
          <Map size={14} />
          Zone filter
        </span>
        {buildingZones.map((zone) => {
          const meta = getBuildingZoneMeta(zone);
          const selected = selectedZones.length === 0 || selectedZones.includes(zone);

          return (
            <button
              key={zone}
              type="button"
              title={zone}
              aria-label={`Filter ${zone}`}
              onClick={() => onZoneToggle(zone)}
              className={clsx(
                "h-8 rounded-md border px-3 text-xs font-medium transition",
                selected
                  ? "border-white/20 text-white"
                  : "border-white/5 text-slate-500",
              )}
              style={{
                backgroundColor: selected ? meta.softColor : "rgba(255,255,255,0.03)",
              }}
            >
              {meta.shortLabel}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function IconToggle({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        "flex h-9 min-w-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-medium transition",
        active
          ? "border-white/20 bg-white/10 text-white"
          : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10",
      )}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}
