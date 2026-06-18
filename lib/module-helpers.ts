import {
  buildingZones,
  type BuildingModule,
  type BuildingZone,
  type TrancheId,
  type ViewerFilters,
} from "@/data/module-types";

export type TrancheMeta = {
  id: TrancheId;
  label: string;
  color: string;
  softColor: string;
  description: string;
};

export type BuildingZoneMeta = {
  id: BuildingZone;
  label: BuildingZone;
  shortLabel: string;
  color: string;
  softColor: string;
};

export const trancheMeta: Record<TrancheId, TrancheMeta> = {
  1: {
    id: 1,
    label: "Tranche 1",
    color: "#f3c6c6",
    softColor: "rgba(243, 198, 198, 0.68)",
    description: "Light pink modules",
  },
  2: {
    id: 2,
    label: "Tranche 2",
    color: "#ef9dcc",
    softColor: "rgba(239, 157, 204, 0.72)",
    description: "Magenta pink modules",
  },
  3: {
    id: 3,
    label: "Tranche 3",
    color: "#cbe4c4",
    softColor: "rgba(203, 228, 196, 0.7)",
    description: "Light green modules",
  },
  4: {
    id: 4,
    label: "Tranche 4",
    color: "#c2d4dc",
    softColor: "rgba(194, 212, 220, 0.72)",
    description: "Light blue-gray modules",
  },
};

export const buildingZoneMeta: Record<BuildingZone, BuildingZoneMeta> = {
  "Residential Affordable": {
    id: "Residential Affordable",
    label: "Residential Affordable",
    shortLabel: "Affordable",
    color: "#c2d4dc",
    softColor: "rgba(194, 212, 220, 0.72)",
  },
  "Market Rate South Wing": {
    id: "Market Rate South Wing",
    label: "Market Rate South Wing",
    shortLabel: "Market - South",
    color: "#cbe4c4",
    softColor: "rgba(203, 228, 196, 0.7)",
  },
  "Market Rate East Wing": {
    id: "Market Rate East Wing",
    label: "Market Rate East Wing",
    shortLabel: "Market - East",
    color: "#ef9dcc",
    softColor: "rgba(239, 157, 204, 0.72)",
  },
  "Market Rate West Wing": {
    id: "Market Rate West Wing",
    label: "Market Rate West Wing",
    shortLabel: "Market - West",
    color: "#d4c2ec",
    softColor: "rgba(212, 194, 236, 0.72)",
  },
  "Market Rate North Wing": {
    id: "Market Rate North Wing",
    label: "Market Rate North Wing",
    shortLabel: "Market - North",
    color: "#f3c6c6",
    softColor: "rgba(243, 198, 198, 0.68)",
  },
};

export function filterModules(
  modules: BuildingModule[],
  filters: ViewerFilters,
): BuildingModule[] {
  return modules.filter((module) => {
    const matchesLevel = filters.showAllLevels || module.level === filters.level;
    const matchesTranche =
      filters.tranches.length === 0 || filters.tranches.includes(module.tranche);
    const matchesZone =
      !filters.zones?.length || filters.zones.includes(module.buildingZone);

    return matchesLevel && matchesTranche && matchesZone;
  });
}

export function getTrancheMeta(tranche: TrancheId): TrancheMeta {
  return trancheMeta[tranche];
}

export function getBuildingZoneMeta(zone: BuildingZone): BuildingZoneMeta {
  return buildingZoneMeta[zone];
}

export function sortBuildingZones(zones: BuildingZone[]): BuildingZone[] {
  return [...zones].sort(
    (left, right) => buildingZones.indexOf(left) - buildingZones.indexOf(right),
  );
}

export function getPdfPageImagePath(sourcePage: number): string {
  if (sourcePage <= 1) {
    return "/generated/pdf-pages/module-id-overall.png";
  }

  return `/generated/pdf-pages/module-id-level-${sourcePage - 1}.png`;
}
