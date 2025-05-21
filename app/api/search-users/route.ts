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
      .or(`username.ilike.%${searchTerm}%,username.eq.${searchTerm}`)
      .neq("id", session.user.id)
      .limit(5)

    if (profilesError) {
      console.error("Erreur lors de la recherche de profils:", profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Si le terme de recherche est un email et qu'aucun profil n'a été trouvé,
    // nous pourrions essayer de rechercher dans les utilisateurs auth
    // Mais cela nécessite des permissions spéciales
    // Cette partie est commentée car elle nécessite des droits d'administrateur
    /*
    if (searchTerm.includes('@') && (!profilesData || profilesData.length === 0)) {
      // Cette requête nécessite des droits d'administrateur
      const { data: authUsers, error: authError } = await supabase
        .rpc('search_users_by_email', { email_query: searchTerm })
      
      if (!authError && authUsers && authUsers.length > 0) {
        // Traiter les résultats...
      }
    }
    */

    return NextResponse.json({ users: profilesData || [] })
  } catch (error: any) {
    console.error("Erreur dans l'API search-users:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
