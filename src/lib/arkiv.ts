import {
  createPublicClient as createArkivPublicClient,
  createWalletClient as createArkivWalletClient,
  defineSchema,
  str,
  bytes,
  addr,
  ExpirationTime,
  isSchema,
} from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { and, eq, or, type Expression } from "@arkiv-network/sdk/query";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { PHashResult } from "./phash";

/**
 * Arkiv Entity row as returned by `query()` with no `.from(schema)` selection: system fields are
 * flat `$`-prefixed keys, and every custom schema attribute (imageHash, b0..b3, payload, ...) is
 * wrapped as `{ type, value }` under `$attributes` — never a top-level field.
 */
export interface ArkivEntity {
  $key?: string;
  $owner?: string;
  $creator?: string;
  $createdAt?: bigint | number;
  $updatedAt?: bigint | number;
  $expiresAt?: bigint | number;
  $attributes?: Record<string, { type: string; value: unknown }>;
  [key: string]: unknown;
}

/**
 * Parameters for registering a new image on Arkiv.
 */
export interface RegisterImageParams {
  pHash: PHashResult;
  swarmRef: string;
  ownerENS?: string;
  lifetimeBlocks: bigint;
}

/**
 * Parameters for logging a detected morphing attempt on Arkiv.
 */
export interface CreateIncidentLogParams {
  targetImageHash: string;
  claimerWallet: string;
  legitimateOwner: string;
  similarityScore: number;
}

/**
 * Schema 1: Image Registry
 * Indexed attributes: type, imageHash, b0, b1, b2, b3
 * $owner is auto-set by Arkiv protocol — NEVER added manually
 */
export const ImageRegistrySchema = defineSchema("image_registry", {
  type: str().indexed(),
  imageHash: str().indexed(),
  b0: str().indexed(),
  b1: str().indexed(),
  b2: str().indexed(),
  b3: str().indexed(),
  ownerENS: str(),
  payload: bytes(),
});

/**
 * Schema 2: Incident Log (Morphing Attempt)
 * Indexed attributes: type, targetImageHash, claimerWallet, legitimateOwner
 */
export const IncidentLogSchema = defineSchema("morphing_attempt", {
  type: str().indexed(),
  targetImageHash: str().indexed(),
  claimerWallet: str().indexed(),
  legitimateOwner: str().indexed(),
  payload: bytes(),
});

export interface ArkivPublicClientLike {
  query: (query: Expression | string) => Promise<unknown>;
  [key: string]: unknown;
}

export interface ArkivWalletClientLike {
  createEntity: (...args: unknown[]) => Promise<{ entityKey: string; txHash: string }>;
  [key: string]: unknown;
}

/**
 * Initializes the default Public Client for reading from Arkiv.
 */
export function createDefaultPublicClient(): ArkivPublicClientLike {
  const accessKey = process.env.ARKIV_ACCESS_KEY ?? process.env.NEXT_PUBLIC_ARKIV_ACCESS_KEY ?? "";
  return createArkivPublicClient({
    chain: rabdi({ accessKey }),
    transport: http(),
  }) as unknown as ArkivPublicClientLike;
}

/**
 * Initializes the default Wallet Client for writing to Arkiv.
 */
export function createDefaultWalletClient(): ArkivWalletClientLike {
  const accessKey = process.env.ARKIV_ACCESS_KEY ?? process.env.NEXT_PUBLIC_ARKIV_ACCESS_KEY ?? "";
  const rawKey = process.env.PRIVATE_KEY?.trim() || "";
  const isZeroKey = /^0x0+$/.test(rawKey);
  const isValidHexKey = /^0x[0-9a-fA-F]{64}$/.test(rawKey) && !isZeroKey;

  // Fallback to standard local key to prevent import-time exceptions when unset or placeholder
  const privateKey = (
    isValidHexKey ? rawKey : "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  ) as `0x${string}`;

  const account = privateKeyToAccount(privateKey);
  const baseClient = createArkivWalletClient({
    chain: rabdi({ accessKey }),
    transport: http(),
    account,
  });

  return {
    ...baseClient,
    createEntity: async (
      schemaOrData: unknown,
      values?: unknown,
      options?: unknown,
      txParams?: unknown,
    ) => {
      // Handle high-level entity object: { payload, contentType, attributes, lifetime }
      if (typeof schemaOrData === "object" && schemaOrData !== null && !isSchema(schemaOrData)) {
        const entityData = schemaOrData as {
          attributes?: { type?: string; [key: string]: unknown };
          lifetime?: bigint | number;
          payload?: string;
        };
        if (entityData.attributes) {
          const isRegistry = entityData.attributes.type === "image_registry";
          const schema = isRegistry ? ImageRegistrySchema : IncidentLogSchema;
          const blocks =
            typeof entityData.lifetime === "bigint"
              ? Number(entityData.lifetime)
              : Number(entityData.lifetime || 7_884_000);

          const payloadBytes = new TextEncoder().encode(entityData.payload || "{}");
          const schemaValues = {
            ...entityData.attributes,
            payload: payloadBytes,
          };

          const rawCreateEntity = baseClient.createEntity as (
            ...args: unknown[]
          ) => Promise<{ entityKey: string; txHash: string }>;

          return await rawCreateEntity(
            schema,
            schemaValues,
            { expiration: ExpirationTime.fromBlocks(Math.max(1, blocks)) },
            txParams,
          );
        }
      }
      const rawCreateEntity = baseClient.createEntity as (
        ...args: unknown[]
      ) => Promise<{ entityKey: string; txHash: string }>;
      return await rawCreateEntity(schemaOrData, values, options, txParams);
    },
  };
}

/**
 * Public Client used for all read/query operations.
 * Can be replaced via setPublicClient for testing or custom provider injection.
 */
export let publicClient: ArkivPublicClientLike = createDefaultPublicClient();

/**
 * Wallet Client used for all write/mutation operations.
 * Can be replaced via setWalletClient for testing or custom provider injection.
 */
export let walletClient: ArkivWalletClientLike = createDefaultWalletClient();

export function setPublicClient(client: ArkivPublicClientLike): void {
  publicClient = client;
}

export function setWalletClient(client: ArkivWalletClientLike): void {
  walletClient = client;
}

/**
 * Normalizes query results from Arkiv into a clean array of entities.
 */
function extractEntities(result: unknown): ArkivEntity[] {
  if (!result) return [];
  if (Array.isArray(result)) return result as ArkivEntity[];
  const r = result as { entities?: ArkivEntity[]; rows?: ArkivEntity[] };
  if (Array.isArray(r.entities)) return r.entities;
  if (Array.isArray(r.rows)) return r.rows;
  return [];
}

/**
 * 1. registerImage — registers a new image on Arkiv.
 *
 * Calls walletClient.createEntity with both entity schema fields:
 * - payload: JSON string { swarmRef, registeredAt }
 * - attributes: { type: "image_registry", imageHash, b0, b1, b2, b3, ownerENS }
 * - lifetime: passed as non-zero bigint
 * NOTE: $owner is auto-set by Arkiv protocol to msg.sender — never passed manually.
 */
export async function registerImage(
  params: RegisterImageParams,
): Promise<{ entityKey: string; txHash: string }> {
  if (!params.pHash || !params.pHash.fullHash) {
    throw new Error("pHash with fullHash is required for image registration");
  }
  if (!params.swarmRef) {
    throw new Error("swarmRef is required for image registration");
  }

  // Ensure non-zero lifetime (default to ~1 year in blocks if unset)
  const lifetime =
    params.lifetimeBlocks && params.lifetimeBlocks > 0n ? params.lifetimeBlocks : 7_884_000n;

  const entityData = {
    payload: JSON.stringify({
      swarmRef: params.swarmRef,
      registeredAt: Math.floor(Date.now() / 1000),
    }),
    contentType: "application/json",
    attributes: {
      type: "image_registry",
      imageHash: params.pHash.fullHash.toLowerCase().replace(/^0x/, ""),
      b0: params.pHash.b0.toLowerCase(),
      b1: params.pHash.b1.toLowerCase(),
      b2: params.pHash.b2.toLowerCase(),
      b3: params.pHash.b3.toLowerCase(),
      ownerENS: params.ownerENS || "none",
    },
    lifetime,
  };

  const result = await walletClient.createEntity(entityData);
  return {
    entityKey: result.entityKey,
    txHash: result.txHash,
  };
}

/**
 * 2. findExactImage — exact lookup checking if imageHash already exists.
 * Returns full entity object or null if not found. Never throws.
 */
export async function findExactImage(imageHash: string): Promise<ArkivEntity | null> {
  if (!imageHash || typeof imageHash !== "string") {
    return null;
  }

  const cleanHash = imageHash.toLowerCase().replace(/^0x/, "");
  const where = and(eq("type", "image_registry"), eq("imageHash", cleanHash));

  try {
    const result = await publicClient.query(where);
    const entities = extractEntities(result);
    return entities.length > 0 ? entities[0] : null;
  } catch (err) {
    console.error("findExactImage query failed:", err);
    return null;
  }
}

/**
 * 3. findSimilarImages — bucket lookup to find similar image candidates.
 * Returns raw candidates (does NOT filter by hamming distance here; filtered by the caller).
 */
export async function findSimilarImages(buckets: {
  b0: string;
  b1: string;
  b2: string;
  b3: string;
}): Promise<ArkivEntity[]> {
  if (!buckets || !buckets.b0 || !buckets.b1 || !buckets.b2 || !buckets.b3) {
    return [];
  }

  const b0 = buckets.b0.toLowerCase().replace(/^0x/, "");
  const b1 = buckets.b1.toLowerCase().replace(/^0x/, "");
  const b2 = buckets.b2.toLowerCase().replace(/^0x/, "");
  const b3 = buckets.b3.toLowerCase().replace(/^0x/, "");

  const where = and(
    eq("type", "image_registry"),
    or(eq("b0", b0), eq("b1", b1), eq("b2", b2), eq("b3", b3)),
  );

  try {
    const result = await publicClient.query(where);
    return extractEntities(result);
  } catch (err) {
    console.error("findSimilarImages query failed:", err);
    return [];
  }
}

/**
 * 4. verifyOwnership — verifies if an image is registered and owned by claimerAddress.
 * Returns true if owned by claimerAddress, false otherwise.
 */
export async function verifyOwnership(imageHash: string, claimerAddress: string): Promise<boolean> {
  if (!imageHash || !claimerAddress) {
    return false;
  }

  const cleanHash = imageHash.toLowerCase().replace(/^0x/, "");
  const cleanAddress = `0x${claimerAddress.toLowerCase().replace(/^0x/, "")}`;

  try {
    const where = and(
      eq("type", "image_registry"),
      eq("imageHash", cleanHash),
      eq("$owner", addr(cleanAddress)),
    );
    const result = await publicClient.query(where);
    const entities = extractEntities(result);
    return entities.length > 0;
  } catch (err) {
    console.error("verifyOwnership query failed:", err);
    return false;
  }
}

/**
 * 5. createIncidentLog — creates an incident log when a morphing attempt is detected.
 *
 * Calls walletClient.createEntity with incident schema:
 * - payload: JSON string { similarityScore, detectedAt }
 * - attributes: { type: "morphing_attempt", targetImageHash, claimerWallet, legitimateOwner }
 * - lifetime: fixed at 7_884_000n blocks (~1 year)
 */
export async function createIncidentLog(
  params: CreateIncidentLogParams,
): Promise<{ entityKey: string; txHash: string }> {
  if (!params.targetImageHash) {
    throw new Error("targetImageHash is required to create incident log");
  }
  if (!params.claimerWallet) {
    throw new Error("claimerWallet is required to create incident log");
  }
  if (!params.legitimateOwner) {
    throw new Error("legitimateOwner is required to create incident log");
  }

  const fixedLifetime = 7_884_000n; // Fixed: ~1 year in blocks

  const entityData = {
    payload: JSON.stringify({
      similarityScore: params.similarityScore,
      detectedAt: Math.floor(Date.now() / 1000),
    }),
    contentType: "application/json",
    attributes: {
      type: "morphing_attempt",
      targetImageHash: params.targetImageHash.toLowerCase().replace(/^0x/, ""),
      claimerWallet: params.claimerWallet.toLowerCase(),
      legitimateOwner: params.legitimateOwner.toLowerCase(),
    },
    lifetime: fixedLifetime,
  };

  const result = await walletClient.createEntity(entityData);
  return {
    entityKey: result.entityKey,
    txHash: result.txHash,
  };
}

/**
 * 6. getIncidentLogsForOwner — queries incident logs for a given legitimate owner wallet.
 * Returns full entity objects. Returns empty array if none found, never throws.
 */
export async function getIncidentLogsForOwner(ownerWallet: string): Promise<ArkivEntity[]> {
  if (!ownerWallet || typeof ownerWallet !== "string") {
    return [];
  }

  const cleanWallet = ownerWallet.toLowerCase();
  const where = and(eq("type", "morphing_attempt"), eq("legitimateOwner", cleanWallet));

  try {
    const result = await publicClient.query(where);
    return extractEntities(result);
  } catch (err) {
    console.error("getIncidentLogsForOwner query failed:", err);
    return [];
  }
}
