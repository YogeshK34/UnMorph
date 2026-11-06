import { computePHash, similarityPercent } from "./phash";
import { uploadImageToSwarm } from "./swarm";
import {
  findExactImage,
  findSimilarImages,
  verifyOwnership,
  registerImage,
  createIncidentLog,
  type ArkivEntity,
} from "./arkiv";

/**
 * Result returned when processing a newly submitted image.
 */
export type NewImageResult =
  | {
      status: "REGISTERED_SUCCESS";
      entityKey: string;
      txHash: string;
      swarmRef: string;
      pHash: string;
    }
  | {
      status: "ALREADY_REGISTERED";
      owner: string;
      registeredAt: number;
    }
  | {
      status: "MORPHING_DETECTED";
      incidentKey: string;
      similarityPercent: number;
      legitimateOwner: string;
    };

/**
 * Result returned when verifying an existing image against the registry.
 */
export type ExistingImageResult =
  | {
      status: "VERIFIED";
      owner: string;
      swarmRef: string;
      registeredAt: number;
    }
  | {
      status: "NOT_REGISTERED";
    }
  | {
      status: "MORPHING_DETECTED";
      incidentKey: string;
      similarityPercent: number;
      legitimateOwner: string;
    };

/**
 * Reads a custom schema attribute off a query row. Without a `.from(schema)` selection, the SDK
 * returns every custom attribute wrapped as `{ type, value }` under `$attributes` — never as a
 * top-level field — so callers must unwrap it here rather than reading `entity.<name>` directly.
 */
function getAttributeValue(
  entity: ArkivEntity | null | undefined,
  name: string,
): string | undefined {
  const attributes = entity?.$attributes as Record<string, { value?: unknown }> | undefined;
  const value = attributes?.[name]?.value;
  return typeof value === "string" ? value : undefined;
}

/**
 * Extracts and parses JSON payload fields from an Arkiv entity safely.
 */
function parseEntityPayload(entity: ArkivEntity | null | undefined): {
  swarmRef: string;
  registeredAt: number;
} {
  const fallback = {
    swarmRef: "",
    registeredAt: Math.floor(Date.now() / 1000),
  };

  // The `payload` column is a `bytes` attribute, decoded by the SDK as a lowercase 0x hex string —
  // never a Uint8Array — so it must be hex-decoded back to UTF-8 before JSON.parse.
  const hexPayload = getAttributeValue(entity, "payload");
  if (!hexPayload) return fallback;

  try {
    const text = Buffer.from(hexPayload.replace(/^0x/, ""), "hex").toString("utf-8");
    const parsed = JSON.parse(text);
    return {
      swarmRef: parsed.swarmRef || fallback.swarmRef,
      registeredAt: parsed.registeredAt ?? fallback.registeredAt,
    };
  } catch {
    return fallback;
  }
}

/**
 * Extracts the owner address from an Arkiv entity.
 */
function getEntityOwner(entity: ArkivEntity | null | undefined): string {
  const owner = entity?.$owner;
  return typeof owner === "string" ? owner.toLowerCase() : "";
}

/**
 * Extracts the perceptual imageHash from an Arkiv entity.
 */
function getEntityHash(entity: ArkivEntity | null | undefined): string {
  return (getAttributeValue(entity, "imageHash") || "").toLowerCase().replace(/^0x/, "");
}

/**
 * Checks if two Ethereum addresses are equivalent (case-insensitive, normalized).
 */
function isSameAddress(addr1: string, addr2: string): boolean {
  if (!addr1 || !addr2) return false;
  const clean1 = addr1.trim().toLowerCase().replace(/^0x/, "");
  const clean2 = addr2.trim().toLowerCase().replace(/^0x/, "");
  return clean1 === clean2;
}

/**
 * 1. handleNewImage — executes the registration decision pipeline.
 *
 * Flow:
 * a. computePHash(imageBuffer) -> get fullHash + buckets
 * b. uploadImageToSwarm(imageBuffer, mimeType) -> get swarmRef
 * c. findExactImage(fullHash) -> exact match check:
 *    - If exact match found AND $owner matches ownerWallet -> ALREADY_REGISTERED
 *    - If exact match found AND $owner does NOT match -> createIncidentLog + MORPHING_DETECTED
 * d. If no exact match -> findSimilarImages(buckets) -> get candidates:
 *    - Filter candidates client-side using similarityPercent(candidate.imageHash, fullHash)
 *    - If any candidate has similarity >= 70% AND $owner !== ownerWallet -> createIncidentLog + MORPHING_DETECTED
 *    - If similarity >= 70% AND $owner === ownerWallet -> ALREADY_REGISTERED
 * e. If no similar found -> registerImage(...) -> REGISTERED_SUCCESS
 */
export async function handleNewImage(params: {
  imageBuffer: Buffer;
  mimeType: string;
  ownerWallet: string;
  ownerENS: string;
  lifetimeBlocks: bigint;
}): Promise<NewImageResult> {
  const { imageBuffer, mimeType, ownerWallet, ownerENS, lifetimeBlocks } = params;

  // a. Compute pHash and bucket sub-chunks
  const pHash = await computePHash(imageBuffer);
  const fullHash = pHash.fullHash;

  // b. Upload original unencrypted image to Swarm
  const swarmUpload = await uploadImageToSwarm(imageBuffer, mimeType);
  const swarmRef = swarmUpload.reference;

  // c. Check for exact match in Arkiv registry
  const exactMatch = await findExactImage(fullHash);

  if (exactMatch) {
    const legitimateOwner = getEntityOwner(exactMatch);
    const { registeredAt } = parseEntityPayload(exactMatch);

    if (isSameAddress(legitimateOwner, ownerWallet)) {
      return {
        status: "ALREADY_REGISTERED",
        owner: legitimateOwner,
        registeredAt,
      };
    } else {
      // Different owner claiming the exact same image -> morphing / tamper incident
      const incident = await createIncidentLog({
        targetImageHash: fullHash,
        claimerWallet: ownerWallet,
        legitimateOwner,
        similarityScore: 100,
      });

      return {
        status: "MORPHING_DETECTED",
        incidentKey: incident.entityKey,
        similarityPercent: 100,
        legitimateOwner,
      };
    }
  }

  // d. No exact match -> search for similar images via 16-bit bucket sub-chunks
  const candidates = await findSimilarImages({
    b0: pHash.b0,
    b1: pHash.b1,
    b2: pHash.b2,
    b3: pHash.b3,
  });

  // Evaluate Hamming distance similarity on candidate subset
  let highestSimilarCandidate: {
    entity: ArkivEntity;
    similarity: number;
  } | null = null;

  for (const candidate of candidates) {
    const candidateHash = getEntityHash(candidate);
    if (!candidateHash) continue;

    const similarity = similarityPercent(candidateHash, fullHash);
    if (similarity >= 70) {
      if (!highestSimilarCandidate || similarity > highestSimilarCandidate.similarity) {
        highestSimilarCandidate = { entity: candidate, similarity };
      }
    }
  }

  if (highestSimilarCandidate) {
    const legitimateOwner = getEntityOwner(highestSimilarCandidate.entity);
    const { registeredAt } = parseEntityPayload(highestSimilarCandidate.entity);

    if (isSameAddress(legitimateOwner, ownerWallet)) {
      // Same owner uploading a similar/recompressed version of their own image
      return {
        status: "ALREADY_REGISTERED",
        owner: legitimateOwner,
        registeredAt,
      };
    } else {
      // Morphing attempt detected by a third-party claimer
      const targetHash = getEntityHash(highestSimilarCandidate.entity) || fullHash;
      const incident = await createIncidentLog({
        targetImageHash: targetHash,
        claimerWallet: ownerWallet,
        legitimateOwner,
        similarityScore: highestSimilarCandidate.similarity,
      });

      return {
        status: "MORPHING_DETECTED",
        incidentKey: incident.entityKey,
        similarityPercent: highestSimilarCandidate.similarity,
        legitimateOwner,
      };
    }
  }

  // e. Genuinely new image -> register on Arkiv
  const registered = await registerImage({
    pHash,
    swarmRef,
    ownerENS: ownerENS || "none",
    lifetimeBlocks,
  });

  return {
    status: "REGISTERED_SUCCESS",
    entityKey: registered.entityKey,
    txHash: registered.txHash,
    swarmRef,
    pHash: fullHash,
  };
}

/**
 * 2. handleExistingImage — verifies an existing image without uploading to Swarm.
 *
 * Flow:
 * a. computePHash(imageBuffer) -> get fullHash
 * b. findExactImage(fullHash)
 *    - If not found -> findSimilarImages(buckets)
 *      - If similar found (>= 70%) -> check verifyOwnership(candidate.imageHash, claimerWallet)
 *        - Owned -> VERIFIED
 *        - Not owned -> createIncidentLog + MORPHING_DETECTED
 *      - If nothing found -> NOT_REGISTERED
 *    - If exact found -> verifyOwnership(fullHash, claimerWallet)
 *      - Owned -> VERIFIED
 *      - Not owned -> createIncidentLog + MORPHING_DETECTED
 */
export async function handleExistingImage(params: {
  imageBuffer: Buffer;
  claimerWallet: string;
}): Promise<ExistingImageResult> {
  const { imageBuffer, claimerWallet } = params;

  // a. Compute perceptual hash
  const pHash = await computePHash(imageBuffer);
  const fullHash = pHash.fullHash;

  // b. Exact match check
  const exactMatch = await findExactImage(fullHash);

  if (exactMatch) {
    const isOwned = await verifyOwnership(fullHash, claimerWallet);
    const legitimateOwner = getEntityOwner(exactMatch);
    const { swarmRef, registeredAt } = parseEntityPayload(exactMatch);

    if (isOwned) {
      return {
        status: "VERIFIED",
        owner: legitimateOwner || claimerWallet,
        swarmRef,
        registeredAt,
      };
    } else {
      // Unowned exact image claim -> incident log
      const incident = await createIncidentLog({
        targetImageHash: fullHash,
        claimerWallet,
        legitimateOwner,
        similarityScore: 100,
      });

      return {
        status: "MORPHING_DETECTED",
        incidentKey: incident.entityKey,
        similarityPercent: 100,
        legitimateOwner,
      };
    }
  }

  // If exact not found, query similar candidates via 16-bit bucket sub-chunks
  const candidates = await findSimilarImages({
    b0: pHash.b0,
    b1: pHash.b1,
    b2: pHash.b2,
    b3: pHash.b3,
  });

  let highestSimilarCandidate: {
    entity: ArkivEntity;
    similarity: number;
  } | null = null;

  for (const candidate of candidates) {
    const candidateHash = getEntityHash(candidate);
    if (!candidateHash) continue;

    const similarity = similarityPercent(candidateHash, fullHash);
    if (similarity >= 70) {
      if (!highestSimilarCandidate || similarity > highestSimilarCandidate.similarity) {
        highestSimilarCandidate = { entity: candidate, similarity };
      }
    }
  }

  if (highestSimilarCandidate) {
    const candidateHash = getEntityHash(highestSimilarCandidate.entity);
    const legitimateOwner = getEntityOwner(highestSimilarCandidate.entity);
    const { swarmRef, registeredAt } = parseEntityPayload(highestSimilarCandidate.entity);

    const isOwned = await verifyOwnership(candidateHash, claimerWallet);

    if (isOwned) {
      return {
        status: "VERIFIED",
        owner: legitimateOwner || claimerWallet,
        swarmRef,
        registeredAt,
      };
    } else {
      // Morphed variant claimed by non-owner -> incident log
      const incident = await createIncidentLog({
        targetImageHash: candidateHash,
        claimerWallet,
        legitimateOwner,
        similarityScore: highestSimilarCandidate.similarity,
      });

      return {
        status: "MORPHING_DETECTED",
        incidentKey: incident.entityKey,
        similarityPercent: highestSimilarCandidate.similarity,
        legitimateOwner,
      };
    }
  }

  // Not registered anywhere on Arkiv
  return {
    status: "NOT_REGISTERED",
  };
}
