"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";
import type { Connector } from "wagmi";
import { ExternalLink, Loader2, LogOut, Wallet, X } from "lucide-react";
import { truncateMiddle } from "@/lib/utils";

const subscribeNoop = () => () => {};

export function ConnectWallet({ className = "" }: { className?: string }) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingConnectorId, setPendingConnectorId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const displayConnected = mounted && isConnected;
  const displayAddress = mounted ? address : undefined;
  const { data: ensName } = useEnsName({ address: displayAddress });

  // Close modal on Escape key
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  // Deduplicate connectors by name to avoid duplicate list items
  const uniqueConnectors = connectors.filter(
    (c, index, self) => index === self.findIndex((item) => item.name === c.name),
  );

  const handleSelectConnector = (connector: Connector) => {
    setPendingConnectorId(connector.id);
    setConnectError(null);
    connect(
      { connector },
      {
        onSuccess: () => {
          setModalOpen(false);
          setPendingConnectorId(null);
        },
        onError: (err) => {
          setPendingConnectorId(null);
          setConnectError(err.message || "Failed to connect to wallet");
        },
      },
    );
  };

  // Prevent SSR hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[13.5px] font-semibold text-white shadow-xs transition hover:bg-ink-soft ${className}`}
      >
        <Wallet className="size-4 text-brand-cyan" />
        <span>Connect Wallet</span>
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
        {activeConnector?.name && (
          <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-muted">
            {activeConnector.name}
          </span>
        )}
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
    <>
      <button
        type="button"
        onClick={() => {
          setConnectError(null);
          setModalOpen(true);
        }}
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
            <span>Connect Wallet</span>
          </>
        )}
      </button>

      {/* Wallet Selection Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-line/80 bg-white p-5 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line/70 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-brand-teal" />
                <h3 className="font-display text-[16px] font-semibold text-ink">
                  Connect a Wallet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-2.5 text-[12.5px] text-muted">
              Choose your Ethereum wallet extension or browser provider to connect.
            </p>

            {connectError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-2.5 text-[12px] text-rose-700">
                {connectError}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {uniqueConnectors.length > 0 ? (
                uniqueConnectors.map((connector) => {
                  const isConnectingThis = isPending && pendingConnectorId === connector.id;

                  return (
                    <button
                      key={connector.uid || connector.id}
                      type="button"
                      onClick={() => handleSelectConnector(connector)}
                      disabled={isPending}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-line/80 bg-canvas/40 px-3.5 py-2.5 text-left text-[13.5px] font-medium text-ink transition hover:border-brand-aqua/80 hover:bg-brand-cyan/[0.04] disabled:opacity-60"
                    >
                      <div className="flex items-center gap-2.5">
                        {connector.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={connector.icon}
                            alt=""
                            className="size-5 shrink-0 rounded-md object-contain"
                          />
                        ) : (
                          <div className="bg-canvas-muted grid size-5 place-items-center rounded-md text-brand-teal">
                            <Wallet className="size-3.5" />
                          </div>
                        )}
                        <span>{connector.name}</span>
                      </div>

                      {isConnectingThis ? (
                        <Loader2 className="size-4 animate-spin text-brand-teal" />
                      ) : (
                        <span className="text-[11px] font-normal text-muted">Connect</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-[13px] text-muted">
                  No Ethereum wallet extensions detected.
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3 text-[11.5px] text-muted">
              <span>Need a wallet?</span>
              <div className="flex items-center gap-2 font-medium text-brand-teal">
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 hover:underline"
                >
                  MetaMask
                  <ExternalLink className="size-2.5" />
                </a>
                <span>·</span>
                <a
                  href="https://rabby.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 hover:underline"
                >
                  Rabby
                  <ExternalLink className="size-2.5" />
                </a>
                <span>·</span>
                <a
                  href="https://www.coinbase.com/wallet"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 hover:underline"
                >
                  Coinbase
                  <ExternalLink className="size-2.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
