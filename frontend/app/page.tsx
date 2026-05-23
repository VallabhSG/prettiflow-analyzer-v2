"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  email: string;
};

type Scorecard = {
  clarity: number;
  feasibility: number;
  market: number;
  differentiation: number;
  monetization: number;
};

type Analysis = {
  id: string;
  idea: string;
  score: number;
  verdict: string;
  summary: string;
  scorecard: Scorecard;
  strengths: string[];
  risks: string[];
  next_steps: string[];
  is_public: boolean;
  created_at: string;
  user_email?: string | null;
};

const emptyScorecard: Scorecard = {
  clarity: 0,
  feasibility: 0,
  market: 0,
  differentiation: 0,
  monetization: 0,
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authMessage, setAuthMessage] = useState("");
  const [idea, setIdea] = useState("A habit-building app for remote teams that turns daily check-ins into lightweight accountability quests.");
  const [publish, setPublish] = useState(true);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<Analysis[]>([]);
  const [selected, setSelected] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  const scorecard = selected?.scorecard ?? emptyScorecard;
  const sortedRecent = useMemo(() => [...recent].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)), [recent]);
  const visibleRecent = useMemo(() => sortedRecent.slice(0, 9), [sortedRecent]);

  useEffect(() => {
    void loadSession();
    void loadRecent();
  }, []);

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
      setSelected((current) => current ?? data.analyses?.[0] ?? null);
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    const res = await fetch(`/api/auth/${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthMessage(data.error ?? "Authentication failed.");
      return;
    }
    setUser(data.user);
    setEmail("");
    setPassword("");
    setAuthMessage(authMode === "register" ? "Account created and signed in." : "Signed in successfully.");
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
    if (idea.trim().length < 12) {
      setError("Describe the idea in at least a sentence so the analyzer has context.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, is_public: publish }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not analyze this idea.");
        return;
      }
      setSelected(data.analysis);
      setRecent((items) => [data.analysis, ...items.filter((item) => item.id !== data.analysis.id)].slice(0, 24));
    } catch {
      setError("Network error while analyzing. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function openResult(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/result/${id}`);
      const data = await res.json();
      if (res.ok) setSelected(data.analysis);
      else setError(data.error ?? "Result is not available.");
    } catch {
      setError("Network error while loading this result.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Idea Scorecard</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Validate startup ideas with a saved demo analysis workflow.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Submit an idea, receive a fixed placeholder scorecard, and keep public or private analyses tied to your custom email/password account.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-slate-900/80 p-5 md:w-80">
            {user ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Signed in</p>
                  <p className="mt-1 font-semibold text-cyan-100">{user.email}</p>
                </div>
                <button onClick={logout} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
                  Sign out
                </button>
              </div>
            ) : (
              <form onSubmit={submitAuth} className="space-y-3">
                <div className="flex rounded-xl bg-slate-800 p-1 text-sm font-bold">
                  <button type="button" onClick={() => setAuthMode("register")} className={`flex-1 rounded-lg py-2 ${authMode === "register" ? "bg-cyan-300 text-slate-950" : "text-slate-300"}`}>Register</button>
                  <button type="button" onClick={() => setAuthMode("login")} className={`flex-1 rounded-lg py-2 ${authMode === "login" ? "bg-cyan-300 text-slate-950" : "text-slate-300"}`}>Login</button>
                </div>
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" type="email" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-300/50 focus:ring-2" required />
                <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (8+ chars)" type="password" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-300/50 focus:ring-2" required />
                <button className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">{authMode === "register" ? "Create account" : "Sign in"}</button>
                {authMessage && <p className="text-sm text-slate-300">{authMessage}</p>}
              </form>
            )}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-black">Analyze a new idea</h2>
            <form onSubmit={analyze} className="mt-5 space-y-4">
              <textarea value={idea} onChange={(event) => setIdea(event.target.value)} rows={7} className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950 p-4 text-base leading-7 text-slate-100 outline-none ring-cyan-300/40 placeholder:text-slate-500 focus:ring-2 md:rows-8" placeholder="Describe the startup, customer, problem, and business model..." />
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} disabled={!user} className="h-5 w-5 accent-cyan-300" />
                Publish this analysis publicly {user ? "" : "(sign in to publish under your account)"}
              </label>
              {error && <p className="rounded-xl border border-rose-400/30 bg-rose-950/50 px-4 py-3 text-sm text-rose-100">{error}</p>}
              <button disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-300 px-5 py-4 text-base font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
                {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />}
                {loading ? "Generating demo scorecard..." : "Analyze and save result"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Current Result</p>
                <h2 className="mt-2 text-3xl font-black">{selected ? selected.verdict : "No analysis yet"}</h2>
              </div>
              <div className="rounded-2xl bg-cyan-300 px-5 py-3 text-center text-slate-950">
                <p className="text-xs font-bold uppercase">Score</p>
                <p className="text-3xl font-black">{selected?.score ?? "--"}</p>
              </div>
            </div>
            {selected ? (
              <div className="mt-6 space-y-6">
                <p className="text-slate-300">{selected.summary}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(scorecard).map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex justify-between text-sm capitalize text-slate-300"><span>{key}</span><span>{value}/10</span></div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800" aria-label={`${key} score ${value} out of 10`}>
                        <div className="h-2 rounded-full bg-cyan-300 transition-[width] duration-500" style={{ width: `${value * 10}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <InsightList title="Strengths" items={selected.strengths} tone="cyan" />
                <InsightList title="Risks" items={selected.risks} tone="amber" />
                <InsightList title="Next steps" items={selected.next_steps} tone="emerald" />
              </div>
            ) : (
              <p className="mt-6 text-slate-400">Submit an idea to create the first persisted demo analysis.</p>
            )}
          </section>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Recent</p>
              <h2 className="mt-2 text-2xl font-black">Public analyses and your private results</h2>
            </div>
            <button onClick={loadRecent} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">Refresh</button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleRecent.map((item) => (
              <button key={item.id} onClick={() => openResult(item.id)} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/60">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">{item.is_public ? "Public" : "Private"}</span>
                  <span className="text-sm font-black text-cyan-200">{item.score}/100</span>
                </div>
                <p className="mt-4 line-clamp-3 font-semibold text-white">{item.idea}</p>
                <p className="mt-3 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()} {item.user_email ? `• ${item.user_email}` : ""}</p>
              </button>
            ))}
            {sortedRecent.length > visibleRecent.length && (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                Showing the latest {visibleRecent.length} of {sortedRecent.length} accessible analyses for faster rendering. Use refresh after creating new results.
              </p>
            )}
            {sortedRecent.length === 0 && <p className="text-slate-400">No analyses have been saved yet.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}

function InsightList({ title, items, tone }: { title: string; items: string[]; tone: "cyan" | "amber" | "emerald" }) {
  const color = tone === "cyan" ? "text-cyan-200" : tone === "amber" ? "text-amber-200" : "text-emerald-200";
  return (
    <div>
      <h3 className={`font-black ${color}`}>{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-300">
        {items.map((item) => <li key={item} className="rounded-xl bg-white/5 px-4 py-3">{item}</li>)}
      </ul>
    </div>
  );
}
