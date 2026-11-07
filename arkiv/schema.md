# Arkiv Schema — Entities, Ownership, Expiration, Queries

How UnMorph actually models and reads/writes data on Arkiv (Rabdi testnet). Source of truth: [`src/lib/arkiv.ts`](../src/lib/arkiv.ts), [`src/hooks/useArkivWriter.ts`](../src/hooks/useArkivWriter.ts), [`src/app/api/check/route.ts`](../src/app/api/check/route.ts), [`src/app/api/register/route.ts`](../src/app/api/register/route.ts), [`src/app/api/incidents/route.ts`](../src/app/api/incidents/route.ts).

---

## 1. Entities

Two `defineSchema(...)` schemas, both defined once in `src/lib/arkiv.ts` and imported everywhere an entity of that kind is read or written.

### 1.1 `image_registry`

One entity per registered original image.

```ts
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
```

| Field        | Type    | Indexed | Contents                                                                                     |
| ------------ | ------- | ------- | ---------------------------------------------------------------------------------------------- |
| `type`       | `str`   | yes     | Literal `"image_registry"` — the discriminator every query filters on.                        |
| `imageHash`  | `str`   | yes     | 16-char hex, the full 64-bit DCT perceptual hash (`phash.ts: computePHash`), lowercase, no `0x`. |
| `b0`..`b3`   | `str`   | yes     | The 4 sub-chunks of `imageHash` (4 hex chars each) — see §4 for why these exist.                |
| `ownerENS`   | `str`   | no      | Resolved ENS name of the registering wallet, or the literal `"none"`.                           |
| `payload`    | `bytes` | no      | UTF-8 JSON blob: `{ swarmRef: string, registeredAt: number }`, where `swarmRef` is the 64-char Swarm content reference for the original image bytes. |

Owner is **not** a declared column — see §2.

### 1.2 `morphing_attempt`

One entity per detected tamper/ownership-conflict incident, written under the **legitimate owner's** record.

```ts
export const IncidentLogSchema = defineSchema("morphing_attempt", {
  type: str().indexed(),
  targetImageHash: str().indexed(),
  claimerWallet: str().indexed(),
  legitimateOwner: str().indexed(),
  payload: bytes(),
});
```

| Field              | Type    | Indexed | Contents                                                                 |
| ------------------ | ------- | ------- | ------------------------------------------------------------------------- |
| `type`              | `str`   | yes     | Literal `"morphing_attempt"`.                                             |
| `targetImageHash`   | `str`   | yes     | The `imageHash` (or best-match candidate hash) that was claimed/contested. |
| `claimerWallet`     | `str`   | yes     | Lowercase address of whoever just submitted the conflicting image.        |
| `legitimateOwner`   | `str`   | yes     | Lowercase address of the original registrant — **stored as a plain `str`, not the system `$owner`** (see §2). This is what incident lookups filter on. |
| `payload`           | `bytes` | no      | UTF-8 JSON blob: `{ similarityScore: number, detectedAt: number }`.       |

---

## 2. Ownership

Arkiv entities carry a protocol-level `$owner` system field, auto-populated from `msg.sender` at creation — it is **never** passed as a column. Every `createEntity` call site in this codebase is explicit about this (`src/lib/arkiv.ts:56` and `:211`: *"$owner is auto-set by Arkiv protocol — NEVER added manually"*).

- **`$owner`** — the *registry's* protocol-level owner. Used by `verifyOwnership()` and `findExactImage()`/`findSimilarImages()` (via `getEntityOwner()`) to decide `VERIFIED` vs `MORPHING_DETECTED`.
- **`legitimateOwner`** — a plain `str` *copy* of an address, used only inside `morphing_attempt` entities so incident logs can be queried by owner without needing `$owner`-based filtering on a different entity type. This is a deliberate denormalization, not a mistake — but it means "owner" means two structurally different things depending on which schema you're looking at (one is a system field, the other a regular indexed string column).

### Reading `$owner` vs. reading a custom attribute

This is the single most important shape distinction in the whole integration, and it's covered in full in [`friction.md`](./friction.md#1-query-result-shape-system-fields-vs-attributes): a `query()` call with no `.from(schema)` selection returns **system fields flat** (`entity.$owner`, `entity.$key`, …) but **every custom column wrapped** as `entity.$attributes.imageHash.value` (never `entity.imageHash`). `src/lib/arkiv.ts`'s `ArkivEntity` type and `src/app/api/check/route.ts`'s `getAttributeValue()` / `getEntityOwner()` helpers exist specifically to paper over this asymmetry.

---

## 3. Expiration (lifetime)

Entities are not permanent — every `createEntity` call passes `{ expiration: ExpirationTime.fromBlocks(n) }`.

- Chain block time: **2 seconds** (`BLOCK_TIME` in the SDK's `consts.ts`).
- Chain-enforced ceiling: **`MAX_LIFETIME = 7_884_000` blocks ≈ 182.5 days (~6 months)**. The SDK validates this client-side and throws `InvalidExpiryError` before ever opening the wallet if you ask for more — see [`friction.md`](./friction.md#4-entity-lifetime-silently-capped-at-~182-days-not-~1-year) for how this currently breaks the UI's own default.
- This codebase's fallback/default lifetime, wherever a caller doesn't specify one, is **exactly** `7_884_000n` blocks — i.e. the protocol maximum — in four places: `registerImage()`, `createIncidentLog()` (`src/lib/arkiv.ts`), and both `registerImageOnChain()` / `createIncidentOnChain()` (`src/hooks/useArkivWriter.ts`). Every one of these is commented `~1 year`; the real figure is ~182 days.
- The register UI (`register-panel.tsx`) converts a user-chosen day count to blocks via `lifetimeDays * 24 * 60 * 30` (= `lifetimeDays * 43,200`), which correctly matches the 2-second block time — the bug is only that nothing in the UI clamps the result to `MAX_LIFETIME`.

---

## 4. Query patterns

All reads go through four functions in `src/lib/arkiv.ts`, all built with the SDK's `eq` / `and` / `or` expression combinators (`@arkiv-network/sdk/query`) against `publicClient.query(...)` — **not** hand-built query strings (that was the bug; see `friction.md` §1 for why).

### 4.1 Exact match — `findExactImage(imageHash)`

```ts
and(eq("type", "image_registry"), eq("imageHash", cleanHash))
```
Renders to `type = str('image_registry') AND imageHash = str('...')` on the wire. Returns the first matching entity or `null`. Used for byte-identical re-registration / re-verification checks.

### 4.2 Perceptual similarity — `findSimilarImages({ b0, b1, b2, b3 })`

```ts
and(
  eq("type", "image_registry"),
  or(eq("b0", b0), eq("b1", b1), eq("b2", b2), eq("b3", b3)),
)
```
This is why the 64-bit pHash is split into four 16-bit (`b0`..`b3`) indexed sub-chunk columns at write time: Arkiv has no native "nearest neighbor" / Hamming-distance query, so the app approximates it with a cheap indexed OR across the four sub-chunks (any one 16-bit segment matching is enough to pull the entity in as a *candidate*), then computes the real Hamming distance / similarity percentage **client-side** in `lib/phash.ts: similarityPercent()` over whatever candidates come back, keeping only `>= 70%` matches. This is a recall-biased pre-filter, not an exact index — a near-duplicate that differs in *all four* 16-bit segments (very unlikely for the intended "same image, light edits" case, but not impossible) would not be found this way.

### 4.3 Ownership check — `verifyOwnership(imageHash, claimerAddress)`

```ts
and(
  eq("type", "image_registry"),
  eq("imageHash", cleanHash),
  eq("$owner", addr(cleanAddress)),
)
```
The only query that filters on a system field — note the value must be wrapped `addr(...)`, not passed as a bare string (bare strings default to `str` and would raise `InvalidPredicateError` against a system attribute whose type is fixed).

### 4.4 Incident lookup — `getIncidentLogsForOwner(ownerWallet)`

```ts
and(eq("type", "morphing_attempt"), eq("legitimateOwner", cleanWallet))
```
Powers `GET /api/incidents?wallet=0x...` and the dashboard's incidents table.

### 4.5 What never gets queried

`findSimilarImages` and `findExactImage` are **only called from `/api/check`** (the verify flow). `/api/register` (`src/app/api/register/route.ts`) does *not* call either — it only computes the pHash and uploads to Swarm, then hands off to the client, which signs a `createEntity` unconditionally. There is currently no duplicate/near-duplicate check in the registration path itself; dedup only happens if/when the user later runs a "verify" check against what they just registered.

---

## 5. Write paths (two, for two different trust boundaries)

| Path | Where | Signer | Used by |
| --- | --- | --- | --- |
| **Client-side, wallet-signed** | `useArkivWriter()` hook — builds its own `createArkivWalletClient({ chain: rabdi(...), transport: custom(window.ethereum) })` directly against the connected MetaMask account. | The end user's wallet (real tx, real gas, real signature). | `register-panel.tsx` → `registerImageOnChain()`; `verify-panel.tsx` → `createIncidentOnChain()` on a detected morph. |
| **Server-side, key-signed** | `createDefaultWalletClient()` in `src/lib/arkiv.ts`, keyed from `process.env.PRIVATE_KEY` (or a hardcoded local-dev fallback key — see `friction.md` §7). | Whatever `PRIVATE_KEY` resolves to. | Exported as `registerImage()` / `createIncidentLog()`, but **not currently called by any API route** — `/api/register` and `/api/check` never write; only the client-side hook does. This path exists as library plumbing (and is what the original hackathon submission doc, `swarm.md`, documents) but is effectively dead in the live request flow today. |

Both paths target the same two schemas and therefore produce interchangeable entities — a `registerImage()` write and a `registerImageOnChain()` write are indistinguishable once on-chain.

---

## 6. Chain configuration

- **Network**: Arkiv Rabdi testnet, chain id **7,794,095** / `0x76edaf` (confirmed from the SDK's own `rabdi.ts`; a stray `0x76ee4f` typo in this app's MetaMask `wallet_addEthereumChain` calls caused wallet connections to target the wrong chain id until fixed — see `friction.md` §3).
- **Native currency**: `tGLM` ("Golem"), **not** `tGTM` as an earlier internal note (`check-arkiv.md`) assumed.
- **RPC**: `https://rpc.rabdi.db-chain.testnet.arkiv.network`, with the access key appended as a URL path segment (`/…/<accessKey>`), not a header — see `friction.md` §5.
- **Entity contract address**: `0x4400000000000000000000000000000000000044` (`ARKIV_ADDRESS` in the SDK, not referenced directly by app code — only via the SDK's `createEntity`/`query` actions).
