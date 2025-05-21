import { NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier si le profil existe déjà
    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", session.user.id).single()

    if (existingProfile) {
      return NextResponse.json({ success: true, profile: existingProfile })
    }

    // Créer un nouveau profil avec l'email comme nom d'utilisateur par défaut
    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        id: session.user.id,
        username: session.user.email, // Utiliser l'email comme nom d'utilisateur par défaut
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
        status: "online",
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur lors de la création du profil:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: newProfile })
  } catch (error: any) {
    console.error("Erreur dans l'API create-profile:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
