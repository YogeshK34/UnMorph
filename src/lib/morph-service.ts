/**
 * Client for the standalone Python morph-check service (services/morph-check).
 *
 * UnMorph's own Arkiv + Swarm lookup already identifies which registered original a
 * candidate image should be compared against (see api/check/route.ts); this module just
 * hands that exact pair to the service and returns its forensic verdict. Never throws for
 * "service not configured" or "service unreachable" — callers should treat a `null` result
 * as "no morph analysis available" and keep using the existing pHash-based verdict.
 */

export type MorphVerdict =
  | "SAME_IMAGE"
  | "GLOBAL_EDIT"
  | "FACE_SWAPPED"
  | "FACE_EDITED"
  | "EDITED_OUTSIDE_FACE"
  | "UNALIGNABLE";

export interface MorphCompareResult {
  verdict: MorphVerdict;
  /** Geometrically-consistent ORB feature matches found between original and candidate. */
  inliers: number | null;
  /** Fraction (0-1) of the aligned, valid frame that changed. */
  changedRatio: number | null;
  /** Fraction (0-1) of the detected face box that changed, if a face was found. */
  faceChange: number | null;
  /** Fraction (0-1) of all changed pixels that fall inside the face box. */
  faceShare: number | null;
  /** ArcFace cosine similarity between original/candidate face embeddings (requires InsightFace). */
  identityCos: number | null;
  /** Base64 PNG: the original with a red heatmap over changed regions. */
  overlayPngBase64: string | null;
}

interface RawCompareResponse {
  verdict: MorphVerdict;
  inliers?: number | null;
  changed_ratio?: number | null;
  face_change?: number | null;
  face_share?: number | null;
  identity_cos?: number | null;
  overlay_png_base64?: string | null;
}

/** `Buffer.buffer` is typed `ArrayBufferLike` (could be a `SharedArrayBuffer`); `Blob` needs a real `ArrayBuffer`. */
function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function serviceUrl(): string | null {
  const url = process.env.MORPH_SERVICE_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

/**
 * Compares a candidate image against one known original via the morph-check service.
 *
 * Returns `null` when the service isn't configured (`MORPH_SERVICE_URL` unset), unreachable,
 * or errors — the caller is expected to degrade gracefully rather than fail the request.
 */
export async function compareWithOriginal(
  originalBuffer: Buffer,
  candidateBuffer: Buffer,
  options?: { includeOverlay?: boolean; timeoutMs?: number },
): Promise<MorphCompareResult | null> {
  const base = serviceUrl();
  if (!base) return null;

  try {
    const formData = new FormData();
    formData.append("original", new Blob([toArrayBuffer(originalBuffer)]), "original.jpg");
    formData.append("candidate", new Blob([toArrayBuffer(candidateBuffer)]), "candidate.jpg");
    formData.append("include_overlay", String(options?.includeOverlay ?? true));

    const response = await fetch(`${base}/compare`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(options?.timeoutMs ?? 20_000),
    });

    if (!response.ok) {
      console.error(`morph-check service returned HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as RawCompareResponse;
    return {
      verdict: data.verdict,
      inliers: data.inliers ?? null,
      changedRatio: data.changed_ratio ?? null,
      faceChange: data.face_change ?? null,
      faceShare: data.face_share ?? null,
      identityCos: data.identity_cos ?? null,
      overlayPngBase64: data.overlay_png_base64 ?? null,
    };
  } catch (err) {
    console.error("morph-check service request failed:", err);
    return null;
  }
}
