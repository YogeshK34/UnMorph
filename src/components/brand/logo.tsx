import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

/** The UnMorph layered-shield mark (aspect ≈ 0.76). */
export function LogoMark({ size = 28, className, priority }: LogoMarkProps) {
  return (
    <Image
      src="/brand/logo-mark.png"
      alt=""
      aria-hidden
      width={Math.round(size * 0.764)}
      height={size}
      priority={priority}
      className={cn("shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

type LogoProps = {
  href?: string;
  size?: number;
  tone?: "dark" | "light";
  className?: string;
  priority?: boolean;
};

/** Mark + wordmark lock-up. */
export function Logo({ href = "/", size = 28, tone = "dark", className, priority }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="UnMorph home"
      className={cn("group inline-flex items-center gap-2.5 rounded-full", className)}
    >
      <LogoMark
        size={size}
        priority={priority}
        className="transition-transform duration-500 ease-(--ease-out-expo) group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]"
      />
      <span
        className={cn(
          "font-display text-[1.05rem] font-medium tracking-[-0.02em]",
          tone === "dark" ? "text-ink" : "text-white",
        )}
      >
        UnMorph
      </span>
    </Link>
  );
}
