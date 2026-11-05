"use client";

import Link from "next/link";
import { useEffect, useId, useSyncExternalStore } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight, House, ShieldX } from "lucide-react";
import { notFoundReport } from "@/lib/mock-data";

const EASE = [0.16, 1, 0.3, 1] as const;
const subscribeNoop = () => () => {};

export function NotFoundView() {
  const path = useSyncExternalStore(
    subscribeNoop,
    () => window.location.pathname,
    () => null,
  );

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center overflow-hidden px-5 pt-32 pb-20 sm:pt-36">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-radial opacity-70" />
        <div className="absolute top-[-10%] left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(6_214_255/0.22),transparent)]" />
        <div className="absolute right-[-10%] bottom-[-20%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(closest-side,rgb(225_29_72/0.06),transparent)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: EASE }}
        className="w-full max-w-3xl"
      >
        <MorphedNumber />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
        className="mt-6 max-w-xl text-center"
      >
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.6rem)] leading-tight font-bold tracking-[-0.035em] text-ink">
          This page didn&apos;t pass verification.
        </h1>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">
          We couldn&apos;t find a registered record for this URL. It may have been moved, renamed —
          or it never existed.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            <House className="size-4" />
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="group inline-flex h-12 items-center gap-2 rounded-full border border-line bg-white/80 px-6 text-[15px] font-semibold text-ink backdrop-blur transition-colors hover:border-brand-aqua/40 hover:bg-white"
          >
            Open dashboard
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>

      <motion.section
        aria-label="Integrity report for this URL"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
        className="mt-14 grid w-full max-w-3xl gap-4 md:grid-cols-[1.1fr_1fr]"
      >
        <div className="rounded-[24px] border border-white bg-white/75 p-5 shadow-glass backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="font-display text-[14px] font-bold text-ink">Integrity report</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-medium text-rose-900 ring-1 ring-rose-600/20">
              <ShieldX className="size-3.5" /> Not found
            </span>
          </div>
          <dl className="mt-4 divide-y divide-line/70 text-[13px]">
            <ReportRow label="Requested path" value={path ?? "…"} mono />
            <ReportRow label="Registry" value={notFoundReport.registry} />
            <ReportRow label="Lookup" value={notFoundReport.lookup} />
            <ReportRow label="Fingerprint" value={notFoundReport.fingerprint} />
            <ReportRow label="Status" value={notFoundReport.status} />
          </dl>
        </div>

        <nav
          aria-label="Suggested pages"
          className="rounded-[24px] border border-white bg-white/75 p-5 shadow-glass backdrop-blur-xl"
        >
          <p className="font-display text-[14px] font-bold text-ink">Verified destinations</p>
          <ul className="mt-3 space-y-1">
            {notFoundReport.suggestions.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-canvas"
                >
                  <span>
                    <span className="block text-[13.5px] font-medium text-ink">{s.label}</span>
                    <span className="block text-[12px] text-muted">{s.hint}</span>
                  </span>
                  <ArrowUpRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-teal" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </motion.section>
    </main>
  );
}

function ReportRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={mono ? "truncate font-mono text-[12px] text-ink" : "truncate text-ink"}>
        {value}
      </dd>
    </div>
  );
}

/** "404" — crisp on the left, pixel-morphed on the right, split by a sweeping integrity scan. */
function MorphedNumber() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (n: string) => `${n}-${uid}`;
  const reduce = useReducedMotion();
  const split = useMotionValue(300);
  const rest = useTransform(split, (v) => 600 - v);
  const labelX = useTransform(split, (v) => v - 64);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(split, [300, 230, 380, 300], {
      duration: 7,
      ease: "easeInOut",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [reduce, split]);

  return (
    <svg viewBox="0 0 600 240" className="w-full" role="img" aria-label="404">
      <defs>
        <linearGradient id={id("ink")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#111827" />
          <stop offset="0.55" stopColor="#0E7490" />
          <stop offset="1" stopColor="#06D6FF" />
        </linearGradient>
        <filter
          id={id("pixelate")}
          filterUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="600"
          height="240"
        >
          <feFlood x="5" y="5" height="2" width="2" />
          <feComposite width="12" height="12" />
          <feTile result="tiles" />
          <feComposite in="SourceGraphic" in2="tiles" operator="in" />
          <feMorphology operator="dilate" radius="6" />
        </filter>
        <clipPath id={id("left")}>
          <motion.rect x="0" y="0" height="240" style={{ width: split }} />
        </clipPath>
        <clipPath id={id("right")}>
          <motion.rect y="0" height="240" style={{ x: split, width: rest }} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id("left")})`}>
        <text
          x="300"
          y="200"
          textAnchor="middle"
          fill={`url(#${id("ink")})`}
          className="font-display"
          style={{ fontSize: 230, fontWeight: 800, letterSpacing: "-0.06em" }}
        >
          404
        </text>
      </g>
      <g clipPath={`url(#${id("right")})`} filter={`url(#${id("pixelate")})`} opacity="0.92">
        <text
          x="300"
          y="200"
          textAnchor="middle"
          fill={`url(#${id("ink")})`}
          className="font-display"
          style={{ fontSize: 230, fontWeight: 800, letterSpacing: "-0.06em" }}
        >
          404
        </text>
      </g>

      {/* scan divider */}
      <motion.g style={{ x: split }}>
        <line x1="0" x2="0" y1="6" y2="234" stroke="#06D6FF" strokeWidth="2" />
        <line x1="0" x2="0" y1="6" y2="234" stroke="#06D6FF" strokeWidth="10" opacity="0.15" />
      </motion.g>
      <motion.g style={{ x: labelX }}>
        <rect x="0" y="0" width="128" height="24" rx="12" fill="#111827" />
        <text
          x="64"
          y="16"
          textAnchor="middle"
          fill="#FFFFFF"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          Integrity check failed
        </text>
      </motion.g>
    </svg>
  );
}
