"use client";

import { clsx } from "clsx";
import type { TrancheId } from "@/data/module-types";
import { getTrancheMeta } from "@/lib/module-helpers";

type TrancheLegendProps = {
  selectedTranches: TrancheId[];
  onToggle: (tranche: TrancheId) => void;
};

const tranches: TrancheId[] = [1, 2, 3, 4];

export function TrancheLegend({ selectedTranches, onToggle }: TrancheLegendProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/25 p-3 shadow-glow backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
          Tranches
        </h2>
        <span className="text-[11px] text-slate-500">Fabrication color key</span>
      </div>
      <div className="grid gap-2">
        {tranches.map((tranche) => {
          const meta = getTrancheMeta(tranche);
          const selected =
            selectedTranches.length === 0 || selectedTranches.includes(tranche);

          return (
            <button
              key={tranche}
              type="button"
              onClick={() => onToggle(tranche)}
              className={clsx(
                "flex h-9 items-center justify-between rounded-md border px-2 text-left text-xs transition",
                selected
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/5 bg-white/[0.03] text-slate-500",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm border border-black/20"
                  style={{ backgroundColor: meta.color }}
                />
                <span>{meta.label}</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                T{tranche}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
