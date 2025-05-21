"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export function ProfileFallback() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const handleRetry = () => {
    toast({
      title: "Actualisation",
      description: "Tentative de récupération de votre profil...",
    })
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-white">Problème de profil</h1>
        <p className="text-gray-400">
          Nous n'avons pas pu récupérer votre profil. Veuillez réessayer ou vous déconnecter.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button onClick={handleRetry} variant="default">
            Réessayer
          </Button>
          <Button onClick={handleSignOut} variant="outline">
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  )
}
