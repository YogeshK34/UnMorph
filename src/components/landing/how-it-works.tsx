"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import {
  Check,
  Database,
  FingerprintPattern,
  HardDrive,
  ScanFace,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Landscape, TAMPER_REGIONS } from "@/components/visuals/landscape";
import { seededHex } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const steps = [
  {
    kicker: "01 · Register",
    title: "Fingerprint the original.",
    body: "Upload or capture an image. UnMorph computes a cryptographic SHA-256 digest and a perceptual hash that survives resizing and recompression — and, where required, binds the registration to a World ID–verified human.",
    points: [
      "Cryptographic + perceptual fingerprints",
      "Proof of personhood via World ID",
      "Capture metadata preserved",
    ],
  },
  {
    kicker: "02 · Anchor",
    title: "Anchor proof on decentralized rails.",
    body: "The fingerprint, ownership reference and verification metadata become a wallet-owned, queryable record on Arkiv. The image and supporting evidence are stored on 0G's decentralized storage network.",
    points: [
      "Wallet-owned Arkiv records",
      "Evidence bundles on 0G Storage",
      "Append-only integrity history",
    ],
  },
  {
    kicker: "03 · Verify",
    title: "Verify any copy, anywhere.",
    body: "Anyone can check an image against the registry. AI tamper detection on 0G compute pinpoints morphing, splicing and generative fill — down to the exact region — with a confidence score you can audit.",
    points: [
      "Region-level tamper heatmaps",
      "Auditable confidence scores",
      "Dashboard and API access",
    ],
  },
] as const;

export function HowItWorks() {
  const stepsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: stepsRef, offset: ["start 0.6", "end 0.6"] });
  const rail = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length))));
  });

  return (
    <section id="how-it-works" className="relative px-5 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="From capture to proof in three steps."
          description="UnMorph turns an image into evidence: a fingerprint only the original can match, anchored where no single party can rewrite it."
        />

        <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* steps */}
          <div ref={stepsRef} className="relative">
            <div
              aria-hidden
              className="absolute top-2 bottom-2 left-[15px] hidden w-[3px] bg-nb-black/15 lg:block"
            >
              <motion.div
                style={{ scaleY: rail }}
                className="h-full w-full origin-top bg-nb-black"
              />
            </div>

            <ol className="space-y-16 lg:space-y-0">
              {steps.map((step, i) => (
                <li
                  key={step.kicker}
                  className="relative lg:flex lg:min-h-[72vh] lg:items-center lg:pl-14"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1/2 left-0 hidden size-[33px] -translate-y-1/2 place-items-center border-[3px] border-nb-black font-heading text-[12px] font-bold transition-colors duration-300 lg:grid",
                      active >= i ? "bg-nb-yellow text-nb-black" : "bg-nb-surface text-nb-muted",
                    )}
                  >
                    {i + 1}
                  </span>
                  <Reveal
                    className={cn(
                      "transition-opacity duration-700 lg:max-w-md",
                      active === i ? "lg:opacity-100" : "lg:opacity-35",
                    )}
                  >
                    <p className="inline-block border-[2px] border-nb-black bg-nb-black px-2.5 py-1 font-heading text-[11px] font-bold tracking-[0.16em] text-nb-bg uppercase">
                      {step.kicker}
                    </p>
                    <h3 className="mt-4 font-display text-[1.65rem] leading-tight font-extrabold tracking-[-0.03em] text-nb-black uppercase">
                      {step.title}
                    </h3>
                    <p className="mt-4 leading-relaxed text-nb-muted">{step.body}</p>
                    <ul className="mt-6 space-y-2.5">
                      {step.points.map((point) => (
                        <li key={point} className="flex items-center gap-3 text-[15px] text-nb-black">
                          <span className="grid size-6 shrink-0 place-items-center border-[2px] border-nb-black bg-nb-green text-nb-black">
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                    {/* inline visual on small screens */}
                    <div className="mt-8 aspect-[5/4] lg:hidden">
                      <StepVisual index={i} />
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>

          {/* sticky visual */}
          <div className="hidden lg:block">
            <div className="sticky top-[calc(50vh-260px)] h-[520px]">
              <div className="relative size-full">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={active}
                    className="absolute inset-0"
                    initial={{ opacity: 0, y: 28, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -28, scale: 0.97 }}
                    transition={{ duration: 0.7, ease: EASE }}
                  >
                    <StepVisual index={active} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function StepVisual({ index }: { index: number }) {
  return (
    <div className="relative size-full overflow-hidden border-[3px] border-nb-black bg-nb-surface p-5 shadow-nb">
      <div aria-hidden className="absolute inset-0 bg-grid opacity-40" />
      {index === 0 && <RegisterVisual />}
      {index === 1 && <AnchorVisual />}
      {index === 2 && <VerifyVisual />}
    </div>
  );
}

const PHASH_BITS = seededHex(77, 64)
  .split("")
  .map((c) => parseInt(c, 16) % 2 === 0);
const DIGEST = seededHex(1337, 64);

function RegisterVisual() {
  return (
    <div className="relative flex h-full flex-col gap-4">
      <div className="relative min-h-0 flex-1 overflow-hidden border-[3px] border-nb-black">
        <Landscape variant="dawn" />
        <div className="absolute top-3 left-3 flex items-center gap-2 border-[2px] border-nb-black bg-nb-surface py-1 pr-3 pl-1 font-heading text-[11px] font-bold uppercase text-nb-black shadow-nb-sm">
          <span className="grid size-5 place-items-center bg-nb-black text-nb-yellow">
            <ScanFace className="size-3" />
          </span>
          Verified human · World ID
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr] items-center gap-4 border-[3px] border-nb-black bg-nb-black p-4 text-nb-bg">
        <div className="grid grid-cols-8 gap-[3px]" aria-label="Perceptual hash bit grid">
          {PHASH_BITS.map((on, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.008, duration: 0.3 }}
              className={cn("size-2.5", on ? "bg-nb-yellow" : "bg-nb-bg/15")}
            />
          ))}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-heading text-[11px] font-bold uppercase tracking-wide text-nb-yellow">
            <FingerprintPattern className="size-3.5" /> SHA-256
          </p>
          <p className="mt-1 font-mono text-[11px] leading-relaxed break-all text-nb-green">
            <TypeOut text={DIGEST} />
          </p>
        </div>
      </div>
    </div>
  );
}

function TypeOut({ text }: { text: string }) {
  return (
    <motion.span
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.012, delayChildren: 0.3 }}
    >
      {text.split("").map((ch, i) => (
        <motion.span key={i} variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
          {ch}
        </motion.span>
      ))}
    </motion.span>
  );
}

const layers = [
  {
    icon: Database,
    name: "Arkiv",
    detail: "Integrity record · ark_7f3a…91c2",
    tone: "bg-nb-black text-nb-bg",
    accent: "text-nb-yellow",
  },
  {
    icon: HardDrive,
    name: "0G Storage",
    detail: "Evidence bundle · 0x4be1…09fa",
    tone: "bg-nb-blue text-nb-black",
    accent: "text-nb-black",
  },
  {
    icon: ScanFace,
    name: "World ID",
    detail: "Attestation · nullifier 0x91c…2d",
    tone: "bg-nb-yellow text-nb-black",
    accent: "text-nb-black",
  },
];

function AnchorVisual() {
  return (
    <div className="relative flex h-full flex-col justify-between">
      <div className="relative mx-auto mt-4 h-[250px] w-full max-w-sm [perspective:1200px]">
        {layers.map((layer, i) => {
          const Icon = layer.icon;
          return (
            <motion.div
              key={layer.name}
              initial={{ opacity: 0, y: -40, rotateX: 50 }}
              animate={{ opacity: 1, y: i * 74, rotateX: 50 }}
              transition={{ delay: 0.15 + i * 0.12, type: "spring", stiffness: 160, damping: 20 }}
              style={{ zIndex: 3 - i, transformStyle: "preserve-3d" }}
              className={cn(
                "absolute inset-x-0 top-0 flex h-[120px] items-start gap-3 border-[3px] border-nb-black p-5 shadow-nb",
                layer.tone,
              )}
            >
              <Icon className={cn("size-5", layer.accent)} strokeWidth={2.5} />
              <div>
                <p className="font-display text-[15px] font-extrabold uppercase">{layer.name}</p>
                <p className="mt-0.5 font-mono text-[11px] opacity-70">{layer.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <motion.pre
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
        className="relative overflow-hidden border-[3px] border-nb-black bg-nb-black p-4 font-mono text-[11px] leading-relaxed text-nb-green shadow-nb"
      >
        <span className="text-nb-bg/45">{"// arkiv record"}</span>
        {"\n{"}
        {"\n  "}
        <span className="text-nb-yellow">&quot;sha256&quot;</span>: &quot;e3b0c4…7b855&quot;,
        {"\n  "}
        <span className="text-nb-yellow">&quot;phash&quot;</span>: &quot;9f2c4ba1d0e7a71e&quot;,
        {"\n  "}
        <span className="text-nb-yellow">&quot;owner&quot;</span>: &quot;0x7a3c…e91f&quot;,
        {"\n  "}
        <span className="text-nb-yellow">&quot;storage&quot;</span>: &quot;0g://0x4be1…09fa&quot;,
        {"\n  "}
        <span className="text-nb-yellow">&quot;human&quot;</span>: true
        {"\n}"}
      </motion.pre>
    </div>
  );
}

function VerifyVisual() {
  return (
    <div className="relative flex h-full flex-col gap-4">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <figure className="relative overflow-hidden border-[3px] border-nb-black">
          <Landscape variant="glacier" />
          <figcaption className="absolute top-2.5 left-2.5 border-[2px] border-nb-black bg-nb-green px-2.5 py-1 font-heading text-[10.5px] font-bold uppercase text-nb-black">
            Registered
          </figcaption>
        </figure>
        <figure className="relative overflow-hidden border-[3px] border-nb-black">
          <Landscape variant="glacier" tampered />
          {TAMPER_REGIONS.map((r, i) => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0, scale: 1.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.2, duration: 0.5, ease: EASE }}
              className="absolute rounded-md border-2 border-verdict-tampered bg-verdict-tampered/15"
              style={{
                left: `${r.left}%`,
                top: `${r.top}%`,
                width: `${r.width}%`,
                height: `${r.height}%`,
              }}
            />
          ))}
          <figcaption className="absolute top-2.5 left-2.5 rounded-full bg-white/85 px-2.5 py-1 text-[10.5px] font-semibold text-ink backdrop-blur">
            Submitted
          </figcaption>
        </figure>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-brand-teal/10 text-brand-teal">
            <ShieldCheck className="size-4.5" />
          </span>
          <div>
            <p className="text-[12px] text-muted">Copy A</p>
            <p className="font-display text-[15px] font-medium text-ink">Authentic · 99.4%</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6, ease: EASE }}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-verdict-tampered/10 text-verdict-tampered">
            <ShieldX className="size-4.5" />
          </span>
          <div>
            <p className="text-[12px] text-muted">Copy B</p>
            <p className="font-display text-[15px] font-medium text-ink">Tampered · 2 regions</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
