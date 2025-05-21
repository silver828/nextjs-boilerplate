import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée
    if (!session && req.nextUrl.pathname.startsWith("/messages")) {
      const redirectUrl = new URL("/", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Si l'utilisateur est connecté et essaie d'accéder à la page d'accueil
    if (session && req.nextUrl.pathname === "/") {
      const redirectUrl = new URL("/messages", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error("Erreur dans le middleware:", error)
    // En cas d'erreur, continuer sans redirection
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/", "/messages/:path*"],
}
