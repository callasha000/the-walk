import matrixData from "./module-matrix.json";
import type { ModuleMatrixRecord } from "./module-types";

export const moduleMatrixById = matrixData as Partial<
  Record<string, ModuleMatrixRecord>
>;
