"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useAccount } from "wagmi";
import { AlertTriangle, CheckCircle2, Copy, RefreshCw, ShieldAlert, Wallet } from "lucide-react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { truncateMiddle } from "@/lib/utils";

interface IncidentEntity {
  entityKey?: string;
  $owner?: string;
  payload?: unknown;
  attributes?: {
    type?: string;
    targetImageHash?: string;
    claimerWallet?: string;
    similarityScore?: number;
    detectedAt?: number;
    [key: string]: unknown;
  };
}

const subscribeNoop = () => () => {};

export function IncidentsTable() {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const { address, isConnected } = useAccount();
  const displayConnected = mounted && isConnected;
  const displayAddress = mounted ? address : undefined;
  const [incidents, setIncidents] = useState<IncidentEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents?wallet=${address}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.incidents)) {
        setIncidents(data.incidents);
      } else {
        setIncidents([]);
      }
    } catch (err) {
      console.error("Failed to fetch incidents:", err);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;
    const timer = setTimeout(() => {
      void fetchIncidents();
    }, 0);
    return () => clearTimeout(timer);
  }, [address, fetchIncidents]);

  const displayedIncidents = address ? incidents : [];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="rounded-3xl border border-line/80 bg-white">
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="size-4" />
            </span>
            <h2 className="font-display text-[17px] font-medium tracking-tight text-ink">
              Morphing incident log
            </h2>
            {incidents.length > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                {incidents.length} {incidents.length === 1 ? "incident" : "incidents"}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Immutable security logs recorded on Arkiv whenever someone attempts to re-register or
            verify a morphed variant of your images.
          </p>
        </div>

        {displayConnected && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchIncidents}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas/60 px-3 py-1.5 text-[12.5px] font-medium text-ink transition hover:bg-canvas"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        )}
      </div>

      {!displayConnected ? (
        <div className="border-t border-line/70 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <Wallet className="size-6" />
          </div>
          <h3 className="mt-3 text-[15px] font-semibold text-ink">
            Connect MetaMask to view incident logs
          </h3>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">
            Arkiv indexes incident logs by legitimate owner. Connect the wallet that owns your
            registered images to query live on-chain logs.
          </p>
          <div className="mt-4">
            <ConnectWallet />
          </div>
        </div>
      ) : displayedIncidents.length === 0 ? (
        <div className="border-t border-line/70 p-8 text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <h3 className="mt-2 text-[14.5px] font-medium text-ink">No morphing attempts detected</h3>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
            All registered images owned by{" "}
            <span className="font-mono">{truncateMiddle(displayAddress || "", 6, 4)}</span> are
            clean with no recorded tampering or unauthorized duplicates.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-line/70">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-canvas/60 text-[11.5px] font-semibold tracking-wider text-muted uppercase">
              <tr>
                <th className="px-5 py-3 sm:px-6">Target Image Hash</th>
                <th className="px-4 py-3">Claimer Wallet</th>
                <th className="px-4 py-3">Similarity</th>
                <th className="px-4 py-3">Detected At</th>
                <th className="px-5 py-3 text-right sm:px-6">Incident Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {displayedIncidents.map((inc, i) => {
                let payload: { similarityScore?: number; detectedAt?: number } = {};
                try {
                  payload =
                    typeof inc.payload === "string"
                      ? JSON.parse(inc.payload)
                      : (inc.payload as typeof payload) || {};
                } catch {
                  payload = {};
                }

                const sim = payload.similarityScore ?? inc.attributes?.similarityScore ?? 100;
                const detectedAt = payload.detectedAt ?? inc.attributes?.detectedAt ?? 0;
                const targetHash = inc.attributes?.targetImageHash || "—";
                const claimer = inc.attributes?.claimerWallet || inc.$owner || "Unknown";
                const incidentKey = inc.entityKey || `inc_${i}`;

                // Target Image Hash (truncated, first 8 + last 4 chars)
                const formattedHash =
                  targetHash.length > 12
                    ? `${targetHash.slice(0, 8)}...${targetHash.slice(-4)}`
                    : targetHash;

                return (
                  <tr key={incidentKey} className="transition-colors hover:bg-canvas/30">
                    <td className="px-5 py-3 font-mono font-medium text-ink sm:px-6">
                      <span title={targetHash}>{formattedHash}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted">
                      <div className="flex items-center gap-1.5">
                        <span title={claimer}>{truncateMiddle(claimer, 8, 6)}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(claimer, `claim_${i}`)}
                          className="hover:text-ink"
                          title="Copy claimer address"
                        >
                          {copiedKey === `claim_${i}` ? (
                            <CheckCircle2 className="size-3 text-emerald-600" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11.5px] font-bold text-rose-700">
                        <AlertTriangle className="size-3" />
                        {sim}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {detectedAt > 0
                        ? new Date(detectedAt * 1000).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-muted sm:px-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <span title={incidentKey}>{truncateMiddle(incidentKey, 8, 6)}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(incidentKey, `key_${i}`)}
                          className="hover:text-ink"
                          title="Copy Incident Key"
                        >
                          {copiedKey === `key_${i}` ? (
                            <CheckCircle2 className="size-3 text-emerald-600" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
