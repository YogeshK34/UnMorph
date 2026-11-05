"use client";

import { motion } from "motion/react";
import {
  CircleCheck,
  CodeXml,
  Database,
  FingerprintPattern,
  HardDrive,
  ScanFace,
} from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { recentVerifications, seededHex } from "@/lib/mock-data";
import { cn, truncateMiddle } from "@/lib/utils";

export function Infrastructure() {
  return (
    <section id="infrastructure" className="relative px-5 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Infrastructure"
          title="Trust that no single party controls."
          description="UnMorph composes three open networks into one integrity layer — so proof outlives any company, server or policy change, including ours."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-6">
          <Reveal className="lg:col-span-3">
            <SpotlightCard tone="dark" className="h-full min-h-[380px]">
              <CardHeader
                icon={ScanFace}
                name="World ID"
                title="Proof of human, not identity."
                body="Registrations can require a privacy-preserving proof that a unique human is behind them — no names, no documents, no tracking."
                dark
              />
              <Parallax speed={0.06} className="relative mt-6 h-44">
                <PersonhoodOrb />
              </Parallax>
            </SpotlightCard>
          </Reveal>

          <Reveal className="lg:col-span-3" delay={0.08}>
            <SpotlightCard className="h-full min-h-[380px]">
              <CardHeader
                icon={Database}
                name="Arkiv"
                title="Integrity records you own."
                body="Fingerprints, ownership references and verification history live in wallet-owned, queryable records — portable and independently auditable."
              />
              <RecordTicker />
            </SpotlightCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.04}>
            <SpotlightCard className="h-full">
              <CardHeader
                icon={HardDrive}
                name="0G"
                title="Decentralized storage & compute."
                body="Originals and evidence bundles are stored on 0G; tamper models run on its decentralized compute."
              />
              <NodeMesh />
            </SpotlightCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.1}>
            <SpotlightCard className="h-full">
              <CardHeader
                icon={FingerprintPattern}
                name="Fingerprints"
                title="Two hashes, one verdict."
                body="SHA-256 proves byte-level identity. A perceptual hash recognises the image through resizing, recompression and screenshots."
              />
              <HashCompare />
            </SpotlightCard>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.16}>
            <SpotlightCard className="h-full">
              <CardHeader
                icon={CodeXml}
                name="API"
                title="Verify from anywhere."
                body="One call returns the verdict, confidence, regions and the on-chain record behind them."
              />
              <CodeSnippet />
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function CardHeader({
  icon: Icon,
  name,
  title,
  body,
  dark,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  name: string;
  title: string;
  body: string;
  dark?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-semibold",
          dark ? "bg-white/[0.08] text-brand-cyan" : "bg-brand-cyan/10 text-brand-teal",
        )}
      >
        <Icon className="size-3.5" strokeWidth={2} />
        {name}
      </p>
      <h3
        className={cn(
          "mt-4 font-display text-[1.4rem] leading-tight font-bold tracking-[-0.025em]",
          dark ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h3>
      <p
        className={cn("mt-2 text-[14.5px] leading-relaxed", dark ? "text-white/60" : "text-muted")}
      >
        {body}
      </p>
    </div>
  );
}

function PersonhoodOrb() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute size-24 rounded-full border border-brand-cyan/40"
          animate={{ scale: [1, 2.3], opacity: [0.6, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeOut", delay: i * 1.2 }}
        />
      ))}
      <div className="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-brand-cyan via-brand-aqua to-brand-teal shadow-[0_0_60px_-6px_rgb(6_214_255/0.7)]">
        <ScanFace className="size-8 text-ink" strokeWidth={1.6} />
      </div>
      <span className="absolute top-3 left-[8%] inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12px] text-white/80 ring-1 ring-white/10 backdrop-blur">
        <CircleCheck className="size-3.5 text-brand-cyan" /> Unique human
      </span>
      <span className="absolute right-[8%] bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12px] text-white/80 ring-1 ring-white/10 backdrop-blur">
        <CircleCheck className="size-3.5 text-brand-cyan" /> Zero personal data
      </span>
    </div>
  );
}

const verdictDot: Record<string, string> = {
  authentic: "bg-verdict-authentic",
  tampered: "bg-verdict-tampered",
  unregistered: "bg-verdict-unregistered",
};

function RecordTicker() {
  const rows = recentVerifications.filter((v) => v.arkivRecord);
  const loop = [...rows, ...rows];
  return (
    <div className="relative mt-6 h-44 overflow-hidden mask-fade-y" aria-hidden>
      <ul className="animate-marquee-y space-y-2 group-hover:[animation-play-state:paused]">
        {loop.map((row, i) => (
          <li
            key={`${row.id}-${i}`}
            className="flex items-center gap-3 rounded-xl border border-line/70 bg-white px-3 py-2.5 text-[12px]"
          >
            <span className={cn("size-2 rounded-full", verdictDot[row.verdict])} />
            <span className="font-mono text-ink/80">
              {truncateMiddle(row.arkivRecord ?? "", 10, 4)}
            </span>
            <span className="ml-auto truncate text-muted">{row.fileName}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const NODES = [
  [30, 40],
  [90, 20],
  [150, 52],
  [210, 24],
  [262, 60],
  [60, 100],
  [128, 112],
  [196, 104],
  [250, 128],
  [24, 150],
  [104, 160],
  [176, 158],
] as const;
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [2, 6],
  [3, 7],
  [5, 9],
  [9, 10],
  [10, 11],
  [6, 10],
  [7, 11],
  [4, 8],
] as const;

function NodeMesh() {
  return (
    <svg viewBox="0 0 290 180" className="mt-5 h-40 w-full" aria-hidden>
      {EDGES.map(([a, b], i) => (
        <g key={i}>
          <line
            x1={NODES[a][0]}
            y1={NODES[a][1]}
            x2={NODES[b][0]}
            y2={NODES[b][1]}
            stroke="#E5E7EB"
            strokeWidth="1.2"
          />
          {i % 3 === 0 && (
            <line
              x1={NODES[a][0]}
              y1={NODES[a][1]}
              x2={NODES[b][0]}
              y2={NODES[b][1]}
              stroke="#00B3E6"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="6 34"
              className="animate-dash"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          )}
        </g>
      ))}
      {NODES.map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r={i % 4 === 0 ? 7 : 5}
            fill="#FFFFFF"
            stroke={i % 4 === 0 ? "#0E7490" : "#9CA3AF"}
            strokeWidth="1.5"
          />
          {i % 4 === 0 && <circle cx={x} cy={y} r="2.5" fill="#06D6FF" />}
        </g>
      ))}
    </svg>
  );
}

const PH_A = seededHex(501, 16);
const SHA_A = seededHex(502, 40);

function HashCompare() {
  return (
    <div className="mt-6 space-y-2.5 font-mono text-[11px]">
      <div className="rounded-xl bg-canvas p-3 ring-1 ring-line/70">
        <p className="flex items-center justify-between font-sans text-[10.5px] font-medium text-muted">
          Perceptual <span className="text-brand-teal">survives edits</span>
        </p>
        <p className="mt-1 text-ink/85">{PH_A}</p>
      </div>
      <div className="rounded-xl bg-canvas p-3 ring-1 ring-line/70">
        <p className="flex items-center justify-between font-sans text-[10.5px] font-medium text-muted">
          SHA-256 <span className="text-brand-teal">exact bytes</span>
        </p>
        <p className="mt-1 truncate text-ink/85">{SHA_A}</p>
      </div>
    </div>
  );
}

function CodeSnippet() {
  return (
    <pre className="mt-6 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-[11.5px] leading-relaxed text-white/80">
      <span className="text-brand-cyan">const</span> report ={" "}
      <span className="text-brand-cyan">await</span> unmorph
      {"\n  "}.verify(file)
      {"\n\n"}report.verdict{"     "}
      <span className="text-white/40">{'// "authentic"'}</span>
      {"\n"}report.confidence{"  "}
      <span className="text-white/40">{"// 0.994"}</span>
      {"\n"}report.record{"      "}
      <span className="text-white/40">{"// ark_7f3a…"}</span>
    </pre>
  );
}
