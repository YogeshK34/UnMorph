# Neo-Brutalism Design System — Complete Next.js Blueprint

This document specifies the exact architecture, tokens, CSS rules, component overrides, and layout patterns needed to replicate this Neo-Brutalist design system into any Next.js project.

---

## 1. Core Visual Philosophy & The 7 Golden Rules

1. **Zero Border Radius Everywhere**
   No rounded corners under any circumstances (`border-radius: 0 !important`). Every button, card, modal, input, and badge is sharp-edged.
2. **Hard Black 2px Borders**
   Every structural element has `border: 2px solid #0A0A0A` (or light border in dark mode). No subtle 1px gray borders.
3. **Hard Offset Drop Shadows (No Blur, No Spread)**
   The signature neo-brutalist shadow is `4px 4px 0px #0A0A0A` (or `8px 8px 0px #0A0A0A` for modals). Never use blurred shadows (`box-shadow: 0 4px 6px rgba(...)`).
4. **Tactile Physics on Interactive Elements**
   - **Resting**: `shadow-[4px_4px_0px_#0A0A0A]`
   - **Hover**: Lift up `translate-x-[-2px] translate-y-[-2px]` and increase shadow to `shadow-[6px_6px_0px_#0A0A0A]`
   - **Active (Pressed)**: Press down `translate-x-[2px] translate-y-[2px]` and eliminate shadow `shadow-none`
   - **Timing**: `100ms ease` / `transition-all`
5. **No Gradients & Flat High-Contrast Fills**
   Surfaces are flat solid colors. Background is a distinct warm off-white (`#F5F5F0`), never pure white `#ffffff`.
6. **Strict Color Palette with Punchy Accents**
   Yellow (`#FFDD00`) is the primary signature pop color, used sparingly for active states, primary highlights, and badges. Green (`#00C853`) and Red (`#FF2D2D`) are strictly functional (success/danger).
7. **High-Contrast Bold & Monospace Typography**
   Headings are ultra-heavy (`font-weight: 800` / `900`) with negative letter spacing (`-0.03em` to `-0.04em`). All technical strings (hashes, IDs, tokens, codes) are rendered in monospace blocks with dark terminal styling (`#0A0A0A` bg with `#00C853` green text).

---

## 2. Dependencies & Package Setup

In your target Next.js project, install the following packages:

```bash
pnpm add class-variance-authority cn lucide-react sonner @base-ui/react
# Or if using standard Radix shadcn primitives:
# pnpm add @radix-ui/react-slot @radix-ui/react-label
```

Ensure Tailwind CSS v4 (or Tailwind v3) and animations are installed:

```bash
pnpm add -D tailwindcss @tailwindcss/turbopack
```

---

## 3. Design Tokens & Global CSS

### `lib/design-tokens.ts`

```ts
export const DESIGN_TOKENS = {
  colors: {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    primary: 'var(--primary)',
    primaryForeground: 'var(--primary-foreground)',
    accent: 'var(--accent)',
    accentForeground: 'var(--accent-foreground)',
    destructive: 'var(--destructive)',
    muted: 'var(--muted)',
    border: 'var(--border)',
    success: 'var(--success)',
  },
  typography: {
    fontSans: 'var(--font-sans)',
    fontMono: 'var(--font-mono)',
  }
};
```

### `app/neo-brutal.css`

Create this dedicated override file and import it in `app/layout.tsx` **after** `globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

:root {
  --background: #F5F5F0;        /* Warm off-white canvas */
  --foreground: #0A0A0A;        /* Near pitch-black */
  --primary: #0A0A0A;           /* Black primary buttons & headers */
  --primary-foreground: #F5F5F0;
  --accent: #FFDD00;            /* Electric yellow — signature accent */
  --accent-foreground: #0A0A0A;
  --destructive: #FF2D2D;       /* Pure red for errors and deletes */
  --muted: #E8E8E3;             /* Bone stone for muted sections */
  --border: #0A0A0A;            /* 2px black borders */
  --success: #00C853;           /* High-contrast terminal green */
  
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

.dark {
  --background: #0A0A0A;
  --foreground: #F5F5F0;
  --primary: #0A0A0A;
  --primary-foreground: #F5F5F0;
  --accent: #FFDD00;
  --accent-foreground: #0A0A0A;
  --destructive: #FF2D2D;
  --muted: #E8E8E3;
  --border: #F5F5F0;
  --success: #00C853;
}

body {
  font-family: var(--font-sans);
  font-weight: 400;
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 800;
  letter-spacing: -0.03em;
}

/* Global Brutalist Radius Kill Switch */
* {
  border-radius: 0 !important;
}

/* Force override any shadcn or Tailwind rounded utility classes */
.rounded, .rounded-sm, .rounded-md, .rounded-lg, .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-full {
  border-radius: 0 !important;
}
```

### `app/globals.css` (Tailwind v4 Setup)

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --color-border: var(--border);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-muted: var(--muted);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### `lib/utils.ts`

```ts
export { cn } from "cn";
// Or standard:
// import { clsx, type ClassValue } from "clsx"
// import { twMerge } from "tailwind-merge"
// export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
```

---

## 4. Neo-Brutalist Component Suite

### 1. Button (`components/ui/button.tsx`)

Featuring tactile 3D offset physics on hover and active states:

```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border-2 border-black font-bold transition-all whitespace-nowrap outline-none select-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 rounded-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[4px_4px_0px_#0A0A0A] dark:shadow-[4px_4px_0px_#F5F5F0] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0A0A0A] dark:hover:shadow-[6px_6px_0px_#F5F5F0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        destructive:
          "bg-destructive text-primary-foreground shadow-[4px_4px_0px_#0A0A0A] dark:shadow-[4px_4px_0px_#F5F5F0] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0A0A0A] dark:hover:shadow-[6px_6px_0px_#F5F5F0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        outline:
          "bg-transparent hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#0A0A0A] dark:hover:shadow-[4px_4px_0px_#F5F5F0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        secondary:
          "bg-accent text-accent-foreground shadow-[4px_4px_0px_#0A0A0A] dark:shadow-[4px_4px_0px_#F5F5F0] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0A0A0A] dark:hover:shadow-[6px_6px_0px_#F5F5F0] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        ghost:
          "border-transparent hover:bg-muted dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-8 gap-1.5 px-3",
        xs: "h-6 gap-1 px-2.5 text-xs",
        sm: "h-7 gap-1 px-3",
        lg: "h-9 gap-1.5 px-4",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
export { buttonVariants }
```

### 2. Card (`components/ui/card.tsx`)

Featuring 2px borders, 4px offset shadow, and a separated header:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-5 overflow-hidden rounded-none border-2 border-black bg-background py-5 text-sm text-foreground shadow-[4px_4px_0px_#0A0A0A] dark:shadow-[4px_4px_0px_#F5F5F0]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("grid auto-rows-min items-start gap-1.5 border-b-2 border-black px-5 pb-4", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-[1.1rem] font-[800] tracking-[-0.02em]", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-5", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-5", className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
```

### 3. Input & Textarea (`components/ui/input.tsx` & `components/ui/textarea.tsx`)

Features sharp borders, white background, and an offset shadow appearing on focus (instead of modern blurred glow rings):

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-none border-2 border-black bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black focus-visible:shadow-[4px_4px_0px_#0A0A0A] dark:focus-visible:shadow-[4px_4px_0px_#F5F5F0] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[60px] w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black focus-visible:shadow-[4px_4px_0px_#0A0A0A] dark:focus-visible:shadow-[4px_4px_0px_#F5F5F0] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
```

### 4. Badge (`components/ui/badge.tsx`)

Compact, bold, uppercase tracking with hard 2px black border:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-none border-2 border-black px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-[#0A0A0A] text-[#F5F5F0] dark:bg-[#F5F5F0] dark:text-[#0A0A0A]",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-[#FF2D2D] text-[#F5F5F0]",
        outline: "text-foreground bg-transparent",
        success: "bg-[#00C853] text-[#0A0A0A]",
        accent: "bg-[#FFDD00] text-[#0A0A0A]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
```

### 5. Alert (`components/ui/alert.tsx`)

With heavy 6px colored indicator left border:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-none border-2 border-black p-4 shadow-[4px_4px_0px_#0A0A0A] dark:shadow-[4px_4px_0px_#F5F5F0] bg-background text-foreground",
  {
    variants: {
      variant: {
        default: "border-l-[6px] border-l-black dark:border-l-white",
        destructive: "border-l-[6px] border-l-[#FF2D2D] [&>svg]:text-[#FF2D2D]",
        success: "border-l-[6px] border-l-[#00C853] [&>svg]:text-[#00C853]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-bold tracking-tight mb-1", className)} {...props} />
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />
}
```

### 6. Table (`components/ui/table.tsx`)

High-contrast solid pitch-black header row, crisp border separators:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto border-2 border-black">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn("[&_tr]:border-b-2 [&_tr]:border-black bg-[#0A0A0A] text-[#F5F5F0] font-bold dark:bg-[#F5F5F0] dark:text-[#0A0A0A]", className)}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b border-black transition-colors hover:bg-[#FFDD00]/20", className)}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th className={cn("h-10 px-3 text-left align-middle font-bold uppercase text-xs tracking-wider", className)} {...props} />
  )
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td className={cn("p-3 align-middle text-sm", className)} {...props} />
  )
}
```

---

## 5. Global Layout & Signature Micro-Patterns

### Navigation Bar (`components/nav-bar.tsx`)

Fixed height 56px, heavy bottom border, with solid yellow square active indicator:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavBar() {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "DASHBOARD" },
    { href: "/credentials", label: "CREDENTIALS" },
    { href: "/verify", label: "VERIFIER" },
  ]

  return (
    <nav className="flex items-center justify-between px-6 h-[56px] border-b-2 border-black bg-[#F5F5F0]">
      <div className="font-[900] text-[1.1rem] tracking-[-0.03em] uppercase">
        YOUR APP LOGO
      </div>
      <div className="flex items-center gap-4 text-sm font-bold">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive
                  ? "bg-[#FFDD00] px-3 py-1 border-2 border-black"
                  : "hover:underline"
              }
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### Standard Page Header Pattern

Every single page follows this typographic hierarchy:

```tsx
<div>
  <h1 className="text-3xl font-[900] tracking-[-0.04em] uppercase">
    PAGE TITLE IN ALL CAPS
  </h1>
  <p className="font-mono text-sm text-muted-foreground mt-2">
    descriptive subtitle in monospace · metadata note
  </p>
  <hr className="border-t-2 border-black mt-4 mb-8" />
</div>
```

### Signature Terminal Dark Code Blocks

Used for raw JSON, tokens, hashes, JWTs, and keys:

```tsx
<pre className="border-2 border-black bg-[#0A0A0A] text-[#00C853] p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all shadow-[4px_4px_0px_#0A0A0A]">
  {JSON.stringify(payload, null, 2)}
</pre>
```

### Monospace Identifier Blocks (e.g., Keys, User IDs)

```tsx
<div>
  <p className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider">
    Account Identifier
  </p>
  <pre className="border-2 border-black bg-white dark:bg-black p-4 font-mono text-sm break-all whitespace-pre-wrap">
    {idString}
  </pre>
</div>
```

### Card Status Accent Borders

Cards representing state (e.g., active, danger, legacy vs new) use 6px colored left borders:

```tsx
{/* Success / Valid Card */}
<Card className="border-l-[6px] border-l-[#00C853]">
  ...
</Card>

{/* Destructive / Danger Card */}
<Card className="border-l-[6px] border-l-[#FF2D2D]">
  ...
</Card>
```

---

## 6. How to Apply to a Fresh Next.js Project

1. Copy `lib/design-tokens.ts` and `app/neo-brutal.css` into your project.
2. In `app/layout.tsx`:
   - Import `./globals.css`
   - Import `./neo-brutal.css` right beneath it
   - Add `<body className="min-h-screen flex flex-col bg-background text-foreground">`
3. Replace or update existing `components/ui/*` with the neo-brutalist versions provided above.
4. Wrap page content in `max-w-5xl mx-auto px-6 py-8`.
5. Use the standard header block (`font-[900] tracking-[-0.04em]` + `border-t-2 border-black`).
