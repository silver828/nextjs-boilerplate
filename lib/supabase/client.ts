import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

// Création d'un singleton pour le client Supabase côté client
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    try {
      supabaseClient = createClientComponentClient<Database>()
    } catch (error) {
      console.error("Erreur lors de la création du client Supabase:", error)
      // Recréer le client en cas d'erreur
      supabaseClient = createClientComponentClient<Database>()
    }
  }
  return supabaseClient
}
