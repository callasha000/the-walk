import type { BuildingModule, Vector3Tuple } from "@/data/module-types";

const explodeGap = 0.3;

export function getModuleRenderPosition(
  module: BuildingModule,
  exploded: boolean,
): Vector3Tuple {
  if (!exploded) {
    return module.position;
  }

  return [
    module.position[0],
    module.position[1] + (module.level - 1) * explodeGap,
    module.position[2],
  ];
}
