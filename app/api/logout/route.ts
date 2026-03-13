import { NextResponse } from "next/server"

const AUTH_COOKIE = "dashboard_auth"

export async function POST() {
  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: AUTH_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return response
}
