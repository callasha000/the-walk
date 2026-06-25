"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { Cuboid, Database, X } from "lucide-react";
import { modules } from "@/data/modules";
import type {
  BuildingModule,
  BuildingZone,
  TrancheId,
} from "@/data/module-types";
import { filterModules, sortBuildingZones } from "@/lib/module-helpers";
import { BuildAnimationPlayer } from "./BuildAnimationPlayer";
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

const DETAIL_PANEL_MIN_WIDTH = 390;
const DETAIL_PANEL_MAX_WIDTH = 780;
const MOBILE_SHEET_CLOSE_DRAG_DISTANCE = 72;

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
  const [buildAnimationOpen, setBuildAnimationOpen] = useState(false);
  const [mobileDetailMounted, setMobileDetailMounted] = useState(false);
  const [mobileDetailVisible, setMobileDetailVisible] = useState(false);
  const [detailPanelWidth, setDetailPanelWidth] = useState(
    DETAIL_PANEL_MIN_WIDTH,
  );
  const [isDetailPanelResizing, setIsDetailPanelResizing] = useState(false);
  const mobileDetailTimerRef = useRef<number | null>(null);
  const detailResizeStateRef = useRef({
    isDragging: false,
    startWidth: DETAIL_PANEL_MIN_WIDTH,
    startX: 0,
  });

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

  const startDetailResize = useCallback(
    (clientX: number) => {
      detailResizeStateRef.current = {
        isDragging: true,
        startWidth: detailPanelWidth,
        startX: clientX,
      };
      setIsDetailPanelResizing(true);
    },
    [detailPanelWidth],
  );

  const updateDetailResize = useCallback((clientX: number) => {
    if (!detailResizeStateRef.current.isDragging) {
      return;
    }

    const deltaX = detailResizeStateRef.current.startX - clientX;
    setDetailPanelWidth(
      clampDetailPanelWidth(detailResizeStateRef.current.startWidth + deltaX),
    );
  }, []);

  const finishDetailResize = useCallback(() => {
    if (!detailResizeStateRef.current.isDragging) {
      return;
    }

    detailResizeStateRef.current.isDragging = false;
    setIsDetailPanelResizing(false);
  }, []);

  const handleDetailResizePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    startDetailResize(event.clientX);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleDetailResizePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!detailResizeStateRef.current.isDragging) {
      return;
    }

    event.preventDefault();
    updateDetailResize(event.clientX);
  };

  const stopDetailResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!detailResizeStateRef.current.isDragging) {
      return;
    }

    finishDetailResize();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleDetailResizeMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    startDetailResize(event.clientX);
  };

  const handleDetailResizeKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setDetailPanelWidth((width) => clampDetailPanelWidth(width + 30));
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setDetailPanelWidth((width) => clampDetailPanelWidth(width - 30));
    }

    if (event.key === "Home") {
      event.preventDefault();
      setDetailPanelWidth(DETAIL_PANEL_MIN_WIDTH);
    }

    if (event.key === "End") {
      event.preventDefault();
      setDetailPanelWidth(DETAIL_PANEL_MAX_WIDTH);
    }
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

  useEffect(() => {
    if (!isDetailPanelResizing) {
      return undefined;
    }

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      updateDetailResize(event.clientX);
    };

    const handleMouseUp = () => {
      finishDetailResize();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [finishDetailResize, isDetailPanelResizing, updateDetailResize]);

  return (
    <main className="min-h-screen bg-[#101214] text-white lg:h-screen lg:overflow-hidden">
      <div
        className="grid min-h-screen content-start grid-cols-1 gap-3 p-3 lg:h-screen lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_12px_var(--detail-panel-width)] lg:grid-rows-[auto_1fr]"
        style={
          {
            "--detail-panel-width": `${detailPanelWidth}px`,
          } as React.CSSProperties
        }
      >
        <header className="rounded-lg border border-white/10 bg-black/25 px-4 py-3 shadow-glow backdrop-blur-xl lg:col-span-3">
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
            </div>
          </div>
        </header>

        <section
          data-testid="building-viewer-shell"
          className="relative h-[calc(100dvh-10rem)] min-h-[560px] overflow-hidden rounded-lg border border-white/10 bg-[#11161a] shadow-glow lg:h-auto lg:min-h-0"
        >
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
              onPlayBuildSequence={() => setBuildAnimationOpen(true)}
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

        <div
          role="separator"
          aria-label="Resize selected module panel"
          aria-orientation="vertical"
          aria-valuemin={DETAIL_PANEL_MIN_WIDTH}
          aria-valuemax={DETAIL_PANEL_MAX_WIDTH}
          aria-valuenow={detailPanelWidth}
          tabIndex={0}
          onKeyDown={handleDetailResizeKeyDown}
          onMouseDown={handleDetailResizeMouseDown}
          onPointerDown={handleDetailResizePointerDown}
          onPointerMove={handleDetailResizePointerMove}
          onPointerUp={stopDetailResize}
          onPointerCancel={stopDetailResize}
          className={clsx(
            "group hidden h-full touch-none select-none items-center justify-center rounded-lg outline-none transition focus-visible:bg-white/[0.06] lg:flex",
            isDetailPanelResizing
              ? "cursor-col-resize bg-white/[0.06]"
              : "cursor-col-resize hover:bg-white/[0.04]",
          )}
        >
          <span className="h-16 w-1 rounded-full bg-white/15 transition group-hover:bg-cyan-100/50 group-focus-visible:bg-cyan-100/60" />
        </div>

        <aside className="hidden min-w-0 lg:block lg:min-h-0">
          <UnitDetailPanel module={selectedModule} />
        </aside>
      </div>

      <MobileModuleBottomSheet
        module={selectedModule}
        mounted={mobileDetailMounted}
        visible={mobileDetailVisible}
        onClose={handleCloseMobileDetail}
      />
      {buildAnimationOpen ? (
        <BuildAnimationPlayer
          modules={modules}
          onClose={() => setBuildAnimationOpen(false)}
        />
      ) : null}
    </main>
  );
}

function clampDetailPanelWidth(width: number) {
  return Math.min(
    DETAIL_PANEL_MAX_WIDTH,
    Math.max(DETAIL_PANEL_MIN_WIDTH, Math.round(width)),
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
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isSheetMouseDragging, setIsSheetMouseDragging] = useState(false);
  const sheetDragStateRef = useRef({
    currentOffsetY: 0,
    isDragging: false,
    startY: 0,
  });

  const startSheetDrag = useCallback((clientY: number) => {
    sheetDragStateRef.current = {
      currentOffsetY: 0,
      isDragging: true,
      startY: clientY,
    };
    setDragOffsetY(0);
  }, []);

  const updateSheetDrag = useCallback((clientY: number) => {
    if (!sheetDragStateRef.current.isDragging) {
      return;
    }

    const offsetY = Math.max(0, clientY - sheetDragStateRef.current.startY);
    sheetDragStateRef.current.currentOffsetY = offsetY;
    setDragOffsetY(offsetY);
  }, []);

  const finishSheetDrag = useCallback(() => {
    if (!sheetDragStateRef.current.isDragging) {
      return;
    }

    const shouldClose =
      sheetDragStateRef.current.currentOffsetY >=
      MOBILE_SHEET_CLOSE_DRAG_DISTANCE;

    sheetDragStateRef.current.isDragging = false;
    setDragOffsetY(0);

    if (shouldClose) {
      onClose();
    }
  }, [onClose]);

  const handleSheetPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    startSheetDrag(event.clientY);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleSheetPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    updateSheetDrag(event.clientY);
  };

  const stopSheetPointerDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!sheetDragStateRef.current.isDragging) {
      return;
    }

    setIsSheetMouseDragging(false);
    finishSheetDrag();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleSheetMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    startSheetDrag(event.clientY);
    setIsSheetMouseDragging(true);
  };

  useEffect(() => {
    if (!isSheetMouseDragging) {
      return undefined;
    }

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      updateSheetDrag(event.clientY);
    };

    const handleMouseUp = () => {
      setIsSheetMouseDragging(false);
      finishSheetDrag();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [finishSheetDrag, isSheetMouseDragging, updateSheetDrag]);

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
      <div className="relative z-10 w-full pt-14">
        <button
          type="button"
          aria-label="Close module details"
          data-testid="mobile-sheet-close-button"
          onClick={onClose}
          className={clsx(
            "absolute right-4 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#12171b]/95 text-slate-200 shadow-xl shadow-black/30 backdrop-blur transition-opacity duration-[520ms] hover:bg-white/12",
            visible ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <X size={16} />
        </button>
        <div
          className={clsx(
            "max-h-[82dvh] overflow-hidden rounded-t-xl border border-white/10 bg-[#12171b] shadow-2xl ease-[cubic-bezier(0.22,1,0.36,1)]",
            dragOffsetY > 0
              ? "transition-none"
              : "transition-transform duration-[520ms]",
          )}
          style={{
            transform: visible ? `translateY(${dragOffsetY}px)` : "translateY(100%)",
          }}
        >
          <div
            data-testid="mobile-sheet-top-bar"
            onMouseDown={handleSheetMouseDown}
            onPointerCancel={stopSheetPointerDrag}
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={stopSheetPointerDrag}
            className="relative flex h-12 touch-none select-none items-center justify-center border-b border-white/10 px-4"
          >
            <span
              data-testid="mobile-sheet-drag-handle"
              className="h-1 w-16 rounded-full bg-white/25"
            />
          </div>
          <div className="max-h-[calc(82dvh-3rem)] overflow-y-auto p-3 pt-1">
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
