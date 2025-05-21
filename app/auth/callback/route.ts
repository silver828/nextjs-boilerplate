import { NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error("Erreur lors de l'échange du code:", error)
      // Rediriger vers la page d'accueil en cas d'erreur
      return NextResponse.redirect(new URL("/", requestUrl.origin))
    }
  }

  // URL de redirection après authentification
  return NextResponse.redirect(new URL("/messages", requestUrl.origin))
}
