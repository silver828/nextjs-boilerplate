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

    // Vérifier si l'utilisateur a un profil
    if (
      !children.props?.childProp?.segment?.includes("create-profile") &&
      !children.props?.childProp?.segment?.includes("error")
    ) {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle()

        // Si le profil n'existe pas, rediriger vers la page de création de profil
        if (!profile && !error) {
          redirect("/create-profile")
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du profil:", error)
        // Continuer sans redirection en cas d'erreur
      }
    }

    return <div className="h-screen">{children}</div>
  } catch (error) {
    console.error("Erreur dans le layout protégé:", error)
    // Rediriger vers la page d'accueil en cas d'erreur
    redirect("/")
  }
}

export { ErrorBoundary as error }
