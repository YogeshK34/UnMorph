"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
} from "motion/react";
import { ChevronsLeftRight, ShieldX } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Landscape, TAMPER_REGIONS } from "@/components/visuals/landscape";
import { cn } from "@/lib/utils";

const metrics = [
  { label: "Fingerprint distance", value: "0.31", hint: "Threshold 0.08", fill: 0.78 },
  { label: "Pixel deviation", value: "4.8%", hint: "Across 2 regions", fill: 0.48 },
  { label: "Noise-pattern consistency", value: "61%", hint: "Expected ≥ 95%", fill: 0.61 },
];

export function DetectionDemo() {
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: true, amount: 0.5 });
  const raw = useMotionValue(50);
  const pos = useSpring(raw, { stiffness: 320, damping: 38, mass: 0.6 });
  const clip = useMotionTemplate`inset(0 0 0 ${pos}%)`;
  const left = useMotionTemplate`${pos}%`;
  const [value, setValue] = useState(50);
  const [heatmap, setHeatmap] = useState(true);
  const dragging = useRef(false);
  const interacted = useRef(false);
  const sweep = useRef<ReturnType<typeof animate> | null>(null);

  useMotionValueEvent(raw, "change", (v) => setValue(Math.round(v)));

  // A gentle sweep the first time the demo comes into view hints that it's draggable.
  useEffect(() => {
    if (!inView || interacted.current) return;
    sweep.current = animate(raw, [50, 30, 70, 46], {
      duration: 2.6,
      ease: "easeInOut",
      delay: 0.3,
    });
    return () => sweep.current?.stop();
  }, [inView, raw]);

  /** Any user input takes over from the intro sweep immediately. */
  const takeOver = () => {
    interacted.current = true;
    sweep.current?.stop();
  };

  const setFromClientX = (clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    raw.set(Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <section id="detection" className="relative px-5 py-24 sm:px-6 sm:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/3 -z-10 h-[600px] bg-[radial-gradient(ellipse_at_center,rgb(6_214_255/0.10),transparent_65%)]"
      />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Tamper detection"
          title="See exactly what changed."
          description="Drag the divider to compare a registered original with a manipulated copy. UnMorph localizes every alteration and shows the evidence behind each flag."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-[1.65fr_1fr]">
          <Reveal>
            <div
              ref={frameRef}
              className="group relative aspect-[16/11] cursor-ew-resize touch-pan-y overflow-hidden rounded-[28px] bg-white shadow-float ring-1 ring-white select-none"
              onPointerDown={(e) => {
                takeOver();
                dragging.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                setFromClientX(e.clientX);
              }}
              onPointerMove={(e) => dragging.current && setFromClientX(e.clientX)}
              onPointerUp={() => (dragging.current = false)}
              onPointerCancel={() => (dragging.current = false)}
            >
              {/* original */}
              <div className="absolute inset-0">
                <Landscape variant="glacier" title="Registered original" />
              </div>

              {/* manipulated copy */}
              <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
                <Landscape
                  variant="glacier"
                  tampered
                  title="Submitted copy with manipulated regions"
                />
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: heatmap ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {TAMPER_REGIONS.map((r) => (
                    <div
                      key={r.id}
                      className="absolute"
                      style={{
                        left: `${r.left}%`,
                        top: `${r.top}%`,
                        width: `${r.width}%`,
                        height: `${r.height}%`,
                      }}
                    >
                      <div className="absolute -inset-[35%] rounded-full bg-[radial-gradient(closest-side,rgb(225_29_72/0.55),rgb(245_158_11/0.25)_55%,transparent)] mix-blend-multiply" />
                      <div className="absolute inset-0 rounded-lg border-2 border-verdict-tampered shadow-[0_0_0_4px_rgb(225_29_72/0.15)]" />
                      <span className="absolute -top-7 left-0 rounded-md bg-verdict-tampered px-1.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap text-white shadow">
                        {r.id} · {r.label} · {r.score}%
                      </span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              {/* labels */}
              <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1 text-[11.5px] font-semibold text-ink shadow-glass backdrop-blur">
                Original · registered
              </span>
              <span className="pointer-events-none absolute right-4 bottom-4 rounded-full bg-ink/85 px-3 py-1 text-[11.5px] font-semibold text-white backdrop-blur">
                Submitted copy
              </span>

              {/* accessible control */}
              <input
                type="range"
                min={2}
                max={98}
                value={value}
                onFocus={takeOver}
                onChange={(e) => {
                  takeOver();
                  raw.set(Number(e.target.value));
                }}
                aria-label="Comparison divider position"
                className="peer sr-only"
              />

              {/* divider */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgb(15_23_42/0.35)]"
                style={{ left }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-float ring-1 ring-line transition-[box-shadow] group-active:scale-95 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-aqua/50"
                style={{ left }}
              >
                <ChevronsLeftRight className="size-4.5" />
              </motion.div>
            </div>
          </Reveal>

          {/* report */}
          <Reveal delay={0.12}>
            <div className="flex h-full flex-col rounded-[28px] border border-white bg-white/75 p-6 shadow-glass backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-medium text-muted">Verdict</p>
                  <p className="mt-1 flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-ink">
                    <ShieldX className="size-6 text-verdict-tampered" />
                    Tampered
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-medium text-muted">Confidence</p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                    96.8%
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="text-ink/85">{m.label}</span>
                      <span className="font-semibold text-ink tabular-nums">{m.value}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-verdict-tampered/12">
                      <motion.div
                        className="h-full rounded-full bg-verdict-tampered"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${m.fill * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                      />
                    </div>
                    <p className="mt-1 text-[11.5px] text-muted">{m.hint}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-[12px] font-medium text-muted">Altered regions</p>
                <ul className="mt-3 space-y-2">
                  {TAMPER_REGIONS.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 rounded-xl bg-canvas px-3 py-2.5 text-[13px]"
                    >
                      <span className="grid size-6 place-items-center rounded-md bg-verdict-tampered text-[11px] font-bold text-white">
                        {r.id}
                      </span>
                      <span className="flex-1 text-ink/85">{r.label}</span>
                      <span className="font-semibold text-ink tabular-nums">{r.score}%</span>
                    </li>
                  ))}
                </ul>
              </div>

              <label className="mt-auto flex cursor-pointer items-center justify-between gap-3 pt-6 text-[13px] font-medium text-ink">
                Show tamper heatmap
                <button
                  type="button"
                  role="switch"
                  aria-checked={heatmap}
                  onClick={() => setHeatmap((h) => !h)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors duration-300",
                    heatmap ? "bg-brand-teal" : "bg-line",
                  )}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 600, damping: 34 }}
                    className={cn(
                      "absolute top-0.5 size-5 rounded-full bg-white shadow",
                      heatmap ? "right-0.5" : "left-0.5",
                    )}
                  />
                </button>
              </label>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
