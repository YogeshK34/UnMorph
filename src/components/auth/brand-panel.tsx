"use client";

import { motion, useTransform } from "motion/react";
import { CircleCheck, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Landscape } from "@/components/visuals/landscape";
import { usePointerParallax } from "@/hooks/use-pointer-parallax";

const points = [
  "Fingerprint and register original images",
  "Detect morphing, splicing & generative fill",
  "Proof anchored on World ID, Arkiv & 0G",
];

/** Left-hand brand panel on the sign-in screen: floating, layered glass plates. */
export function BrandPanel() {
  const pointer = usePointerParallax();
  const rotateY = useTransform(pointer.x, (v) => v * 8);
  const rotateX = useTransform(pointer.y, (v) => v * -6);
  const shiftA = useTransform(pointer.x, (v) => v * -14);
  const shiftB = useTransform(pointer.x, (v) => v * 10);

  return (
    <aside className="relative m-3 hidden overflow-hidden rounded-[32px] bg-ink text-white lg:flex lg:flex-col">
      <div aria-hidden className="absolute inset-0 bg-grid-dark mask-radial" />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 h-[620px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(6_214_255/0.28),rgb(0_179_230/0.08)_55%,transparent)]"
      />

      <div className="relative p-10">
        <Logo tone="light" />
      </div>

      {/* floating plate stack */}
      <div className="relative flex flex-1 items-center justify-center [perspective:1400px]">
        <motion.div
          style={{ rotateX, rotateY }}
          className="relative h-[340px] w-[300px] [transform-style:preserve-3d]"
        >
          <motion.div
            aria-hidden
            style={{ x: shiftA }}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="absolute -top-6 -left-16 h-[300px] w-[170px] rotate-[-14deg] rounded-[40px] border border-white/15 bg-gradient-to-b from-brand-cyan/45 to-brand-cyan/0"
          />
          <motion.div
            aria-hidden
            style={{ x: shiftB }}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="absolute -right-14 bottom-0 h-[260px] w-[150px] rotate-[12deg] rounded-[36px] border border-white/10 bg-gradient-to-b from-brand-aqua/35 to-brand-teal/0"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="absolute inset-0 animate-float rounded-[30px] border border-white/15 bg-white/[0.06] p-3 shadow-[0_40px_80px_-30px_rgb(6_214_255/0.45)] backdrop-blur-xl"
          >
            <div className="relative h-full overflow-hidden rounded-[22px]">
              <Landscape variant="aurora" />
              <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-white/90 p-3 text-ink shadow-float backdrop-blur">
                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-cyan to-brand-teal text-white">
                  <ShieldCheck className="size-4.5" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[13px] font-semibold">Authentic · 99.7%</span>
                  <span className="block font-mono text-[10.5px] text-muted">ark_7f3a…91c2</span>
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative p-10">
        <h2 className="max-w-md font-display text-[2rem] leading-[1.08] font-bold tracking-[-0.035em]">
          Every image deserves a <span className="text-gradient-brand">provable origin.</span>
        </h2>
        <ul className="mt-6 space-y-2.5">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-[14.5px] text-white/70">
              <CircleCheck className="size-4 text-brand-cyan" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
