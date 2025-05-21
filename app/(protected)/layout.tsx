export const dynamic = "force-dynamic"

import type React from "react"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import ErrorBoundary from "@/components/error-boundary"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = getSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      redirect("/")
    }

    return <div className="h-screen">{children}</div>
  } catch (error) {
    console.error("Erreur dans le layout protégé:", error)
    // Rediriger vers la page d'accueil en cas d'erreur
    redirect("/")
  }
}

export { ErrorBoundary as error }
