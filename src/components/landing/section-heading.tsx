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
      <Reveal y={12}>
        <p className={cn("flex", center && "justify-center")}>
          <span
            className={cn(
              "inline-block border-[3px] border-nb-black bg-nb-yellow px-3 py-1 font-heading text-[12px] font-bold tracking-[0.18em] uppercase text-nb-black",
              tone === "dark" && "shadow-[3px_3px_0_0_#FFFDF5]",
              tone === "light" && "shadow-nb-sm",
            )}
          >
            {eyebrow}
          </span>
        </p>
      </Reveal>
      <h2
        className={cn(
          "mt-6 font-display text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em] uppercase",
          tone === "light" ? "text-nb-black" : "text-nb-bg",
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
              tone === "light" ? "text-nb-muted" : "text-nb-bg/70",
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
