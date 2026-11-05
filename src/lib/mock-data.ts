/**
 * Internal mock data for the dashboard and 404 page.
 * Fully deterministic (seeded) so server and client renders always agree.
 */
import type { SceneVariant } from "./scenes";
import type { Verdict } from "./verification";

/** The fixed "now" every relative timestamp in the mock is measured against. */
export const MOCK_NOW = Date.parse("2026-11-05T18:30:00Z");

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededHex(seed: number, length: number) {
  const rand = mulberry32(seed);
  let out = "";
  for (let i = 0; i < length; i++) out += Math.floor(rand() * 16).toString(16);
  return out;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type HistoryEvent = {
  type: "registered" | "verified" | "tamper-detected" | "lookup-miss";
  label: string;
  at: string; // ISO
};

export type Verification = {
  id: string;
  fileName: string;
  sizeBytes: number;
  dimensions: string;
  verdict: Verdict;
  confidence: number;
  alteredRegions: number;
  sha256: string;
  perceptualHash: string;
  arkivRecord: string | null;
  storageRoot: string | null;
  humanVerified: boolean;
  owner: string | null;
  source: "Web upload" | "API" | "Extension";
  scene: SceneVariant;
  checkedAt: string; // ISO
  history: HistoryEvent[];
};

export type VerdictFilter = "all" | Verdict;

// ---------------------------------------------------------------------------
// Recent verifications
// ---------------------------------------------------------------------------
type Seed = Pick<
  Verification,
  | "fileName"
  | "sizeBytes"
  | "dimensions"
  | "verdict"
  | "confidence"
  | "alteredRegions"
  | "source"
  | "scene"
  | "humanVerified"
> & { minutesAgo: number };

const seeds: Seed[] = [
  {
    fileName: "summit-press-photo.jpg",
    sizeBytes: 4_812_330,
    dimensions: "4032 × 3024",
    verdict: "authentic",
    confidence: 99.4,
    alteredRegions: 0,
    source: "Web upload",
    scene: "glacier",
    humanVerified: true,
    minutesAgo: 4,
  },
  {
    fileName: "harbor-evidence-0442.png",
    sizeBytes: 2_190_004,
    dimensions: "2560 × 1440",
    verdict: "tampered",
    confidence: 96.8,
    alteredRegions: 2,
    source: "API",
    scene: "harbor",
    humanVerified: true,
    minutesAgo: 17,
  },
  {
    fileName: "id-scan-front.jpg",
    sizeBytes: 1_204_771,
    dimensions: "1800 × 1134",
    verdict: "authentic",
    confidence: 98.9,
    alteredRegions: 0,
    source: "API",
    scene: "mist",
    humanVerified: true,
    minutesAgo: 38,
  },
  {
    fileName: "campaign-hero-v3.webp",
    sizeBytes: 884_120,
    dimensions: "2400 × 1600",
    verdict: "unregistered",
    confidence: 81.2,
    alteredRegions: 0,
    source: "Extension",
    scene: "dusk",
    humanVerified: false,
    minutesAgo: 52,
  },
  {
    fileName: "field-report-aurora.jpg",
    sizeBytes: 6_022_918,
    dimensions: "6000 × 4000",
    verdict: "authentic",
    confidence: 99.7,
    alteredRegions: 0,
    source: "Web upload",
    scene: "aurora",
    humanVerified: true,
    minutesAgo: 95,
  },
  {
    fileName: "claim-7731-damage.jpg",
    sizeBytes: 3_301_442,
    dimensions: "4000 × 3000",
    verdict: "tampered",
    confidence: 91.5,
    alteredRegions: 3,
    source: "API",
    scene: "dawn",
    humanVerified: false,
    minutesAgo: 140,
  },
  {
    fileName: "portrait-session-12.jpg",
    sizeBytes: 5_480_225,
    dimensions: "5472 × 3648",
    verdict: "authentic",
    confidence: 99.1,
    alteredRegions: 0,
    source: "Web upload",
    scene: "dawn",
    humanVerified: true,
    minutesAgo: 210,
  },
  {
    fileName: "listing-photo-118.jpg",
    sizeBytes: 742_380,
    dimensions: "1600 × 1200",
    verdict: "unregistered",
    confidence: 76.4,
    alteredRegions: 0,
    source: "Extension",
    scene: "harbor",
    humanVerified: false,
    minutesAgo: 305,
  },
  {
    fileName: "newsroom-wire-5590.jpg",
    sizeBytes: 2_960_118,
    dimensions: "3000 × 2000",
    verdict: "authentic",
    confidence: 98.6,
    alteredRegions: 0,
    source: "API",
    scene: "glacier",
    humanVerified: true,
    minutesAgo: 412,
  },
  {
    fileName: "passport-renewal.png",
    sizeBytes: 1_655_090,
    dimensions: "2048 × 1365",
    verdict: "tampered",
    confidence: 88.9,
    alteredRegions: 1,
    source: "Web upload",
    scene: "mist",
    humanVerified: true,
    minutesAgo: 590,
  },
];

function isoMinutesAgo(minutes: number) {
  return new Date(MOCK_NOW - minutes * 60_000).toISOString();
}

function buildHistory(seed: Seed, index: number): HistoryEvent[] {
  const registeredDaysAgo = 3 + ((index * 7) % 40);
  const checked = isoMinutesAgo(seed.minutesAgo);

  if (seed.verdict === "unregistered") {
    return [
      { type: "lookup-miss", label: "No registry record matched this fingerprint", at: checked },
    ];
  }

  const events: HistoryEvent[] = [
    {
      type: "registered",
      label: "Original registered & anchored on Arkiv",
      at: isoMinutesAgo(registeredDaysAgo * 24 * 60),
    },
    {
      type: "verified",
      label: "Verified authentic by a third party",
      at: isoMinutesAgo(Math.round((registeredDaysAgo / 2) * 24 * 60)),
    },
  ];

  events.push(
    seed.verdict === "tampered"
      ? {
          type: "tamper-detected",
          label: `${seed.alteredRegions} altered region${seed.alteredRegions > 1 ? "s" : ""} detected`,
          at: checked,
        }
      : { type: "verified", label: "Verified authentic", at: checked },
  );
  return events;
}

export const recentVerifications: Verification[] = seeds.map((seed, i) => {
  const registered = seed.verdict !== "unregistered";
  return {
    id: `VRF-${(20931 - i * 37).toString()}`,
    fileName: seed.fileName,
    sizeBytes: seed.sizeBytes,
    dimensions: seed.dimensions,
    verdict: seed.verdict,
    confidence: seed.confidence,
    alteredRegions: seed.alteredRegions,
    sha256: seededHex(1000 + i, 64),
    perceptualHash: seededHex(2000 + i, 16),
    arkivRecord: registered ? `ark_${seededHex(3000 + i, 24)}` : null,
    storageRoot: registered ? `0x${seededHex(4000 + i, 64)}` : null,
    humanVerified: seed.humanVerified,
    owner: registered ? `0x${seededHex(5000 + i, 40)}` : null,
    source: seed.source,
    scene: seed.scene,
    checkedAt: isoMinutesAgo(seed.minutesAgo),
    history: buildHistory(seed, i),
  };
});

export function filterVerifications(
  items: Verification[],
  filter: VerdictFilter,
  query = "",
): Verification[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (filter !== "all" && item.verdict !== filter) return false;
    if (!q) return true;
    return (
      item.fileName.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.sha256.startsWith(q)
    );
  });
}

export function countByVerdict(items: Verification[]): Record<VerdictFilter, number> {
  const counts: Record<VerdictFilter, number> = {
    all: items.length,
    authentic: 0,
    tampered: 0,
    unregistered: 0,
  };
  for (const item of items) counts[item.verdict]++;
  return counts;
}

/** "4m ago", "2h ago", "3d ago" relative to MOCK_NOW (or a supplied now). */
export function timeAgo(iso: string, now = MOCK_NOW) {
  const diff = Math.max(0, now - Date.parse(iso));
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// KPI tiles (12-point trends, oldest → newest)
// ---------------------------------------------------------------------------
export type Kpi = {
  id: string;
  label: string;
  value: number;
  unit?: string;
  /** Pre-formatted display value when not a plain count. */
  display?: string;
  delta: { value: string; direction: "up" | "down"; good: boolean; period: string };
  trend: number[];
};

export const kpis: Kpi[] = [
  {
    id: "registered",
    label: "Images registered",
    value: 1284,
    delta: { value: "+12.4%", direction: "up", good: true, period: "vs last 30 days" },
    trend: [61, 68, 72, 70, 81, 88, 86, 94, 101, 108, 112, 121],
  },
  {
    id: "verifications",
    label: "Verifications",
    value: 8921,
    delta: { value: "+8.1%", direction: "up", good: true, period: "vs last 30 days" },
    trend: [540, 588, 610, 602, 655, 690, 702, 688, 731, 760, 772, 801],
  },
  {
    id: "tampered",
    label: "Tampering detected",
    value: 137,
    delta: { value: "−3.2%", direction: "down", good: true, period: "vs last 30 days" },
    trend: [14, 12, 15, 13, 11, 12, 10, 12, 11, 10, 9, 10],
  },
  {
    id: "latency",
    label: "Median verification time",
    value: 1.8,
    display: "1.8s",
    delta: { value: "−0.3s", direction: "down", good: true, period: "vs last 30 days" },
    trend: [2.4, 2.3, 2.3, 2.2, 2.2, 2.1, 2.0, 2.0, 1.9, 1.9, 1.8, 1.8],
  },
];

// ---------------------------------------------------------------------------
// Daily activity (last 14 days)
// ---------------------------------------------------------------------------
export type DailyActivity = {
  date: string; // ISO date
  authentic: number;
  unregistered: number;
  tampered: number;
};

export const dailyActivity: DailyActivity[] = Array.from({ length: 14 }, (_, i) => {
  const rand = mulberry32(9000 + i);
  const day = new Date(MOCK_NOW - (13 - i) * 86_400_000);
  const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
  const base = (weekend ? 190 : 270) + i * 6;
  return {
    date: day.toISOString().slice(0, 10),
    authentic: Math.round(base + rand() * 60),
    unregistered: Math.round(42 + rand() * 30),
    tampered: Math.round(6 + rand() * 9),
  };
});

// ---------------------------------------------------------------------------
// Workspace / user
// ---------------------------------------------------------------------------
export const mockUser = {
  name: "Alex Rivera",
  email: "alex@unmorph.app",
  initials: "AR",
  workspace: "Rivera Media",
  plan: "Private beta",
  quota: { used: 642, limit: 1000 },
} as const;

// ---------------------------------------------------------------------------
// 404 "integrity report"
// ---------------------------------------------------------------------------
export const notFoundReport = {
  registry: "Arkiv · mainnet mirror",
  lookup: "No record found",
  fingerprint: "—",
  status: "404 · Not found",
  suggestions: [
    { href: "/", label: "Home", hint: "Start from the overview" },
    { href: "/#how-it-works", label: "How it works", hint: "Register, anchor, verify" },
    { href: "/sign-in", label: "Sign in", hint: "Access your workspace" },
    { href: "/dashboard", label: "Dashboard", hint: "Verify an image now" },
  ],
} as const;
