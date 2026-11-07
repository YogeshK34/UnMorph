# Arkiv Integration — Friction Log

Concrete problems hit while building UnMorph against `@arkiv-network/sdk` (Rabdi testnet), what each one actually cost in debugging time/behavior, and where in the SDK's own source the real answer turned out to live. Every item here was reproduced against the live chain or confirmed by reading the SDK's shipped TypeScript source (it publishes real `.ts`, not just `.d.ts` — see §8), not guessed at.

---

## 1. Query result shape: system fields vs. attributes (the big one)

**Symptom:** every "is this image already registered" check returned "not found," even for an image registered seconds earlier by the same session, with the exact same wallet.

**Root cause, in two layers:**

1. This app originally hand-built query filters as raw strings: `` `type = "image_registry" AND imageHash = "${hash}"` ``. The real grammar requires **typed literals** — `str('...')`, `addr(...)`, `u64(...)`, etc. — never a bare double-quoted string. Querying the live chain directly with the old syntax throws immediately:
   ```
   QueryError: Query rejected (parse, -32001): unexpected character.
   Query: type = "image_registry" AND imageHash = "b3b34eadc60c8cca"
   ```
   Every call site wrapped this in `try { ... } catch { return null }`, so the parse error was swallowed silently on *every single read*, forever. Nothing in normal usage would ever have surfaced this — the app just always behaved as if the registry were empty.

2. Even after switching to the SDK's own `eq()`/`and()`/`or()` builders (which generate correct query strings automatically), a second, independent bug remained: a `query()` call with no `.from(schema)` selection returns **system fields flat** (`row.$owner`, `row.$key`, `row.$createdAt`, …) but wraps **every custom column** as `row.$attributes.<name>.value` — never `row.<name>`. This app's original field-access code read `entity.attributes?.imageHash` (wrong container name, no `$`) and `candidate.imageHash` (wrong — missing the `$attributes` layer entirely), both of which are `undefined` against a real row, every time.

**Fix:** switch to `eq`/`and`/`or` from `@arkiv-network/sdk/query` for every filter, and read custom attributes via `entity.$attributes?.[name]?.value` instead of `entity[name]` or `entity.attributes?.[name]`.

**Where the real answer lived:** not in any top-level README example seen in-repo — in the SDK's own `query/selection.ts` JSDoc ("*the selected entity fields and attributes side by side, flat*") and `schema/types.ts`'s `Value<tag, value> = { type, value }` shape. Confirmed by querying the live chain and inspecting the literal JSON shape returned.

**Severity:** critical — this silently broke 100% of "already registered / verify ownership / find similar" functionality from day one. It did not degrade gracefully; it failed identically to "nothing has ever been registered."

---

## 2. Payload (`bytes` column) decodes as a hex *string*, not `Uint8Array`

Downstream of §1: code written assuming `entity.payload` might be a `Uint8Array` (`instanceof Uint8Array` checks, `TextDecoder().decode(...)`) never matched reality. A `bytes` column, read back through `query()`, decodes as a **lowercase `0x`-prefixed hex string** (`schema/codec.ts: decodeRpcValue`, case `"bytes"`). The fix is a plain `Buffer.from(hex.replace(/^0x/, ""), "hex").toString("utf-8")` before `JSON.parse`, not a `TextDecoder` branch keyed on `typeof`/`instanceof`.

---

## 3. Chain id: decimal comment and hex literal drifted apart

`rabdi()`'s real chain id is `7794095` decimal. Converted correctly, that's `0x76edaf`. This app's `wallet_switchEthereumChain` / `wallet_addEthereumChain` calls (`useArkivWriter.ts`) used `"0x76ee4f"` instead — a different number entirely (`7794255` decimal). The comment right next to it even said *"Chain ID: 0x76ee4f / 7794095"* — decimal and hex no longer agreed with each other, and nothing catches that kind of drift at compile time since it's two independent string literals with no shared source of truth.

**Why this is easy to get wrong in the first place:** the SDK's `rabdi({ accessKey })` chain object already carries the correct id internally (`defineChain({ id: 7794095, ... })`), but `wallet_addEthereumChain`/`wallet_switchEthereumChain` are raw EIP-1193 calls this app has to make by hand against `window.ethereum` — there's no SDK helper that derives the hex chain id for you from the chain object you already have, so it gets re-typed by hand and can silently diverge.

**Effect when wrong:** MetaMask ends up switched to (or prompted to add) a *different* chain than the one the Arkiv wallet/public clients are actually configured for — transactions and queries then operate against mismatched chain state, surfacing as generic connection/signing failures with no obvious link back to a chain-id typo.

---

## 4. Entity lifetime silently capped at ~182 days, not "~1 year"

The SDK enforces a **protocol maximum entity lifetime of `MAX_LIFETIME = 7_884_000` blocks** at 2s/block ≈ **182.5 days** (`consts.ts`, `entity/expiry.ts`). Ask for anything longer and `resolveExpiry()` throws `InvalidExpiryError` client-side — before gas estimation, before the wallet even opens.

This app's own fallback/default lifetime (used in four places — `registerImage`, `createIncidentLog`, `registerImageOnChain`, `createIncidentOnChain`) is `7_884_000n` blocks exactly — i.e., someone already discovered and used the real protocol ceiling — but every comment next to it says **"~1 year"**. The real number is ~6 months. Worse, the register UI's own default state is `lifetimeDays = 365` with a `365d` quick-pick button and a `max="3650"` (10-year) input ceiling — so the **out-of-the-box default path in the UI requests a lifetime more than double what the chain allows**, and will throw `InvalidExpiryError` on first use unless the user happens to manually dial the day count down below ~182.

**Where the real ceiling lives:** `node_modules/@arkiv-network/sdk/src/consts.ts` and `entity/expiry.ts` — a one-line exported constant with a clear doc comment, but nothing in the day-to-day `createEntity`/`ExpirationTime.fromDays()` call surface surfaces that ceiling until you hit it at runtime (and even then, only by reading the thrown message carefully — see §4's `InvalidExpiryError` text, which *does* state the real number clearly once you get that far).

**Fix not yet applied in-repo:** clamp the UI's day picker to the chain's real maximum (or call `ExpirationTime.max()`, which the SDK suggests directly in the error message) and correct the "~1 year" comments.

---

## 5. Access key: one credential, two different undocumented behaviors

The original build-time question captured in `check-arkiv.md` (verbatim from the person building this): *"Could rate limiting on the public RPC be causing createEntity calls to silently fail or timeout rather than returning an error? And does the access key from hub.arkiv.network/access-keys work for both READ queries (publicClient) and WRITE transactions (walletClient)?"*

**Answer, confirmed from source:** yes, one key covers both — because the access key isn't a request header or a separate auth mechanism per client type, it's baked directly into the **RPC URL itself** at chain-config time: `rabdi({ accessKey })` builds `https://rpc.rabdi.db-chain.testnet.arkiv.network/<accessKey>` as the transport URL (`chains/rabdi.ts`). Any client — public or wallet — built from that same `rabdi({ accessKey })` call automatically inherits it. This isn't obvious from the top-level SDK usage examples; it only becomes clear by reading `chains/rabdi.ts` itself. With no key, the SDK logs a one-time console warning ("heavily rate limited") but does **not** throw — a missing/invalid key degrades silently into rate-limited (or eventually failing) requests rather than a clear configuration error up front.

---

## 6. Browser/MetaMask wallet client setup isn't the documented path

The SDK's own doc examples for `createWalletClient` show `privateKeyToAccount(...)` (Node.js/server signer). The browser/MetaMask pattern this app actually needs — `createWalletClient({ chain: rabdi(...), transport: custom(window.ethereum), account: <connected address> })` — had to be reverse-engineered from viem's own `custom()` transport convention rather than from an Arkiv-specific example. It works (viem's standard pattern applies directly), but it's one more thing confirmed by source-reading/trial rather than by following a documented browser quickstart.

A related, undocumented-by-example gap: the SDK does **not** switch the wallet's active chain for you. `createWalletClient` just binds a `chain` value for signing context — if MetaMask itself is still pointed at a different network, nothing in the SDK call stops you from building the client or stops the signature request from going through against the wrong chain. This app's `ensureRabdiNetwork()` helper (manual `wallet_switchEthereumChain`/`wallet_addEthereumChain` calls, see §3) exists purely to compensate for that — the chain switch is entirely the app's responsibility.

---

## 7. `createEntity`'s eager account validation forces a throwaway key into server code that never signs

`createWalletClient({ account, ... })` validates the account/private key eagerly, at construction time — even in code paths that only ever call the **public** client and never actually sign anything. `src/lib/arkiv.ts`'s `createDefaultWalletClient()` has to carry a hardcoded, well-known local-dev placeholder private key (`0xac09...`) purely so that importing the module doesn't throw when `process.env.PRIVATE_KEY` is unset — which is also true of most of this app's actual request paths, since reads happen through `publicClient` and writes happen client-side through the user's own wallet (see `schema.md` §5: the server-signing path is effectively unused in the live app). A lazy/optional account, or a public-client-only client type that doesn't require an account at all, would remove the need for this workaround.

---

## 8. What worked well (worth stating plainly)

The SDK ships its full, heavily-commented TypeScript **source** inside the published package (`node_modules/@arkiv-network/sdk/src/**/*.ts`), not just compiled `.d.ts` type stubs. Every finding above was ultimately confirmed — not guessed — by reading that source directly (`query/expression.ts`'s `render()` function for exact query syntax, `consts.ts` for `MAX_LIFETIME`, `chains/rabdi.ts` for the access-key URL behavior). That's genuinely unusual and was the single biggest unblock in this whole investigation; the friction isn't "the SDK is undocumented," it's that the **authoritative, correct answers live one level deeper than the quickstart/README surface**, in source JSDoc most developers won't think to open until something has already failed silently in production-like usage.
