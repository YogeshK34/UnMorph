"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  comingSoon,
  dashboardSections,
  scrollToSection,
} from "@/components/dashboard/dashboard-nav";
import { useActiveSection } from "@/hooks/use-active-section";
import { mockUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const IDS = dashboardSections.map((s) => s.id);

export function Sidebar() {
  const active = useActiveSection(IDS, "dash-overview", "-12% 0px -78% 0px");
  const pct = Math.round((mockUser.quota.used / mockUser.quota.limit) * 100);

  return (
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-line/70 bg-white/70 px-4 py-5 backdrop-blur-xl lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-canvas px-3 py-2.5 ring-1 ring-line/70">
        <span className="grid size-8 place-items-center rounded-lg bg-ink font-display text-[12px] font-medium text-brand-cyan">
          RM
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[13px] font-semibold text-ink">
            {mockUser.workspace}
          </span>
          <span className="block text-[11.5px] text-muted">{mockUser.plan}</span>
        </span>
      </div>

      <nav aria-label="Dashboard" className="mt-6">
        <p className="px-3 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
          Workspace
        </p>
        <ul className="mt-2 space-y-0.5">
          {dashboardSections.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(id);
                  }}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors",
                    isActive ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-canvas ring-1 ring-line/80"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon className={cn("relative size-4", isActive && "text-brand-teal")} />
                  <span className="relative">{label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 px-3 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
          Coming soon
        </p>
        <ul className="mt-2 space-y-0.5">
          {comingSoon.map(({ label, icon: Icon }) => (
            <li key={label}>
              <span
                aria-disabled
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium text-muted/60"
              >
                <Icon className="size-4" />
                {label}
                <span className="ml-auto rounded-full bg-canvas px-1.5 py-px text-[10px] font-semibold text-muted ring-1 ring-line/70">
                  Soon
                </span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-2xl bg-ink p-4 text-white">
          <p className="text-[12px] text-white/60">Monthly verifications</p>
          <p className="mt-1 text-[15px] font-semibold">
            {mockUser.quota.used}{" "}
            <span className="font-normal text-white/50">
              / {mockUser.quota.limit.toLocaleString("en-US")}
            </span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-cyan/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-aqua to-brand-cyan"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-cyan to-brand-teal text-[12px] font-medium text-white">
            {mockUser.initials}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-semibold text-ink">
              {mockUser.name}
            </span>
            <span className="block truncate text-[11.5px] text-muted">{mockUser.email}</span>
          </span>
          <Link
            href="/"
            aria-label="Sign out"
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <LogOut className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
