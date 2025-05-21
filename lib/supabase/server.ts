import { createServerComponentClient, createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

// Client Supabase pour les Server Components
export const getSupabaseServerClient = () => {
  try {
    const cookieStore = cookies()
    return createServerComponentClient<Database>({ cookies: () => cookieStore })
  } catch (error) {
    console.error("Erreur lors de la création du client Supabase serveur:", error)
    // Réessayer avec une nouvelle instance
    const cookieStore = cookies()
    return createServerComponentClient<Database>({ cookies: () => cookieStore })
  }
}

// Client Supabase pour les Server Actions
export const getSupabaseServerActionClient = () => {
  try {
    const cookieStore = cookies()
    return createServerActionClient<Database>({ cookies: () => cookieStore })
  } catch (error) {
    console.error("Erreur lors de la création du client Supabase pour les actions serveur:", error)
    // Réessayer avec une nouvelle instance
    const cookieStore = cookies()
    return createServerActionClient<Database>({ cookies: () => cookieStore })
  }
}
