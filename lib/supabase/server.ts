import { createServerComponentClient, createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

// Client Supabase pour les Server Components
export const getSupabaseServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// Client Supabase pour les Server Actions
export const getSupabaseServerActionClient = () => {
  const cookieStore = cookies()
  return createServerActionClient<Database>({ cookies: () => cookieStore })
}
