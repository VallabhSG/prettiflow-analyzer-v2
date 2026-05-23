import { and, desc, eq, gt, or } from "drizzle-orm";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { db } from "./db";
import { analyses, sessions, users } from "./db/schema";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

type AnalysisResult = Record<string, unknown>;

export type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export type Analysis = {
  id: string;
  userId: string | null;
  appName: string;
  input: string;
  inputType: string;
  result: AnalysisResult;
  provider: string;
  complexityLabel: string;
  overallComplexity: number;
  isPublic: boolean;
  createdAt: string;
};

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const hashBuffer = Buffer.from(hash, "hex");
  const inputBuffer = scryptSync(password, salt, 64);

  if (hashBuffer.length !== inputBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashBuffer, inputBuffer);
}

function normalizeUser(user: typeof users.$inferSelect): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

function normalizeAnalysis(analysis: typeof analyses.$inferSelect): Analysis {
  return {
    id: analysis.id,
    userId: analysis.userId,
    appName: analysis.appName,
    input: analysis.input,
    inputType: analysis.inputType,
    result: analysis.result as AnalysisResult,
    provider: analysis.provider,
    complexityLabel: analysis.complexityLabel,
    overallComplexity: analysis.overallComplexity,
    isPublic: analysis.isPublic,
    createdAt: analysis.createdAt.toISOString(),
  };
}

export async function createUser(email: string, name: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    throw new Error("Invalid email address.");
  }

  if (password.length > 128) {
    throw new Error("Password must be 128 characters or fewer.");
  }

  const [user] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: name.trim() || null,
      passwordHash: hashPassword(password),
    })
    .returning();

  return normalizeUser(user);
}

export async function findUserByCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return normalizeUser(user);
}

export async function createSession(userId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      token,
      expiresAt,
    })
    .returning();

  return session.token;
}

export async function getCurrentUser(token?: string | null) {
  if (!token) {
    return null;
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ? normalizeUser(user) : null;
}

export async function saveAnalysis(input: {
  userId?: string | null;
  appName: string;
  input: string;
  inputType: string;
  result: AnalysisResult;
  provider: string;
  complexityLabel: string;
  overallComplexity: number;
  isPublic?: boolean;
}) {
  const [analysis] = await db
    .insert(analyses)
    .values({
      userId: input.userId ?? null,
      appName: input.appName,
      input: input.input,
      inputType: input.inputType,
      result: input.result,
      provider: input.provider,
      complexityLabel: input.complexityLabel,
      overallComplexity: input.overallComplexity,
      isPublic: input.isPublic ?? true,
    })
    .returning();

  return normalizeAnalysis(analysis);
}

export async function getVisibleAnalyses(userId?: string | null) {
  const rows = await db
    .select()
    .from(analyses)
    .where(userId ? or(eq(analyses.isPublic, true), eq(analyses.userId, userId)) : eq(analyses.isPublic, true))
    .orderBy(desc(analyses.createdAt));

  return rows.map(normalizeAnalysis);
}

export async function getAnalysisById(id: string, userId?: string | null) {
  const visibility = userId ? or(eq(analyses.isPublic, true), eq(analyses.userId, userId)) : eq(analyses.isPublic, true);
  const [analysis] = await db
    .select()
    .from(analyses)
    .where(and(eq(analyses.id, id), visibility))
    .limit(1);

  return analysis ? normalizeAnalysis(analysis) : null;
}

export async function deleteExpiredSessions() {
  await db.delete(sessions).where(gt(new Date(), sessions.expiresAt));
}
