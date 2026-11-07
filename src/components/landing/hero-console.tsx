"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import {
  CircleCheck,
  FingerprintPattern,
  Hash,
  Database,
  ScanFace,
  ScanSearch,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import { Landscape } from "@/components/visuals/landscape";
import { cn } from "@/lib/utils";

const checks = [
  {
    icon: FingerprintPattern,
    label: "Perceptual fingerprint",
    value: "pHash 9f2c4b…a71e",
    result: "Match",
  },
  { icon: Hash, label: "SHA-256 digest", value: "e3b0c4…7b855", result: "Match" },
  { icon: Database, label: "Arkiv record", value: "ark_7f3a…91c2", result: "Found" },
  { icon: ScanFace, label: "Human attestation", value: "World ID", result: "Verified" },
  { icon: ScanSearch, label: "Tamper analysis", value: "0 altered regions", result: "Clean" },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

/** The product "console" shown in the hero — a live-feeling verification run. */
export function HeroConsole() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [stage, setStage] = useState(0);
  const done = stage > checks.length;

  useEffect(() => {
    if (!inView) return;
    const timers = Array.from({ length: checks.length + 1 }, (_, i) =>
      window.setTimeout(() => setStage(i + 1), 900 + i * 520),
    );
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="relative border-[4px] border-nb-black bg-nb-bg p-2 shadow-nb-xl">
      <div className="overflow-hidden border-[3px] border-nb-black bg-nb-surface">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b-[3px] border-nb-black bg-nb-yellow px-4 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-3 border-[2px] border-nb-black bg-nb-pink" />
            <span className="size-3 border-[2px] border-nb-black bg-nb-orange" />
            <span className="size-3 border-[2px] border-nb-black bg-nb-green" />
          </div>
          <div className="mx-auto flex min-w-0 items-center gap-2 border-[2px] border-nb-black bg-nb-surface px-3 py-1 font-mono text-[11px] text-nb-black">
            <ShieldCheck className="size-3 shrink-0" />
            <span className="truncate">app.unmorph.io/verify/VRF-20931</span>
          </div>
          <span className="hidden items-center gap-1.5 border-[2px] border-nb-black bg-nb-black px-2.5 py-1 font-heading text-[11px] font-bold uppercase tracking-wide text-nb-bg sm:inline-flex">
            <span className="size-2 animate-pulse bg-nb-green" />
            Live
          </span>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.35fr_1fr]">
          {/* scanned image */}
          <div className="relative p-3 sm:p-4">
            <div className="relative aspect-[4/3] overflow-hidden border-[3px] border-nb-black bg-nb-bg">
              <Landscape variant="glacier" title="Registered photograph being verified" />

              {/* scan beam */}
              {!done && inView && (
                <div aria-hidden className="absolute inset-x-0 top-0 h-[10%] animate-scan">
                  <div className="h-full bg-nb-yellow/35" />
                  <div className="h-[3px] bg-nb-black" />
                </div>
              )}

              {/* corner brackets */}
              <Brackets active={inView} done={done} />

              {/* verified shield */}
              <AnimatePresence>
                {done && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    className="absolute right-3 bottom-3 flex items-center gap-2.5 border-[3px] border-nb-black bg-nb-green py-2 pr-3.5 pl-2 shadow-nb sm:right-4 sm:bottom-4"
                  >
                    <span className="grid size-9 place-items-center border-[2px] border-nb-black bg-nb-black text-nb-green">
                      <ShieldCheck className="size-4.5" />
                    </span>
                    <span className="text-left leading-tight">
                      <span className="block font-heading text-[12px] font-bold uppercase text-nb-black">
                        Authentic
                      </span>
                      <span className="block text-[11px] text-nb-black/70">
                        Matches registered original
                      </span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* integrity report */}
          <div className="flex flex-col border-t-[3px] border-nb-black p-4 text-left md:border-t-0 md:border-l-[3px] md:p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-[14px] font-extrabold uppercase tracking-tight text-nb-black">
                Integrity report
              </p>
              <p className="font-mono text-[11px] text-nb-muted">summit-press-photo.jpg</p>
            </div>

            <ul className="mt-4 space-y-2">
              {checks.map((check, i) => {
                const state = stage > i + 1 ? "done" : stage === i + 1 ? "running" : "idle";
                const Icon = check.icon;
                return (
                  <li
                    key={check.label}
                    className={cn(
                      "flex items-center gap-3 border-[2px] px-2.5 py-2 transition-colors duration-300",
                      state === "running"
                        ? "border-nb-black bg-nb-yellow"
                        : state === "done"
                          ? "border-nb-black bg-nb-surface"
                          : "border-nb-black/20 bg-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center border-[2px] transition-colors duration-300",
                        state === "done"
                          ? "border-nb-black bg-nb-green text-nb-black"
                          : "border-nb-black/30 bg-nb-bg text-nb-muted",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-[12px] font-bold uppercase text-nb-black">
                        {check.label}
                      </span>
                      <span className="block truncate font-mono text-[10.5px] text-nb-muted">
                        {check.value}
                      </span>
                    </span>
                    <span className="relative grid h-5 w-16 place-items-end">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {state === "done" ? (
                          <motion.span
                            key="done"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: EASE }}
                            className="inline-flex items-center gap-1 font-heading text-[10px] font-bold uppercase text-nb-black"
                          >
                            <CircleCheck className="size-3.5" />
                            {check.result}
                          </motion.span>
                        ) : state === "running" ? (
                          <motion.span
                            key="running"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="inline-flex items-center text-nb-black"
                          >
                            <LoaderCircle className="size-3.5 animate-spin" />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="idle"
                            exit={{ opacity: 0 }}
                            className="h-[3px] w-8 bg-nb-black/25"
                          />
                        )}
                      </AnimatePresence>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto pt-4">
              <div className="border-[3px] border-nb-black bg-nb-bg p-3.5">
                <div className="flex items-center justify-between font-heading text-[11px] font-bold uppercase tracking-wide text-nb-black">
                  <span>Confidence</span>
                  <span className="tabular-nums">{done ? "99.4%" : "—"}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden border-[2px] border-nb-black bg-nb-surface">
                  <motion.div
                    className="h-full bg-nb-green"
                    initial={{ width: "0%" }}
                    animate={{
                      width: inView
                        ? `${Math.min(100, (stage / (checks.length + 1)) * 99.4)}%`
                        : "0%",
                    }}
                    transition={{ duration: 0.6, ease: EASE }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Brackets({ active, done }: { active: boolean; done: boolean }) {
  const corner = "absolute size-7 border-nb-yellow";
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0, scale: 1.08 }}
      animate={active ? { opacity: 1, scale: done ? 0.97 : 1 } : {}}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <span className={cn(corner, "top-4 left-4 border-t-[4px] border-l-[4px]")} />
      <span className={cn(corner, "top-4 right-4 border-t-[4px] border-r-[4px]")} />
      <span className={cn(corner, "bottom-4 left-4 border-b-[4px] border-l-[4px]")} />
      <span className={cn(corner, "right-4 bottom-4 border-r-[4px] border-b-[4px]")} />
    </motion.div>
  );
}
