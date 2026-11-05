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
 * The floating "dynamic island" navigation.
 *
 * It boots as a tiny logo pill, springs open once hydrated, collapses into a
 * compact status pill (logo + scroll ring + current section) while you scroll
 * down, and re-expands on scroll-up, hover or focus. On small screens the pill
 * morphs into a full menu sheet.
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
        animate={
          size
            ? { width: size.width, height: size.height, borderRadius: mode === "menu" ? 28 : 26 }
            : undefined
        }
        transition={ISLAND_SPRING}
        style={{ width: size?.width ?? 52, height: size?.height ?? 52, borderRadius: 26 }}
        className={cn(
          "pointer-events-auto relative overflow-hidden text-white shadow-island ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-300",
          mode === "menu" ? "bg-ink" : "bg-ink/[0.92]",
        )}
      >
        {/* top sheen */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />

        <AnimatePresence initial={false}>
          {mode === "boot" && (
            <Measured key="boot" onSize={setSize}>
              <div className="grid size-[52px] place-items-center">
                <LogoMark size={24} priority />
              </div>
            </Measured>
          )}

          {mode === "expanded" && (
            <Measured key="expanded" onSize={setSize}>
              <div className="flex h-[52px] items-center gap-1 pr-1.5 pl-4">
                <IslandBrand />
                <span aria-hidden className="mx-2.5 h-5 w-px bg-white/12" />
                <DesktopLinks activeId={onLanding ? activeId : null} onLink={handleLink} />
                <SignInButton className="ml-2" />
              </div>
            </Measured>
          )}

          {mode === "compact" && (
            <Measured key="compact" onSize={setSize}>
              <div className="flex h-[52px] items-center gap-3 pr-1.5 pl-2">
                <ProgressRing progress={scrollYProgress} />
                <button
                  type="button"
                  onClick={() => setEngaged(true)}
                  className="relative flex h-10 items-center gap-2 overflow-hidden rounded-full pr-1 text-[13px] font-medium text-white/90"
                  aria-label={`Current section: ${label}. Expand navigation`}
                >
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-brand-cyan" />
                    <span className="relative inline-flex size-2 rounded-full bg-brand-cyan" />
                  </span>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={label}
                      initial={{ y: 14, opacity: 0, filter: "blur(4px)" }}
                      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                      exit={{ y: -14, opacity: 0, filter: "blur(4px)" }}
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
              <div className="flex h-[52px] items-center gap-2 pr-1.5 pl-4">
                <IslandBrand />
                <span className="w-3" />
                <SignInButton size="sm" />
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-expanded={false}
                  aria-label="Open menu"
                  className="grid size-10 place-items-center rounded-full bg-white/[0.08] text-white transition-colors hover:bg-white/15"
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
      initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.94, filter: "blur(6px)", transition: { duration: 0.18 } }}
      transition={{ duration: 0.38, ease: CONTENT_EASE, delay: 0.04 }}
    >
      {children}
    </motion.div>
  );
}

function IslandBrand() {
  return (
    <Link href="/" aria-label="UnMorph home" className="flex items-center gap-2 rounded-full">
      <LogoMark size={22} />
      <span className="font-display text-[15px] font-bold tracking-[-0.02em]">UnMorph</span>
    </Link>
  );
}

function SignInButton({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <Link
      href="/sign-in"
      className={cn(
        "group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-cyan font-semibold text-ink transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-[0_0_24px_-4px_rgb(6_214_255/0.8)]",
        size === "md" ? "h-10 px-4 text-[13px]" : "h-9 px-3.5 text-[12.5px]",
        className,
      )}
    >
      Sign in
      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
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
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <ul className="flex items-center" onPointerLeave={() => setHovered(null)}>
      {navLinks.map((link) => {
        const isActive = activeId === link.id;
        return (
          <li key={link.id} className="relative">
            <Link
              href={`/#${link.id}`}
              onClick={(e) => onLink(e, link.id)}
              onPointerEnter={() => setHovered(link.id)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "relative z-10 flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200",
                isActive ? "text-white" : "text-white/60 hover:text-white",
              )}
            >
              {link.label}
              {isActive && (
                <motion.span
                  layoutId="island-active-dot"
                  className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand-cyan"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
            </Link>
            {hovered === link.id && (
              <motion.span
                layoutId="island-hover"
                className="absolute inset-0 rounded-full bg-white/[0.08]"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
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
      <div className="flex h-[52px] items-center justify-between pr-1.5 pl-4">
        <IslandBrand />
        <button
          type="button"
          onClick={onClose}
          aria-expanded
          aria-label="Close menu"
          className="grid size-10 place-items-center rounded-full bg-white/[0.08] transition-colors hover:bg-white/15"
        >
          <X className="size-[18px]" />
        </button>
      </div>

      <ul className="px-2 pt-1">
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
                "flex items-center justify-between rounded-2xl px-3 py-3.5 text-[15px] font-medium transition-colors hover:bg-white/[0.06]",
                activeId === link.id ? "text-white" : "text-white/70",
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    activeId === link.id ? "bg-brand-cyan" : "bg-white/20",
                  )}
                />
                {link.label}
              </span>
              <ArrowUpRight className="size-4 text-white/40" />
            </Link>
          </motion.li>
        ))}
      </ul>

      <motion.div
        className="grid gap-2 p-2 pt-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: CONTENT_EASE, delay: 0.28 }}
      >
        <Link
          href="/sign-in"
          onClick={onClose}
          className="flex h-12 items-center justify-center gap-2 rounded-[20px] bg-brand-cyan text-[15px] font-semibold text-ink"
        >
          Sign in <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex h-12 items-center justify-center rounded-[20px] bg-white/[0.06] text-[15px] font-medium text-white/80"
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
        <defs>
          <linearGradient id="island-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06D6FF" />
            <stop offset="100%" stopColor="#00B3E6" />
          </linearGradient>
        </defs>
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="rgb(255 255 255 / 0.1)"
          strokeWidth="2"
        />
        <motion.circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="url(#island-ring)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ pathLength }}
        />
      </svg>
      <LogoMark size={20} />
    </Link>
  );
}
