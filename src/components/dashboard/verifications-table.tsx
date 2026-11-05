"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, ScanFace, Search } from "lucide-react";
import { VerdictBadge } from "@/components/dashboard/verdict-badge";
import { Landscape } from "@/components/visuals/landscape";
import {
  countByVerdict,
  filterVerifications,
  timeAgo,
  type Verification,
  type VerdictFilter,
} from "@/lib/mock-data";
import { cn, truncateMiddle } from "@/lib/utils";

const tabs: { key: VerdictFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "authentic", label: "Authentic" },
  { key: "tampered", label: "Tampered" },
  { key: "unregistered", label: "Unregistered" },
];

export function VerificationsTable({
  items,
  onSelect,
}: {
  items: Verification[];
  onSelect: (item: Verification) => void;
}) {
  const [filter, setFilter] = useState<VerdictFilter>("all");
  const [query, setQuery] = useState("");
  const counts = useMemo(() => countByVerdict(items), [items]);
  const rows = useMemo(() => filterVerifications(items, filter, query), [items, filter, query]);

  return (
    <div className="rounded-3xl border border-line/80 bg-white">
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-[17px] font-medium tracking-tight text-ink">
            Recent verifications
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Select a row to open its integrity report.
          </p>
        </div>
        <label className="relative block lg:w-72">
          <span className="sr-only">Search verifications</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search file, ID or hash…"
            className="h-10 w-full rounded-xl border border-line bg-canvas/60 pr-3 pl-10 text-[13.5px] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-muted/80 focus:border-brand-aqua focus:bg-white focus:shadow-[0_0_0_4px_rgb(6_214_255/0.12)]"
          />
        </label>
      </div>

      <div
        className="flex [scrollbar-width:none] gap-1 overflow-x-auto border-b border-line/70 px-5 sm:px-6"
        role="tablist"
        aria-label="Filter by verdict"
      >
        {tabs.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-3 pt-1 pb-3 text-[13.5px] font-medium transition-colors",
                active ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[11px] tabular-nums",
                  active ? "bg-ink text-white" : "bg-canvas text-muted ring-1 ring-line/70",
                )}
              >
                {counts[tab.key]}
              </span>
              {active && (
                <motion.span
                  layoutId="verification-tab"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13.5px]">
          <thead>
            <tr className="text-left text-[12px] text-muted">
              <th className="px-6 py-3 font-medium">Image</th>
              <th className="px-3 py-3 font-medium">Verdict</th>
              <th className="px-3 py-3 text-right font-medium">Confidence</th>
              <th className="px-3 py-3 font-medium">Fingerprint</th>
              <th className="px-3 py-3 font-medium">Source</th>
              <th className="px-3 py-3 text-right font-medium">Checked</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((item) => (
                <motion.tr
                  key={item.id}
                  layout="position"
                  initial={{ opacity: 0, backgroundColor: "rgb(6 214 255 / 0.10)" }}
                  animate={{ opacity: 1, backgroundColor: "rgb(6 214 255 / 0)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  onClick={() => onSelect(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(item);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`${item.fileName}, ${item.verdict}, open report`}
                  className="group cursor-pointer border-t border-line/60 outline-none hover:bg-canvas/80 focus-visible:bg-brand-cyan/[0.06]"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span className="block h-10 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-line/70">
                        <Landscape variant={item.scene} tampered={item.verdict === "tampered"} />
                      </span>
                      <span className="min-w-0">
                        <span className="block max-w-[220px] truncate font-medium text-ink">
                          {item.fileName}
                        </span>
                        <span className="block text-[12px] text-muted">{item.id}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <VerdictBadge verdict={item.verdict} />
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-ink tabular-nums">
                    {item.confidence.toFixed(1)}%
                  </td>
                  <td className="px-3 py-3 font-mono text-[12px] text-muted">
                    {truncateMiddle(item.sha256, 8, 4)}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      {item.source}
                      {item.humanVerified && (
                        <ScanFace
                          className="size-3.5 text-brand-teal"
                          aria-label="World ID verified"
                        />
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap text-muted tabular-nums">
                    {timeAgo(item.checkedAt)}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-display text-[15px] font-semibold text-ink">
              No verifications match
            </p>
            <p className="mt-1 text-[13px] text-muted">Try another filter or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}
