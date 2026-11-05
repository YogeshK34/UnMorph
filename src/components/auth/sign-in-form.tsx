"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail, ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "email" | "world-id";

/**
 * Demo sign-in. There is no authentication yet: any credentials — or none —
 * lead straight to the dashboard after a short, realistic pause.
 */
export function SignInForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  // Next keeps this route alive (hidden) after navigating away — reset it.
  useLayoutEffect(
    () => () => {
      setStatus("idle");
      setPassword("");
      setShowPassword(false);
    },
    [],
  );

  const go = (next: Status, delay: number) => {
    if (status !== "idle") return;
    setStatus(next);
    window.setTimeout(() => router.push("/dashboard"), delay);
  };

  const busy = status !== "idle";

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="font-display text-[2rem] font-bold tracking-[-0.035em] text-ink">
        Welcome back
      </h1>
      <p className="mt-2 text-[15px] text-muted">Sign in to verify and protect your images.</p>

      <button
        type="button"
        onClick={() => go("world-id", 1300)}
        disabled={busy}
        className="group relative mt-8 flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-ink text-[15px] font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-90"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-brand-teal via-brand-aqua to-brand-cyan opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <AnimatePresence mode="popLayout" initial={false}>
          {status === "world-id" ? (
            <motion.span
              key="verifying"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative flex items-center gap-2.5"
            >
              <LoaderCircle className="size-4.5 animate-spin" />
              Verifying you&apos;re human…
            </motion.span>
          ) : (
            <motion.span
              key="label"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative flex items-center gap-2.5"
            >
              <ScanFace className="size-4.5" />
              Continue with World ID
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <div className="my-7 flex items-center gap-4 text-[12px] font-medium tracking-wide text-muted uppercase">
        <span className="h-px flex-1 bg-line" />
        or with email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          go("email", 900);
        }}
        className="space-y-4"
      >
        <Field label="Email" htmlFor="email" icon={Mail}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-2xl border border-line bg-white pr-4 pl-11 text-[15px] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-muted/70 focus:border-brand-aqua focus:shadow-[0_0_0_4px_rgb(6_214_255/0.15)]"
          />
        </Field>

        <Field label="Password" htmlFor="password" icon={Lock}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-2xl border border-line bg-white pr-12 pl-11 text-[15px] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-muted/70 focus:border-brand-aqua focus:shadow-[0_0_0_4px_rgb(6_214_255/0.15)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-xl text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </Field>

        <div className="flex items-center justify-between pt-1 text-[13.5px]">
          <label className="flex cursor-pointer items-center gap-2 text-ink/80 select-none">
            <input type="checkbox" defaultChecked className="size-4 rounded accent-brand-teal" />
            Remember me
          </label>
          <span className="text-muted">Demo mode</span>
        </div>

        <button
          type="submit"
          disabled={busy}
          className={cn(
            "group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-cyan text-[15px] font-semibold text-ink shadow-[0_10px_30px_-12px_rgb(6_214_255/0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-aqua hover:text-white",
            busy && "pointer-events-none",
          )}
        >
          {status === "email" ? (
            <>
              <LoaderCircle className="size-4.5 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 rounded-2xl bg-brand-cyan/[0.08] px-4 py-3 text-[13px] leading-relaxed text-brand-teal ring-1 ring-brand-cyan/20">
        <strong className="font-semibold">Demo mode:</strong> no account needed — any credentials
        (or none) open the verification dashboard.
      </p>

      <p className="mt-8 text-center text-[14px] text-muted">
        New to UnMorph?{" "}
        <Link
          href="/#get-started"
          className="font-semibold text-ink underline-offset-4 hover:underline"
        >
          Request access
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13.5px] font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        {children}
      </div>
    </div>
  );
}
