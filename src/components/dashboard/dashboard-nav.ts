import {
  Boxes,
  ChartColumn,
  Database,
  ImageUp,
  KeyRound,
  LayoutDashboard,
  ScanSearch,
  Settings,
  ShieldAlert,
} from "lucide-react";

/** Dashboard sections (ids are prefixed — the landing page may still be in the DOM, hidden). */
export const dashboardSections = [
  { id: "dash-overview", label: "Overview", icon: LayoutDashboard },
  { id: "dash-register", label: "Register", icon: ImageUp },
  { id: "dash-verify", label: "Verify", icon: ScanSearch },
  { id: "dash-incidents", label: "Incidents", icon: ShieldAlert },
  { id: "dash-activity", label: "Activity", icon: ChartColumn },
  { id: "dash-registry", label: "Registry", icon: Database },
] as const;

export const comingSoon = [
  { label: "Evidence vault", icon: Boxes },
  { label: "API keys", icon: KeyRound },
  { label: "Settings", icon: Settings },
] as const;

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
