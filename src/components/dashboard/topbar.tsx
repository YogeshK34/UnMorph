"use client";

import Link from "next/link";
import { Bell, ChevronRight, LogOut } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { dashboardSections, scrollToSection } from "@/components/dashboard/dashboard-nav";
import { mockUser } from "@/lib/mock-data";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="UnMorph home" className="lg:hidden">
          <LogoMark size={26} />
        </Link>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13.5px]">
          <span className="hidden text-muted sm:inline">{mockUser.workspace}</span>
          <ChevronRight className="hidden size-3.5 text-muted/60 sm:inline" />
          <span className="font-semibold text-ink">Image verification</span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-900 ring-1 ring-amber-600/20 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Demo data
          </span>
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-xl text-muted ring-1 ring-line transition-colors hover:bg-white hover:text-ink"
          >
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-verdict-tampered ring-2 ring-canvas" />
          </button>
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-cyan to-brand-teal text-[12px] font-bold text-white">
            {mockUser.initials}
          </span>
          <Link
            href="/"
            aria-label="Sign out"
            className="grid size-9 place-items-center rounded-xl text-muted ring-1 ring-line transition-colors hover:bg-white hover:text-ink lg:hidden"
          >
            <LogOut className="size-4" />
          </Link>
        </div>
      </div>

      {/* mobile section chips */}
      <nav
        aria-label="Dashboard sections"
        className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden"
      >
        {dashboardSections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollToSection(id)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink/80 ring-1 ring-line"
          >
            <Icon className="size-3.5 text-brand-teal" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
