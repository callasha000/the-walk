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
      <aside className="flex h-full flex-col rounded-lg border border-white/10 bg-black/35 p-4 shadow-glow backdrop-blur-xl">
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
    <aside className="flex h-full min-h-0 flex-col overflow-y-auto rounded-lg border border-white/10 bg-black/35 p-4 shadow-glow backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
            Selected Module
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal text-white">
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

      <div className="mt-3 h-40 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white">
        <Image
          src={getPdfPageImagePath(module.sourcePage)}
          alt={`Source PDF page for ${module.id}`}
          width={1512}
          height={1080}
          className="h-full w-full object-contain"
          sizes="(max-width: 1024px) 100vw, 380px"
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <DetailItem label="Unit code" value={module.unitCode} />
        <DetailItem label="Level" value={`Level ${module.level}`} />
        <DetailItem
          className="col-span-2"
          label="Zone"
          value={module.buildingZone}
        />
      </dl>

      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <DetailItem
          className="col-span-2"
          label="Dimensions"
          value={module.matrix.dimension ?? "Not listed"}
        />
        <DetailItem
          label="Weight"
          value={formatWeight(module.matrix.estimatedWeightLb)}
        />
        <DetailItem
          label="Fabricator"
          value={module.matrix.assignedFabricator ?? "Not assigned"}
        />
        <DetailItem label="Production" value={formatProduction(module.matrix)} />
        <DetailItem
          label="Oversized"
          value={module.matrix.oversized ? "Yes" : "No"}
        />
        <DetailItem
          label="Ship date"
          value={formatDate(module.matrix.shipping.shippingDate)}
        />
        <DetailItem
          label="Arrival"
          value={formatDate(module.matrix.shipping.arrivalDate)}
        />
      </dl>

      <div className="mt-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-300">
        Geometry is approximate from PDF/module schedule. The 2D preview shows
        the full source level sheet because exact crop coordinates are not
        available.
      </div>
    </aside>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  const itemClassName = [
    "rounded-md border border-white/10 bg-white/[0.04] p-2.5",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={itemClassName}>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-white">{value}</dd>
    </div>
  );
}

function formatWeight(value: number | null): string {
  if (value === null) {
    return "Not listed";
  }

  return `${value.toLocaleString("en-US")} lb`;
}

function formatProduction(matrix: BuildingModule["matrix"]): string {
  if (matrix.productionLine === null && matrix.productionSequence === null) {
    return "Not listed";
  }

  if (matrix.productionLine !== null && matrix.productionSequence !== null) {
    return `Line ${matrix.productionLine} / Seq ${matrix.productionSequence}`;
  }

  if (matrix.productionLine !== null) {
    return `Line ${matrix.productionLine}`;
  }

  return `Seq ${matrix.productionSequence}`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not listed";
  }

  if (value === "TBD") {
    return value;
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}
