"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export function ProfileFallback() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  const [isCreating, setIsCreating] = useState(false)
  const [isAutoCreating, setIsAutoCreating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tentative automatique de création de profil au chargement
  useEffect(() => {
    const autoCreateProfile = async () => {
      try {
        // Récupérer la session
        const { data: sessionData } = await supabase.auth.getSession()

        if (!sessionData.session) {
          setError("Vous n'êtes pas connecté.")
          setIsAutoCreating(false)
          return
        }

        // Vérifier si le profil existe déjà
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", sessionData.session.user.id)
          .maybeSingle()

        if (existingProfile) {
          // Le profil existe, rediriger vers la page des messages
          window.location.reload()
          return
        }

        // Créer un profil
        const { error } = await supabase.from("profiles").insert({
          id: sessionData.session.user.id,
          username: sessionData.session.user.email,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionData.session.user.email}`,
          status: "online",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) {
          throw error
        }

        // Attendre un peu avant de recharger la page
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (error: any) {
        console.error("Erreur lors de la création automatique du profil:", error)
        setError(error.message || "Une erreur est survenue lors de la création du profil.")
        setIsAutoCreating(false)
      }
    }

    if (isAutoCreating) {
      autoCreateProfile()
    }
  }, [supabase, isAutoCreating])

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
    setError(null)

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
      const { error } = await supabase.from("profiles").insert({
        id: sessionData.session.user.id,
        username: sessionData.session.user.email,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionData.session.user.email}`,
        status: "online",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }

      toast({
        title: "Profil créé",
        description: "Votre profil a été créé avec succès.",
      })

      // Rafraîchir la page
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error("Erreur lors de la création du profil:", error)
      setError(error.message || "Une erreur est survenue lors de la création du profil.")
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du profil.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (isAutoCreating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold text-white">Création de votre profil</h1>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
          <p className="text-gray-400">Veuillez patienter pendant que nous créons votre profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-white">Problème de profil</h1>
        <p className="text-gray-400">
          Nous n'avons pas pu récupérer ou créer votre profil. Veuillez essayer de créer votre profil manuellement ou
          vous déconnecter.
        </p>
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-md p-3 text-sm text-red-300">{error}</div>
        )}
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
