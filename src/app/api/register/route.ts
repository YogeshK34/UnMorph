import { NextRequest, NextResponse } from "next/server";
import { computePHash } from "@/lib/phash";
import { uploadImageToSwarm } from "@/lib/swarm";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    // Validate image presence
    if (!imageFile || !(imageFile instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid image file in request" },
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

    const mimeType = imageFile.type || "image/png";

    // 1. Compute 64-bit perceptual hash & buckets (client-free heavy compute)
    const pHashResult = await computePHash(imageBuffer);
    const resultWithBuckets = pHashResult as Partial<PHashResult> & {
      buckets?: { b0?: string; b1?: string; b2?: string; b3?: string };
    };
    const buckets = pHashResult.b0
      ? {
          b0: pHashResult.b0,
          b1: pHashResult.b1,
          b2: pHashResult.b2,
          b3: pHashResult.b3,
        }
      : resultWithBuckets.buckets || {};

    // 2. Upload unencrypted backup to Swarm decentralized storage
    const swarm = await uploadImageToSwarm(imageBuffer, mimeType);

    // 3. Return hashes and Swarm reference for client-side MetaMask signing
    return NextResponse.json(
      {
        success: true,
        pHash: pHashResult.fullHash,
        buckets,
        swarmRef: swarm.reference,
        result: {
          pHash: pHashResult.fullHash,
          buckets,
          swarmRef: swarm.reference,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while processing registration";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
