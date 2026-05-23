import Link from "next/link";
import type { Metadata } from "next";
import type { AnalysisResult } from "@/lib/analyzer";
import { getAnalysisById } from "@/lib/store";

type PageProps = {
  params: Promise<{ id: string }>;
};

function scoreColor(score: number) {
  if (score <= 3) return "text-emerald-300 border-emerald-400/70 bg-emerald-400/10";
  if (score <= 6) return "text-yellow-300 border-yellow-400/70 bg-yellow-400/10";
  if (score <= 8) return "text-orange-300 border-orange-400/70 bg-orange-400/10";
  return "text-red-300 border-red-400/70 bg-red-400/10";
}

function scoreStroke(score: number) {
  if (score <= 3) return "stroke-emerald-400";
  if (score <= 6) return "stroke-yellow-400";
  if (score <= 8) return "stroke-orange-400";
  return "stroke-red-400";
}

function scoreFill(score: number) {
  if (score <= 3) return "bg-emerald-400";
  if (score <= 6) return "bg-yellow-400";
  if (score <= 8) return "bg-orange-400";
  return "bg-red-400";
}

function timeAgo(value: string | Date) {
  const date = new Date(value);
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(score, 10)) / 10) * circumference;

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="14" className="stroke-zinc-800" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className={scoreStroke(score)}
        />
      </svg>
      <div className="text-center">
        <p className="text-5xl font-black tracking-tight text-white">{score}</p>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">/ 10</p>
      </div>
    </div>
  );
}

async function loadPublicAnalysis(id: string) {
  return getAnalysisById(id, null);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const analysis = await loadPublicAnalysis(id);

  if (!analysis) {
    return {
      title: "Analysis not found — Prettiflow",
      description: "Analysis not found or private.",
    };
  }

  const result = analysis.result as AnalysisResult;

  return {
    title: `${result.appName} — Prettiflow Complexity Report`,
    description: `${result.complexityLabel}: ${result.appSummary}`,
  };
}

export default async function SharedResultPage({ params }: PageProps) {
  const { id } = await params;
  const analysis = await loadPublicAnalysis(id);

  if (!analysis) {
    return (
      <main className="min-h-screen overflow-hidden bg-zinc-950 px-5 py-10 text-zinc-50 sm:px-8">
        <div className="pointer-events-none fixed inset-0 -z-0">
          <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="absolute right-[-8%] top-[20%] h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute bottom-[-12%] left-[25%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        </div>
        <section className="relative mx-auto max-w-2xl rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 text-2xl font-black shadow-lg shadow-rose-950/40">P</div>
          <h1 className="text-3xl font-black tracking-tight text-white">Analysis not found or private.</h1>
          <p className="mt-3 text-zinc-400">This report may have been removed, or it is only visible to its owner.</p>
          <Link href="/" className="mt-8 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-rose-100">
            ← Analyze another app
          </Link>
        </section>
      </main>
    );
  }

  const result = analysis.result as AnalysisResult;
  const score = result.overallComplexity;

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 px-5 py-8 text-zinc-50 sm:px-8 lg:px-10">
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute right-[-8%] top-[20%] h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[25%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <section className="relative mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 text-xl font-black shadow-lg shadow-rose-950/40">P</div>
            <div>
              <p className="text-lg font-black tracking-tight">Prettiflow</p>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Complexity Report</p>
            </div>
          </div>
          <Link href="/" className="inline-flex rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:border-rose-400 hover:bg-rose-500/10 hover:text-white">
            ← Analyze another app
          </Link>
        </div>

        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            <div className="flex flex-col items-center justify-start rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 text-center">
              <ScoreRing score={score} />
              <span className={`mt-5 rounded-full border px-4 py-2 text-sm font-black ${scoreColor(score)}`}>{result.complexityLabel}</span>
              <p className="mt-5 text-sm leading-6 text-zinc-400">Overall Prettiflow build complexity score.</p>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">{result.appName}</h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">{result.appSummary}</p>
              </div>

              <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-200">Top insight</p>
                <p className="mt-3 text-lg font-semibold leading-8 text-white">{result.topInsight}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {result.dimensions.slice(0, 6).map((dimension) => (
                  <div key={dimension.name} className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-bold text-white">{dimension.name}</h2>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${scoreColor(dimension.score)}`}>{dimension.score}/10</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div className={`h-full rounded-full ${scoreFill(dimension.score)}`} style={{ width: `${Math.max(5, Math.min(dimension.score * 10, 100))}%` }} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{dimension.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
              <h2 className="text-xl font-black text-emerald-100">Prettiflow handles</h2>
              <ul className="mt-4 space-y-3 text-zinc-200">
                {result.prettiflowHandlesList.map((item) => (
                  <li key={item} className="flex gap-3"><span className="text-emerald-300">✓</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-orange-400/20 bg-orange-400/10 p-6">
              <h2 className="text-xl font-black text-orange-100">Manual work</h2>
              <ul className="mt-4 space-y-3 text-zinc-200">
                {result.manualWorkList.map((item) => (
                  <li key={item} className="flex gap-3"><span className="text-orange-300">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-500">Time estimate</p>
              <p className="mt-3 text-3xl font-black text-white">{result.timeEstimate}</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-500">Verdict</p>
              <p className="mt-3 text-lg leading-8 text-zinc-200">{result.verdict}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-zinc-800 pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Analyzed {timeAgo(analysis.createdAt)} • powered by {analysis.provider}</p>
            <Link href="/" className="font-bold text-rose-200 transition hover:text-white">← Analyze another app</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
