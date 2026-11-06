"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { useAccount, useEnsName } from "wagmi";
import { useArkivWriter } from "@/hooks/useArkivWriter";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  ImageUp,
  Loader2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { cn, formatBytes, truncateMiddle } from "@/lib/utils";

type NewImageResult =
  | {
      status: "REGISTERED_SUCCESS";
      entityKey: string;
      txHash: string;
      swarmRef: string;
      pHash: string;
    }
  | {
      status: "ALREADY_REGISTERED";
      owner: string;
      registeredAt: number;
    }
  | {
      status: "MORPHING_DETECTED";
      incidentKey: string;
      similarityPercent: number;
      legitimateOwner: string;
    };

const subscribeNoop = () => () => {};

export function RegisterPanel({ onRegistered }: { onRegistered?: () => void }) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const { address, isConnected } = useAccount();
  const displayConnected = mounted && isConnected;
  const displayAddress = mounted ? address : undefined;
  const { data: ensName } = useEnsName({ address: displayAddress });

  const { registerImageOnChain } = useArkivWriter();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lifetimeDays, setLifetimeDays] = useState<number>(365);
  const [loading, setLoading] = useState(false);
  const [stepText, setStepText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NewImageResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }
    setError(null);
    setResult(null);
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleReset = () => {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setStepText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !displayConnected || !address) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setStepText("1/2: Computing pHash & uploading backup to Swarm…");

    try {
      console.log("Step 1: Starting register...");
      // Step 1: POST to /api/register to compute pHash & upload to Swarm
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Step 2: Got server response:", data);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process image on server");
      }

      const pHash = data.pHash || data.result?.pHash;
      const buckets = data.buckets || data.result?.buckets;
      const swarmRef = data.swarmRef || data.result?.swarmRef;

      // Step 2: Call registerImageOnChain() from hook -> Wallet popup appears -> user signs
      setStepText("2/2: Confirm transaction in your wallet to sign on Arkiv…");

      const blocksPerDay = 24 * 60 * 30; // 43,200 blocks/day
      const lifetimeBlocks = BigInt(Math.round(lifetimeDays * blocksPerDay));

      console.log("Step 3: Calling registerImageOnChain with:", { pHash, buckets, swarmRef });
      const onChain = await registerImageOnChain(
        pHash,
        buckets,
        swarmRef,
        ensName ?? "none",
        lifetimeBlocks,
      );

      // Step 3: Show real txHash from MetaMask transaction
      setResult({
        status: "REGISTERED_SUCCESS",
        entityKey: onChain.entityKey,
        txHash: onChain.txHash,
        swarmRef,
        pHash,
      });

      if (onRegistered) onRegistered();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred during registration",
      );
    } finally {
      setLoading(false);
      setStepText("");
    }
  };

  return (
    <div className="rounded-3xl border border-line/80 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-cyan/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-brand-teal">
            Arkiv Web3 DB + ETH Swarm
          </div>
          <h2 className="mt-1 font-display text-[18px] font-medium tracking-tight text-ink">
            Register image ownership
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Anchors perceptual hash (pHash) into Arkiv and stores unencrypted backup on Swarm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ConnectWallet />
          {imageFile && !loading && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-medium text-muted ring-1 ring-line transition-colors hover:bg-canvas hover:text-ink"
            >
              <RotateCcw className="size-3.5" /> Register another
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleSelectFile(e.target.files?.[0])}
      />

      {/* Always render form, never conditionally swap element type */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Upload Zone or Preview */}
        {!previewUrl ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleSelectFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200",
              dragging
                ? "border-brand-aqua bg-brand-cyan/[0.06]"
                : "border-line bg-canvas/60 hover:border-brand-aqua/60 hover:bg-brand-cyan/[0.03]",
            )}
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand-teal shadow-glass ring-1 ring-line/70 transition-transform duration-300 group-hover:-translate-y-1">
              <ImageUp className="size-5" />
            </span>
            <span className="mt-3 font-display text-[15px] font-semibold text-ink">
              {dragging ? "Release image to select" : "Click or drag image to register"}
            </span>
            <span className="mt-1 text-[13px] text-muted">
              JPG, PNG, WebP up to 25 MB · Generates 64-bit DCT perceptual hash
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas/40 p-4 sm:flex-row sm:items-center">
            <div className="relative aspect-video w-full max-w-[180px] shrink-0 overflow-hidden rounded-xl border border-line bg-white shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Selected preview" className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{imageFile?.name}</p>
              <p className="text-[12.5px] text-muted">
                {imageFile ? formatBytes(imageFile.size) : ""} · Ready for pHash indexing
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="text-[12px] font-medium text-brand-teal hover:underline disabled:opacity-50"
                >
                  Change file
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Inputs: Lifetime and Wallet Display */}
        {previewUrl && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="lifetime" className="block text-[12px] font-medium text-ink">
                Registry Lifetime (Days)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="lifetime"
                  type="number"
                  min="1"
                  max="3650"
                  value={lifetimeDays}
                  onChange={(e) => setLifetimeDays(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={loading}
                  className="h-9 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand-aqua"
                />
                <div className="flex gap-1">
                  {[30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setLifetimeDays(d)}
                      disabled={loading}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[11px] font-medium transition",
                        lifetimeDays === d
                          ? "bg-ink text-white"
                          : "border border-line bg-canvas text-muted hover:text-ink",
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Auto-converts to ~{lifetimeDays * 24 * 60 * 30} Arkiv blocks
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-ink">Owner Wallet</label>
              <div className="mt-1 flex h-9 items-center justify-between rounded-xl border border-line bg-canvas/70 px-3 font-mono text-[12.5px] text-ink">
                <span>
                  {displayAddress ? truncateMiddle(displayAddress, 8, 6) : "Wallet not connected"}
                </span>
                {ensName && (
                  <span className="font-sans text-[11px] text-brand-teal">{ensName}</span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Automatically registered as on-chain $owner
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
            <TriangleAlert className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit button - always rendered inside form when not in result state */}
        {!result && (
          <button
            type="submit"
            disabled={!displayConnected || loading || !imageFile}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink text-[14px] font-semibold text-white shadow-xs transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin text-brand-cyan" />
                <span>
                  {stepText || "Processing pHash, uploading to Swarm & signing on Arkiv…"}
                </span>
              </>
            ) : !displayConnected ? (
              <>
                <Wallet className="size-4 text-brand-cyan" />
                <span>Connect wallet to register</span>
              </>
            ) : (
              <>
                <span>Register Original on Arkiv + Swarm</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        )}
      </form>

      {/* Result Display — strictly per prompt requirements */}
      {result && (
        <div className="mt-5 space-y-3">
          {/* 'REGISTERED_SUCCESS' → show success: entityKey, txHash, swarmRef */}
          {result.status === "REGISTERED_SUCCESS" && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2.5 text-emerald-800">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <h3 className="text-[15px] font-semibold">Image Registered Successfully</h3>
              </div>
              <p className="mt-1 text-[13px] text-muted">
                Original image anchored on Arkiv Web3 database with public unencrypted replica on
                ETH Swarm.
              </p>

              <div className="mt-3 divide-y divide-emerald-500/10 rounded-xl border border-emerald-500/20 bg-white p-3 text-[12.5px]">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted">Entity Key</span>
                  <div className="flex items-center gap-1.5 font-mono text-ink">
                    <span>{truncateMiddle(result.entityKey, 10, 8)}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.entityKey, "entity")}
                      title="Copy Entity Key"
                      className="text-muted hover:text-ink"
                    >
                      {copiedKey === "entity" ? (
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted">Transaction Hash</span>
                  <div className="flex items-center gap-1.5 font-mono text-ink">
                    <span>{truncateMiddle(result.txHash, 10, 8)}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.txHash, "tx")}
                      title="Copy Tx Hash"
                      className="text-muted hover:text-ink"
                    >
                      {copiedKey === "tx" ? (
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted">Swarm Reference</span>
                  <div className="flex items-center gap-1.5 font-mono text-ink">
                    <span>{truncateMiddle(result.swarmRef, 10, 8)}</span>
                    <a
                      href={`https://api.gateway.ethswarm.org/bzz/${result.swarmRef}/`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in Swarm Gateway"
                      className="inline-flex items-center gap-0.5 text-brand-teal hover:underline"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted">pHash (64-bit DCT)</span>
                  <span className="font-mono text-ink">{result.pHash}</span>
                </div>
              </div>
            </div>
          )}

          {/* 'ALREADY_REGISTERED' → show: "This image is already registered by [owner]" */}
          {result.status === "ALREADY_REGISTERED" && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-amber-600" />
                <h3 className="text-[15px] font-semibold">Already Registered</h3>
              </div>
              <p className="mt-2 text-[13.5px]">
                This image is already registered by{" "}
                <span className="font-mono font-semibold">{result.owner}</span>
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Registered on: {new Date(result.registeredAt * 1000).toLocaleString()}
              </p>
            </div>
          )}

          {/* 'MORPHING_DETECTED' → show warning: "Morphing attempt detected — similarity: X%, legitimate owner: [legitimateOwner]" also show incidentKey */}
          {result.status === "MORPHING_DETECTED" && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-900">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-rose-600" />
                <h3 className="text-[15px] font-semibold">Morphing Attempt Detected</h3>
              </div>
              <p className="mt-2 text-[13.5px] font-medium">
                Morphing attempt detected — similarity: {result.similarityPercent}%, legitimate
                owner: <span className="font-mono font-semibold">{result.legitimateOwner}</span>
              </p>
              <div className="mt-3 rounded-xl border border-rose-500/20 bg-white p-3 font-mono text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Incident Log Key:</span>
                  <span className="font-bold text-rose-700">
                    {truncateMiddle(result.incidentKey, 12, 10)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[11.5px] text-muted">
                An immutable security incident was logged on Arkiv under the legitimate owner&apos;s
                records.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
