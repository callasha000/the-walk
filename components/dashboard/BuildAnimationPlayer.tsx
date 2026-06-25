"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import type { BuildingModule } from "@/data/module-types";
import {
  createBuildSequence,
  getBuildSequenceDate,
  getFinalRenderingProgress,
} from "@/lib/build-sequence";

const BuildSequenceViewer = dynamic(
  () =>
    import("@/components/viewer/BuildSequenceViewer").then(
      (module) => module.BuildSequenceViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Loading build sequence
      </div>
    ),
  },
);

const REFERENCE_RENDERING_PATH = "/generated/a301-reference-texture-crop.png";
const PLAYBACK_SPEEDS = [1, 2, 4, 8];

type BuildAnimationPlayerProps = {
  modules: BuildingModule[];
  onClose: () => void;
};

export function BuildAnimationPlayer({
  modules,
  onClose,
}: BuildAnimationPlayerProps) {
  const sequence = useMemo(() => createBuildSequence(modules), [modules]);
  const [elapsedDays, setElapsedDays] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const finalRenderingProgress = getFinalRenderingProgress(sequence, elapsedDays);
  const currentDate = getBuildSequenceDate(sequence, elapsedDays);
  const installedCount = useMemo(
    () =>
      sequence.steps.filter(
        (step) => elapsedDays >= step.dayIndex + step.staggerOffsetDays,
      ).length,
    [elapsedDays, sequence.steps],
  );

  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = null;
      return undefined;
    }

    const tick = (timestamp: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaSeconds = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      setElapsedDays((current) => {
        const next = Math.min(
          sequence.totalDurationDays,
          current + deltaSeconds * speed,
        );

        if (next >= sequence.totalDurationDays) {
          window.setTimeout(() => setIsPlaying(false), 0);
        }

        return next;
      });

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isPlaying, sequence.totalDurationDays, speed]);

  const handleTogglePlayback = () => {
    if (elapsedDays >= sequence.totalDurationDays) {
      setElapsedDays(0);
    }

    setIsPlaying((playing) => !playing);
  };

  const handleRestart = () => {
    setElapsedDays(0);
    setIsPlaying(false);
  };

  const handleTimelineChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setElapsedDays(Number(event.target.value));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Build sequence player"
      className="fixed inset-0 z-[70] bg-[#080b0e] text-white"
    >
      <div className="flex h-full min-h-0 flex-col gap-3 p-3 sm:p-4">
        <header className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/45 px-3 py-2 shadow-glow backdrop-blur-xl">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
              Build sequence
            </p>
            <h2 className="truncate text-lg font-semibold tracking-normal text-white">
              Installation playback
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 sm:inline">
              1 day / sec
            </span>
            <button
              type="button"
              aria-label="Close build sequence player"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-200 transition hover:bg-white/12"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        <section className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-[#11161a] shadow-glow">
          <BuildSequenceViewer
            elapsedDays={elapsedDays}
            finalRenderingProgress={finalRenderingProgress}
            sequence={sequence}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_0,transparent_42%,rgba(0,0,0,0.28)_100%)]" />
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-700"
            style={{ opacity: finalRenderingProgress }}
          >
            <Image
              src={REFERENCE_RENDERING_PATH}
              alt="A301 architectural rendering reference"
              fill
              priority
              sizes="100vw"
              className="object-contain"
              style={{
                opacity: finalRenderingProgress,
                transform: `scale(${1.045 - finalRenderingProgress * 0.045})`,
              }}
            />
            <div className="absolute inset-0 bg-cyan-100/5 mix-blend-screen" />
          </div>
        </section>

        <footer className="rounded-lg border border-white/10 bg-black/50 p-3 shadow-glow backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              <span className="font-semibold text-white">
                {installedCount.toLocaleString("en-US")} / {sequence.steps.length}
              </span>{" "}
              modules placed
            </div>
            <div className="flex items-center gap-2">
              <span>{formatPlaybackDate(currentDate)}</span>
              <span className="text-slate-600">Day {Math.floor(elapsedDays)}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={
                  isPlaying ? "Pause build animation" : "Start build animation"
                }
                onClick={handleTogglePlayback}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/12 text-white transition hover:bg-white/18"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                type="button"
                aria-label="Restart build animation"
                onClick={handleRestart}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10"
              >
                <RotateCcw size={17} />
              </button>
            </div>

            <input
              type="range"
              aria-label="Build sequence timeline"
              min={0}
              max={sequence.totalDurationDays.toFixed(1)}
              step={0.05}
              value={elapsedDays}
              onChange={handleTimelineChange}
              className="h-2 min-w-0 flex-1 accent-cyan-200"
            />

            <div className="flex items-center gap-1">
              {PLAYBACK_SPEEDS.map((playbackSpeed) => (
                <button
                  key={playbackSpeed}
                  type="button"
                  aria-label={`Set playback speed to ${playbackSpeed}x`}
                  aria-pressed={speed === playbackSpeed}
                  onClick={() => setSpeed(playbackSpeed)}
                  className={
                    speed === playbackSpeed
                      ? "h-8 rounded-md border border-white/20 bg-white/14 px-2.5 text-xs font-semibold text-white"
                      : "h-8 rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
                  }
                >
                  {playbackSpeed}x
                </button>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function formatPlaybackDate(date: Date | null): string {
  if (!date) {
    return "Schedule date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}
