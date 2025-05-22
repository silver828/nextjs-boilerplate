import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const currentUserId = searchParams.get("currentUserId")

    if (!currentUserId) {
      return NextResponse.json({ error: "currentUserId est requis" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Récupérer tous les utilisateurs sauf l'utilisateur actuel
    const { data, error } = await supabase.from("profiles").select("*").neq("id", currentUserId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
