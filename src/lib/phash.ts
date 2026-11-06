import sharp from "sharp";

/**
 * 64-bit perceptual hash result split into four 16-bit buckets (b0..b3)
 * for sub-chunk indexing in Arkiv.
 */
export interface PHashResult {
  /** 16-character hexadecimal string representing the 64-bit pHash */
  fullHash: string;
  /** First 16 bits (hex chars 0-3) */
  b0: string;
  /** Second 16 bits (hex chars 4-7) */
  b1: string;
  /** Third 16 bits (hex chars 8-11) */
  b2: string;
  /** Fourth 16 bits (hex chars 12-15) */
  b3: string;
}

/** Precomputed 8x32 Discrete Cosine Transform (DCT) matrix */
const DCT_SIZE = 32;
const DCT_LOW_FREQ = 8;

const COSINE_TABLE: number[][] = (() => {
  const table: number[][] = [];
  for (let u = 0; u < DCT_LOW_FREQ; u++) {
    table[u] = [];
    const alpha = u === 0 ? 1 / Math.SQRT2 : 1;
    for (let x = 0; x < DCT_SIZE; x++) {
      table[u][x] = alpha * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * DCT_SIZE));
    }
  }
  return table;
})();

/**
 * Normalizes input image source into a Buffer.
 * Supports Buffer, Uint8Array, file path string, or Base64 data URL.
 */
function toBuffer(input: Buffer | Uint8Array | string): Buffer {
  if (Buffer.isBuffer(input)) {
    return input;
  }
  if (input instanceof Uint8Array) {
    return Buffer.from(input);
  }
  if (typeof input === "string") {
    // Handle data URL (e.g. data:image/png;base64,...)
    const dataUrlMatch = input.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/);
    if (dataUrlMatch && dataUrlMatch[1]) {
      return Buffer.from(dataUrlMatch[1], "base64");
    }
    // Handle raw base64 if not an existing file path
    if (
      /^[A-Za-z0-9+/=]{64,}$/.test(input.trim()) &&
      !input.includes("/") &&
      !input.includes(".")
    ) {
      return Buffer.from(input, "base64");
    }
    // Otherwise treat as file path
    return Buffer.from(input, "utf-8");
  }
  throw new TypeError("Unsupported input type for pHash computation");
}

/**
 * Computes a 64-bit DCT-based Perceptual Hash (pHash) for an image.
 *
 * Algorithm:
 * 1. Downsample image to 32x32 pixels, 1-channel grayscale.
 * 2. Compute 2D Discrete Cosine Transform (DCT-II).
 * 3. Extract top-left 8x8 low-frequency coefficients.
 * 4. Compute median of the AC coefficients (excluding DC component).
 * 5. Generate 64-bit hash (1 if coefficient > median, else 0).
 * 6. Return 16-character hex representation and 4-bucket partition.
 *
 * @param input Buffer, Uint8Array, file path, or base64 data URI of the image
 * @returns PHashResult with fullHash, b0, b1, b2, b3
 */
export async function computePHash(input: Buffer | Uint8Array | string): Promise<PHashResult> {
  const imageInput =
    typeof input === "string" && !input.startsWith("data:") ? input : toBuffer(input);

  // Resize to 32x32, convert to 1-channel grayscale, get raw 8-bit pixels
  const { data } = await sharp(imageInput)
    .resize(DCT_SIZE, DCT_SIZE, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 1D DCT on rows: shape [DCT_LOW_FREQ][DCT_SIZE]
  const rowDct: number[][] = [];
  for (let u = 0; u < DCT_LOW_FREQ; u++) {
    rowDct[u] = new Array<number>(DCT_SIZE);
    const cosU = COSINE_TABLE[u];
    for (let y = 0; y < DCT_SIZE; y++) {
      let sum = 0;
      const rowOffset = y * DCT_SIZE;
      for (let x = 0; x < DCT_SIZE; x++) {
        sum += data[rowOffset + x] * cosU[x];
      }
      rowDct[u][y] = sum;
    }
  }

  // 1D DCT on columns for 8x8 low frequency coefficients
  const coeffs: number[] = new Array<number>(DCT_LOW_FREQ * DCT_LOW_FREQ);
  for (let v = 0; v < DCT_LOW_FREQ; v++) {
    const cosV = COSINE_TABLE[v];
    for (let u = 0; u < DCT_LOW_FREQ; u++) {
      let sum = 0;
      const rowU = rowDct[u];
      for (let y = 0; y < DCT_SIZE; y++) {
        sum += rowU[y] * cosV[y];
      }
      coeffs[v * DCT_LOW_FREQ + u] = sum;
    }
  }

  // Calculate median of AC coefficients (exclude DC coefficient at index 0)
  const acCoeffs = coeffs.slice(1);
  const sorted = [...acCoeffs].sort((a, b) => a - b);
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  // Build 64-bit binary string
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    let nibble = 0;
    for (let b = 0; b < 4; b++) {
      const bit = coeffs[i + b] > median ? 1 : 0;
      nibble = (nibble << 1) | bit;
    }
    hex += nibble.toString(16);
  }

  const fullHash = hex.toLowerCase().padStart(16, "0");

  return splitBuckets(fullHash);
}

/**
 * Splits a 16-character hex pHash string into four 4-character buckets.
 */
export function splitBuckets(fullHash: string): PHashResult {
  const normalized = fullHash.trim().toLowerCase().replace(/^0x/, "").padStart(16, "0");
  return {
    fullHash: normalized,
    b0: normalized.slice(0, 4),
    b1: normalized.slice(4, 8),
    b2: normalized.slice(8, 12),
    b3: normalized.slice(12, 16),
  };
}

/**
 * Returns number of differing bits between two hexadecimal pHash strings.
 * Operates on bitwise level (Hamming distance, 0..64 for 64-bit hashes).
 */
export function hammingDistance(hash1: string, hash2: string): number {
  const clean1 = hash1.trim().toLowerCase().replace(/^0x/, "");
  const clean2 = hash2.trim().toLowerCase().replace(/^0x/, "");

  const maxLen = Math.max(clean1.length, clean2.length, 16);
  const p1 = clean1.padStart(maxLen, "0");
  const p2 = clean2.padStart(maxLen, "0");

  let distance = 0;
  for (let i = 0; i < maxLen; i++) {
    const n1 = parseInt(p1[i], 16) || 0;
    const n2 = parseInt(p2[i], 16) || 0;
    let xor = n1 ^ n2;
    // Count set bits in 4-bit nibble
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }

  return distance;
}

/**
 * Calculates similarity percentage between two perceptual hashes.
 *
 * Returns 0–100, where:
 * - 100 = identical image fingerprint (0 bit difference)
 * - > 70 = perceptual match / morphed image candidate
 *
 * @param hash1 16-char hex pHash string
 * @param hash2 16-char hex pHash string
 * @returns similarity percentage (0 to 100)
 */
export function similarityPercent(hash1: string, hash2: string): number {
  const distance = hammingDistance(hash1, hash2);
  const clean1 = hash1.trim().toLowerCase().replace(/^0x/, "");
  const clean2 = hash2.trim().toLowerCase().replace(/^0x/, "");
  const totalBits = Math.max(clean1.length, clean2.length, 16) * 4;

  const score = ((totalBits - distance) / totalBits) * 100;
  const clamped = Math.max(0, Math.min(100, score));
  return Number(clamped.toFixed(2));
}

/**
 * Checks whether similarity reaches the morphing / similarity threshold (default 70%).
 */
export function isSimilar(hash1: string, hash2: string, thresholdPercent = 70): boolean {
  return similarityPercent(hash1, hash2) >= thresholdPercent;
}
