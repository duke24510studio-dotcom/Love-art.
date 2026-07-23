import { NextRequest, NextResponse } from "next/server";
import { lookupRakutenItem } from "@/lib/rakuten";

// Preview a Rakuten product from its item URL without saving anything yet.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const item = await lookupRakutenItem(url);
    return NextResponse.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    const status = /RAKUTEN_APP_ID/.test(message) ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
