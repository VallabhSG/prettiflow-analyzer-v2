import { NextResponse } from "next/server";
import { getCurrentUser, getVisibleAnalysis } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const analysis = await getVisibleAnalysis(id, user);
  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found or private." }, { status: 404 });
  }
  return NextResponse.json({ analysis });
}
