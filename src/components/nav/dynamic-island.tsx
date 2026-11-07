"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useMotionValueEvent,
  useScroll,
  useSpring,
  type MotionValue,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { useActiveSection } from "@/hooks/use-active-section";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSectionNav } from "@/hooks/use-section-nav";
import { navLinks, sections } from "@/lib/site";
import { cn } from "@/lib/utils";

const ISLAND_SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.9 } as const;
const CONTENT_EASE = [0.16, 1, 0.3, 1] as const;
const SECTION_IDS = sections.map((s) => s.id);

type Mode = "boot" | "expanded" | "compact" | "mobile" | "menu";
type Size = { width: number; height: number };

const subscribeNoop = () => () => {};

/**
 * The primary navigation bar — a hard-edged black slab that resizes between
 * states. Boots as a logo block, springs open once hydrated, collapses to a
 * status block (scroll ring + current section) on scroll, and becomes a full
 * menu sheet on small screens.
 */
export function DynamicIsland({ pageLabel }: { pageLabel?: string }) {
  const pathname = usePathname();
  const onLanding = pathname === "/";
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const isDesktop = useMediaQuery("(min-width: 960px)");

  const [compact, setCompact] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [size, setSize] = useState<Size | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const { scrollY, scrollYProgress } = useScroll();
  const activeId = useActiveSection(SECTION_IDS, "overview");
  const onSectionClick = useSectionNav();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    if (y < 96) setCompact(false);
    else if (y > prev + 4) setCompact(true);
    else if (y < prev - 10) setCompact(false);
  });

  // Close transient UI when the route is hidden by <Activity> (Next cache components).
  useLayoutEffect(
    () => () => {
      setMenuOpen(false);
      setEngaged(false);
    },
    [],
  );

  // Dismiss the mobile sheet on Escape / outside press.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [menuOpen]);

  const mode: Mode = !mounted
    ? "boot"
    : isDesktop
      ? compact && !engaged
        ? "compact"
        : "expanded"
      : menuOpen
        ? "menu"
        : "mobile";

  const label = onLanding
    ? (sections.find((s) => s.id === activeId)?.label ?? "Overview")
    : (pageLabel ?? "UnMorph");

  const handleLink = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      onSectionClick(event, id);
      setMenuOpen(false);
    },
    [onSectionClick],
  );

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4">
      <motion.nav
        ref={navRef}
        aria-label="Primary"
        data-mode={mode}
        data-testid="dynamic-island"
        onPointerEnter={() => setEngaged(true)}
        onPointerLeave={() => setEngaged(false)}
        onFocus={() => setEngaged(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setEngaged(false);
        }}
        initial={false}
        animate={size ? { width: size.width, height: size.height } : undefined}
        transition={ISLAND_SPRING}
        style={{ width: size?.width ?? 56, height: size?.height ?? 56 }}
        className="pointer-events-auto relative overflow-hidden border-[3px] border-nb-black bg-nb-black text-nb-bg shadow-nb"
      >
        <AnimatePresence initial={false}>
          {mode === "boot" && (
            <Measured key="boot" onSize={setSize}>
              <div className="grid size-[50px] place-items-center">
                <LogoMark size={24} priority />
              </div>
            </Measured>
          )}

          {mode === "expanded" && (
            <Measured key="expanded" onSize={setSize}>
              <div className="flex h-[50px] items-center gap-1 pr-1.5 pl-4">
                <IslandBrand />
                <span aria-hidden className="mx-2.5 h-6 w-[2px] bg-nb-bg/30" />
                <DesktopLinks activeId={onLanding ? activeId : null} onLink={handleLink} />
                <SignInButton className="ml-2" />
              </div>
            </Measured>
          )}

          {mode === "compact" && (
            <Measured key="compact" onSize={setSize}>
              <div className="flex h-[50px] items-center gap-3 pr-1.5 pl-2">
                <ProgressRing progress={scrollYProgress} />
                <button
                  type="button"
                  onClick={() => setEngaged(true)}
                  className="relative flex h-10 items-center gap-2 overflow-hidden pr-1 font-heading text-[13px] font-bold uppercase tracking-wide text-nb-bg"
                  aria-label={`Current section: ${label}. Expand navigation`}
                >
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-pulse-ring bg-nb-yellow" />
                    <span className="relative inline-flex size-2.5 bg-nb-yellow" />
                  </span>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={label}
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -14, opacity: 0 }}
                      transition={{ duration: 0.35, ease: CONTENT_EASE }}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  </AnimatePresence>
                </button>
                <SignInButton size="sm" />
              </div>
            </Measured>
          )}

          {mode === "mobile" && (
            <Measured key="mobile" onSize={setSize}>
              <div className="flex h-[50px] items-center gap-2 pr-1.5 pl-4">
                <IslandBrand />
                <span className="w-3" />
                <SignInButton size="sm" />
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-expanded={false}
                  aria-label="Open menu"
                  className="grid size-10 place-items-center border-[2px] border-nb-bg text-nb-bg transition-colors hover:bg-nb-yellow hover:text-nb-black"
                >
                  <Menu className="size-[18px]" />
                </button>
              </div>
            </Measured>
          )}

          {mode === "menu" && (
            <Measured key="menu" onSize={setSize}>
              <MobileMenu
                activeId={onLanding ? activeId : null}
                onLink={handleLink}
                onClose={() => setMenuOpen(false)}
              />
            </Measured>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
}

/* -------------------------------------------------------------------------- */

function Measured({
  onSize,
  children,
}: {
  onSize: (size: Size) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isPresent = useIsPresent();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !isPresent) return;
    const report = () => onSize({ width: el.offsetWidth, height: el.offsetHeight });
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isPresent, onSize]);

  return (
    <motion.div
      ref={ref}
      className="absolute top-0 left-1/2 w-max"
      style={{ x: "-50%" }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ duration: 0.38, ease: CONTENT_EASE, delay: 0.04 }}
    >
      {children}
    </motion.div>
  );
}

function IslandBrand() {
  return (
    <Link href="/" aria-label="UnMorph home" className="flex items-center gap-2">
      <LogoMark size={22} />
      <span className="font-display text-[16px] font-extrabold uppercase tracking-tight">
        UnMorph
      </span>
    </Link>
  );
}

function SignInButton({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <Link
      href="/sign-in"
      className={cn(
        "group inline-flex shrink-0 items-center gap-1.5 border-[2px] border-nb-black bg-nb-yellow font-heading font-bold uppercase tracking-wide text-nb-black shadow-[3px_3px_0_0_#FFFDF5] transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#FFFDF5] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        size === "md" ? "h-10 px-4 text-[13px]" : "h-9 px-3.5 text-[12px]",
        className,
      )}
    >
      Sign in
      <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}

function DesktopLinks({
  activeId,
  onLink,
}: {
  activeId: string | null;
  onLink: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
}) {
  return (
    <ul className="flex items-center gap-1">
      {navLinks.map((link) => {
        const isActive = activeId === link.id;
        return (
          <li key={link.id}>
            <Link
              href={`/#${link.id}`}
              onClick={(e) => onLink(e, link.id)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "flex h-9 items-center border-[2px] px-3 font-heading text-[12px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors duration-150",
                isActive
                  ? "border-nb-black bg-nb-yellow text-nb-black"
                  : "border-transparent text-nb-bg/70 hover:border-nb-bg hover:text-nb-bg",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MobileMenu({
  activeId,
  onLink,
  onClose,
}: {
  activeId: string | null;
  onLink: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="w-[min(calc(100vw-24px),400px)]">
      <div className="flex h-[50px] items-center justify-between border-b-[2px] border-nb-bg/30 pr-1.5 pl-4">
        <IslandBrand />
        <button
          type="button"
          onClick={onClose}
          aria-expanded
          aria-label="Close menu"
          className="grid size-10 place-items-center border-[2px] border-nb-bg transition-colors hover:bg-nb-pink hover:text-nb-black"
        >
          <X className="size-[18px]" />
        </button>
      </div>

      <ul className="space-y-1.5 p-2 pt-3">
        {navLinks.map((link, i) => (
          <motion.li
            key={link.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: CONTENT_EASE, delay: 0.08 + i * 0.04 }}
          >
            <Link
              href={`/#${link.id}`}
              onClick={(e) => onLink(e, link.id)}
              className={cn(
                "flex items-center justify-between border-[2px] px-3 py-3 font-heading text-[14px] font-bold uppercase tracking-wide transition-colors",
                activeId === link.id
                  ? "border-nb-black bg-nb-yellow text-nb-black"
                  : "border-nb-bg/40 text-nb-bg hover:border-nb-bg hover:bg-nb-bg hover:text-nb-black",
              )}
            >
              {link.label}
              <ArrowUpRight className="size-4" />
            </Link>
          </motion.li>
        ))}
      </ul>

      <motion.div
        className="grid gap-2 p-2 pt-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: CONTENT_EASE, delay: 0.28 }}
      >
        <Link
          href="/sign-in"
          onClick={onClose}
          className="flex h-12 items-center justify-center gap-2 border-[2px] border-nb-black bg-nb-yellow font-heading text-[14px] font-bold uppercase tracking-wide text-nb-black"
        >
          Sign in <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex h-12 items-center justify-center border-[2px] border-nb-bg font-heading text-[14px] font-bold uppercase tracking-wide text-nb-bg transition-colors hover:bg-nb-bg hover:text-nb-black"
        >
          Open dashboard
        </Link>
      </motion.div>
    </div>
  );
}

function ProgressRing({ progress }: { progress: MotionValue<number> }) {
  const pathLength = useSpring(progress, { stiffness: 140, damping: 26 });
  return (
    <Link href="/" aria-label="UnMorph home" className="relative grid size-10 place-items-center">
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r="17" fill="none" stroke="#FFFDF5" strokeOpacity="0.25" strokeWidth="3" />
        <motion.circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="#FFD23F"
          strokeWidth="3"
          strokeLinecap="butt"
          style={{ pathLength }}
        />
      </svg>
      <LogoMark size={20} />
    </Link>
  );
}
