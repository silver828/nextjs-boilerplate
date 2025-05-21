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
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) throw error

      // Si l'échange a réussi et que nous avons un utilisateur, créer un profil
      if (data.user) {
        try {
          // Vérifier si le profil existe déjà
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", data.user.id)
            .maybeSingle()

          if (!existingProfile) {
            // Créer un nouveau profil
            await supabase.from("profiles").insert({
              id: data.user.id,
              username: data.user.email,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
              status: "online",
            })
          }
        } catch (profileError) {
          console.error("Erreur lors de la création du profil:", profileError)
          // Continuer même si la création du profil échoue
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'échange du code:", error)
      // Rediriger vers la page d'accueil en cas d'erreur
      return NextResponse.redirect(new URL("/", requestUrl.origin))
    }
  }

  // URL de redirection après authentification
  return NextResponse.redirect(new URL("/messages", requestUrl.origin))
}
