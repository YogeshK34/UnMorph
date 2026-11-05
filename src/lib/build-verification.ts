import { MOCK_NOW, type HistoryEvent, type Verification } from "./mock-data";
import type { SceneVariant } from "./scenes";
import type { VerdictResult } from "./verification";

export type VerificationSubject = {
  fileName: string;
  sizeBytes: number;
  dimensions: string;
  scene: SceneVariant;
};

const DAY = 86_400_000;

/**
 * Turns a (mock) pipeline result into a dashboard record. Timestamps use the
 * mock clock so new rows sit naturally at the top of the "recent" list.
 */
export function buildVerification(
  subject: VerificationSubject,
  hash: string,
  result: VerdictResult,
  sequence: number,
): Verification {
  const registered = result.verdict !== "unregistered";
  const now = new Date(MOCK_NOW).toISOString();

  const history: HistoryEvent[] = registered
    ? [
        {
          type: "registered",
          label: "Original registered & anchored on Arkiv",
          at: new Date(MOCK_NOW - 3 * DAY).toISOString(),
        },
        result.verdict === "tampered"
          ? {
              type: "tamper-detected",
              label: `${result.alteredRegions} altered region${result.alteredRegions === 1 ? "" : "s"} detected`,
              at: now,
            }
          : { type: "verified", label: "Verified authentic", at: now },
      ]
    : [{ type: "lookup-miss", label: "No registry record matched this fingerprint", at: now }];

  return {
    id: `VRF-${20932 + sequence}`,
    fileName: subject.fileName,
    sizeBytes: subject.sizeBytes,
    dimensions: subject.dimensions,
    verdict: result.verdict,
    confidence: result.confidence,
    alteredRegions: result.alteredRegions,
    sha256: hash,
    perceptualHash: hash.slice(48, 64),
    arkivRecord: registered ? `ark_${hash.slice(8, 32)}` : null,
    storageRoot: registered ? `0x${hash}` : null,
    humanVerified: result.humanVerified,
    owner: registered ? `0x${hash.slice(24, 64)}` : null,
    source: "Web upload",
    scene: subject.scene,
    checkedAt: now,
    history,
  };
}
