import type { BuildingModule, TrancheId, ViewerFilters } from "@/data/module-types";

export type TrancheMeta = {
  id: TrancheId;
  label: string;
  color: string;
  softColor: string;
  description: string;
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

export function filterModules(
  modules: BuildingModule[],
  filters: ViewerFilters,
): BuildingModule[] {
  return modules.filter((module) => {
    const matchesLevel = filters.showAllLevels || module.level === filters.level;
    const matchesTranche =
      filters.tranches.length === 0 || filters.tranches.includes(module.tranche);

    return matchesLevel && matchesTranche;
  });
}

export function getTrancheMeta(tranche: TrancheId): TrancheMeta {
  return trancheMeta[tranche];
}

export function getPdfPageImagePath(sourcePage: number): string {
  if (sourcePage <= 1) {
    return "/generated/pdf-pages/module-id-overall.png";
  }

  return `/generated/pdf-pages/module-id-level-${sourcePage - 1}.png`;
}
