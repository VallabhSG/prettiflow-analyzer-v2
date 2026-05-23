import { NextResponse } from "next/server";
import { getCurrentUser, saveAnalysis } from "@/lib/store";
import { analyze } from "@/lib/analyzer";
import { fetchGitHubRepoContext, formatGitHubContext } from "@/lib/github";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestLog = new Map<string, { count: number; windowStart: number }>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();

  for (const [storedIp, record] of requestLog.entries()) {
    if (now - record.windowStart >= RATE_LIMIT_WINDOW_MS) {
      requestLog.delete(storedIp);
    }
  }

  const record = requestLog.get(ip);
  if (!record) {
    requestLog.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (now - record.windowStart >= RATE_LIMIT_WINDOW_MS) {
    requestLog.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { input, inputType } = body as { input?: string; inputType?: string };
  const cleanInput = String(input ?? "").trim();

  if (!cleanInput) {
    return NextResponse.json({ error: "Please provide an input to analyze." }, { status: 400 });
  }

  const validTypes = ["description", "github"];
  const resolvedType = validTypes.includes(inputType ?? "") ? inputType! : "description";

  let analysisInput = cleanInput;

  // If inputType is "github", fetch repo context first
  if (resolvedType === "github") {
    try {
      const repoContext = await fetchGitHubRepoContext(cleanInput);
      analysisInput = formatGitHubContext(repoContext);
    } catch (githubError) {
      return NextResponse.json(
        { error: `Failed to fetch GitHub repository: ${(githubError as Error).message}` },
        { status: 400 }
      );
    }
  }

  // Call AI analyzer
  let aiResult: Awaited<ReturnType<typeof analyze>>;
  try {
    aiResult = await analyze(analysisInput);
  } catch (analyzeError) {
    return NextResponse.json(
      { error: `AI analysis failed: ${(analyzeError as Error).message}` },
      { status: 502 }
    );
  }

  const { result, provider } = aiResult;

  // Determine complexity label from result
  const complexityLabel = result.complexityLabel ?? "Moderate";
  const overallComplexity = Math.min(10, Math.max(1, result.overallComplexity ?? 5));

  // Save to DB
  const user = await getCurrentUser();
  const savedAnalysis = await saveAnalysis({
    userId: user?.id ?? null,
    appName: result.appName ?? "Untitled App",
    input: cleanInput,
    inputType: resolvedType,
    result: result as Record<string, unknown>,
    provider,
    complexityLabel,
    overallComplexity,
    isPublic: true,
  });

  return NextResponse.json({
    result,
    provider,
    id: savedAnalysis.id,
  });
}
