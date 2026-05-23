import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  created_at: string;
};

export type Analysis = {
  id: string;
  idea: string;
  score: number;
  verdict: string;
  summary: string;
  scorecard: {
    clarity: number;
    feasibility: number;
    market: number;
    differentiation: number;
    monetization: number;
  };
  strengths: string[];
  risks: string[];
  next_steps: string[];
  is_public: boolean;
  user_id: string | null;
  user_email?: string | null;
  created_at: string;
};

type Session = {
  token: string;
  user_id: string;
  created_at: string;
};

type Database = {
  users: User[];
  sessions: Session[];
  analyses: Analysis[];
};

const dbPath = path.join(process.cwd(), ".data", "idea-scorecard.json");
const sessionCookie = "idea_scorecard_session";

async function readDb(): Promise<Database> {
  try {
    const raw = await readFile(dbPath, "utf8");
    return JSON.parse(raw) as Database;
  } catch {
    return { users: [], sessions: [], analyses: [] };
  }
}

async function writeDb(db: Database) {
  await mkdir(path.dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  return actual.length === candidate.length && timingSafeEqual(actual, candidate);
}

export async function createUser(email: string, password: string) {
  const db = await readDb();
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) throw new Error("Enter a valid email address.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (db.users.some((user) => user.email === normalized)) throw new Error("An account with this email already exists.");
  const user: User = {
    id: crypto.randomUUID(),
    email: normalized,
    passwordHash: hashPassword(password),
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  await writeDb(db);
  return user;
}

export async function findUserByCredentials(email: string, password: string) {
  const db = await readDb();
  const user = db.users.find((item) => item.email === normalizeEmail(email));
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export async function createSession(userId: string) {
  const db = await readDb();
  const token = randomBytes(32).toString("hex");
  db.sessions.push({ token, user_id: userId, created_at: new Date().toISOString() });
  await writeDb(db);
  return token;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (token) {
    const db = await readDb();
    db.sessions = db.sessions.filter((session) => session.token !== token);
    await writeDb(db);
  }
  cookieStore.delete(sessionCookie);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) return null;
  const db = await readDb();
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.user_id);
  return user ?? null;
}

export function publicUser(user: User) {
  return { id: user.id, email: user.email };
}

export async function saveAnalysis(input: { idea: string; is_public: boolean; user: User | null }) {
  const db = await readDb();
  const analysis: Analysis = {
    id: crypto.randomUUID(),
    idea: input.idea.trim(),
    score: 82,
    verdict: "Promising with focused validation",
    summary:
      "This fixed demo analyzer sees a clear customer pain, a plausible product wedge, and enough monetization potential to justify customer interviews before building deeper AI scoring.",
    scorecard: {
      clarity: 8,
      feasibility: 9,
      market: 8,
      differentiation: 7,
      monetization: 9,
    },
    strengths: [
      "Specific user segment and recurring workflow make the problem easy to validate.",
      "Lightweight product surface can be prototyped quickly without heavy infrastructure.",
      "Account-based persistence supports private drafts and public examples for sharing.",
    ],
    risks: [
      "The market may already have strong incumbents with similar positioning.",
      "Retention depends on proving repeated value after the initial novelty wears off.",
      "The current score is a placeholder and should be replaced by real AI logic later.",
    ],
    next_steps: [
      "Interview 8-12 target users and capture exact language around the pain.",
      "Create a landing page with one measurable call to action.",
      "Define the future AI rubric and compare it against expert manual reviews.",
    ],
    is_public: Boolean(input.user && input.is_public),
    user_id: input.user?.id ?? null,
    user_email: input.user?.email ?? null,
    created_at: new Date().toISOString(),
  };
  db.analyses.unshift(analysis);
  await writeDb(db);
  return analysis;
}

export async function listVisibleAnalyses(user: User | null) {
  const db = await readDb();
  return db.analyses
    .filter((analysis) => analysis.is_public || (user && analysis.user_id === user.id))
    .map((analysis) => ({ ...analysis, user_email: analysis.user_email ?? null }));
}

export async function getVisibleAnalysis(id: string, user: User | null) {
  const db = await readDb();
  const analysis = db.analyses.find((item) => item.id === id);
  if (!analysis) return null;
  if (!analysis.is_public && (!user || analysis.user_id !== user.id)) return null;
  return analysis;
}
