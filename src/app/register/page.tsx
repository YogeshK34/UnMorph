import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RegisterPanel } from "@/components/dashboard/register-panel";
import { Topbar } from "@/components/dashboard/topbar";
import { Sidebar } from "@/components/dashboard/sidebar";

export const metadata: Metadata = {
  title: "Register Image Ownership",
  description: "Register original images on Arkiv Web3 database with Swarm unencrypted storage.",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <Sidebar />
      <div className="min-w-0">
        <Topbar />
        <main className="mx-auto max-w-[800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
          </div>
          <RegisterPanel />
        </main>
      </div>
    </div>
  );
}
