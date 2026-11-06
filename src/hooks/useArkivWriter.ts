"use client";

import { useCallback, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { createWalletClient as createArkivWalletClient, ExpirationTime } from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { custom, type Address } from "viem";
import { ImageRegistrySchema, IncidentLogSchema } from "@/lib/arkiv";

interface EthereumRpcProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  selectedAddress?: string;
  [key: string]: unknown;
}

function getEthereum(): EthereumRpcProvider | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const win = window as unknown as {
      ethereum?: EthereumRpcProvider & { providers?: EthereumRpcProvider[] };
    };
    if (win.ethereum?.providers?.length) {
      return win.ethereum.providers[0];
    }
    return win.ethereum;
  } catch {
    return undefined;
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null) {
    const e = err as {
      message?: string;
      details?: string;
      shortMessage?: string;
      cause?: { details?: string; shortMessage?: string };
    };
    return (
      e.cause?.details ||
      e.cause?.shortMessage ||
      e.details ||
      e.shortMessage ||
      e.message ||
      fallback
    );
  }
  return fallback;
}

export interface RegisterOnChainParams {
  pHash: string;
  buckets: { b0: string; b1: string; b2: string; b3: string };
  swarmRef: string;
  ownerENS?: string;
  lifetimeBlocks?: bigint | number;
}

export interface CreateIncidentOnChainParams {
  targetImageHash: string;
  claimerWallet: string;
  legitimateOwner: string;
  similarityScore: number;
}

export interface ArkivWriteResult {
  entityKey: string;
  txHash: string;
}

// Arkiv Rabdi Testnet chain from SDK - has RPC URL baked in
export const arkivTestnet = rabdi({
  accessKey: process.env.NEXT_PUBLIC_ARKIV_ACCESS_KEY || "",
});

/**
 * Ensures the connected wallet is on the Arkiv Rabdi testnet (Chain ID: 0x76ee4f / 7794095).
 */
async function ensureRabdiNetwork(ethereum: EthereumRpcProvider) {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x76ee4f" }],
    });
  } catch (switchError: unknown) {
    const err = switchError as {
      code?: number;
      message?: string;
      data?: { originalError?: { code?: number } };
    };
    // 4902 indicates chain not added
    if (
      err.code === 4902 ||
      err?.data?.originalError?.code === 4902 ||
      err?.message?.includes("Unrecognized chain ID")
    ) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x76ee4f",
              chainName: "Arkiv Rabdi Testnet",
              nativeCurrency: {
                name: "Golem",
                symbol: "tGLM",
                decimals: 18,
              },
              rpcUrls: [
                process.env.NEXT_PUBLIC_ARKIV_ACCESS_KEY
                  ? `https://rpc.rabdi.db-chain.testnet.arkiv.network/${process.env.NEXT_PUBLIC_ARKIV_ACCESS_KEY}`
                  : "https://rpc.rabdi.db-chain.testnet.arkiv.network",
              ],
              blockExplorerUrls: null,
            },
          ],
        });
      } catch (addError: unknown) {
        throw new Error(getErrorMessage(addError, "Failed to add Arkiv Rabdi Testnet to wallet"));
      }
    } else {
      throw new Error(
        getErrorMessage(switchError, "Failed to switch to Arkiv Rabdi Testnet in wallet"),
      );
    }
  }
}

/**
 * Hook to write entities to Arkiv Web3 database signed directly by MetaMask.
 */
export function useArkivWriter() {
  const { address, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Registers a new image on Arkiv directly via connected wallet.
   */
  const registerImageOnChain = useCallback(
    async (
      pHash: string,
      buckets: { b0: string; b1: string; b2: string; b3: string },
      swarmRef: string,
      ownerENS: string = "none",
      lifetimeBlocks: bigint | number = 7_884_000n,
    ): Promise<ArkivWriteResult> => {
      setIsPending(true);
      setError(null);

      try {
        let ethereum: EthereumRpcProvider | undefined;
        if (connector) {
          try {
            ethereum = (await connector.getProvider()) as EthereumRpcProvider;
          } catch {
            // fallback
          }
        }
        if (!ethereum) {
          ethereum = getEthereum();
        }
        if (!ethereum) {
          const err = "Please connect an Ethereum wallet";
          setError(err);
          throw new Error(err);
        }

        // Prompt wallet to switch or add Arkiv Rabdi testnet
        console.log(
          "Current chainId:",
          await ethereum.request({
            method: "eth_chainId",
          }),
        );
        console.log("Expected: 0x76ee4f (7794095)");
        console.log("Step 4: Ensuring Rabdi network...");
        await ensureRabdiNetwork(ethereum);
        console.log("Step 4b: Rabdi network confirmed");

        // Resolve active account
        let activeAddress: Address | undefined =
          (address as Address) ||
          (walletClient?.account?.address as Address) ||
          (ethereum?.selectedAddress as Address);

        if (!activeAddress) {
          const accounts = (await ethereum.request({
            method: "eth_accounts",
          })) as string[] | undefined;
          if (accounts && accounts[0]) {
            activeAddress = accounts[0] as Address;
          }
        }

        if (!activeAddress) {
          const requested = (await ethereum.request({
            method: "eth_requestAccounts",
          })) as string[] | undefined;
          if (requested && requested[0]) {
            activeAddress = requested[0] as Address;
          }
        }

        if (!activeAddress) {
          throw new Error("No connected account found in wallet");
        }

        console.log("Step 5: Network confirmed, creating Arkiv client for account:", activeAddress);
        // Initialize Arkiv SDK client directly with custom transport and baked-in chain
        const arkivClient = createArkivWalletClient({
          chain: arkivTestnet,
          transport: custom(ethereum),
          account: activeAddress,
        });

        const cleanHash = pHash.toLowerCase().replace(/^0x/, "");
        const b0 = buckets.b0.toLowerCase().replace(/^0x/, "");
        const b1 = buckets.b1.toLowerCase().replace(/^0x/, "");
        const b2 = buckets.b2.toLowerCase().replace(/^0x/, "");
        const b3 = buckets.b3.toLowerCase().replace(/^0x/, "");

        const blocks =
          typeof lifetimeBlocks === "bigint"
            ? Number(lifetimeBlocks)
            : Number(lifetimeBlocks || 7_884_000);

        const payloadBytes = new TextEncoder().encode(
          JSON.stringify({
            swarmRef,
            registeredAt: Math.floor(Date.now() / 1000),
          }),
        );

        const schemaValues = {
          type: "image_registry",
          imageHash: cleanHash,
          b0,
          b1,
          b2,
          b3,
          ownerENS: ownerENS || "none",
          payload: payloadBytes,
        };

        console.log("Step 6: Calling arkivClient.createEntity...", {
          cleanHash,
          blocks,
        });
        const rawCreate = arkivClient.createEntity as (
          ...args: unknown[]
        ) => Promise<{ entityKey: string; txHash?: string }>;

        const result = await rawCreate(
          ImageRegistrySchema,
          schemaValues,
          { expiration: ExpirationTime.fromBlocks(Math.max(1, blocks)) },
          { gas: 500_000n },
        );

        console.log("Step 7: createEntity returned:", {
          entityKey: result.entityKey,
          txHash: result.txHash,
        });
        return {
          entityKey: result.entityKey,
          txHash: result.txHash || "",
        };
      } catch (err: unknown) {
        console.error("registerImageOnChain ERROR:", err);
        const msg = getErrorMessage(err, "Failed to sign registration with wallet");
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsPending(false);
      }
    },
    [address, connector, walletClient],
  );

  /**
   * Logs a detected morphing incident on Arkiv directly via connected wallet.
   */
  const createIncidentOnChain = useCallback(
    async (params: CreateIncidentOnChainParams): Promise<ArkivWriteResult> => {
      setIsPending(true);
      setError(null);

      try {
        let ethereum: EthereumRpcProvider | undefined;
        if (connector) {
          try {
            ethereum = (await connector.getProvider()) as EthereumRpcProvider;
          } catch {
            // fallback
          }
        }
        if (!ethereum) {
          ethereum = getEthereum();
        }
        if (!ethereum) {
          const err = "Please connect an Ethereum wallet";
          setError(err);
          throw new Error(err);
        }

        // Prompt wallet to switch or add Arkiv Rabdi testnet
        console.log(
          "Current chainId:",
          await ethereum.request({
            method: "eth_chainId",
          }),
        );
        console.log("Expected: 0x76ee4f (7794095)");
        console.log("Step 4: Ensuring Rabdi network...");
        await ensureRabdiNetwork(ethereum);
        console.log("Step 4b: Rabdi network confirmed");

        // Resolve active account
        let activeAddress: Address | undefined =
          (address as Address) ||
          (walletClient?.account?.address as Address) ||
          (ethereum?.selectedAddress as Address);

        if (!activeAddress) {
          const accounts = (await ethereum.request({
            method: "eth_accounts",
          })) as string[] | undefined;
          if (accounts && accounts[0]) {
            activeAddress = accounts[0] as Address;
          }
        }

        if (!activeAddress) {
          const requested = (await ethereum.request({
            method: "eth_requestAccounts",
          })) as string[] | undefined;
          if (requested && requested[0]) {
            activeAddress = requested[0] as Address;
          }
        }

        if (!activeAddress) {
          throw new Error("No connected account found in wallet");
        }

        // Initialize Arkiv SDK client directly with custom transport and baked-in chain
        const arkivClient = createArkivWalletClient({
          chain: arkivTestnet,
          transport: custom(ethereum),
          account: activeAddress,
        });

        const fixedLifetime = 7_884_000; // ~1 year retention for incident logs
        const payloadBytes = new TextEncoder().encode(
          JSON.stringify({
            similarityScore: params.similarityScore,
            detectedAt: Math.floor(Date.now() / 1000),
          }),
        );

        const schemaValues = {
          type: "morphing_attempt",
          targetImageHash: params.targetImageHash.toLowerCase().replace(/^0x/, ""),
          claimerWallet: params.claimerWallet.toLowerCase(),
          legitimateOwner: params.legitimateOwner.toLowerCase(),
          payload: payloadBytes,
        };

        const rawCreate = arkivClient.createEntity as (
          ...args: unknown[]
        ) => Promise<{ entityKey: string; txHash?: string }>;

        const result = await rawCreate(
          IncidentLogSchema,
          schemaValues,
          { expiration: ExpirationTime.fromBlocks(fixedLifetime) },
          { gas: 500_000n },
        );

        console.log("Step 7: createEntity returned:", {
          entityKey: result.entityKey,
          txHash: result.txHash,
        });
        return {
          entityKey: result.entityKey,
          txHash: result.txHash || "",
        };
      } catch (err: unknown) {
        console.error("createIncidentOnChain ERROR:", err);
        const msg = getErrorMessage(err, "Failed to sign incident log with wallet");
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsPending(false);
      }
    },
    [address, connector, walletClient],
  );

  return {
    registerImageOnChain,
    createIncidentOnChain,
    isPending,
    error,
  };
}
