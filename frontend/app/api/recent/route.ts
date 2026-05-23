import { NextResponse } from "next/server";
import { getCurrentUser, getVisibleAnalyses } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  const analyses = await getVisibleAnalyses(user?.id ?? null);

  return NextResponse.json({ analyses });
}
