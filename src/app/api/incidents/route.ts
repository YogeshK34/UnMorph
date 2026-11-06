import { NextRequest, NextResponse } from "next/server";
import { getIncidentLogsForOwner } from "@/lib/arkiv";

function isValidEthereumAddress(address: unknown): address is string {
  return typeof address === "string" && /^0x[0-9a-fA-F]{40}$/.test(address.trim());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet") || searchParams.get("owner");

    if (!wallet || !isValidEthereumAddress(wallet)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid wallet parameter (expected ?wallet=0x... 40 hex chars)",
        },
        { status: 400 },
      );
    }

    const incidents = await getIncidentLogsForOwner(wallet.trim());

    // Serialize safely handling any bigint fields (like lifetime or block numbers)
    const sanitizedIncidents = JSON.parse(
      JSON.stringify(incidents, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
    );

    return NextResponse.json({ success: true, incidents: sanitizedIncidents }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while fetching incident logs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
