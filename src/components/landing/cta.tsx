"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { RevealWords, Reveal } from "@/components/motion/reveal";

export function CallToAction() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const plateA = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const plateB = useTransform(scrollYProgress, [0, 1], [200, -160]);
  const plateC = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [0.94, 1]);

  return (
    <section id="get-started" ref={ref} className="relative px-3 py-20 sm:px-6 sm:py-28">
      <motion.div
        style={{ scale }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-ink px-6 py-20 text-center sm:rounded-[44px] sm:px-12 sm:py-28"
      >
        {/* glow + grid */}
        <div aria-hidden className="absolute inset-0 bg-grid-dark mask-radial" />
        <div
          aria-hidden
          className="absolute -top-1/3 left-1/2 h-[640px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(6_214_255/0.35),rgb(0_179_230/0.12)_50%,transparent)]"
        />

        {/* floating glass plates — the logo's layers, pulled apart */}
        <motion.div
          aria-hidden
          style={{ y: plateA }}
          className="absolute top-10 -left-10 hidden h-64 w-36 rotate-[-18deg] rounded-[36px] border border-white/15 bg-gradient-to-b from-brand-cyan/50 to-brand-cyan/0 sm:block"
        />
        <motion.div
          aria-hidden
          style={{ y: plateB }}
          className="absolute top-32 left-24 hidden h-44 w-24 rotate-[-18deg] rounded-[28px] border border-white/10 bg-gradient-to-b from-white/25 to-white/0 md:block"
        />
        <motion.div
          aria-hidden
          style={{ y: plateC }}
          className="absolute -right-12 bottom-0 hidden h-72 w-40 rotate-[16deg] rounded-[40px] border border-white/15 bg-gradient-to-b from-brand-aqua/45 to-brand-teal/0 sm:block"
        />

        <div className="relative">
          <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.25rem,5.6vw,4.25rem)] leading-[1.02] font-bold tracking-[-0.045em] text-white">
            <RevealWords text="Make every image" />
            <br />
            <RevealWords text="provable." delay={0.2} wordClassName="text-gradient-brand" />
          </h2>
          <Reveal delay={0.25}>
            <p className="mx-auto mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-white/60">
              Register originals, anchor proof and verify any copy in seconds. Join the private beta
              and bring integrity to every image you publish.
            </p>
          </Reveal>
          <Reveal
            delay={0.35}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/sign-in"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand-cyan px-6 text-[15px] font-semibold text-ink shadow-[0_0_40px_-8px_rgb(6_214_255/0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              Start verifying
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/[0.04] px-6 text-[15px] font-semibold text-white/90 transition-colors duration-300 hover:bg-white/10"
            >
              Explore the dashboard
            </Link>
          </Reveal>
        </div>
      </motion.div>
    </section>
  );
}
