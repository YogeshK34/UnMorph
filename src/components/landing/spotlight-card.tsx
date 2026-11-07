import { cn } from "@/lib/utils";

/**
 * Flat bordered panel that lifts on hover — the neubrutalist replacement for the
 * old cursor-tracking glass spotlight card.
 */
export function SpotlightCard({
  className,
  children,
  tone = "light",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "group relative isolate border-[3px] border-nb-black p-6 transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 sm:p-7",
        tone === "light"
          ? "bg-nb-surface text-nb-black shadow-nb hover:shadow-nb-hover"
          : "bg-nb-black text-nb-bg shadow-[5px_5px_0_0_#FFFDF5] hover:shadow-[7px_7px_0_0_#FFFDF5]",
        className,
      )}
    >
      {children}
    </div>
  );
}
