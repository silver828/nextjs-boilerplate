"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function ProfileFallback() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  const [isCreating, setIsCreating] = useState(false)

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const handleCreateProfile = async () => {
    setIsCreating(true)
    try {
      // Récupérer la session
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        toast({
          title: "Erreur",
          description: "Vous n'êtes pas connecté.",
          variant: "destructive",
        })
        window.location.href = "/"
        return
      }

      // Créer un profil manuellement
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: sessionData.session.user.id,
          username: sessionData.session.user.email,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionData.session.user.email}`,
          status: "online",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) {
        throw error
      }

      toast({
        title: "Profil créé",
        description: "Votre profil a été créé avec succès.",
      })

      // Rafraîchir la page
      window.location.reload()
    } catch (error: any) {
      console.error("Erreur lors de la création du profil:", error)
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du profil.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-white">Problème de profil</h1>
        <p className="text-gray-400">
          Nous n'avons pas pu récupérer ou créer votre profil. Veuillez essayer de créer votre profil manuellement ou
          vous déconnecter.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button onClick={handleCreateProfile} variant="default" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer mon profil"
            )}
          </Button>
          <Button onClick={handleSignOut} variant="outline">
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  )
}
