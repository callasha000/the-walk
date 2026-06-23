export type TrancheId = 1 | 2 | 3 | 4;

export const buildingZones = [
  "Residential Affordable",
  "Market Rate South Wing",
  "Market Rate East Wing",
  "Market Rate West Wing",
  "Market Rate North Wing",
] as const;

export type BuildingZone = (typeof buildingZones)[number];

export type Vector3Tuple = [number, number, number];

export type MatrixStatus = string | number | null;

export type MatrixSchedule = {
  status: MatrixStatus;
  startDate: string | null;
  dueDate: string | null;
};

export type MatrixApprovalSchedule = MatrixSchedule & {
  requiredApprovalDate: string | null;
  revisionStatus: MatrixStatus;
};

export type ModuleMatrixRecord = {
  module: string;
  item: number | null;
  tranche: TrancheId | null;
  modType: string | null;
  moduleSerialNumber: string | null;
  oversized: boolean;
  dimension: string | null;
  estimatedWeightLb: number | null;
  productionLine: 1 | 2 | null;
  productionSequence: number | null;
  chassisShopDrawings: MatrixApprovalSchedule;
  moduleShopDrawings: MatrixApprovalSchedule;
  assignedFabricator: string | null;
  chassisFabrication: MatrixSchedule;
  moduleFabrication: MatrixSchedule;
  preYardInspection: MatrixSchedule & {
    notes: string | null;
  };
  shipping: {
    status: MatrixStatus;
    shippingDate: string | null;
    arrivalDate: string | null;
  };
  yard: {
    inspectionDate: string | null;
    notes: string | null;
  };
};

export type BuildingModule = {
  id: string;
  unitCode: string;
  level: number;
  tranche: TrancheId;
  buildingZone: BuildingZone;
  matrix: ModuleMatrixRecord;
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
