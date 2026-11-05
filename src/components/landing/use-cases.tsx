"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { Camera, Gavel, IdCard, Newspaper, ShoppingBag } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import { Landscape } from "@/components/visuals/landscape";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { SceneVariant } from "@/lib/scenes";
import { cn } from "@/lib/utils";

type UseCase = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  scene: SceneVariant;
  tag: string;
  verdict: "authentic" | "tampered" | "unregistered";
};

const cases: UseCase[] = [
  {
    icon: Newspaper,
    title: "Newsrooms & fact-checkers",
    body: "Publish with provenance. Let readers confirm a photo is the exact frame your photographer captured.",
    scene: "harbor",
    tag: "Wire photo · Authentic",
    verdict: "authentic",
  },
  {
    icon: IdCard,
    title: "Identity & KYC",
    body: "Catch morphed ID portraits and face swaps before they slip into onboarding flows.",
    scene: "mist",
    tag: "ID portrait · Face region altered",
    verdict: "tampered",
  },
  {
    icon: Gavel,
    title: "Legal & insurance evidence",
    body: "Keep an auditable chain of integrity for claims, disputes and court submissions.",
    scene: "dawn",
    tag: "Claim #7731 · 3 regions altered",
    verdict: "tampered",
  },
  {
    icon: Camera,
    title: "Creators & brands",
    body: "Prove your originals and spot unauthorised edits of your work wherever it travels.",
    scene: "dusk",
    tag: "Portfolio · Registered original",
    verdict: "authentic",
  },
  {
    icon: ShoppingBag,
    title: "Marketplaces",
    body: "Check that listing photos are real, current and unaltered — before buyers ever see them.",
    scene: "glacier",
    tag: "Listing photo · No record found",
    verdict: "unregistered",
  },
];

const tagDot = {
  authentic: "bg-verdict-authentic",
  tampered: "bg-verdict-tampered",
  unregistered: "bg-verdict-unregistered",
} as const;

export function UseCases() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !isDesktop) return;
    const measure = () => {
      const last = track.lastElementChild as HTMLElement | null;
      if (!last) return;
      const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      setDistance(Math.max(0, last.offsetLeft + last.offsetWidth + pad - track.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [isDesktop]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section
      id="use-cases"
      ref={sectionRef}
      className="relative"
      style={isDesktop && distance ? { height: `calc(100vh + ${distance}px)` } : undefined}
    >
      <div className="py-24 sm:py-32 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:overflow-hidden lg:py-0">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
          <SectionHeading
            eyebrow="Use cases"
            title="Wherever an image is evidence."
            description="From breaking news to insurance claims, UnMorph gives teams a shared, verifiable answer to one question: is this the original?"
          />
        </div>

        <motion.div
          ref={trackRef}
          style={{ x: isDesktop ? x : 0 }}
          className="relative mt-12 flex snap-x snap-mandatory [scrollbar-width:none] gap-5 overflow-x-auto px-5 pb-4 sm:px-6 lg:snap-none lg:overflow-visible lg:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] [&::-webkit-scrollbar]:hidden"
        >
          {cases.map((item, i) => (
            <UseCaseCard key={item.title} item={item} index={i} />
          ))}
        </motion.div>

        <div className="mx-auto mt-8 hidden w-full max-w-6xl px-6 lg:block">
          <div className="h-px w-full bg-line">
            <motion.div
              style={{ scaleX: progress }}
              className="h-px origin-left bg-gradient-to-r from-brand-teal to-brand-cyan"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCaseCard({ item, index }: { item: UseCase; index: number }) {
  const Icon = item.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      className="group w-[82vw] shrink-0 snap-start overflow-hidden rounded-[28px] border border-white bg-white/80 shadow-glass backdrop-blur-xl transition-shadow duration-500 hover:shadow-float sm:w-[380px] lg:w-[400px]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <div className="size-full transition-transform duration-[1.2s] ease-(--ease-out-expo) group-hover:scale-[1.06]">
          <Landscape variant={item.scene} />
        </div>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11.5px] font-semibold text-ink shadow-glass backdrop-blur">
          <span className={cn("size-1.5 rounded-full", tagDot[item.verdict])} />
          {item.tag}
        </span>
      </div>
      <div className="p-6">
        <span className="grid size-10 place-items-center rounded-xl bg-ink text-brand-cyan">
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </span>
        <h3 className="mt-4 font-display text-[1.3rem] font-bold tracking-[-0.02em] text-ink">
          {item.title}
        </h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{item.body}</p>
      </div>
    </motion.article>
  );
}
