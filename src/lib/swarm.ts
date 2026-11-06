import { Bee, SWARM_GATEWAY_URL } from "@ethersphere/bee-js";

/**
 * Result returned from a Swarm upload.
 * Contains both the 64-character content reference and the postage batch ID used.
 */
export interface SwarmUploadResult {
  /** 64-character hexadecimal Swarm content reference (unencrypted) */
  reference: string;
  /** Postage stamp batch ID used for the upload */
  batchId: string;
  /** Custom string coercion returning the reference hex string */
  toString(): string;
}

/**
 * Resolves the Bee client instance pointing to the configured Swarm gateway.
 */
export function getBeeClient(gatewayUrl?: string): Bee {
  const url =
    gatewayUrl ||
    process.env.NEXT_PUBLIC_SWARM_GATEWAY ||
    process.env.SWARM_GATEWAY_URL ||
    SWARM_GATEWAY_URL ||
    "https://api.gateway.ethswarm.org";
  return new Bee(url);
}

/**
 * Retrieves the configured Postage Batch ID from environment variables or custom argument.
 *
 * NOTE: As required by the Swarm bonus track, NULL_STAMP is prohibited for live submissions.
 * A real, funded postage batch ID purchased on Gnosis Chain / testnet must be provided.
 */
export function getPostageBatchId(customBatchId?: string): string {
  const batchId =
    customBatchId || process.env.SWARM_BATCH_ID || process.env.NEXT_PUBLIC_SWARM_BATCH_ID;

  if (!batchId) {
    throw new Error(
      "SWARM_BATCH_ID is not configured in environment variables. A real postage batch ID is required (NULL_STAMP is prohibited for live submissions).",
    );
  }

  return batchId.trim().toLowerCase().replace(/^0x/, "");
}

/**
 * Resolves the public gateway URL for accessing or embedding a Swarm asset.
 */
export function getSwarmGatewayUrl(swarmRef?: string): string {
  const gateway =
    process.env.NEXT_PUBLIC_SWARM_GATEWAY ||
    process.env.SWARM_GATEWAY_URL ||
    SWARM_GATEWAY_URL ||
    "https://api.gateway.ethswarm.org";
  const baseUrl = gateway.replace(/\/+$/, "");
  return swarmRef ? `${baseUrl}/bytes/${swarmRef.replace(/^0x/, "")}` : baseUrl;
}

/**
 * Uploads an image buffer to Swarm as an UNENCRYPTED blob and returns the reference
 * alongside the postage batch ID used.
 *
 * ARCHITECTURAL DECISION — UNENCRYPTED SWARM REFERENCES:
 * Images are public content by design (destined for social media and web discovery).
 * In UnMorph, ownership is proven cryptographically via Arkiv's native `$owner` protocol attribute
 * and perceptual hash uniqueness, not by obscuring or encrypting the file payload.
 * Encrypting Swarm references embeds decryption keys within the reference string; storing
 * encrypted references on a public blockchain database like Arkiv would risk key leakage or defeat public verifiability.
 * Therefore, unencrypted Swarm references are intentionally stored in Arkiv entities.
 *
 * @param imageBuffer Buffer containing the image file bytes
 * @param mimeType MIME type of the image (default: "image/png")
 * @param customBatchId Optional explicit postage batch ID (defaults to SWARM_BATCH_ID from env)
 * @returns SwarmUploadResult with { reference, batchId }
 */
export async function uploadImageToSwarm(
  imageBuffer: Buffer | Uint8Array,
  mimeType: string = "image/png",
  customBatchId?: string,
): Promise<SwarmUploadResult> {
  const bee = getBeeClient();
  const batchId = getPostageBatchId(customBatchId);
  const data = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer);

  // Upload unencrypted data via bee.data.upload (/bytes endpoint)
  const result = await bee.data.upload(batchId, data, {
    encrypt: false,
    contentType: mimeType,
  } as Parameters<typeof bee.data.upload>[2]);

  const reference = result.reference.toHex();

  return {
    reference,
    batchId,
    toString() {
      return reference;
    },
  };
}

/**
 * Downloads image bytes from Swarm given a 64-character Swarm reference.
 * Used for retrieving the original registered image for side-by-side morphing disputes.
 *
 * @param swarmRef 64-character hex Swarm reference
 * @returns Buffer containing the image bytes
 */
export async function getImageFromSwarm(swarmRef: string): Promise<Buffer> {
  if (!swarmRef || typeof swarmRef !== "string") {
    throw new TypeError("Valid Swarm reference string is required");
  }

  const bee = getBeeClient();
  const cleanRef = swarmRef.trim().toLowerCase().replace(/^0x/, "");

  try {
    const bytes = await bee.data.download(cleanRef);
    return Buffer.from(bytes.toUint8Array());
  } catch (dataErr) {
    // If not found in /bytes endpoint, attempt /bzz file download as fallback
    try {
      const fileData = await bee.file.download(cleanRef);
      return Buffer.from(fileData.data.toUint8Array());
    } catch {
      throw dataErr;
    }
  }
}
