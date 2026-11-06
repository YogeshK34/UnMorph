"use client";

import { useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";
import { Loader2, LogOut, Wallet } from "lucide-react";
import { truncateMiddle } from "@/lib/utils";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

const subscribeNoop = () => () => {};

export function ConnectWallet({ className = "" }: { className?: string }) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const displayConnected = mounted && isConnected;
  const displayAddress = mounted ? address : undefined;
  const { data: ensName } = useEnsName({ address: displayAddress });

  const handleConnect = async () => {
    // 1. Try to find the MetaMask / injected connector configured in Wagmi
    const connector =
      connectors.find((c) => c.id === "metaMask") ||
      connectors.find((c) => c.id === "metaMaskSDK") ||
      connectors.find((c) => c.name.toLowerCase().includes("metamask")) ||
      connectors.find((c) => c.id === "injected") ||
      connectors[0];

    if (connector) {
      connect({ connector });
      return;
    }

    // 2. Fallback: If no connector matched yet, trigger window.ethereum directly
    const eth =
      typeof window !== "undefined"
        ? (window as unknown as { ethereum?: EthereumProvider }).ethereum
        : undefined;

    if (eth) {
      try {
        await eth.request({ method: "eth_requestAccounts" });
        // After native prompt, re-run connect on available connector
        if (connectors[0]) {
          connect({ connector: connectors[0] });
        }
      } catch (err) {
        console.error("MetaMask direct request failed:", err);
      }
    } else {
      window.open("https://metamask.io/download/", "_blank");
    }
  };

  // Prevent SSR hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[13.5px] font-semibold text-white shadow-xs transition hover:bg-ink-soft ${className}`}
      >
        <Wallet className="size-4 text-brand-cyan" />
        <span>Connect MetaMask</span>
      </button>
    );
  }

  if (displayConnected && displayAddress) {
    const displayName = ensName ?? truncateMiddle(displayAddress, 6, 4);

    return (
      <div
        className={`inline-flex items-center gap-2 rounded-xl border border-line/80 bg-white px-2.5 py-1.5 shadow-xs ${className}`}
      >
        <span className="flex size-2 rounded-full bg-emerald-500" />
        <span className="font-mono text-[13px] font-medium text-ink" title={displayAddress}>
          {displayName}
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          title="Disconnect wallet"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-muted transition hover:bg-canvas hover:text-rose-600"
        >
          <LogOut className="size-3.5" />
          <span>Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isPending}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[13.5px] font-semibold text-white shadow-xs transition hover:bg-ink-soft active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 ${className}`}
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin text-brand-cyan" />
          <span>Connecting…</span>
        </>
      ) : (
        <>
          <Wallet className="size-4 text-brand-cyan" />
          <span>Connect MetaMask</span>
        </>
      )}
    </button>
  );
}
