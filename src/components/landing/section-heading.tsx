import { Reveal, RevealWords } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className,
}: SectionHeadingProps) {
  const center = align === "center";
  return (
    <div className={cn(center && "mx-auto text-center", "max-w-3xl", className)}>
      <Reveal blur={false} y={12}>
        <p
          className={cn(
            "flex items-center gap-3 text-[12px] font-semibold tracking-[0.22em] uppercase",
            center && "justify-center",
            tone === "light" ? "text-brand-teal" : "text-brand-cyan",
          )}
        >
          <span
            className={cn("h-px w-8", tone === "light" ? "bg-brand-teal/60" : "bg-brand-cyan/60")}
          />
          {eyebrow}
        </p>
      </Reveal>
      <h2
        className={cn(
          "mt-5 font-display text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.04] font-bold tracking-[-0.04em]",
          tone === "light" ? "text-ink" : "text-white",
        )}
      >
        <RevealWords text={title} />
      </h2>
      {description && (
        <Reveal delay={0.15}>
          <p
            className={cn(
              "mt-5 text-[1.0625rem] leading-relaxed text-pretty",
              center && "mx-auto max-w-2xl",
              tone === "light" ? "text-muted" : "text-white/60",
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
