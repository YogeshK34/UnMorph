I am building a dApp at ETHGlobal Mumbai 2026 using Arkiv
(@arkiv-network/sdk) and Next.js. I need to make on-chain
writes to Arkiv Rabdi testnet using my MetaMask wallet.

My setup:

- Chain: Arkiv Rabdi testnet
- ChainId: 0x76ee4f (7794095)
- RPC: https://rpc.rabdi.db-chain.testnet.arkiv.network
- Native currency: tGTM
- My wallet has 20 tGTM (funded via Arkiv faucet)
- SDK: @arkiv-network/sdk with arkivTestnet chain config

My client initialization in the browser (useArkivWriter hook):

const walletClient = createWalletClient({
chain: arkivTestnet,
transport: custom(window.ethereum),
account: address,
})

Questions:

1. Is tGTM the correct gas token for Arkiv Rabdi testnet
   or is it something else?

2. Is 20 tGTM enough to call createEntity multiple times?

3. When I initialize createWalletClient with custom(window.ethereum)
   and arkivTestnet chain — does MetaMask need to already be
   switched to Arkiv Rabdi testnet BEFORE the createEntity call,
   or does the SDK handle chain switching?

4. What is the correct way to initialize the Arkiv SDK
   walletClient for browser/MetaMask usage specifically?
   The docs show privateKeyToAccount for Node.js but I need
   the browser MetaMask equivalent.

5. Is there anything specific about Arkiv Rabdi testnet that
   makes it different from standard EVM chains when it comes
   to signing transactions via MetaMask?

Please give me the exact working code for browser-side
Arkiv walletClient initialization using MetaMask/wagmi.
Arkiv SDK docs: https://docs.arkiv.network

Additionally — the Arkiv SDK logs this warning in my console:

"Rabdi: no access key, so requests go to the public endpoint,
which is heavily rate limited."

Could rate limiting on the public RPC be causing createEntity
calls to silently fail or timeout rather than returning an error?
And does the access key from hub.arkiv.network/access-keys
work for both READ queries (publicClient) and WRITE transactions
(walletClient)?
