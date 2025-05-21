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
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()

    if (checkError) {
      console.error("Erreur lors de la vérification du profil:", checkError)
    }

    if (existingProfile) {
      return NextResponse.json({ success: true, profile: existingProfile })
    }

    // Créer un nouveau profil
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: session.user.id,
        username: session.user.email,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
        status: "online",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Erreur lors de la création du profil:", insertError)

      // Vérifier si le profil existe maintenant (en cas de race condition)
      const { data: checkAgain } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

      if (checkAgain) {
        return NextResponse.json({ success: true, profile: checkAgain })
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: newProfile })
  } catch (error: any) {
    console.error("Erreur dans l'API create-profile:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
