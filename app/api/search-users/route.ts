export const dynamic = "force-dynamic"

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

    const { searchTerm } = await request.json()

    if (!searchTerm || typeof searchTerm !== "string") {
      return NextResponse.json({ error: "Terme de recherche invalide" }, { status: 400 })
    }

    // Rechercher dans les profils existants
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${searchTerm}%`)
      .neq("id", session.user.id)
      .limit(5)

    if (profilesError) {
      console.error("Erreur lors de la recherche de profils:", profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    return NextResponse.json({ users: profilesData || [] })
  } catch (error: any) {
    console.error("Erreur dans l'API search-users:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
