"use client";

import Image from "next/image";
import type { BuildingModule } from "@/data/module-types";
import { getPdfPageImagePath, getTrancheMeta } from "@/lib/module-helpers";

type UnitDetailPanelProps = {
  module: BuildingModule | null;
};

export function UnitDetailPanel({ module }: UnitDetailPanelProps) {
  if (!module) {
    return (
      <aside className="flex h-full flex-col rounded-lg border border-white/10 bg-black/35 p-5 shadow-glow backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
          Module Detail
        </p>
        <div className="mt-8 rounded-md border border-dashed border-white/15 p-4 text-sm leading-6 text-slate-400">
          Select a module to view source metadata and the corresponding PDF page.
        </div>
      </aside>
    );
  }

  const tranche = getTrancheMeta(module.tranche);

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg border border-white/10 bg-black/35 p-5 shadow-glow backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
            Selected Module
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">
            {module.id}
          </h2>
        </div>
        <span
          className="rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: tranche.softColor }}
        >
          {tranche.label}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <DetailItem label="Unit code" value={module.unitCode} />
        <DetailItem label="Level" value={`Level ${module.level}`} />
        <DetailItem label="Zone" value={module.buildingZone} />
        <DetailItem label="Source page" value={`Page ${module.sourcePage}`} />
      </dl>

      <div className="mt-5 rounded-md border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-300">
        Geometry is approximate from PDF/module schedule. The 2D preview shows
        the full source level sheet because exact crop coordinates are not
        available.
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-hidden rounded-md border border-white/10 bg-white">
        <Image
          src={getPdfPageImagePath(module.sourcePage)}
          alt={`Source PDF page for ${module.id}`}
          width={1512}
          height={1080}
          className="h-full w-full object-contain"
          sizes="(max-width: 1024px) 100vw, 380px"
        />
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400">{module.notes}</p>
    </aside>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-white">{value}</dd>
    </div>
  );
}
