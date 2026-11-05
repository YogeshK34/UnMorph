"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Kpi } from "@/lib/mock-data";
import { cn, formatCount } from "@/lib/utils";

export function KpiTiles({ items }: { items: Kpi[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((kpi, i) => (
        <motion.li
          key={kpi.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 * i }}
          className="rounded-3xl border border-line/80 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
        >
          <p className="text-[13px] font-medium text-muted">{kpi.label}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-[1.75rem] leading-none font-semibold tracking-tight text-ink">
                {kpi.display ?? formatCount(kpi.value)}
              </p>
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-0.5 text-[12px] font-medium",
                  kpi.delta.good ? "text-emerald-700" : "text-rose-700",
                )}
              >
                {kpi.delta.direction === "up" ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {kpi.delta.value}
                <span className="ml-1 font-normal text-muted">{kpi.delta.period}</span>
              </p>
            </div>
            <Sparkline values={kpi.trend} label={`${kpi.label} trend, last 12 periods`} />
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

/** 12-point trend: de-emphasised line, current period in the accent. */
function Sparkline({ values, label }: { values: number[]; label: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const w = 96;
  const h = 36;
  const pad = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (w - pad * 2),
    pad + (1 - (v - min) / span) * (h - pad * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts.at(-1)![0]} ${h} L${pts[0][0]} ${h} Z`;
  const [lx, ly] = pts.at(-1)!;
  const [px, py] = pts.at(-2)!;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={label}
      className="shrink-0 overflow-visible"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00B3E6" stopOpacity="0.12" />
          <stop offset="1" stopColor="#00B3E6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} />
      <motion.path
        d={line}
        fill="none"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      <path
        d={`M${px} ${py} L${lx} ${ly}`}
        stroke="#00B3E6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r="4" fill="#00B3E6" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  );
}
