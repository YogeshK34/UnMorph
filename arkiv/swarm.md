# Arkiv + Swarm Integration & Bonus Submission

> **ETHGlobal Mumbai 2026** — _Arkiv + Swarm Bonus Track ($500)_  
> Project: **UnMorph** — Decentralized Image Ownership Registry & Perceptual Tamper Detection Layer

---

## 1. What Lives on Swarm vs. Arkiv

UnMorph pairs Ethereum Swarm with the Arkiv Web3 Database:

| Component                    | Storage Layer   | Purpose                                                                                                                                                                         | Content Type / Schema                                 |
| :--------------------------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------- |
| **Original Image Binary**    | **Swarm (Bee)** | Decentralized, immutable content-addressed blob storage for the full-resolution PNG / JPEG image files.                                                                         | Raw binary / image buffer (`image/png`, `image/jpeg`) |
| **Image Ownership Registry** | **Arkiv**       | Structured, queryable on-chain database indexing the 64-bit perceptual hash (`pHash`), sub-chunk bucket indexes (`b0`–`b3`), `$owner` wallet, ENS, and Swarm reference pointer. | JSON payload + indexed string attributes              |
| **Morphing Incident Logs**   | **Arkiv**       | Tamper detection audit log recording bad-actor claimer addresses, similarity percentages, and timestamps for owner dashboard queries.                                           | JSON payload + indexed attributes                     |

---

## 2. Arkiv Entity Field Mapping

- **Target Arkiv Entity:** `image_registry`
- **Field Holding Swarm Reference:** `payload.swarmRef` (JSON-encoded string inside `payload`)
- **Protocol Ownership Field:** Arkiv native `$owner` (auto-populated with registrant's `msg.sender` address)

### Example Entity Payload Schema:

```json
{
  "payload": "{\"swarmRef\":\"<64-hex-swarm-reference>\",\"registeredAt\":1741234567}",
  "contentType": "application/json",
  "attributes": {
    "type": "image_registry",
    "imageHash": "<16-char-phash>",
    "b0": "<bits-0-15>",
    "b1": "<bits-16-31>",
    "b2": "<bits-32-47>",
    "b3": "<bits-48-63>",
    "ownerENS": "vitalik.eth"
  },
  "lifetime": 15768000
}
```

---

## 3. Example Live Entity Key + Swarm Reference

> _Placeholder: This section is updated upon first live deployment / testnet upload._

- **Arkiv Entity Key:** `0x[PLACEHOLDER_ENTITY_KEY]`
- **Swarm Reference:** `[PLACEHOLDER_64_CHAR_HEX_SWARM_REF]`
- **Public Swarm Gateway URL:** `https://api.gateway.ethswarm.org/bytes/[PLACEHOLDER_64_CHAR_HEX_SWARM_REF]`
- **Arkiv Explorer Link:** `https://explorer.testnet.arkiv.network/entity/0x[PLACEHOLDER_ENTITY_KEY]`

---

## 4. Postage Batch, Wallet & Bee Node Used

- **Postage Stamp Batch ID:** `[PLACEHOLDER_POSTAGE_BATCH_ID]` _(stored in `.env` as `SWARM_BATCH_ID`)_
- **Batch Purchaser / Funder Wallet:** `[PLACEHOLDER_PURCHASER_WALLET_ADDRESS]` _(Batch funded via Gnosis Chain / Swarm testnet faucet)_
- **Bee Node / Gateway Endpoint:** `https://api.gateway.ethswarm.org` _(Swarm Public Gateway)_

---

## 5. Architectural Decision: Unencrypted Swarm Storage

**Decision:** UnMorph intentionally stores **UNENCRYPTED** Swarm references in Arkiv entities.

### Rationale:

1. **Public by Design:** Registered creator media and artwork are meant for public discovery, social media provenance, and transparent verification by third parties and feed algorithms.
2. **Cryptographic Integrity via `$owner`:** Ownership is proven at the protocol level through Arkiv's native `$owner` system attribute and perceptual hash uniqueness, not through access obscurity or file encryption.
3. **Security Against Key Leakage:** An encrypted Swarm reference contains the decryption key within the reference identifier. Because Arkiv entities are publicly queryable by all nodes and indexers, committing an encrypted reference would expose the decryption key publicly or provide a false sense of security.

---

## 6. Files in Repo Interacting with Swarm

- **`lib/swarm.ts` / `src/lib/swarm.ts`:**
  - `uploadImageToSwarm(imageBuffer, mimeType, customBatchId)`: Uploads unencrypted image blob to Swarm and returns `{ reference, batchId }`.
  - `getImageFromSwarm(swarmRef)`: Downloads image bytes from Swarm for retrieval / morphing dispute comparison.
  - `getBeeClient()`: Initializes the `@ethersphere/bee-js` client with gateway configuration.
  - `getSwarmGatewayUrl(swarmRef)`: Formats public HTTP URL for asset rendering.
- **`src/app/api/register/route.ts`:** Invokes `uploadImageToSwarm` before registering the metadata entity on Arkiv.
- **`src/app/api/verify/route.ts`:** Fetches original image bytes via `getImageFromSwarm` when presenting visual side-by-side evidence to the user.

---

## 7. Steps to Run One Upload and One Read

### Prerequisites

Ensure `.env` contains:

```env
SWARM_BATCH_ID=<your-64-char-batch-id>
NEXT_PUBLIC_SWARM_GATEWAY=https://api.gateway.ethswarm.org
```

### 1. Upload Test Image

Run in terminal:

```bash
bun -e "
import fs from 'fs';
import { uploadImageToSwarm } from './lib/swarm';

const sample = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const res = await uploadImageToSwarm(sample, 'image/png');
console.log('Uploaded successfully!');
console.log('Reference:', res.reference);
console.log('Batch ID:', res.batchId);
"
```

**Expected Output:**
A 64-character hex reference and the confirmed postage batch ID.

### 2. Download Image by Reference

Run in terminal:

```bash
bun -e "
import { getImageFromSwarm } from './lib/swarm';

const ref = '<insert-reference-from-upload>';
const buf = await getImageFromSwarm(ref);
console.log('Downloaded bytes:', buf.length);
"
```

**Expected Output:**
A matching byte count for the downloaded image buffer.

---

## 8. Timestamp in Demo Video Where Swarm is Used

- **Video URL:** `[PLACEHOLDER_YOUTUBE_OR_LOOM_LINK]`
- **Timestamp:** `[PLACEHOLDER_MM:SS]` (e.g., `01:45` – image upload to Swarm followed by Arkiv entity creation showing `swarmRef` linking).

---

## 9. What Got in the Way with Swarm

- **Postage Batch Requirement:** Unlike IPFS where public gateways accept raw unauthenticated pinning in sandboxes, Swarm strictly requires funded Postage Stamp Batches even on testnets. Obtaining funded batches requires Gnosis Chain BZZ or specific testnet faucets.
- **Bee-js v13 Namespace Migration:** The official `@ethersphere/bee-js` v13 modularized endpoints under sub-clients (`bee.data`, `bee.file`, `bee.soc`). Adapting to the new return types (`Reference`, `Bytes`) required ensuring proper conversions to standard Node `Buffer` and hex string representations.
- **Gateway Rate Limits:** Public gateway endpoints (`api.gateway.ethswarm.org`) occasionally enforce rate limits on consecutive uploads; retry logic and clear error propagation were implemented in `lib/swarm.ts`.
