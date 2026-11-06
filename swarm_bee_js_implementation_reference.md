# Swarm (bee-js): Architecture & Integration Reference

This document maps the business logic requirements (entity write, exact lookup, owner verification, similarity search, and automated expiration) against Ethereum Swarm's decentralized storage architecture and the official `@ethersphere/bee-js` SDK (`bee-js.ethswarm.org/docs`).

---

## 1. Executive Summary & Parameter Mapping

| Business Requirement      | Traditional SQL Equivalent                        | Swarm Primitive / `bee-js` Equivalent                                            | Architectural Verdict                                                                                |
| :------------------------ | :------------------------------------------------ | :------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **Write / Register**      | `INSERT INTO entities (...)`                      | `bee.data.upload(batchId, payload)` or `bee.soc.upload(signer, identifier, ...)` | Requires a funded Postage Batch ID. Writes raw chunks or Single Owner Chunks.                        |
| **Exact Lookup**          | `SELECT * WHERE imageHash = '...'`                | SOC deterministic lookup or Manifest/Feed query                                  | Swarm is content-addressed; exact queries require deterministic Topic IDs or an inverted index feed. |
| **Owner Verification**    | `WHERE imageHash = '...' AND ownerWallet = '...'` | Cryptographic SOC Reader verification: `bee.soc.makeReader(ownerAddress)`        | Cryptographically enforced. SOC chunks are signed by the owner's private key.                        |
| **Similarity / Distance** | `WHERE imageHash SIMILAR TO ... WITHIN 10`        | None (No native fuzzy or distance index)                                         | Must fetch candidate chunks or index client-side and compute Hamming distance in app code.           |
| **Entity Expiration**     | Scheduled row deletion                            | Postage Batch TTL & Batch Dilution                                               | Governed by postage stamp balance/depth. Unfunded chunks are evicted by nodes.                       |

---

## 2. Core Architectural Contrast: Swarm vs. Arkiv

- **Arkiv** is a structured, searchable Web3 database with RPC-level indexing and SQL-like attribute filtering.
- **Swarm** is an immutable, chunk-based Content Addressed Storage (CAS) layer. It stores raw bytes, content chunks (up to 4 KiB per chunk), and trees of chunks (Swarm files and collections).
- Swarm has **no database query engine** running on nodes. Searching by arbitrary attributes is achieved using **Single Owner Chunks (SOC)**, **Feeds**, or client-side indexes stored on Swarm.

---

## 3. Writing Entities via `bee-js`

Writes require a valid **Postage Batch ID** (purchased on Gnosis Chain to pay storage incentives). In `bee-js` (v13+), client operations are structured into modular namespaces (`bee.data`, `bee.soc`, `bee.feed`, `bee.bytes`).

### A. Raw Content Write (Standard Chunk / CAS)

```typescript
import { Bee } from "@ethersphere/bee-js";

const bee = new Bee("http://localhost:1633");
const postageBatchId = "your_32_byte_postage_batch_id";

async function writeEntity(metadata: object) {
  const result = await bee.data.upload(postageBatchId, JSON.stringify(metadata), {
    pin: true, // Instructs the connected Bee node to keep a local copy
    encrypt: false, // Optional: encrypt content before dispatching to the network
  });

  // Returns 64-character hex reference (Swarm hash)
  return result.reference.toHex();
}
```

### B. Single Owner Chunk Write (Attributed / Signed)

To bind an image directly to a cryptographic owner, write a Single Owner Chunk:

```typescript
import { Bee, Identifier, Signer } from "@ethersphere/bee-js";
import { privateKeyToAccount } from "viem/accounts";

async function writeOwnerEntity(pHash: string, payload: object, signer: Signer) {
  // Derive a deterministic topic identifier from the image hash
  const identifier = Identifier.fromString(`image:${pHash}`);
  const data = new TextEncoder().encode(JSON.stringify(payload));

  const socWriter = bee.soc.makeWriter(signer);
  const uploadResult = await socWriter.upload(postageBatchId, identifier, data);

  return uploadResult.reference.toHex();
}
```

---

## 4. Querying & Exact Lookup Patterns

Because Swarm does not execute `WHERE` queries over JSON payload keys, exact matching requires one of two design patterns:

### Pattern A: Single Owner Chunk (Deterministic Identifier)

An SOC address is deterministically calculated by hashing the signer's Ethereum address and the identifier:

$$\text{SOC Address} = \text{keccak256}(\text{Identifier} \,||\, \text{OwnerAddress})$$

If the claimer address and the hash are known, you can query directly without a directory:

```typescript
import { Bee, Identifier } from "@ethersphere/bee-js";

async function checkRegistered(ownerAddress: string, pHash: string) {
  const identifier = Identifier.fromString(`image:${pHash}`);
  const reader = bee.soc.makeReader(ownerAddress);

  try {
    const chunk = await reader.download(identifier);
    const data = JSON.parse(new TextDecoder().decode(chunk.payload));
    return { exists: true, data };
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return { exists: false, data: null };
    }
    throw err;
  }
}
```

### Pattern B: Global Hash Index via Feeds

If multiple users register images and you need to look up who owns a given `imageHash` across the entire application:

1. Maintain an append-only index or Radix tree mapping `imageHash -> ownerWallet / swarmReference`.
2. Update this index periodically using a **Swarm Feed** (`bee.feed.makeWriter(...)`).
3. Clients read the latest feed update to check if `imageHash` is already recorded.

---

## 5. Owner Verification

Owner verification in Swarm is cryptographic:

- When an entity is stored as a **Single Owner Chunk (SOC)**, the chunk envelope contains the ECDSA signature of the creator.
- The content cannot be spoofed or created by an unauthorized third party:
  - Only `0xClaimer`'s private key can generate a valid chunk for the path `(0xClaimer, Identifier)`.
  - Attempting to query `bee.soc.makeReader(0xClaimer).download(identifier)` will fail if `0xClaimer` never signed and posted that chunk.
- **Result:** No SQL `ownerWallet = "0x..."` check is needed—ownership verification is enforced at the network layer by signature validity.

---

## 6. Similarity Search (pHash Hamming Distance)

- **Protocol Capability:** Swarm does not have metric indexes, Hamming distance calculators, or substring matching.
- **Integration Strategy:**
  1. **Candidate Grouping (Buckets):** Group perceptual hashes into buckets (e.g., prefix partitions of 8 or 16 bits).
  2. **Feed / Manifest Storage:** Upload bucket collections to Swarm under deterministically calculated identifiers:
     `Identifier.fromString("bucket:" + pHashPrefix)`.
  3. **Client-Side Comparison:**
     - The client downloads the candidate bucket corresponding to the queried image.
     - Computes bitwise Hamming distance between the candidate hashes and the target hash in application memory.
     - Flags matches that fall within the threshold (e.g., $\text{distance} \le 10$).

---

## 7. Storage Lifecycle & Expiry

Swarm uses a reserve incentive mechanism rather than fixed block expiration dates:

- **Postage Batch Parameters:**
  - **Batch Depth:** Dictates how much data volume the batch can hold ($2^{\text{depth}}$ chunks).
  - **Batch Amount:** The BZZ token balance assigned to the batch.
- **Time-to-Live (TTL):** Storage rent is continuously deducted from the postage batch balance as network price fluctuations occur.
- **Automatic Eviction:** When a postage batch runs out of balance, storage nodes drop the chunks during garbage collection.
- **Prolonging Lifetime:** Use `bee.postage.topUpBatch(...)` or `bee.postage.diluteBatch(...)` to keep data alive.
