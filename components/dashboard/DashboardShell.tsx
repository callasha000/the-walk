"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { Cuboid, Database, Maximize2, X } from "lucide-react";
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
  const [mobileDetailMounted, setMobileDetailMounted] = useState(false);
  const [mobileDetailVisible, setMobileDetailVisible] = useState(false);
  const mobileDetailTimerRef = useRef<number | null>(null);

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

  const clearMobileDetailTimer = () => {
    if (mobileDetailTimerRef.current !== null) {
      window.clearTimeout(mobileDetailTimerRef.current);
      mobileDetailTimerRef.current = null;
    }
  };

  const handleOpenMobileDetail = () => {
    clearMobileDetailTimer();
    setMobileDetailMounted(true);

    mobileDetailTimerRef.current = window.setTimeout(() => {
      setMobileDetailVisible(true);
      mobileDetailTimerRef.current = null;
    }, 20);
  };

  const handleCloseMobileDetail = () => {
    clearMobileDetailTimer();
    setMobileDetailVisible(false);

    mobileDetailTimerRef.current = window.setTimeout(() => {
      setMobileDetailMounted(false);
      mobileDetailTimerRef.current = null;
    }, 560);
  };

  useEffect(
    () => () => {
      clearMobileDetailTimer();
    },
    [],
  );

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
              selectedModule={selectedModule}
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
              onOpenModuleDetail={handleOpenMobileDetail}
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

        <aside className="hidden lg:block lg:min-h-0">
          <UnitDetailPanel module={selectedModule} />
        </aside>
      </div>

      <MobileModuleBottomSheet
        module={selectedModule}
        mounted={mobileDetailMounted}
        visible={mobileDetailVisible}
        onClose={handleCloseMobileDetail}
      />
    </main>
  );
}

function MobileModuleBottomSheet({
  module,
  mounted,
  visible,
  onClose,
}: {
  module: BuildingModule | null;
  mounted: boolean;
  visible: boolean;
  onClose: () => void;
}) {
  if (!mounted) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Selected module details"
      className="fixed inset-0 z-50 flex items-end lg:hidden"
    >
      <div
        className={clsx(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-[520ms] ease-out",
          visible ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="relative z-10 w-full">
        <button
          type="button"
          aria-label="Close module details"
          onClick={onClose}
          className={clsx(
            "absolute -top-14 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#12171b]/95 text-slate-200 shadow-xl shadow-black/30 backdrop-blur transition-all duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/12",
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          <X size={16} />
        </button>
        <div
          className={clsx(
            "max-h-[86vh] overflow-hidden rounded-t-xl border border-white/10 bg-[#12171b] p-3 shadow-2xl transition-transform duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            visible ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/25" />
          <div className="max-h-[calc(86vh-2.75rem)] overflow-y-auto pt-1">
            <UnitDetailPanel module={module} />
          </div>
        </div>
      </div>
    </div>
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
