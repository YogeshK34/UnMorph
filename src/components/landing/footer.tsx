"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Logo } from "@/components/brand/logo";
import { useSectionNav } from "@/hooks/use-section-nav";
import { navLinks, site } from "@/lib/site";

const appLinks = [
  { href: "/sign-in", label: "Sign in" },
  { href: "/dashboard", label: "Dashboard" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const onSectionClick = useSectionNav();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const wordY = useTransform(scrollYProgress, [0, 1], ["45%", "0%"]);
  const wordOpacity = useTransform(scrollYProgress, [0.2, 1], [0, 1]);

  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-line/70 bg-white/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[14.5px] leading-relaxed text-muted">
            The image integrity layer. Prevent morphing, prove authenticity — on infrastructure no
            one can quietly rewrite.
          </p>
        </div>

        <nav aria-label="Footer — product">
          <p className="text-[12px] font-semibold tracking-[0.18em] text-ink uppercase">Product</p>
          <ul className="mt-4 space-y-2.5">
            {navLinks.map((link) => (
              <li key={link.id}>
                <Link
                  href={`/#${link.id}`}
                  onClick={(e) => onSectionClick(e, link.id)}
                  className="text-[14.5px] text-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer — app">
          <p className="text-[12px] font-semibold tracking-[0.18em] text-ink uppercase">App</p>
          <ul className="mt-4 space-y-2.5">
            {appLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[14.5px] text-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={site.repo}
                target="_blank"
                rel="noreferrer"
                className="text-[14.5px] text-muted transition-colors hover:text-ink"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-3 px-5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© 2026 UnMorph. All rights reserved.</p>
        <ul className="flex gap-5">
          {legalLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <motion.p
        aria-hidden
        style={{ y: wordY, opacity: wordOpacity }}
        className="pointer-events-none mt-6 text-center font-display text-[clamp(4.5rem,21vw,17rem)] leading-[0.78] font-extrabold tracking-[-0.04em] select-none"
      >
        <span className="bg-gradient-to-b from-brand-teal/25 via-brand-aqua/15 to-transparent bg-clip-text text-transparent">
          UnMorph
        </span>
      </motion.p>
    </footer>
  );
}
