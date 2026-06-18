"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Cuboid, Database, Maximize2 } from "lucide-react";
import { modules } from "@/data/modules";
import type {
  BuildingModule,
  BuildingZone,
  TrancheId,
} from "@/data/module-types";
import { filterModules, sortBuildingZones } from "@/lib/module-helpers";
import { UnitDetailPanel } from "./UnitDetailPanel";
import { ViewerToolbar } from "./ViewerToolbar";

const BuildingViewer = dynamic(
  () =>
    import("@/components/viewer/BuildingViewer").then(
      (module) => module.BuildingViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Loading 3D viewer
      </div>
    ),
  },
);

export function DashboardShell() {
  const [activeLevel, setActiveLevel] = useState(1);
  const [selectedTranches, setSelectedTranches] = useState<TrancheId[]>([]);
  const [selectedZones, setSelectedZones] = useState<BuildingZone[]>([]);
  const [showAllLevels, setShowAllLevels] = useState(true);
  const [showShell, setShowShell] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(
    modules[0]?.id ?? null,
  );

  const visibleModules = useMemo(
    () =>
      filterModules(modules, {
        level: activeLevel,
        tranches: selectedTranches,
        zones: selectedZones,
        showAllLevels,
      }),
    [activeLevel, selectedTranches, selectedZones, showAllLevels],
  );

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? null,
    [selectedModuleId],
  );

  const handleTrancheToggle = (tranche: TrancheId) => {
    setSelectedTranches((current) => {
      if (current.length === 0) {
        return [tranche];
      }

      if (current.includes(tranche)) {
        return current.filter((item) => item !== tranche);
      }

      return [...current, tranche].sort();
    });
  };

  const handleZoneToggle = (zone: BuildingZone) => {
    setSelectedZones((current) => {
      if (current.length === 0) {
        return [zone];
      }

      if (current.includes(zone)) {
        return current.filter((item) => item !== zone);
      }

      return sortBuildingZones([...current, zone]);
    });
  };

  const handleSelectModule = (module: BuildingModule) => {
    setSelectedModuleId(module.id);
    setActiveLevel(module.level);
  };

  return (
    <main className="min-h-screen bg-[#101214] text-white lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen grid-cols-1 gap-3 p-3 lg:h-screen lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_390px] lg:grid-rows-[auto_1fr]">
        <header className="rounded-lg border border-white/10 bg-black/25 px-4 py-3 shadow-glow backdrop-blur-xl lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                The Walk at Norwalk
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-normal text-white">
                Architectural Module Dashboard
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <Metric icon={<Cuboid size={15} />} label="Visible" value={visibleModules.length} />
              <Metric icon={<Database size={15} />} label="Source modules" value={modules.length} />
              <Metric icon={<Maximize2 size={15} />} label="Levels" value={7} />
            </div>
          </div>
        </header>

        <section className="relative h-[560px] min-h-[420px] overflow-hidden rounded-lg border border-white/10 bg-[#11161a] shadow-glow lg:h-auto lg:min-h-0">
          <div className="absolute left-3 right-3 top-3 z-10">
            <ViewerToolbar
              activeLevel={activeLevel}
              selectedTranches={selectedTranches}
              selectedZones={selectedZones}
              showAllLevels={showAllLevels}
              showShell={showShell}
              showWireframe={showWireframe}
              exploded={exploded}
              onLevelChange={(level) => {
                setActiveLevel(level);
                setShowAllLevels(false);
              }}
              onTrancheToggle={handleTrancheToggle}
              onZoneToggle={handleZoneToggle}
              onToggleAllLevels={() => setShowAllLevels((value) => !value)}
              onToggleShell={() => setShowShell((value) => !value)}
              onToggleWireframe={() => setShowWireframe((value) => !value)}
              onToggleExploded={() => setExploded((value) => !value)}
            />
          </div>
          <BuildingViewer
            modules={visibleModules}
            selectedModuleId={selectedModuleId}
            showShell={showShell}
            showWireframe={showWireframe}
            exploded={exploded}
            onSelectModule={handleSelectModule}
          />
        </section>

        <aside className="lg:min-h-0">
          <UnitDetailPanel module={selectedModule} />
        </aside>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3">
      {icon}
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
