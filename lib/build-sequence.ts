import type { BuildingModule } from "@/data/module-types";

export const BUILD_SEQUENCE_FALL_DURATION_DAYS = 0.9;
export const BUILD_SEQUENCE_FINAL_TRANSITION_DAYS = 6;
const SAME_DAY_STAGGER_DAYS = 0.06;
const MAX_SAME_DAY_STAGGER_DAYS = 0.72;

export type BuildSequenceStep = {
  module: BuildingModule;
  installDate: Date | null;
  dayIndex: number;
  dayOrder: number;
  sequence: number | null;
  staggerOffsetDays: number;
};

export type BuildSequence = {
  steps: BuildSequenceStep[];
  startDate: Date | null;
  endDate: Date | null;
  installDurationDays: number;
  installCompleteDay: number;
  totalDurationDays: number;
};

export type ModuleBuildProgress = {
  state: "pending" | "falling" | "installed";
  fallProgress: number;
};

export function createBuildSequence(modules: BuildingModule[]): BuildSequence {
  const scheduledModules = modules
    .map((module) => ({
      module,
      installDate: getModuleInstallDate(module),
      sequence: module.matrix.productionSequence,
    }))
    .sort((left, right) => compareScheduledModules(left, right));

  const datedModules = scheduledModules.filter((item) => item.installDate);
  const startDate = datedModules[0]?.installDate
    ? startOfUtcDay(datedModules[0].installDate)
    : null;
  const fallbackStartIndex = datedModules.length > 0
    ? Math.max(
        ...datedModules.map((item) =>
          startDate && item.installDate
            ? getDayDifference(startDate, item.installDate)
            : 0,
        ),
      ) + 1
    : 0;
  const dayOrderByIndex = new Map<number, number>();

  const steps = scheduledModules.map((item, index) => {
    const dayIndex =
      startDate && item.installDate
        ? getDayDifference(startDate, item.installDate)
        : fallbackStartIndex + index;
    const dayOrder = dayOrderByIndex.get(dayIndex) ?? 0;
    dayOrderByIndex.set(dayIndex, dayOrder + 1);

    return {
      module: item.module,
      installDate: item.installDate,
      dayIndex,
      dayOrder,
      sequence: item.sequence,
      staggerOffsetDays: Math.min(
        dayOrder * SAME_DAY_STAGGER_DAYS,
        MAX_SAME_DAY_STAGGER_DAYS,
      ),
    };
  });

  const installDurationDays =
    steps.length > 0 ? Math.max(...steps.map((step) => step.dayIndex)) : 0;
  const finalStepEndDays = steps.map(
    (step) =>
      step.dayIndex + step.staggerOffsetDays + BUILD_SEQUENCE_FALL_DURATION_DAYS,
  );
  const installCompleteDay =
    finalStepEndDays.length > 0 ? Math.max(...finalStepEndDays) : 0;
  const totalDurationDays =
    installCompleteDay + BUILD_SEQUENCE_FINAL_TRANSITION_DAYS;
  const endDate =
    startDate && steps.length > 0
      ? addUtcDays(startDate, installDurationDays)
      : null;

  return {
    steps,
    startDate,
    endDate,
    installDurationDays,
    installCompleteDay,
    totalDurationDays,
  };
}

export function getModuleBuildProgress(
  step: BuildSequenceStep,
  elapsedDays: number,
): ModuleBuildProgress {
  const startDay = step.dayIndex + step.staggerOffsetDays;
  const rawProgress =
    (elapsedDays - startDay) / BUILD_SEQUENCE_FALL_DURATION_DAYS;
  const fallProgress = clamp(rawProgress, 0, 1);

  if (rawProgress < 0) {
    return { state: "pending", fallProgress: 0 };
  }

  if (rawProgress < 1) {
    return { state: "falling", fallProgress };
  }

  return { state: "installed", fallProgress: 1 };
}

export function getFinalRenderingProgress(
  sequence: BuildSequence,
  elapsedDays: number,
): number {
  return clamp(
    (elapsedDays - sequence.installCompleteDay) /
      BUILD_SEQUENCE_FINAL_TRANSITION_DAYS,
    0,
    1,
  );
}

export function getBuildSequenceDate(
  sequence: BuildSequence,
  elapsedDays: number,
): Date | null {
  if (!sequence.startDate) {
    return null;
  }

  return addUtcDays(sequence.startDate, Math.floor(Math.max(0, elapsedDays)));
}

function getModuleInstallDate(module: BuildingModule): Date | null {
  return parseBuildDate(module.matrix.yard.inspectionDate) ??
    parseBuildDate(module.matrix.shipping.arrivalDate) ??
    parseBuildDate(module.matrix.shipping.shippingDate) ??
    parseBuildDate(module.matrix.moduleFabrication.dueDate);
}

function compareScheduledModules(
  left: {
    module: BuildingModule;
    installDate: Date | null;
    sequence: number | null;
  },
  right: {
    module: BuildingModule;
    installDate: Date | null;
    sequence: number | null;
  },
) {
  const leftTime = left.installDate?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightTime = right.installDate?.getTime() ?? Number.POSITIVE_INFINITY;

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  const leftSequence = left.sequence ?? Number.POSITIVE_INFINITY;
  const rightSequence = right.sequence ?? Number.POSITIVE_INFINITY;

  if (leftSequence !== rightSequence) {
    return leftSequence - rightSequence;
  }

  return getModuleNumber(left.module.id) - getModuleNumber(right.module.id);
}

function parseBuildDate(value: string | null): Date | null {
  if (!value || value === "TBD") {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : startOfUtcDay(date);
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getDayDifference(start: Date, end: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfUtcDay(end).getTime() - start.getTime()) / millisecondsPerDay);
}

function getModuleNumber(moduleId: string): number {
  const parsed = Number.parseInt(moduleId.replace(/^M/i, ""), 10);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
