import { NextResponse } from "next/server";
import { getCurrentUser, saveAnalysis } from "@/lib/store";

export async function POST(request: Request) {
  const { idea, is_public } = await request.json();
  const cleanIdea = String(idea ?? "").trim();
  if (cleanIdea.length < 12) {
    return NextResponse.json({ error: "Please provide a more detailed idea." }, { status: 400 });
  }
  const user = await getCurrentUser();
  const analysis = await saveAnalysis({ idea: cleanIdea, is_public: Boolean(is_public), user });
  return NextResponse.json({ analysis });
}
