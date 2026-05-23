import { NextResponse } from "next/server";
import { createSession, findUserByCredentials, publicUser, setSessionCookie } from "@/lib/store";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, password } = body;
  const user = await findUserByCredentials(String(email ?? ""), String(password ?? ""));
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const token = await createSession(user.id);
  await setSessionCookie(token);
  return NextResponse.json({ user: publicUser(user) });
}
