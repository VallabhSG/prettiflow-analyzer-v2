import { NextResponse } from "next/server";
import { createSession, createUser, publicUser, setSessionCookie } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const user = await createUser(String(email ?? ""), String(password ?? ""));
    const token = await createSession(user.id);
    await setSessionCookie(token);
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create account." }, { status: 400 });
  }
}
