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
    <div
      ref={ref}
      className="relative rounded-[30px] border border-white/80 bg-white/60 p-2 shadow-float backdrop-blur-xl"
    >
      <div className="overflow-hidden rounded-[24px] border border-line/80 bg-white">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-line/70 px-4 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
          </div>
          <div className="mx-auto flex min-w-0 items-center gap-2 rounded-full bg-canvas px-3 py-1 text-[11px] text-muted ring-1 ring-line/70">
            <ShieldCheck className="size-3 shrink-0 text-brand-teal" />
            <span className="truncate">app.unmorph.io/verify/VRF-20931</span>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-brand-cyan/10 px-2.5 py-1 text-[11px] font-medium text-brand-teal sm:inline-flex">
            <span className="size-1.5 animate-pulse rounded-full bg-brand-aqua" />
            Live
          </span>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.35fr_1fr]">
          {/* scanned image */}
          <div className="relative p-3 sm:p-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas">
              <Landscape variant="glacier" title="Registered photograph being verified" />

              {/* fingerprint mesh */}
              <motion.div
                aria-hidden
                className="absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.75)_1px,transparent_1.4px)] [background-size:14px_14px] mix-blend-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: inView && !done ? 0.9 : 0 }}
                transition={{ duration: 0.8 }}
              />

              {/* scan beam */}
              {!done && inView && (
                <div aria-hidden className="absolute inset-x-0 top-0 h-[10%] animate-scan">
                  <div className="h-full bg-gradient-to-b from-transparent via-brand-cyan/25 to-brand-cyan/50" />
                  <div className="h-px bg-brand-cyan shadow-[0_0_18px_2px_rgb(6_214_255/0.9)]" />
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
                    className="absolute right-3 bottom-3 flex items-center gap-2 rounded-2xl bg-white/85 py-2 pr-3.5 pl-2 shadow-float ring-1 ring-white backdrop-blur-md sm:right-4 sm:bottom-4"
                  >
                    <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-brand-cyan to-brand-teal text-white shadow-[0_6px_16px_-4px_rgb(14_116_144/0.6)]">
                      <ShieldCheck className="size-4.5" />
                    </span>
                    <span className="text-left leading-tight">
                      <span className="block text-[12px] font-semibold text-ink">Authentic</span>
                      <span className="block text-[11px] text-muted">
                        Matches registered original
                      </span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* integrity report */}
          <div className="flex flex-col border-t border-line/70 p-4 text-left md:border-t-0 md:border-l md:p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-[13px] font-semibold text-ink">Integrity report</p>
              <p className="text-[11px] text-muted tabular-nums">summit-press-photo.jpg</p>
            </div>

            <ul className="mt-3 space-y-1.5">
              {checks.map((check, i) => {
                const state = stage > i + 1 ? "done" : stage === i + 1 ? "running" : "idle";
                const Icon = check.icon;
                return (
                  <li
                    key={check.label}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-500",
                      state === "running" && "bg-brand-cyan/[0.07]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-lg transition-colors duration-500",
                        state === "done"
                          ? "bg-brand-teal/10 text-brand-teal"
                          : "bg-canvas text-muted",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium text-ink">
                        {check.label}
                      </span>
                      <span className="block truncate font-mono text-[10.5px] text-muted">
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
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-teal"
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
                            className="inline-flex items-center text-muted"
                          >
                            <LoaderCircle className="size-3.5 animate-spin" />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="idle"
                            exit={{ opacity: 0 }}
                            className="h-1.5 w-8 rounded-full bg-line"
                          />
                        )}
                      </AnimatePresence>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto pt-4">
              <div className="rounded-2xl bg-canvas p-3.5 ring-1 ring-line/70">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>Confidence</span>
                  <span className="font-medium text-ink tabular-nums">{done ? "99.4%" : "—"}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-cyan/15">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand-teal via-brand-aqua to-brand-cyan"
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
  const corner = "absolute size-7 border-white/95 drop-shadow-[0_1px_4px_rgb(15_23_42/0.25)]";
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0, scale: 1.08 }}
      animate={active ? { opacity: 1, scale: done ? 0.97 : 1 } : {}}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <span className={cn(corner, "top-4 left-4 rounded-tl-xl border-t-2 border-l-2")} />
      <span className={cn(corner, "top-4 right-4 rounded-tr-xl border-t-2 border-r-2")} />
      <span className={cn(corner, "bottom-4 left-4 rounded-bl-xl border-b-2 border-l-2")} />
      <span className={cn(corner, "right-4 bottom-4 rounded-br-xl border-r-2 border-b-2")} />
    </motion.div>
  );
}
