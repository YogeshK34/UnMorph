"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Card with a soft cyan spotlight that follows the cursor. */
export function SpotlightCard({
  className,
  children,
  tone = "light",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        el.style.setProperty("--my", `${e.clientY - rect.top}px`);
      }}
      className={cn(
        "group relative isolate overflow-hidden rounded-[28px] border p-6 transition-[transform,box-shadow] duration-500 ease-(--ease-out-expo) hover:-translate-y-1 sm:p-7",
        tone === "light"
          ? "border-white bg-white/75 shadow-glass backdrop-blur-xl hover:shadow-float"
          : "border-white/10 bg-ink text-white shadow-float",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            tone === "light"
              ? "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgb(6 214 255 / 0.14), transparent 60%)"
              : "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgb(6 214 255 / 0.18), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}
