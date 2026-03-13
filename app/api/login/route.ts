import { NextResponse } from "next/server"

const AUTH_COOKIE = "dashboard_auth"

const ALLOWED_USERS: Record<string, string> = {
  task5: "task5",
  seekcommons: "seekcommons",
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: unknown
    password?: unknown
  } | null

  const username = typeof body?.username === "string" ? body.username : ""
  const password = typeof body?.password === "string" ? body.password : ""

  const isValid = ALLOWED_USERS[username] === password

  if (!isValid) {
    return NextResponse.json(
      { ok: false, message: "Invalid username or password" },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: AUTH_COOKIE,
    value: "1",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return response
}
