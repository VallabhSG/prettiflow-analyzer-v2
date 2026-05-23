import { NextResponse } from "next/server";
import { getCurrentUser, listVisibleAnalyses } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  const analyses = await listVisibleAnalyses(user);
  return NextResponse.json({ analyses });
}
