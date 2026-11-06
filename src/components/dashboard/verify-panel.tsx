"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAccount } from "wagmi";
import { useArkivWriter } from "@/hooks/useArkivWriter";
import {
  ArrowRight,
  CircleCheck,
  Copy,
  ImageUp,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TriangleExclamationPoint,
} from "lucide-react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { VerdictBadge, verdictMeta } from "@/components/dashboard/verdict-badge";
import { Landscape, TAMPER_REGIONS } from "@/components/visuals/landscape";
import { buildVerification, type VerificationSubject } from "@/lib/build-verification";
import { seededHex, type Verification } from "@/lib/mock-data";
import { cn, formatBytes, truncateMiddle } from "@/lib/utils";
import {
  deriveVerdict,
  pipelineSteps,
  sceneForHash,
  sha256Hex,
  type VerdictResult,
} from "@/lib/verification";

const MAX_BYTES = 25 * 1024 * 1024;
const EASE = [0.16, 1, 0.3, 1] as const;

type Subject = VerificationSubject & { previewUrl?: string };

/** The shape of `result` returned by `POST /api/check`, as consumed by this panel. */
type ApiCheckResult =
  | { status: "VERIFIED"; owner: string; swarmRef: string; registeredAt: number }
  | { status: "NOT_REGISTERED" }
  | {
      status: "MORPHING_DETECTED";
      similarityPercent: number;
      legitimateOwner: string;
      targetImageHash: string;
      incidentKey?: string;
      txHash?: string;
    }
  | { status: "ALREADY_REGISTERED"; owner: string; registeredAt: number };

type Run =
  | { phase: "idle" }
  | { phase: "running"; subject: Subject; step: number; hash?: string }
  | {
      phase: "done";
      subject: Subject;
      hash: string;
      result: VerdictResult;
      record: Verification;
      apiResult?: ApiCheckResult;
    }
  | { phase: "error"; message: string };

/** Sample images. The leading hash byte picks the verdict bucket deterministically. */
const samples: (VerificationSubject & { hash: string; hint: string })[] = [
  {
    fileName: "harbor-dawn.jpg",
    scene: "harbor",
    sizeBytes: 3_204_118,
    dimensions: "4032 × 3024",
    hash: `1e${seededHex(41, 62)}`,
    hint: "Registered",
  },
  {
    fileName: "summit-edited.jpg",
    scene: "glacier",
    sizeBytes: 2_880_532,
    dimensions: "3000 × 2000",
    hash: `10${seededHex(42, 62)}`,
    hint: "Edited copy",
  },
  {
    fileName: "profile-upload.png",
    scene: "dusk",
    sizeBytes: 912_040,
    dimensions: "1600 × 1600",
    hash: `12${seededHex(43, 62)}`,
    hint: "Unknown origin",
  },
];

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

async function readDimensions(url: string) {
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return `${img.naturalWidth} × ${img.naturalHeight}`;
  } catch {
    return "Unknown";
  }
}

export function VerifyPanel({
  onComplete,
  onOpen,
  sequence,
}: {
  onComplete: (record: Verification) => void;
  onOpen: (record: Verification) => void;
  sequence: number;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { address, isConnected } = useAccount();
  const displayConnected = mounted && isConnected;
  const displayAddress = mounted ? address : undefined;
  const { createIncidentOnChain } = useArkivWriter();
  const [selectedMode, setSelectedMode] = useState<"existing" | "new">("existing");
  const [run, setRun] = useState<Run>({ phase: "idle" });
  const [dragging, setDragging] = useState(false);
  const runId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  const releasePreview = useCallback(() => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
  }, []);

  // Cancel in-flight runs + free object URLs when unmounted or hidden by <Activity>.
  useLayoutEffect(() => {
    const runs = runId;
    return () => {
      runs.current++;
      releasePreview();
      setRun({ phase: "idle" });
    };
  }, [releasePreview]);

  const execute = useCallback(
    async (subject: Subject, hashPromise: Promise<string>, file?: File) => {
      const id = ++runId.current;
      setRun({ phase: "running", subject, step: 0 });

      // Run API check in parallel with animation steps if a real File is provided
      const apiCheckPromise = (async (): Promise<ApiCheckResult | null> => {
        if (!file) return null;
        try {
          const connectedWallet = address || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
          const formData = new FormData();
          formData.append("image", file);
          formData.append("claimerWallet", connectedWallet);
          formData.append("mode", selectedMode);

          const response = await fetch("/api/check", {
            method: "POST",
            body: formData,
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.result) {
              return data.result as ApiCheckResult;
            }
          }
        } catch {
          // Gracefully fallback to deterministic local verdict
        }
        return null;
      })();

      let hash = "";
      for (let i = 0; i < pipelineSteps.length; i++) {
        if (runId.current !== id) return;
        setRun((r) => (r.phase === "running" ? { ...r, step: i } : r));
        await wait(pipelineSteps[i].duration);
        if (i === 0) {
          hash = await hashPromise;
          if (runId.current !== id) return;
          setRun((r) => (r.phase === "running" ? { ...r, hash } : r));
        }
      }
      if (runId.current !== id) return;

      const apiResult = await apiCheckPromise;
      let result: VerdictResult;

      if (apiResult?.status === "VERIFIED") {
        result = {
          verdict: "authentic",
          confidence: 100,
          alteredRegions: 0,
          fingerprintDistance: 0,
          humanVerified: true,
        };
      } else if (apiResult?.status === "MORPHING_DETECTED") {
        const sim = apiResult.similarityPercent || 85;
        result = {
          verdict: "tampered",
          confidence: sim,
          alteredRegions: 2,
          fingerprintDistance: Number(((100 - sim) / 100).toFixed(2)),
          humanVerified: false,
        };

        // Requirement 5: If MORPHING_DETECTED -> call createIncidentOnChain() -> MetaMask signs incident log
        if (isConnected && address && apiResult.legitimateOwner) {
          try {
            const onChainIncident = await createIncidentOnChain({
              targetImageHash: apiResult.targetImageHash || hash,
              claimerWallet: address,
              legitimateOwner: apiResult.legitimateOwner,
              similarityScore: sim,
            });
            apiResult.incidentKey = onChainIncident.entityKey;
            apiResult.txHash = onChainIncident.txHash;
          } catch (err) {
            console.warn("User declined or error signing incident log on Arkiv:", err);
          }
        }
      } else if (apiResult?.status === "NOT_REGISTERED") {
        result = {
          verdict: "unregistered",
          confidence: 0,
          alteredRegions: 0,
          fingerprintDistance: 1,
          humanVerified: false,
        };
      } else if (apiResult?.status === "ALREADY_REGISTERED") {
        result = {
          verdict: "authentic",
          confidence: 95,
          alteredRegions: 0,
          fingerprintDistance: 0,
          humanVerified: true,
        };
      } else {
        result = deriveVerdict(hash);
      }

      // Uploaded files get a stable placeholder scene for their table thumbnail.
      const final = subject.previewUrl ? { ...subject, scene: sceneForHash(hash) } : subject;
      const record = buildVerification(final, hash, result, sequence);
      setRun({ phase: "done", subject: final, hash, result, record, apiResult: apiResult ?? undefined });
      onComplete(record);
    },
    [address, createIncidentOnChain, isConnected, onComplete, selectedMode, sequence],
  );

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setRun({
          phase: "error",
          message: "That file isn't an image. Try a JPG, PNG, WebP or HEIC.",
        });
        return;
      }
      if (file.size > MAX_BYTES) {
        setRun({
          phase: "error",
          message: `That image is ${formatBytes(file.size)} — the limit is 25 MB.`,
        });
        return;
      }
      releasePreview();
      const previewUrl = URL.createObjectURL(file);
      previewRef.current = previewUrl;
      const hashPromise = file.arrayBuffer().then(sha256Hex);
      const dimensions = await readDimensions(previewUrl);
      const subject: Subject = {
        fileName: file.name,
        sizeBytes: file.size,
        dimensions,
        scene: "glacier",
        previewUrl,
      };
      void execute(subject, hashPromise, file);
    },
    [execute, releasePreview],
  );

  const reset = () => {
    runId.current++;
    releasePreview();
    setRun({ phase: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-3xl border border-line/80 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[17px] font-medium tracking-tight text-ink">
            Verify an image
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">
            The SHA-256 fingerprint is computed in your browser. Registry & analysis results are
            simulated.
          </p>
        </div>
        {run.phase !== "idle" && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-medium text-muted ring-1 ring-line transition-colors hover:bg-canvas hover:text-ink"
          >
            <RotateCcw className="size-3.5" /> Verify another
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="verify-file-input"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="mt-5">
        {/* Mode selector & wallet banner */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium text-muted">Mode:</span>
            <button
              type="button"
              onClick={() => setSelectedMode("existing")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[12px] font-medium transition",
                selectedMode === "existing"
                  ? "bg-ink text-white"
                  : "border border-line bg-canvas text-muted hover:text-ink",
              )}
            >
              Existing image check
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode("new")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[12px] font-medium transition",
                selectedMode === "new"
                  ? "bg-ink text-white"
                  : "border border-line bg-canvas text-muted hover:text-ink",
              )}
            >
              New upload check
            </button>
          </div>

          {!displayConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-amber-700">
                Connect wallet to verify ownership:
              </span>
              <ConnectWallet />
            </div>
          ) : (
            <span className="font-mono text-[12px] text-muted">
              Claimer:{" "}
              <span className="text-ink">{truncateMiddle(displayAddress || "", 6, 4)}</span>
            </span>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {(run.phase === "idle" || run.phase === "error") && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  void handleFile(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-300",
                  dragging
                    ? "border-brand-aqua bg-brand-cyan/[0.06]"
                    : "border-line bg-canvas/60 hover:border-brand-aqua/60 hover:bg-brand-cyan/[0.03]",
                )}
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand-teal shadow-glass ring-1 ring-line/70 transition-transform duration-500 ease-(--ease-out-expo) group-hover:-translate-y-1">
                  <ImageUp className="size-5" />
                </span>
                <span className="mt-4 font-display text-[15px] font-semibold text-ink">
                  {dragging ? "Release to verify" : "Drop an image to verify"}
                </span>
                <span className="mt-1 text-[13px] text-muted">
                  or{" "}
                  <span className="font-medium text-brand-teal underline-offset-4 group-hover:underline">
                    browse files
                  </span>{" "}
                  · JPG, PNG, WebP up to 25 MB
                </span>
              </button>

              {run.phase === "error" && (
                <p
                  role="alert"
                  className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-800"
                >
                  <TriangleExclamationPoint className="size-4 shrink-0" />
                  {run.message}
                </p>
              )}

              <div className="mt-5">
                <p className="text-[12px] font-medium text-muted">Or try a sample</p>
                <ul className="mt-2 grid grid-cols-3 gap-3">
                  {samples.map((s) => (
                    <li key={s.fileName}>
                      <button
                        type="button"
                        onClick={() =>
                          execute(
                            { ...s },
                            wait(250).then(() => s.hash),
                          )
                        }
                        className="group w-full overflow-hidden rounded-2xl text-left ring-1 ring-line/80 transition-shadow hover:shadow-float"
                        aria-label={`Verify sample ${s.fileName}`}
                      >
                        <span className="block aspect-[4/3] overflow-hidden">
                          <span className="block size-full transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105">
                            <Landscape variant={s.scene} tampered={s.hint === "Edited copy"} />
                          </span>
                        </span>
                        <span className="block px-3 py-2">
                          <span className="block truncate text-[12px] font-medium text-ink">
                            {s.fileName}
                          </span>
                          <span className="block text-[11px] text-muted">{s.hint}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {(run.phase === "running" || run.phase === "done") && (
            <motion.div
              key="run"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="grid gap-5 md:grid-cols-[1fr_1.1fr]"
            >
              <Preview run={run} />
              {run.phase === "running" ? (
                <Steps step={run.step} hash={run.hash} />
              ) : (
                <Result run={run} onOpen={() => onOpen(run.record)} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Preview({ run }: { run: Extract<Run, { phase: "running" | "done" }> }) {
  const { subject } = run;
  const done = run.phase === "done";
  const tampered = done && run.result.verdict === "tampered";

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas ring-1 ring-line/70">
        {subject.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img
            src={subject.previewUrl}
            alt={`Preview of ${subject.fileName}`}
            className="size-full object-cover"
          />
        ) : (
          <Landscape
            variant={subject.scene}
            tampered={subject.fileName === "summit-edited.jpg"}
            title={subject.fileName}
          />
        )}

        {!done && (
          <div aria-hidden className="absolute inset-x-0 top-0 h-[12%] animate-scan">
            <div className="h-full bg-gradient-to-b from-transparent via-brand-cyan/25 to-brand-cyan/50" />
            <div className="h-px bg-brand-cyan shadow-[0_0_18px_2px_rgb(6_214_255/0.9)]" />
          </div>
        )}

        {tampered &&
          TAMPER_REGIONS.slice(0, Math.max(1, Math.min(2, run.result.alteredRegions))).map(
            (r, i) => (
              <motion.span
                key={r.id}
                initial={{ opacity: 0, scale: 1.25 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.15, duration: 0.5, ease: EASE }}
                className="absolute rounded-md border-2 border-verdict-tampered bg-verdict-tampered/15"
                style={{
                  left: `${r.left}%`,
                  top: `${r.top}%`,
                  width: `${r.width}%`,
                  height: `${r.height}%`,
                }}
              />
            ),
          )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[12px]">
        <span className="truncate font-medium text-ink">{subject.fileName}</span>
        <span className="shrink-0 text-muted tabular-nums">
          {formatBytes(subject.sizeBytes)} · {subject.dimensions}
        </span>
      </div>
    </div>
  );
}

function Steps({ step, hash }: { step: number; hash?: string }) {
  const progress = ((step + 0.5) / pipelineSteps.length) * 100;
  return (
    <div className="flex flex-col" aria-live="polite">
      <ol className="space-y-1.5">
        {pipelineSteps.map((s, i) => {
          const state = i < step ? "done" : i === step ? "running" : "pending";
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300",
                state === "running" && "bg-brand-cyan/[0.07]",
              )}
            >
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center">
                {state === "done" ? (
                  <CircleCheck className="size-5 text-brand-teal" />
                ) : state === "running" ? (
                  <LoaderCircle className="size-4.5 animate-spin text-brand-aqua" />
                ) : (
                  <span className="size-2 rounded-full bg-line" />
                )}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-[13.5px] font-medium",
                    state === "running"
                      ? "shimmer-text"
                      : state === "done"
                        ? "text-ink"
                        : "text-muted",
                  )}
                >
                  {s.label}
                </span>
                <span className="block text-[12px] text-muted">
                  {s.id === "fingerprint" && hash ? (
                    <span className="font-mono">sha256 {truncateMiddle(hash, 10, 6)}</span>
                  ) : (
                    s.detail
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-auto pt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-brand-cyan/15">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-teal via-brand-aqua to-brand-cyan"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </div>
      </div>
    </div>
  );
}

function Result({ run, onOpen }: { run: Extract<Run, { phase: "done" }>; onOpen: () => void }) {
  const { result, hash, record } = run;
  const meta = verdictMeta[result.verdict];
  const Icon = meta.icon;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const facts: [string, React.ReactNode][] = [
    [
      "SHA-256",
      <button
        key="sha"
        type="button"
        onClick={() => navigator.clipboard?.writeText(hash).then(() => setCopied(true))}
        className="inline-flex items-center gap-1.5 font-mono text-ink hover:text-brand-teal"
        aria-label="Copy SHA-256 digest"
      >
        {truncateMiddle(hash, 8, 6)}
        {copied ? (
          <CircleCheck className="size-3.5 text-brand-teal" />
        ) : (
          <Copy className="size-3.5 text-muted" />
        )}
      </button>,
    ],
    [
      "Arkiv record",
      record.arkivRecord ? (
        <span className="font-mono">{truncateMiddle(record.arkivRecord, 10, 4)}</span>
      ) : (
        "Not found"
      ),
    ],
    ["Human attestation", result.humanVerified ? "World ID verified" : "None"],
    ["Altered regions", String(result.alteredRegions)],
    [
      "Fingerprint distance",
      result.verdict === "unregistered" ? "—" : result.fingerprintDistance.toFixed(2),
    ],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col"
      data-testid="verify-result"
    >
      <div className="flex items-center gap-3">
        <motion.span
          initial={{ scale: 0.5, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
          className={cn("grid size-12 place-items-center rounded-2xl", meta.soft)}
        >
          <Icon className="size-6" />
        </motion.span>
        <div>
          <VerdictBadge verdict={result.verdict} size="md" />
          <p className="mt-1 text-[12.5px] text-muted">{meta.description}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[12px] text-muted">Confidence</p>
          <p className="text-[1.5rem] leading-tight font-semibold text-ink">{result.confidence}%</p>
        </div>
      </div>

      {/* Task 3: Status Banners */}
      {run.apiResult?.status === "VERIFIED" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13.5px] font-semibold text-emerald-900">
          <CircleCheck className="size-4.5 shrink-0 text-emerald-600" />
          <span>✅ Verified — you are the registered owner</span>
        </div>
      )}

      {run.apiResult?.status === "NOT_REGISTERED" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-canvas/80 px-4 py-3 text-[13.5px] font-medium text-muted">
          <span className="size-2 shrink-0 rounded-full bg-muted" />
          <span>Image not found in registry</span>
        </div>
      )}

      {run.apiResult?.status === "MORPHING_DETECTED" && (
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-rose-900">
          <div className="flex items-center gap-2 text-[13.5px] font-semibold">
            <ShieldAlert className="size-4.5 shrink-0 text-rose-600" />
            <span>
              🚩 Morphing detected — similarity: {run.apiResult.similarityPercent}%, real owner:{" "}
              <span className="font-mono">
                {truncateMiddle(run.apiResult.legitimateOwner, 6, 4)}
              </span>
            </span>
          </div>
          {run.apiResult.incidentKey && (
            <p className="mt-1 font-mono text-[11.5px] text-rose-700">
              Incident logged on Arkiv: {truncateMiddle(run.apiResult.incidentKey, 10, 6)}
            </p>
          )}
        </div>
      )}

      {run.apiResult?.status === "ALREADY_REGISTERED" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[13.5px] font-semibold text-amber-900">
          <ShieldCheck className="size-4.5 shrink-0 text-amber-600" />
          <span>Already registered by {truncateMiddle(run.apiResult.owner, 6, 4)}</span>
        </div>
      )}

      <dl className="mt-5 divide-y divide-line/70 rounded-2xl bg-canvas/70 px-4 text-[13px] ring-1 ring-line/60">
        {facts.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={onOpen}
        className="group mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink text-[13.5px] font-semibold text-white transition-colors hover:bg-ink-soft"
      >
        View full report
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  );
}
