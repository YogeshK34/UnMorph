import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto border-[3px] border-nb-black shadow-nb">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("bg-nb-black text-nb-bg", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("bg-nb-surface", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b-[2px] border-nb-black transition-colors last:border-b-0 hover:bg-nb-yellow",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em]",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
