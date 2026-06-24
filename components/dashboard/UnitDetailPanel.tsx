"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { BuildingModule } from "@/data/module-types";
import { getPdfPageImagePath, getTrancheMeta } from "@/lib/module-helpers";

type UnitDetailPanelProps = {
  module: BuildingModule | null;
};

type DetailTab = "details" | "schedule";

type ScheduleRow = {
  label: string;
  start: Date | null;
  end: Date | null;
  displayValue: string;
  colorClassName: string;
};

type Timeline = {
  start: Date;
  end: Date;
  months: string[];
  todayOffset: number | null;
};

export function UnitDetailPanel({ module }: UnitDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const scheduleRows = useMemo(
    () => (module ? buildScheduleRows(module) : []),
    [module],
  );
  const timeline = useMemo(() => buildTimeline(scheduleRows), [scheduleRows]);

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

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-md border border-white/10 bg-white/[0.04] p-1">
        <TabButton
          active={activeTab === "details"}
          label="Details"
          onClick={() => setActiveTab("details")}
        />
        <TabButton
          active={activeTab === "schedule"}
          label="Schedule"
          onClick={() => setActiveTab("schedule")}
        />
      </div>

      {activeTab === "details" ? (
        <>
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
          <ModuleDetails module={module} />
        </>
      ) : (
        <ScheduleTimeline rows={scheduleRows} timeline={timeline} />
      )}
    </aside>
  );
}

function ModuleDetails({ module }: { module: BuildingModule }) {
  return (
    <>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
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
    </>
  );
}

function ScheduleTimeline({
  rows,
  timeline,
}: {
  rows: ScheduleRow[];
  timeline: Timeline;
}) {
  const timelineWidth = Math.max(684, timeline.months.length * 72);
  const dragStateRef = useRef({
    isDragging: false,
    startScrollLeft: 0,
    startX: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = {
      isDragging: true,
      startScrollLeft: event.currentTarget.scrollLeft,
      startX: event.clientX,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging) {
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - dragStateRef.current.startX;
    event.currentTarget.scrollLeft =
      dragStateRef.current.startScrollLeft - deltaX;
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging) {
      return;
    }

    dragStateRef.current.isDragging = false;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <section
      aria-label="Schedule Gantt chart"
      className="mt-3 flex min-h-[520px] flex-col overflow-hidden rounded-md border border-white/10 bg-black/20"
    >
      <div className="grid min-h-0 flex-1 grid-cols-[156px_minmax(0,1fr)]">
        <div
          data-testid="schedule-phase-column"
          className="border-r border-white/10 bg-white/[0.03]"
        >
          <div
            data-testid="schedule-phase-header"
            className="flex h-9 items-center border-b border-white/10 bg-white/[0.03] px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
          >
            Phase
          </div>
          {rows.map((row) => (
            <SchedulePhaseCell key={row.label} row={row} />
          ))}
        </div>

        <div
          data-testid="schedule-timeline-scroll"
          onPointerDown={handlePointerDown}
          onPointerLeave={stopDragging}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          className={`min-h-0 overflow-x-auto overflow-y-hidden select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <div style={{ width: timelineWidth }}>
            <div
              className="grid h-9 items-center border-b border-white/10 bg-white/[0.03] px-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              style={{
                gridTemplateColumns: `repeat(${timeline.months.length}, minmax(64px, 1fr))`,
              }}
            >
              {timeline.months.map((month, index) => (
                <span key={`${month}-${index}`}>{month}</span>
              ))}
            </div>

            {rows.map((row) => (
              <ScheduleTimelineRow
                key={row.label}
                row={row}
                timeline={timeline}
              />
            ))}
          </div>
        </div>
      </div>

      {timeline.todayOffset !== null ? (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
          <span className="h-2.5 w-px bg-cyan-200" />
          Today
        </div>
      ) : null}
    </section>
  );
}

function SchedulePhaseCell({ row }: { row: ScheduleRow }) {
  return (
    <div
      data-testid={`schedule-phase-${row.label}`}
      className="h-16 border-b border-white/10 bg-white/[0.03] px-2 py-2"
    >
      <p className="text-xs font-medium leading-4 text-slate-100">{row.label}</p>
      <p className="mt-1 text-[11px] leading-4 text-slate-500">
        {row.displayValue}
      </p>
    </div>
  );
}

function ScheduleTimelineRow({
  row,
  timeline,
}: {
  row: ScheduleRow;
  timeline: Timeline;
}) {
  const rangeStyle = getScheduleRangeStyle(row, timeline);
  const barClassName = [
    "absolute top-1/2 h-3 -translate-y-1/2 rounded-full shadow-sm",
    row.colorClassName,
    rangeStyle.isMilestone ? "min-w-3" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative h-16 border-b border-white/10 px-2 py-2">
      <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-white/10" />
      {timeline.todayOffset !== null ? (
        <div
          className="absolute bottom-0 top-0 w-px bg-cyan-200/70"
          style={{ left: `${timeline.todayOffset}%` }}
        />
      ) : null}
      {rangeStyle.left !== null ? (
        <div
          className={barClassName}
          style={{
            left: `${rangeStyle.left}%`,
            width: `${rangeStyle.width}%`,
          }}
        />
      ) : (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">
          No dates
        </span>
      )}
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "h-8 rounded-md bg-white/12 px-3 text-xs font-semibold text-white"
          : "h-8 rounded-md px-3 text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
      }
    >
      {label}
    </button>
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

function buildScheduleRows(module: BuildingModule): ScheduleRow[] {
  const matrix = module.matrix;

  return [
    {
      label: "Chassis shop drawings",
      start: parseScheduleDate(matrix.chassisShopDrawings.startDate),
      end: parseScheduleDate(matrix.chassisShopDrawings.dueDate),
      displayValue: formatDateRange(
        matrix.chassisShopDrawings.startDate,
        matrix.chassisShopDrawings.dueDate,
      ),
      colorClassName: "bg-cyan-200/80",
    },
    {
      label: "Module shop drawings",
      start: parseScheduleDate(matrix.moduleShopDrawings.startDate),
      end: parseScheduleDate(matrix.moduleShopDrawings.dueDate),
      displayValue: formatDateRange(
        matrix.moduleShopDrawings.startDate,
        matrix.moduleShopDrawings.dueDate,
      ),
      colorClassName: "bg-violet-200/80",
    },
    {
      label: "Chassis fabrication",
      start: parseScheduleDate(matrix.chassisFabrication.startDate),
      end: parseScheduleDate(matrix.chassisFabrication.dueDate),
      displayValue: formatDateRange(
        matrix.chassisFabrication.startDate,
        matrix.chassisFabrication.dueDate,
      ),
      colorClassName: "bg-emerald-200/80",
    },
    {
      label: "Module fabrication",
      start: parseScheduleDate(matrix.moduleFabrication.startDate),
      end: parseScheduleDate(matrix.moduleFabrication.dueDate),
      displayValue: formatDateRange(
        matrix.moduleFabrication.startDate,
        matrix.moduleFabrication.dueDate,
      ),
      colorClassName: "bg-pink-200/80",
    },
    {
      label: "Shipping",
      start: parseScheduleDate(matrix.shipping.shippingDate),
      end: parseScheduleDate(matrix.shipping.arrivalDate),
      displayValue: formatDateRange(
        matrix.shipping.shippingDate,
        matrix.shipping.arrivalDate,
      ),
      colorClassName: "bg-amber-200/85",
    },
    {
      label: "Yard inspection",
      start: parseScheduleDate(matrix.yard.inspectionDate),
      end: parseScheduleDate(matrix.yard.inspectionDate),
      displayValue: formatDate(matrix.yard.inspectionDate),
      colorClassName: "bg-slate-200/85",
    },
  ];
}

function parseScheduleDate(value: string | null): Date | null {
  if (!value || value === "TBD") {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateRange(startValue: string | null, endValue: string | null): string {
  const start = formatDate(startValue);
  const end = formatDate(endValue);

  if (start === "Not listed" && end === "Not listed") {
    return "Not listed";
  }

  if (start === end) {
    return start;
  }

  return `${start} - ${end}`;
}

function buildTimeline(rows: ScheduleRow[]) {
  const dates = rows.flatMap((row) => [row.start, row.end]).filter(isDate);
  const fallbackStart = new Date("2026-06-01T00:00:00Z");
  const fallbackEnd = new Date("2027-03-31T00:00:00Z");
  const start =
    dates.length > 0
      ? startOfMonth(new Date(Math.min(...dates.map(Number))))
      : fallbackStart;
  const end =
    dates.length > 0
      ? endOfMonth(new Date(Math.max(...dates.map(Number))))
      : fallbackEnd;
  const months = buildMonthLabels(start, end);
  const todayOffset = getDateOffsetPercent(new Date(), start, end);

  return { start, end, months, todayOffset };
}

function buildMonthLabels(start: Date, end: Date): string[] {
  const labels: string[] = [];
  const cursor = startOfMonth(start);

  while (cursor <= end && labels.length < 36) {
    labels.push(
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC",
      }).format(cursor),
    );
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return labels;
}

function getScheduleRangeStyle(
  row: ScheduleRow,
  timeline: Timeline,
) {
  const start = row.start ?? row.end;
  const end = row.end ?? row.start;

  if (!start || !end) {
    return { left: null, width: 0, isMilestone: false };
  }

  const left = getDateOffsetPercent(start, timeline.start, timeline.end) ?? 0;
  const right = getDateOffsetPercent(end, timeline.start, timeline.end) ?? left;
  const width = Math.max(2.5, right - left);

  return { left, width, isMilestone: start.getTime() === end.getTime() };
}

function getDateOffsetPercent(date: Date, start: Date, end: Date): number | null {
  const span = end.getTime() - start.getTime();

  if (span <= 0 || date < start || date > end) {
    return null;
  }

  return ((date.getTime() - start.getTime()) / span) * 100;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function isDate(value: Date | null): value is Date {
  return value instanceof Date;
}
