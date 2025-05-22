import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and trying to access protected routes
  if (!session && (req.nextUrl.pathname.startsWith("/conversations") || req.nextUrl.pathname.startsWith("/profile"))) {
    const redirectUrl = new URL("/auth?mode=sign-in", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If session and trying to access auth routes
  if (session && req.nextUrl.pathname.startsWith("/auth")) {
    const redirectUrl = new URL("/conversations", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
