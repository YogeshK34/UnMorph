"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import {
  ArrowRight,
  Infinity as InfinityIcon,
  Layers,
  ScanFace,
  ShieldCheck,
  HardDrive,
} from "lucide-react";
import { HeroConsole } from "@/components/landing/hero-console";
import { EASE_OUT_EXPO, RevealWords } from "@/components/motion/reveal";
import { usePointerParallax } from "@/hooks/use-pointer-parallax";
import { useSectionNav } from "@/hooks/use-section-nav";
import { cn } from "@/lib/utils";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 1, ease: EASE_OUT_EXPO, delay },
});

const pillars = [
  { icon: ShieldCheck, label: "Authentic" },
  { icon: Layers, label: "Tamper-proof" },
  { icon: InfinityIcon, label: "Permanent" },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const onSectionClick = useSectionNav();
  const pointer = usePointerParallax();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const textScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);

  const { scrollYProgress: consoleProgress } = useScroll({
    target: consoleRef,
    offset: ["start end", "start 0.18"],
  });
  const rotateX = useTransform(consoleProgress, [0, 1], [26, 0]);
  const consoleScale = useTransform(consoleProgress, [0, 1], [0.88, 1]);
  const consoleY = useTransform(consoleProgress, [0, 1], [60, 0]);

  return (
    <section
      ref={sectionRef}
      id="overview"
      className="relative isolate overflow-x-clip pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      <HeroBackdrop progress={scrollYProgress} pointer={pointer} />

      <motion.div
        style={{ y: textY, opacity: textOpacity, scale: textScale }}
        className="relative mx-auto max-w-4xl px-5 text-center sm:px-6"
      >
        <motion.div {...fadeUp(0.1)} className="flex justify-center">
          <span className="group inline-flex items-center gap-2 rounded-full border border-white bg-white/70 py-1 pr-3 pl-1 text-[12.5px] font-medium text-ink/80 shadow-glass backdrop-blur-md">
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
              New
            </span>
            Image integrity layer, now in private beta
          </span>
        </motion.div>

        <h1 className="mt-7 font-display text-[clamp(2.75rem,7.6vw,5.75rem)] leading-[0.98] font-medium tracking-[-0.045em] text-ink">
          <RevealWords text="Prevent morphing." immediate delay={0.2} />
          <br />
          <RevealWords
            text="Prove authenticity."
            immediate
            delay={0.42}
            wordClassName="text-gradient-brand pr-[0.04em]"
          />
        </h1>

        <motion.p
          {...fadeUp(0.75)}
          className="mx-auto mt-7 max-w-2xl text-[1.0625rem] leading-relaxed text-pretty text-muted sm:text-lg"
        >
          UnMorph fingerprints original images, anchors that proof on decentralized infrastructure,
          and exposes any manipulation — from subtle retouching to AI-generated alterations.
        </motion.p>

        <motion.div
          {...fadeUp(0.9)}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/sign-in"
            className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full bg-ink px-6 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgb(17_24_39/0.6)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-brand-teal via-brand-aqua to-brand-cyan opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="relative">Start verifying</span>
            <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/#how-it-works"
            onClick={(e) => onSectionClick(e, "how-it-works")}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-white/80 px-6 text-[15px] font-semibold text-ink backdrop-blur-md transition-colors duration-300 hover:border-brand-aqua/40 hover:bg-white"
          >
            See how it works
          </Link>
        </motion.div>

        <motion.ul
          {...fadeUp(1.05)}
          className="mt-9 flex flex-wrap items-center justify-center gap-2.5"
        >
          {pillars.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white bg-white/60 px-3.5 py-1.5 text-[13px] font-medium text-ink/80 shadow-glass backdrop-blur-md"
            >
              <Icon className="size-4 text-brand-teal" strokeWidth={1.8} />
              {label}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      {/* tilting product console */}
      <div
        ref={consoleRef}
        className="relative mx-auto mt-16 max-w-6xl px-4 [perspective:1800px] sm:mt-20 sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.55 }}
        >
          <motion.div
            style={{ rotateX, scale: consoleScale, y: consoleY, transformOrigin: "50% 0%" }}
            className="relative will-change-transform"
          >
            <HeroConsole />
          </motion.div>
        </motion.div>

        <FloatingChips pointer={pointer} progress={consoleProgress} />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

type Pointer = { x: MotionValue<number>; y: MotionValue<number> };

function HeroBackdrop({ progress, pointer }: { progress: MotionValue<number>; pointer: Pointer }) {
  const slabA = useTransform(progress, [0, 1], [0, 260]);
  const slabB = useTransform(progress, [0, 1], [0, 160]);
  const slabC = useTransform(progress, [0, 1], [0, 320]);
  const px1 = useTransform(pointer.x, (v) => v * -18);
  const py1 = useTransform(pointer.y, (v) => v * -12);
  const px2 = useTransform(pointer.x, (v) => v * 26);
  const py2 = useTransform(pointer.y, (v) => v * 16);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-grid mask-radial opacity-70" />
      <div className="absolute top-[-18%] left-1/2 h-[720px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(6_214_255/0.28),rgb(0_179_230/0.10)_55%,transparent)]" />
      <div className="absolute top-[30%] -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(14_116_144/0.14),transparent)]" />
      <div className="absolute top-[12%] -right-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(0_179_230/0.16),transparent)]" />

      {/* glass slabs — echo the brand's layered plates */}
      <motion.div style={{ y: slabA }} className="absolute top-24 -left-28 hidden md:block">
        <motion.div
          style={{ x: px1, y: py1 }}
          className="h-[560px] w-[230px] rotate-[-16deg] rounded-[56px] border border-white/70 bg-gradient-to-b from-brand-cyan/40 via-brand-aqua/10 to-transparent shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]"
        />
      </motion.div>
      <motion.div style={{ y: slabC }} className="absolute top-56 left-16 hidden lg:block">
        <motion.div
          style={{ x: px2, y: py2 }}
          className="h-[300px] w-[120px] rotate-[-16deg] rounded-[40px] border border-white/70 bg-gradient-to-b from-white/80 via-brand-cyan/10 to-transparent"
        />
      </motion.div>
      <motion.div style={{ y: slabB }} className="absolute top-10 -right-24 hidden md:block">
        <motion.div
          style={{ x: px2, y: py1 }}
          className="h-[620px] w-[260px] rotate-[14deg] rounded-[64px] border border-white/70 bg-gradient-to-b from-brand-aqua/30 via-brand-cyan/10 to-transparent shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]"
        />
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />
    </div>
  );
}

function FloatingChips({ pointer, progress }: { pointer: Pointer; progress: MotionValue<number> }) {
  const deep = useTransform(progress, [0, 1], [90, -30]);
  const mid = useTransform(progress, [0, 1], [140, -10]);
  const near = useTransform(progress, [0, 1], [200, 10]);
  const pxA = useTransform(pointer.x, (v) => v * 22);
  const pyA = useTransform(pointer.y, (v) => v * 14);
  const pxB = useTransform(pointer.x, (v) => v * -30);
  const pyB = useTransform(pointer.y, (v) => v * -20);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      <Chip
        style={{ y: deep }}
        inner={{ x: pxA, y: pyA }}
        className="top-[38%] -left-14"
        delay={1.4}
      >
        <span className="grid size-8 place-items-center rounded-xl bg-ink text-brand-cyan">
          <ScanFace className="size-4" />
        </span>
        <span>
          <span className="block text-[12px] font-semibold text-ink">World ID</span>
          <span className="block text-[11px] text-muted">Verified unique human</span>
        </span>
      </Chip>
      <Chip style={{ y: mid }} inner={{ x: pxB, y: pyB }} className="-top-7 -right-4" delay={1.6}>
        <span className="grid size-8 place-items-center rounded-xl bg-brand-cyan/15 text-brand-teal">
          <HardDrive className="size-4" />
        </span>
        <span>
          <span className="block text-[12px] font-semibold text-ink">0G Storage</span>
          <span className="block font-mono text-[10.5px] text-muted">
            root 0x4be1…09fa · pinned
          </span>
        </span>
      </Chip>
      <Chip
        style={{ y: near }}
        inner={{ x: pxA, y: pyB }}
        className="-bottom-7 left-[24%]"
        delay={1.8}
      >
        <span className="grid size-8 place-items-center rounded-xl bg-brand-teal/10 text-brand-teal">
          <Layers className="size-4" />
        </span>
        <span>
          <span className="block text-[12px] font-semibold text-ink">Anchored on Arkiv</span>
          <span className="block text-[11px] text-muted">Owner 0x7a3c…e91f · 12 Oct 2026</span>
        </span>
      </Chip>
    </div>
  );
}

function Chip({
  children,
  className,
  style,
  inner,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  style: { y: MotionValue<number> };
  inner: { x: MotionValue<number>; y: MotionValue<number> };
  delay: number;
}) {
  return (
    <motion.div style={style} className={cn("absolute", className)}>
      <motion.div style={inner}>
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay }}
        >
          <div className="flex animate-float items-center gap-2.5 rounded-2xl border border-white bg-white/80 py-2 pr-4 pl-2 shadow-float backdrop-blur-xl">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
