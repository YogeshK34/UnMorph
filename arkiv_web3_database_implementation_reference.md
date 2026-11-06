# Arkiv Web3 Database: Architecture & Integration Reference

This document maps the business logic requirements (entity write, exact lookup, owner verification, similarity search, and automated expiration) directly against Arkiv Web3 Database's native architecture, query engine, and SDK interfaces.

---

## 1. Executive Summary & Parameter Mapping

| Business Requirement      | Traditional SQL Equivalent                        | Arkiv Native Mechanism                          | Status / Verdict                                                       |
| :------------------------ | :------------------------------------------------ | :---------------------------------------------- | :--------------------------------------------------------------------- |
| **Write / Register**      | `INSERT INTO entities (...)`                      | `walletClient.createEntity(...)`                | Native SDK transaction (`msg.sender` pays gas).                        |
| **Exact Lookup**          | `SELECT * WHERE imageHash = '...'`                | `where: 'imageHash = "..."'`                    | Fully supported via indexed string attributes.                         |
| **Owner Verification**    | `WHERE imageHash = '...' AND ownerWallet = '...'` | `where: 'imageHash = "..." AND $owner = 0x...'` | Built-in system attribute `$owner` auto-managed by Arkiv.              |
| **Similarity / Distance** | `WHERE imageHash SIMILAR TO ... WITHIN 10`        | None (No native fuzzy/Hamming operator)         | Must fetch candidate hashes and compute Hamming distance in app logic. |
| **Entity Expiration**     | Cron/background delete queries                    | Automated on-chain expiration (`lifetime`)      | Built-in protocol-level automatic pruning.                             |

---

## 2. Writing Entities via the SDK

In Arkiv, write operations are executed as on-chain transactions using an authenticated wallet client (built on top of Viem).

### Key Characteristics

- **Payload vs Attributes:**
  - `payload`: Holds the raw object data (up to 128 KiB).
  - `attributes`: Key-value pairs indexed by Arkiv nodes for search and filtering.
- **Typing:** String attributes default to type `str`. Values can be explicitly typed using SDK helpers (`addr(...)`, `i32(...)`, `u64(...)`, etc.).
- **Mandatory Lifetime:** Every entity must specify a non-zero `lifetime` (denominated in blocks or human-readable time helpers).

### Implementation Example

```typescript
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arkivTestnet } from "@arkiv-network/sdk/chains";
import { createArkivClient, stringToPayload } from "@arkiv-network/sdk";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const client = createArkivClient({
  chain: arkivTestnet,
  transport: http(),
  account,
});

async function registerImage(pHash: string, metadata: object, lifetimeBlocks: bigint) {
  const { entityKey, txHash } = await client.createEntity({
    payload: stringToPayload(JSON.stringify(metadata)),
    contentType: "application/json",
    attributes: {
      imageHash: pHash, // Indexed string attribute
    },
    lifetime: lifetimeBlocks, // e.g., 7_884_000n blocks (~1 year depending on block cadence)
  });

  return { entityKey, txHash };
}
```

---

## 3. Query Syntax & Operators

Arkiv query engine operates over indexed user attributes and system attributes prefixed with `$`.

### Supported Operators

| Category                  | Operators              | Notes                                                                          |
| :------------------------ | :--------------------- | :----------------------------------------------------------------------------- |
| **Equality / Inequality** | `=`, `!=`              | Value matching for numbers; lexicographic/byte-level for `str`, `addr`, `key`. |
| **Comparison**            | `<`, `<=`, `>`, `>=`   | Supported for numbers (`i32`, `u64`, `dec`) and lexicographically on `str`.    |
| **Prefix Matching**       | `STARTSWITH`           | Supported on UTF-8 string attributes.                                          |
| **Set / Range**           | `BETWEEN`, `IN`        | Can be expressed via range combinations (`> AND <`) or SDK helper filters.     |
| **Logical**               | `AND`, `OR`, `NOT`     | Supports multi-field compound conditions.                                      |
| **Existence**             | `EXISTS`, `NOT EXISTS` | Checks if an optional attribute exists on an entity.                           |

### Unsupported Operators

- **No `LIKE %term%` or Regex:** Arbitrary substring matching is not available.
- **No Vector / Hamming Distance:** No metric space calculations or fuzzy distance algorithms.

---

## 4. Owner Management: System Fields vs Custom Fields

Arkiv manages ownership at the protocol level:

1. **Auto-Assignment:** When `createEntity` is executed, the protocol automatically sets the internal system field `$owner` to `msg.sender`.
2. **Access Control:** Only the current `$owner` has administrative rights to:
   - `patchEntity`: Update metadata or attribute values.
   - `extendEntity`: Prolong entity lifetime.
   - `changeOwnership`: Transfer entity ownership to a new wallet.
   - `deleteEntity`: Explicitly purge the entity early.
3. **Query Verification:** You do not need a custom `ownerWallet` attribute. You can directly query the system field:

```typescript
const verificationQuery = await publicClient.query({
  where: `imageHash = "${pHash}" AND $owner = 0x${claimerAddress.toLowerCase()}`,
});

const isOwner = verificationQuery.entities.length > 0;
```

---

## 5. Architectural Strategy for Image Similarity (pHash)

Because perceptual hashes (pHash) require calculating bitwise Hamming distance to account for compression, crops, or morphing, and Arkiv lacks a native distance index, use the following hybrid pipeline:

```
[Uploaded Image]
       │
       ▼
[Compute pHash (64-bit / 16-hex)]
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
1. Exact Query Arkiv                     2. Range / Bucket Query
   where: imageHash = "<hash>"              where: hashBucket = "<prefix>"
       │                                         │
  [Found Match?]                            [Fetch Candidate List]
   ├── YES ──> Return 100% Match                 │
   └── NO                                        ▼
                                            3. Client/Server App Logic
                                               - Compute Hamming distance
                                               - Distance <= threshold ?
```

### Bucket Indexing Optimization

If the database grows large, fetching all hashes becomes inefficient. You can break down the pHash into multi-index chunks (Locality Sensitive Hashing / Substring Bucketing):

- Compute 4 sub-chunks of the 64-bit pHash (16 bits each).
- Store them as indexed attributes: `b0`, `b1`, `b2`, `b3`.
- By pigeonhole principle, if two hashes have a Hamming distance $\le 3$, at least one 16-bit block must be an exact match.
- Query candidates matching _any_ identical block:
  ```sql
  b0 = "chunk0" OR b1 = "chunk1" OR b2 = "chunk2" OR b3 = "chunk3"
  ```
- Compute precise Hamming distance strictly against the filtered candidate subset in your backend/client code.

---

## 6. Entity Expiry Lifecycle

Arkiv handles expiration natively as a storage cost-efficiency mechanism:

- **Creation:** Lifetime is committed at creation time.
- **System Field:** Accessible via `$expiresAt` (expressed in absolute block numbers).
- **Automatic Eviction:** Once the chain reaches block `$expiresAt`, the entity is removed from indexes and marked expired automatically.
- **Extension:** If an entity needs to remain active indefinitely, the `$owner` can periodically call `client.extendEntity({ entityKey, lifetime: additionalBlocks })`.
