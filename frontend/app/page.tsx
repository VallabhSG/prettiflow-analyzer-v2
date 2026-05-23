"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type InputType = "description" | "github";
type ComplexityLabel = "Simple" | "Moderate" | "Complex" | "Enterprise-Grade";

type User = {
  id: string;
  email: string;
  name?: string | null;
};

type Dimension = {
  name: string;
  score: number;
  description: string;
};

type AnalysisResult = {
  appName: string;
  appSummary: string;
  overallComplexity: number;
  complexityLabel: ComplexityLabel | string;
  dimensions: Dimension[];
  prettiflowHandlesList: string[];
  manualWorkList: string[];
  timeEstimate: string;
  verdict: string;
  topInsight: string;
  mermaidDiagram: string;
};

type Analysis = {
  id: string;
  appName: string;
  appSummary?: string;
  overallComplexity: number;
  complexityLabel: ComplexityLabel | string;
  provider: string;
  createdAt: string;
  result?: AnalysisResult;
};

type AnalyzeResponse = {
  result: AnalysisResult;
  provider: string;
  id: string;
};

const sampleDescription =
  "A collaborative project management app for design teams with AI-generated task summaries, file approvals, real-time comments, and role-based client portals.";

const CURRENT_SANDBOX_ID = "ivemzxn5d4z9svde0d6ah";
const SANDBOX_RECOVERY_PARAM = "sandboxRecovery";
const SANDBOX_LOG_KEY = "prettiflow:sandbox-events";
const SANDBOX_NOT_FOUND_MESSAGE = `Sandbox Not Found: the sandbox ${CURRENT_SANDBOX_ID} wasn't found. Redirecting to a safe recovery view. If this preview still fails, refresh after the sandbox is recreated or open a newly generated preview URL.`;

function logSandboxNotFoundEvent(sandboxId: string, host: string) {
  const event = {
    type: "sandbox_not_found",
    sandboxId,
    host,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
    message: SANDBOX_NOT_FOUND_MESSAGE,
  };

  console.warn("[Prettiflow] Sandbox not found", event);

  try {
    const existing = JSON.parse(window.localStorage.getItem(SANDBOX_LOG_KEY) ?? "[]");
    const events = Array.isArray(existing) ? existing : [];
    window.localStorage.setItem(SANDBOX_LOG_KEY, JSON.stringify([event, ...events].slice(0, 25)));
  } catch {
    window.localStorage.setItem(SANDBOX_LOG_KEY, JSON.stringify([event]));
  }
}

function scoreColor(score: number) {
  if (score <= 3) return "text-emerald-300 border-emerald-400/70 bg-emerald-400/10";
  if (score <= 6) return "text-yellow-300 border-yellow-400/70 bg-yellow-400/10";
  if (score <= 8) return "text-orange-300 border-orange-400/70 bg-orange-400/10";
  return "text-red-300 border-red-400/70 bg-red-400/10";
}

function scoreFill(score: number) {
  if (score <= 3) return "bg-emerald-400";
  if (score <= 6) return "bg-yellow-400";
  if (score <= 8) return "bg-orange-400";
  return "bg-red-400";
}

function timeAgo(value: string) {
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

function resultFromAnalysis(analysis: Analysis): AnalysisResult {
  return (
    analysis.result ?? {
      appName: analysis.appName,
      appSummary: analysis.appSummary ?? "A saved Prettiflow app complexity analysis.",
      overallComplexity: analysis.overallComplexity,
      complexityLabel: analysis.complexityLabel,
      dimensions: [],
      prettiflowHandlesList: [],
      manualWorkList: [],
      timeEstimate: "See analysis",
      verdict: "Open the full result to review the complete scorecard.",
      topInsight: "This recent analysis is ready to share and revisit.",
      mermaidDiagram: "",
    }
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [inputType, setInputType] = useState<InputType>("description");
  const [input, setInput] = useState(sampleDescription);
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<"Gemini" | "Groq">("Gemini");
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<Analysis[]>([]);
  const [activeResult, setActiveResult] = useState<AnalyzeResponse | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [sandboxError, setSandboxError] = useState("");

  const result = activeResult?.result ?? null;
  const sortedRecent = useMemo(() => [...recent].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [recent]);

  useEffect(() => {
    void loadSession();
    void loadRecent();

    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const previewMatch = host.match(/^([a-z0-9-]+)\.e2b\.app$/i);
      const previewSandboxId = previewMatch?.[1]?.replace(/^\d+-/, "");

      const url = new URL(window.location.href);
      const alreadyRecovered = url.searchParams.get(SANDBOX_RECOVERY_PARAM) === "1";

      if (previewSandboxId === CURRENT_SANDBOX_ID) {
        setSandboxError(SANDBOX_NOT_FOUND_MESSAGE);
        logSandboxNotFoundEvent(CURRENT_SANDBOX_ID, host);

        if (!alreadyRecovered) {
          url.searchParams.set(SANDBOX_RECOVERY_PARAM, "1");
          window.history.replaceState(null, "", url.toString());
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => {
      setLoadingProvider((current) => (current === "Gemini" ? "Groq" : "Gemini"));
    }, 1800);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function loadSession() {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user ?? null);
    }
  }

  async function loadRecent() {
    const res = await fetch("/api/recent");
    if (res.ok) {
      const data = await res.json();
      setRecent(data.analyses ?? []);
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");

    const payload = authMode === "register" ? { email, password, name: authName } : { email, password };
    const res = await fetch(`/api/auth/${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setAuthMessage(data.error ?? "Authentication failed.");
      return;
    }

    setUser(data.user);
    setEmail("");
    setPassword("");
    setAuthName("");
    setAuthMessage(authMode === "register" ? "Account created." : "Signed in.");
    void loadRecent();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAuthMessage("Signed out.");
    void loadRecent();
  }

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setShareMessage("");

    const value = inputType === "description" ? input.trim() : githubUrl.trim();
    if (inputType === "description" && value.length < 20) {
      setError("Give Prettiflow at least one clear sentence about the app you want built.");
      return;
    }
    if (inputType === "github" && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?/.test(value)) {
      setError("Paste a valid GitHub repository URL, like https://github.com/org/repo.");
      return;
    }

    setLoading(true);
    setLoadingProvider(Math.random() > 0.5 ? "Gemini" : "Groq");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value, inputType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Prettiflow could not analyze this app yet.");
        return;
      }

      const analysis: AnalyzeResponse = { result: data.result, provider: data.provider, id: data.id };
      setActiveResult(analysis);
      setRecent((items) => [
        {
          id: data.id,
          appName: data.result.appName,
          appSummary: data.result.appSummary,
          overallComplexity: data.result.overallComplexity,
          complexityLabel: data.result.complexityLabel,
          provider: data.provider,
          createdAt: new Date().toISOString(),
          result: data.result,
        },
        ...items.filter((item) => item.id !== data.id),
      ]);
      void loadRecent();
    } catch {
      setError("Network error while analyzing. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function shareResult() {
    if (!activeResult) return;
    const url = `${window.location.origin}/r/${activeResult.id}`;
    await navigator.clipboard.writeText(url);
    setShareMessage("Copied share link.");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-zinc-50">
      {sandboxError ? (
        <div className="mx-auto mt-6 w-[min(92vw,980px)] rounded-3xl border border-red-400/40 bg-red-500/10 p-5 text-red-100 shadow-2xl shadow-red-950/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-300/40 bg-red-400/15 text-xl">!</div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-200">Sandbox unavailable</p>
              <h1 className="mt-2 text-2xl font-black text-white">Sandbox Not Found</h1>
              <p className="mt-2 leading-7 text-red-100/90">{sandboxError}</p>
              <p className="mt-3 text-sm text-red-100/75">The app will keep rendering below, but preview or API links tied to that missing sandbox may fail until a valid sandbox is created.</p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute right-[-8%] top-[20%] h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[25%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <section className="relative mx-auto flex max-w-7xl flex-col gap-10 px-5 py-6 sm:px-8 lg:px-10">
        <header className="rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 text-xl font-black shadow-lg shadow-rose-950/40">P</div>
                <div>
                  <p className="text-lg font-black tracking-tight">Prettiflow</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Complexity Analyzer</p>
                </div>
              </div>

              <div className="max-w-4xl">
                <p className="mb-4 inline-flex rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200">
                  AI scorecards for real build scope
                </p>
                <h1 className="text-5xl font-black tracking-tight text-white md:text-7xl">Will Prettiflow build your app?</h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300 md:text-xl">
                  Drop a description or GitHub link. Get an instant scorecard of what AI handles vs. what needs you.
                </p>
              </div>
            </div>

            <aside className="w-full rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 lg:w-96">
              {user ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-500">Signed in</p>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                    <p className="font-semibold text-white">{user.name || user.email}</p>
                    <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
                  </div>
                  <button onClick={logout} className="w-full rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:border-rose-400 hover:bg-rose-500/10 hover:text-white">
                    Logout
                  </button>
                  {authMessage ? <p className="text-sm text-zinc-400">{authMessage}</p> : null}
                </div>
              ) : (
                <form onSubmit={submitAuth} className="space-y-3">
                  <div className="grid grid-cols-2 rounded-2xl bg-zinc-800 p-1 text-sm font-bold">
                    <button type="button" onClick={() => setAuthMode("login")} className={`rounded-xl px-3 py-2 transition ${authMode === "login" ? "bg-zinc-950 text-white shadow" : "text-zinc-400 hover:text-white"}`}>
                      Login
                    </button>
                    <button type="button" onClick={() => setAuthMode("register")} className={`rounded-xl px-3 py-2 transition ${authMode === "register" ? "bg-zinc-950 text-white shadow" : "text-zinc-400 hover:text-white"}`}>
                      Register
                    </button>
                  </div>
                  {authMode === "register" ? (
                    <input value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Name" className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-rose-400" />
                  ) : null}
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-rose-400" />
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required minLength={6} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-rose-400" />
                  <button className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-rose-100">
                    {authMode === "register" ? "Create account" : "Sign in"}
                  </button>
                  {authMessage ? <p className="text-sm text-amber-200">{authMessage}</p> : null}
                </form>
              )}
            </aside>
          </div>
        </header>

        <section className="mx-auto w-full max-w-4xl rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur md:p-7">
          <form onSubmit={analyze} className="space-y-5">
            <div className="mx-auto grid max-w-lg grid-cols-2 rounded-2xl bg-zinc-950 p-1 text-sm font-black">
              <button type="button" onClick={() => setInputType("description")} className={`rounded-xl px-4 py-3 transition ${inputType === "description" ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-purple-950/40" : "text-zinc-400 hover:text-white"}`}>
                Describe your app
              </button>
              <button type="button" onClick={() => setInputType("github")} className={`rounded-xl px-4 py-3 transition ${inputType === "github" ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-purple-950/40" : "text-zinc-400 hover:text-white"}`}>
                GitHub URL
              </button>
            </div>

            {inputType === "description" ? (
              <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={8} className="w-full resize-none rounded-3xl border border-zinc-800 bg-zinc-950/90 px-5 py-4 text-base leading-7 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10" placeholder="Describe the app, workflows, users, integrations, data, and anything custom..." />
            ) : (
              <input type="url" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} className="w-full rounded-3xl border border-zinc-800 bg-zinc-950/90 px-5 py-5 text-base text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10" placeholder="https://github.com/owner/repository" />
            )}

            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-zinc-500">Your scorecard can be saved to your account and shared with the team.</p>
              <button disabled={loading} className="inline-flex min-w-56 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-purple-950/40 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Analyzing with {loadingProvider}...
                  </>
                ) : (
                  "Analyze with AI"
                )}
              </button>
            </div>
            {error ? <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
          </form>
        </section>

        {result ? (
          <section className="animate-in slide-in-from-bottom-8 fade-in duration-700 rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              <div className="flex flex-col items-center justify-start rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 text-center">
                <div className={`relative flex h-48 w-48 items-center justify-center rounded-full border-[12px] ${scoreColor(result.overallComplexity)}`}>
                  <div className="absolute inset-3 rounded-full border border-zinc-800 bg-zinc-950" />
                  <div className="relative">
                    <p className="text-6xl font-black">{result.overallComplexity}</p>
                    <p className="text-sm font-bold text-zinc-500">/ 10</p>
                  </div>
                </div>
                <span className={`mt-5 rounded-full border px-4 py-2 text-sm font-black ${scoreColor(result.overallComplexity)}`}>{result.complexityLabel}</span>
                <span className="mt-4 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Powered by {activeResult.provider}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-white md:text-5xl">{result.appName}</h2>
                  <p className="mt-3 max-w-3xl text-lg leading-8 text-zinc-300">{result.appSummary}</p>
                </div>

                <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-yellow-50">
                  <div className="flex gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                      <p className="font-black text-yellow-200">Top insight</p>
                      <p className="mt-1 leading-7 text-yellow-50/90">{result.topInsight}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {result.dimensions.slice(0, 6).map((dimension) => (
                    <div key={dimension.name} className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-black text-white">{dimension.name}</h3>
                        <span className="text-sm font-bold text-zinc-300">{dimension.score}/10</span>
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                        <div className={`h-full rounded-full ${scoreFill(dimension.score)} transition-all duration-1000 ease-out`} style={{ width: `${Math.max(4, Math.min(100, dimension.score * 10))}%` }} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">{dimension.description}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                    <h3 className="text-lg font-black text-emerald-200">✓ Prettiflow handles</h3>
                    <ul className="mt-4 space-y-3 text-sm text-emerald-50/90">
                      {result.prettiflowHandlesList.map((item) => (
                        <li key={item} className="flex gap-3"><span className="text-emerald-300">✓</span><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
                    <h3 className="text-lg font-black text-amber-200">⚠ Manual work needed</h3>
                    <ul className="mt-4 space-y-3 text-sm text-amber-50/90">
                      {result.manualWorkList.map((item) => (
                        <li key={item} className="flex gap-3"><span className="text-amber-300">⚠</span><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-zinc-950">Est. build time: {result.timeEstimate}</span>
                  <button onClick={shareResult} className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-black text-zinc-200 transition hover:border-purple-400 hover:bg-purple-500/10 hover:text-white">
                    Share scorecard
                  </button>
                </div>
                {shareMessage ? <p className="text-sm text-emerald-300">{shareMessage}</p> : null}
                <p className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 leading-8 text-zinc-300">{result.verdict}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="pb-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-zinc-500">Recent analyses</p>
              <h2 className="mt-2 text-3xl font-black text-white">What builders are checking</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedRecent.slice(0, 9).map((analysis) => {
              const cardResult = resultFromAnalysis(analysis);
              return (
                <Link key={analysis.id} href={`/r/${analysis.id}`} className="group rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 transition hover:-translate-y-1 hover:border-rose-400/50 hover:bg-zinc-900">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="line-clamp-2 text-xl font-black text-white group-hover:text-rose-100">{cardResult.appName}</h3>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${scoreColor(cardResult.overallComplexity)}`}>{cardResult.complexityLabel}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">{cardResult.appSummary}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4 text-sm">
                    <span className="font-black text-white">{cardResult.overallComplexity}/10</span>
                    <span className="text-zinc-500">{timeAgo(analysis.createdAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
