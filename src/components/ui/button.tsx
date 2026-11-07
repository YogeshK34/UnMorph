import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Neubrutalist button: 3px black border, hard offset shadow, lifts on hover and
 * presses on click. Reference: https://neubrutalism.com
 */
const buttonVariants = cva(
  "nb-press inline-flex shrink-0 items-center justify-center gap-2 border-[3px] border-nb-black font-heading font-bold uppercase tracking-wide whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-nb-yellow text-nb-black",
        primary: "bg-nb-black text-nb-bg",
        secondary: "bg-nb-surface text-nb-black",
        danger: "bg-nb-pink text-nb-black",
        success: "bg-nb-green text-nb-black",
        info: "bg-nb-blue text-nb-black",
        ghost: "border-transparent bg-transparent text-nb-black shadow-none hover:bg-nb-yellow",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        default: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
