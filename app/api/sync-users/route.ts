import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Récupérer tous les utilisateurs authentifiés
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Récupérer tous les profils existants
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id")

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Créer un ensemble d'IDs de profils existants pour une recherche rapide
    const existingProfileIds = new Set(profiles?.map((p) => p.id) || [])

    // Trouver les utilisateurs qui n'ont pas de profil
    const usersWithoutProfiles = authUsers?.users.filter((user) => !existingProfileIds.has(user.id)) || []

    // Créer des profils pour les utilisateurs qui n'en ont pas
    const newProfiles = []
    for (const user of usersWithoutProfiles) {
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        username: user.email?.split("@")[0] || "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (!error) {
        newProfiles.push({
          id: user.id,
          email: user.email,
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalAuthUsers: authUsers?.users.length || 0,
      totalProfiles: profiles?.length || 0,
      usersWithoutProfiles: usersWithoutProfiles.length,
      newProfilesCreated: newProfiles.length,
      newProfiles,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
