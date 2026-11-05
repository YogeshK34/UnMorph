/**
 * Mock verification engine.
 *
 * The SHA-256 fingerprint is real (Web Crypto, computed in the browser).
 * Everything after it — the Arkiv registry lookup, 0G tamper analysis and
 * World ID attestation — is simulated deterministically from that hash so the
 * same file always yields the same verdict. Swap these for real clients later.
 */
import type { SceneVariant } from "./scenes";

export type Verdict = "authentic" | "tampered" | "unregistered";

export type PipelineStepId = "fingerprint" | "registry" | "analysis" | "attestation";

export type PipelineStep = {
  id: PipelineStepId;
  label: string;
  detail: string;
  /** Simulated duration in ms. */
  duration: number;
};

export const pipelineSteps: PipelineStep[] = [
  {
    id: "fingerprint",
    label: "Computing fingerprint",
    detail: "SHA-256 + perceptual hash",
    duration: 700,
  },
  {
    id: "registry",
    label: "Querying Arkiv registry",
    detail: "Wallet-owned integrity records",
    duration: 850,
  },
  {
    id: "analysis",
    label: "Running tamper analysis",
    detail: "Morph, splice & generative-fill detectors on 0G",
    duration: 1100,
  },
  {
    id: "attestation",
    label: "Checking human attestation",
    detail: "World ID proof of personhood",
    duration: 650,
  },
];

export type VerdictResult = {
  verdict: Verdict;
  /** 0–100, one decimal. */
  confidence: number;
  alteredRegions: number;
  /** Normalised perceptual distance from the registered original (0 = identical). */
  fingerprintDistance: number;
  humanVerified: boolean;
};

/** Hex-encoded SHA-256 of arbitrary bytes. */
export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function byteAt(hash: string, index: number) {
  return parseInt(hash.slice(index * 2, index * 2 + 2), 16) || 0;
}

/**
 * Deterministically maps a hash to a mock verdict.
 * ~60% authentic, ~20% tampered, ~20% unregistered.
 */
export function deriveVerdict(hash: string): VerdictResult {
  if (!/^[0-9a-f]{8,}$/i.test(hash)) {
    throw new Error("deriveVerdict expects a hex digest");
  }
  const bucket = byteAt(hash, 0) % 10;
  const jitter = byteAt(hash, 1) / 255; // 0..1

  if (bucket < 6) {
    return {
      verdict: "authentic",
      confidence: round1(97 + jitter * 2.9),
      alteredRegions: 0,
      fingerprintDistance: round2(jitter * 0.04),
      humanVerified: byteAt(hash, 2) % 4 !== 0,
    };
  }
  if (bucket < 8) {
    return {
      verdict: "tampered",
      confidence: round1(86 + jitter * 12),
      alteredRegions: 1 + (byteAt(hash, 2) % 4),
      fingerprintDistance: round2(0.18 + jitter * 0.3),
      humanVerified: byteAt(hash, 3) % 2 === 0,
    };
  }
  return {
    verdict: "unregistered",
    confidence: round1(70 + jitter * 20),
    alteredRegions: 0,
    fingerprintDistance: 1,
    humanVerified: false,
  };
}

const sceneOrder: SceneVariant[] = ["glacier", "dawn", "dusk", "harbor", "aurora", "mist"];

/** Picks a stable thumbnail scene for a hash. */
export function sceneForHash(hash: string): SceneVariant {
  return sceneOrder[byteAt(hash, 4) % sceneOrder.length];
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
