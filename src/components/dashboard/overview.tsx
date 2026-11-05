"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { motion } from "motion/react";
import { ScanSearch } from "lucide-react";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { scrollToSection } from "@/components/dashboard/dashboard-nav";
import { KpiTiles } from "@/components/dashboard/kpi-tiles";
import { VerificationDrawer } from "@/components/dashboard/verification-drawer";
import { VerificationsTable } from "@/components/dashboard/verifications-table";
import { VerifyPanel } from "@/components/dashboard/verify-panel";
import {
  dailyActivity,
  kpis,
  mockUser,
  recentVerifications,
  type Verification,
} from "@/lib/mock-data";

export function DashboardOverview() {
  const [items, setItems] = useState<Verification[]>(recentVerifications);
  const [selected, setSelected] = useState<Verification | null>(null);
  const added = items.length - recentVerifications.length;

  // Transient UI resets when Next hides this route with <Activity>.
  useLayoutEffect(() => () => setSelected(null), []);

  const handleComplete = useCallback((record: Verification) => {
    setItems((prev) => [record, ...prev]);
  }, []);
  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <div className="space-y-6">
      <motion.header
        id="dash-overview"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-[13px] font-medium text-brand-teal">
            Welcome back, {mockUser.name.split(" ")[0]}
          </p>
          <h1 className="mt-1 font-display text-[1.85rem] leading-tight font-medium tracking-[-0.03em] text-ink">
            Image verification
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            Register originals, verify copies and review integrity history across your workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => scrollToSection("dash-verify")}
          className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-xl bg-ink px-4 text-[14px] font-semibold text-white shadow-[0_8px_24px_-10px_rgb(17_24_39/0.6)] transition-transform hover:-translate-y-0.5 sm:self-auto"
        >
          <ScanSearch className="size-4 text-brand-cyan" />
          Verify an image
        </button>
      </motion.header>

      <KpiTiles items={kpis} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section id="dash-verify" aria-label="Verify an image">
          <VerifyPanel onComplete={handleComplete} onOpen={setSelected} sequence={added} />
        </section>
        <section id="dash-activity" aria-label="Verification activity">
          <ActivityChart data={dailyActivity} />
        </section>
      </div>

      <section id="dash-registry" aria-label="Recent verifications">
        <VerificationsTable items={items} onSelect={setSelected} />
      </section>

      <VerificationDrawer item={selected} onClose={handleClose} />
    </div>
  );
}
