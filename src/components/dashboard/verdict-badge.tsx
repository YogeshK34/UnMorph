import { ShieldCheck, ShieldQuestionMark, ShieldX } from "lucide-react";
import type { Verdict } from "@/lib/verification";
import { cn } from "@/lib/utils";

export const verdictMeta: Record<
  Verdict,
  {
    label: string;
    description: string;
    icon: typeof ShieldCheck;
    /** chart / dot fill */
    fill: string;
    hex: string;
    badge: string;
    soft: string;
  }
> = {
  authentic: {
    label: "Authentic",
    description: "Matches a registered original",
    icon: ShieldCheck,
    fill: "bg-verdict-authentic",
    hex: "#0891B2",
    badge: "bg-cyan-50 text-cyan-900 ring-cyan-600/20",
    soft: "bg-cyan-50 text-cyan-700",
  },
  tampered: {
    label: "Tampered",
    description: "Altered after registration",
    icon: ShieldX,
    fill: "bg-verdict-tampered",
    hex: "#E11D48",
    badge: "bg-rose-50 text-rose-900 ring-rose-600/20",
    soft: "bg-rose-50 text-rose-600",
  },
  unregistered: {
    label: "Unregistered",
    description: "No registry record found",
    icon: ShieldQuestionMark,
    fill: "bg-verdict-unregistered",
    hex: "#F59E0B",
    badge: "bg-amber-50 text-amber-900 ring-amber-600/25",
    soft: "bg-amber-50 text-amber-600",
  },
};

/** Status is never colour-alone: icon + label + tint. */
export function VerdictBadge({
  verdict,
  size = "sm",
  className,
}: {
  verdict: Verdict;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = verdictMeta[verdict];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-3 py-1 text-[13px]",
        meta.badge,
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} />
      {meta.label}
    </span>
  );
}
