export type TrancheId = 1 | 2 | 3 | 4;

export const buildingZones = [
  "Residential Affordable",
  "Market Rate South Wing",
  "Market Rate East Wing",
  "Market Rate North Wing",
] as const;

export type BuildingZone = (typeof buildingZones)[number];

export type Vector3Tuple = [number, number, number];

export type BuildingModule = {
  id: string;
  unitCode: string;
  level: number;
  tranche: TrancheId;
  buildingZone: BuildingZone;
  position: Vector3Tuple;
  size: Vector3Tuple;
  sourcePage: number;
  notes: string;
};

export type ViewerFilters = {
  level: number;
  tranches: TrancheId[];
  zones?: BuildingZone[];
  showAllLevels?: boolean;
};
