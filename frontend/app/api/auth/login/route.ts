import { NextResponse } from "next/server";
import { createSession, findUserByCredentials, publicUser, setSessionCookie } from "@/lib/store";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = await findUserByCredentials(String(email ?? ""), String(password ?? ""));
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const token = await createSession(user.id);
  await setSessionCookie(token);
  return NextResponse.json({ user: publicUser(user) });
}
