import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandPanel } from "@/components/auth/brand-panel";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to UnMorph to register, protect and verify images.",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <div className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <div
          aria-hidden
          className="absolute inset-0 -z-0 bg-grid mask-radial opacity-60 lg:hidden"
        />
        <div className="relative flex items-center justify-between">
          <Logo className="lg:invisible" />
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-white hover:text-ink"
          >
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Back to home
          </Link>
        </div>

        <main className="relative flex flex-1 items-center justify-center py-12">
          <SignInForm />
        </main>

        <p className="relative text-center text-[12.5px] text-muted">
          Protected by World ID · Records on Arkiv · Storage on 0G
        </p>
      </div>
    </div>
  );
}
