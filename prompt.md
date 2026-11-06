# Gemini Build Prompt — Image Morphing Detection App

## ETHGlobal Mumbai 2026 | Arkiv + Swarm Integration

---

## Project Overview

Build a **image ownership registry and morphing detection app** using:

- **Swarm** (`@ethersphere/bee-js`) — decentralized blob storage for actual image files
- **Arkiv** (`@arkiv-network/sdk`) — structured on-chain queryable database for image metadata, ownership and incident logs
- **Perceptual Hashing** (`imghash` or `sharp` + custom pHash) — image fingerprinting for similarity detection

The app sits as a layer before social media posting. A user registers their image on-chain. If someone later tries to claim the same (or morphed) image, the app detects it and logs an incident.

---

## Runtime & Package Manager

- **Runtime:** Node.js 18+
- **Package Manager:** Bun (use `bun install`, `bun add` etc. — do NOT use `bun run` as runtime for SDK calls)
- **Language:** TypeScript (strict mode)
- **Framework:** Next.js (App Router) for frontend

---

## Reference Files Attached

You have been given:

1. `arkiv_web3_database_implementation_reference.md` — Arkiv SDK full reference
2. Swarm `@ethersphere/bee-js` — official SDK docs

Read both completely before writing any code.

---

## Entity Schema (Arkiv)

### Entity Type 1 — Image Registry

```typescript
// Written when a user registers a NEW image
{
  payload: JSON.stringify({
    swarmRef: string,         // Swarm content hash of actual image
    registeredAt: number,     // Unix timestamp
  }),
  contentType: "application/json",
  attributes: {
    type: "image_registry",
    imageHash: string,        // Full 64-bit pHash (hex string)
    b0: string,               // pHash bits 0-15
    b1: string,               // pHash bits 16-31
    b2: string,               // pHash bits 32-47
    b3: string,               // pHash bits 48-63
    ownerENS: string,         // ENS name if resolved, else "none"
  },
  lifetime: bigint,           // User-chosen, passed as blocks — expose as UI input (days → blocks conversion)
  // $owner is auto-set by Arkiv protocol to msg.sender — do NOT add ownerWallet manually
}
```

### Entity Type 2 — Incident Log

```typescript
// Written when a morphing attempt is detected
{
  payload: JSON.stringify({
    similarityScore: number,  // Hamming distance result as % similarity
    detectedAt: number,       // Unix timestamp
  }),
  contentType: "application/json",
  attributes: {
    type: "morphing_attempt",
    targetImageHash: string,  // pHash of the original registered image
    claimerWallet: string,    // Wallet address of bad actor
    legitimateOwner: string,  // Wallet address of real owner (for query)
  },
  lifetime: 7_884_000n,       // Fixed: ~1 year
  // $owner auto-set to app wallet or claimer wallet — document this decision
}
```

---

## pHash Utility — Build This First

```typescript
// lib/phash.ts
// Use 'sharp' for image processing + manual DCT-based pHash
// OR use 'imghash' npm package directly

// Must return:
interface PHashResult {
  fullHash: string; // 16-char hex string (64-bit pHash)
  b0: string; // fullHash.slice(0, 4)
  b1: string; // fullHash.slice(4, 8)
  b2: string; // fullHash.slice(8, 12)
  b3: string; // fullHash.slice(12, 16)
}

// Also implement:
function hammingDistance(hash1: string, hash2: string): number;
// Returns number of differing bits between two hex pHash strings

function similarityPercent(hash1: string, hash2: string): number;
// Returns 0-100, where 100 = identical image
// Threshold for "morphed": similarity > 70% but $owner mismatch
```

---

## Swarm Integration

```typescript
// lib/swarm.ts
import { Bee, NULL_STAMP, SWARM_GATEWAY_URL } from "@ethersphere/bee-js";

// Use SWARM_GATEWAY_URL for hackathon/testnet — no need to run own Bee node
// NULL_STAMP for testnet uploads

async function uploadImageToSwarm(imageBuffer: Buffer, mimeType: string): Promise<string>;
// Returns: swarmReference (hex string) — this is your swarmRef stored in Arkiv

async function getImageFromSwarm(swarmRef: string): Promise<Buffer>;
// For retrieving original image if needed for dispute
```

---

## Arkiv Integration

```typescript
// lib/arkiv.ts
import { createArkivClient, stringToPayload } from "@arkiv-network/sdk";
import { arkivTestnet } from "@arkiv-network/sdk/chains";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Functions to implement:

// 1. Register new image
async function registerImage(params: {
  pHash: PHashResult;
  swarmRef: string;
  ownerENS: string;
  lifetimeBlocks: bigint; // passed from frontend
}): Promise<{ entityKey: string; txHash: string }>;

// 2. Exact lookup — check if hash already exists
async function findExactImage(imageHash: string): Promise<ArkivEntity | null>;

// 3. Bucket lookup — find similar images
async function findSimilarImages(buckets: {
  b0: string;
  b1: string;
  b2: string;
  b3: string;
}): Promise<ArkivEntity[]>;
// Query: `b0 = "${b0}" OR b1 = "${b1}" OR b2 = "${b2}" OR b3 = "${b3}"`
// Then filter client-side by hammingDistance threshold

// 4. Verify ownership
async function verifyOwnership(imageHash: string, claimerAddress: string): Promise<boolean>;
// Query: `imageHash = "${imageHash}" AND $owner = 0x${claimerAddress.toLowerCase()}`

// 5. Create incident log
async function createIncidentLog(params: {
  targetImageHash: string;
  claimerWallet: string;
  legitimateOwner: string;
  similarityScore: number;
}): Promise<{ entityKey: string; txHash: string }>;

// 6. Query incident logs for a wallet (owner's dashboard)
async function getIncidentLogsForOwner(ownerWallet: string): Promise<ArkivEntity[]>;
// Query: `type = "morphing_attempt" AND legitimateOwner = "${ownerWallet}"`
```

---

## Core App Logic — The Decision Tree

```
User uploads image
       │
       ▼
Compute pHash → split into b0,b1,b2,b3
       │
       ▼
Upload image to Swarm → get swarmRef
       │
       ▼
User selects: [New Image] or [Existing Image]
       │
       ├──────────────────────────────────────────┐
       │ NEW                                      │ EXISTING
       ▼                                          ▼
Run exact lookup on Arkiv              Check ownership:
(imageHash = fullHash)                 imageHash = fullHash
       │                               AND $owner = claimerAddr
       ├── No match found                         │
       │   → Run bucket query                     ├── Owned by claimer → ✅ Verified
       │   → Compute hammingDistance              └── Not owner → 🚩 Incident log
       │      on candidates
       │      ├── No similar (< 70%) → Genuinely New
       │      │   → createEntity (registry)
       │      │   → User sets lifetime
       │      │   → Return txHash
       │      └── Similar found (≥ 70%) + owner mismatch
       │          → createIncidentLog
       │          → Notify: "This image is already registered by [owner]"
       └── Exact match found
           → Treat as EXISTING flow
```

---

## Frontend Pages

### 1. `/` — Home

- Connect wallet button (use wagmi + viem)
- Once connected: show wallet address + ENS name if resolved
- Two buttons: **Register New Image** | **Check My Incidents**

### 2. `/register` — Register Image

- Image upload input (PNG/JPEG only, max 5MB)
- Lifetime selector: 30 days / 90 days / 1 year / Custom (days input)
  - Convert days → blocks on submit (assume ~2 second block time)
- Submit → runs full flow → shows txHash + entityKey on success

### 3. `/dashboard` — Owner Incident Dashboard

- Queries Arkiv for all `morphing_attempt` entities where `legitimateOwner = connectedWallet`
- Shows table: Claimer Wallet | Similarity % | Timestamp | Target Image Hash
- Each row expandable to show full incident entity details

### 4. `/verify` — Check Any Image

- Upload image → runs lookup
- Shows: Registered / Not Registered / Morphed Detected
- If registered: shows owner wallet + ENS + registration date

---

## Implementation Order (Do This Exactly)

1. `lib/phash.ts` — pHash + bucket split + hamming distance
2. `lib/swarm.ts` — upload + retrieve via bee-js
3. `lib/arkiv.ts` — all 6 functions above
4. `lib/decisions.ts` — the decision tree logic, calls lib/arkiv and lib/phash
5. API routes — `/api/register`, `/api/check`, `/api/incidents`
6. Frontend pages in order: `/register` → `/verify` → `/dashboard` → `/`

---

## Environment Variables Needed

```env
PRIVATE_KEY=0x...              # Wallet that signs Arkiv transactions
NEXT_PUBLIC_SWARM_GATEWAY=https://api.gateway.ethswarm.org
NEXT_PUBLIC_ARKIV_RPC=         # From Arkiv testnet docs
```

---

## Packages to Install

```bash
bun add @ethersphere/bee-js
bun add @arkiv-network/sdk
bun add viem
bun add wagmi
bun add imghash
bun add sharp
bun add @types/node -d
```

---

## What NOT to Build Yet

- World ID integration — this is Phase 2, skip entirely for now
- Any IPFS or other storage — Swarm only
- Any custom access control — Arkiv's `$owner` handles it natively

---

## Arkiv Testnet Notes

- Use `arkivTestnet` chain from SDK
- Every entity needs non-zero `lifetime` — never skip this
- `$owner` is auto-set, never pass it manually as an attribute
- For similarity queries: fetch bucket candidates first, then filter client-side with hammingDistance
- Keep incident log lifetime fixed at `7_884_000n` blocks (~1 year)

---

## Success Criteria for Demo

A judge should be able to:

1. Upload an image → register it → see txHash on Arkiv testnet
2. Upload same (or slightly modified) image with different wallet → see morphing detection + incident log created
3. Go to dashboard with original wallet → see the incident log entry with claimer's wallet address
4. All tx hashes verifiable on Arkiv testnet explorer

---

_Phase 2 (after all above works): World ID integration for human-verified ownership_
_Phase 3: ENS name resolution for display_
