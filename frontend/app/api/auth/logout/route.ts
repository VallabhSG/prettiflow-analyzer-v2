import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/store";

export async function POST(request: Request) {
  const hasJsonBody = request.headers.get("content-type")?.includes("application/json") && request.headers.get("content-length") !== "0";

  if (hasJsonBody) {
    try {
      await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
