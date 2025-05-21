import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!session && (req.nextUrl.pathname.startsWith("/messages") || req.nextUrl.pathname.startsWith("/profile"))) {
    const redirectUrl = new URL("/login", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/messages/:path*", "/profile/:path*", "/login", "/signup"],
}
