import { NextResponse } from "next/server";
import { getCurrentUser, listVisibleAnalyses } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  const analyses = await listVisibleAnalyses(user);
  const publicAnalyses = analyses.map(({ user_email: _userEmail, ...analysis }) => analysis);

  return NextResponse.json({ analyses: publicAnalyses });
}
