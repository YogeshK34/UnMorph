import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "w-full border-[3px] border-nb-black p-4 text-nb-black shadow-nb [&>svg]:size-5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-nb-surface border-l-[10px]",
        info: "bg-nb-blue border-l-[10px]",
        success: "bg-nb-green border-l-[10px]",
        warning: "bg-nb-orange border-l-[10px]",
        danger: "bg-nb-pink border-l-[10px]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface AlertProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("font-heading text-sm font-bold uppercase tracking-wide", className)}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm", className)} {...props} />;
}

export { alertVariants };
