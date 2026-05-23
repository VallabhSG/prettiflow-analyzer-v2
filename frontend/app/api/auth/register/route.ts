import { NextResponse } from "next/server";
import { createSession, createUser, publicUser, setSessionCookie } from "@/lib/store";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const { email, password } = body;
    const user = await createUser(String(email ?? ""), String(password ?? ""));
    const token = await createSession(user.id);
    await setSessionCookie(token);
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create account." }, { status: 400 });
  }
}
