export type TrancheId = 1 | 2 | 3 | 4;

export type Vector3Tuple = [number, number, number];

export type BuildingModule = {
  id: string;
  unitCode: string;
  level: number;
  tranche: TrancheId;
  buildingZone: string;
  position: Vector3Tuple;
  size: Vector3Tuple;
  sourcePage: number;
  notes: string;
};

export type ViewerFilters = {
  level: number;
  tranches: TrancheId[];
  showAllLevels?: boolean;
};
