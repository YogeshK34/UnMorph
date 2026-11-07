import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 border-[2px] border-nb-black px-2.5 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.08em] whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-nb-black text-nb-bg",
        yellow: "bg-nb-yellow text-nb-black",
        green: "bg-nb-green text-nb-black",
        pink: "bg-nb-pink text-nb-black",
        orange: "bg-nb-orange text-nb-black",
        blue: "bg-nb-blue text-nb-black",
        lavender: "bg-nb-lavender text-nb-black",
        outline: "bg-nb-surface text-nb-black",
      },
      shadow: {
        none: "",
        sm: "shadow-nb-sm",
      },
    },
    defaultVariants: { variant: "default", shadow: "none" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, shadow, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, shadow }), className)} {...props} />;
}

export { badgeVariants };
