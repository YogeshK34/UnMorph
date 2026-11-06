import { NextRequest, NextResponse } from "next/server";
import { computePHash, similarityPercent } from "@/lib/phash";
import { findExactImage, findSimilarImages, verifyOwnership, type ArkivEntity } from "@/lib/arkiv";

function isValidEthereumAddress(address: unknown): address is string {
  return typeof address === "string" && /^0x[0-9a-fA-F]{40}$/.test(address.trim());
}

function parseEntityPayload(entity: ArkivEntity | null | undefined): {
  swarmRef: string;
  registeredAt: number;
} {
  const fallback = {
    swarmRef: "",
    registeredAt: Math.floor(Date.now() / 1000),
  };
  if (!entity || !entity.payload) return fallback;
  try {
    if (typeof entity.payload === "object" && !(entity.payload instanceof Uint8Array)) {
      return {
        swarmRef: entity.payload.swarmRef || fallback.swarmRef,
        registeredAt: entity.payload.registeredAt ?? fallback.registeredAt,
      };
    }
    const text =
      entity.payload instanceof Uint8Array
        ? new TextDecoder().decode(entity.payload)
        : String(entity.payload);
    const parsed = JSON.parse(text);
    return {
      swarmRef: parsed.swarmRef || fallback.swarmRef,
      registeredAt: parsed.registeredAt ?? fallback.registeredAt,
    };
  } catch {
    return fallback;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const imageFile = formData.get("image");
    const claimerWallet = formData.get("claimerWallet");
    const modeRaw = formData.get("mode");
    const mode = typeof modeRaw === "string" ? modeRaw.trim().toLowerCase() : "existing";

    // Validate mode
    if (mode !== "new" && mode !== "existing") {
      return NextResponse.json(
        { success: false, error: 'Invalid mode parameter (expected "new" or "existing")' },
        { status: 400 },
      );
    }

    // Validate image presence
    if (!imageFile || !(imageFile instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid image file in request" },
        { status: 400 },
      );
    }

    // Validate wallet address
    if (!claimerWallet || !isValidEthereumAddress(claimerWallet)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid claimerWallet address (expected 0x... 40 hex chars)",
        },
        { status: 400 },
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    if (imageBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Uploaded image file is empty" },
        { status: 400 },
      );
    }

    const cleanClaimer = claimerWallet.trim().toLowerCase();

    // 1. Compute pHash server side
    const { fullHash, b0, b1, b2, b3 } = await computePHash(imageBuffer);
    const buckets = { b0, b1, b2, b3 };

    // 2. Perform Arkiv read queries (NO server writes)
    if (mode === "existing") {
      // Step A: Check exact match
      const exactMatch = await findExactImage(fullHash);
      if (exactMatch) {
        const isOwner = await verifyOwnership(fullHash, cleanClaimer);
        if (isOwner) {
          const { swarmRef, registeredAt } = parseEntityPayload(exactMatch);
          return NextResponse.json(
            {
              success: true,
              result: {
                status: "VERIFIED",
                owner: cleanClaimer,
                swarmRef,
                registeredAt,
              },
            },
            { status: 200 },
          );
        } else {
          const legitimateOwner = (exactMatch.$owner || exactMatch.owner || "").toLowerCase();
          return NextResponse.json(
            {
              success: true,
              result: {
                status: "MORPHING_DETECTED",
                similarityPercent: 100,
                legitimateOwner,
                targetImageHash: fullHash,
              },
            },
            { status: 200 },
          );
        }
      }

      // Step B: Check similar candidates from bucket query
      const candidates = await findSimilarImages(buckets);
      const similarCandidates: { entity: ArkivEntity; similarity: number }[] = [];

      for (const candidate of candidates) {
        if (!candidate.imageHash) continue;
        const sim = similarityPercent(candidate.imageHash, fullHash);
        if (sim >= 70) {
          similarCandidates.push({ entity: candidate, similarity: sim });
        }
      }

      if (similarCandidates.length > 0) {
        similarCandidates.sort((a, b) => b.similarity - a.similarity);
        const best = similarCandidates[0];
        const isOwner = await verifyOwnership(best.entity.imageHash, cleanClaimer);

        if (isOwner) {
          const { swarmRef, registeredAt } = parseEntityPayload(best.entity);
          return NextResponse.json(
            {
              success: true,
              result: {
                status: "VERIFIED",
                owner: cleanClaimer,
                swarmRef,
                registeredAt,
              },
            },
            { status: 200 },
          );
        } else {
          const legitimateOwner = (best.entity.$owner || best.entity.owner || "").toLowerCase();
          return NextResponse.json(
            {
              success: true,
              result: {
                status: "MORPHING_DETECTED",
                similarityPercent: best.similarity,
                legitimateOwner,
                targetImageHash: best.entity.imageHash,
              },
            },
            { status: 200 },
          );
        }
      }

      // Step C: Not found in Arkiv
      return NextResponse.json(
        { success: true, result: { status: "NOT_REGISTERED" } },
        { status: 200 },
      );
    } else {
      // mode === "new"
      const exactMatch = await findExactImage(fullHash);
      if (exactMatch) {
        const owner = (exactMatch.$owner || exactMatch.owner || "").toLowerCase();
        const { registeredAt } = parseEntityPayload(exactMatch);
        if (owner === cleanClaimer) {
          return NextResponse.json(
            { success: true, result: { status: "ALREADY_REGISTERED", owner, registeredAt } },
            { status: 200 },
          );
        } else {
          return NextResponse.json(
            {
              success: true,
              result: {
                status: "MORPHING_DETECTED",
                similarityPercent: 100,
                legitimateOwner: owner,
                targetImageHash: fullHash,
              },
            },
            { status: 200 },
          );
        }
      }

      const candidates = await findSimilarImages(buckets);
      const similarCandidates: { entity: ArkivEntity; similarity: number }[] = [];

      for (const candidate of candidates) {
        if (!candidate.imageHash) continue;
        const sim = similarityPercent(candidate.imageHash, fullHash);
        if (sim >= 70) {
          similarCandidates.push({ entity: candidate, similarity: sim });
        }
      }

      if (similarCandidates.length > 0) {
        similarCandidates.sort((a, b) => b.similarity - a.similarity);
        const best = similarCandidates[0];
        const owner = (best.entity.$owner || best.entity.owner || "").toLowerCase();
        const { registeredAt } = parseEntityPayload(best.entity);

        if (owner === cleanClaimer) {
          return NextResponse.json(
            { success: true, result: { status: "ALREADY_REGISTERED", owner, registeredAt } },
            { status: 200 },
          );
        } else {
          return NextResponse.json(
            {
              success: true,
              result: {
                status: "MORPHING_DETECTED",
                similarityPercent: best.similarity,
                legitimateOwner: owner,
                targetImageHash: best.entity.imageHash,
              },
            },
            { status: 200 },
          );
        }
      }

      return NextResponse.json(
        { success: true, result: { status: "NOT_REGISTERED" } },
        { status: 200 },
      );
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while processing check request";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
