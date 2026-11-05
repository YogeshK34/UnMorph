import type { Metadata } from "next";
import { DashboardOverview } from "@/components/dashboard/overview";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Verify images, review integrity history and monitor tampering across your workspace.",
  robots: { index: false },
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
