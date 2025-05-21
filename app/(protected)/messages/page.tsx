export const dynamic = "force-dynamic"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MessageLayout } from "@/components/message-layout"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AuthError } from "@/components/auth-error"

export default async function MessagesPage() {
  try {
    const supabase = getSupabaseServerClient()

    // Vérifier la session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      redirect("/")
    }

    // Récupérer le profil de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()

    // Si le profil n'existe pas, le créer
    if (!profile && !profileError) {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: session.user.id,
          username: session.user.email,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
          status: "online",
        })
        .select()
        .single()

      if (insertError) {
        return (
          <AuthError
            title="Erreur de profil"
            message="Impossible de créer votre profil. Veuillez vous déconnecter et réessayer."
          />
        )
      }

      // Si le profil a été créé avec succès, l'utiliser
      if (newProfile) {
        return <MessageLayout profile={newProfile} initialConversations={[]} userId={session.user.id} />
      }
    }

    if (profileError) {
      return (
        <AuthError
          title="Erreur de profil"
          message="Impossible de récupérer votre profil. Veuillez vous déconnecter et réessayer."
        />
      )
    }

    // Si le profil existe, l'utiliser
    if (profile) {
      // Récupérer les conversations
      const { data: conversations = [] } = await supabase
        .from("conversations")
        .select(
          `
          *,
          conversation_participants!inner(profile_id),
          profiles:conversation_participants!inner(profiles(*))
        `,
        )
        .eq("conversation_participants.profile_id", session.user.id)
        .order("updated_at", { ascending: false })

      return <MessageLayout profile={profile} initialConversations={conversations || []} userId={session.user.id} />
    }

    // Si nous arrivons ici, c'est qu'il y a eu un problème avec le profil
    return (
      <AuthError
        title="Erreur de profil"
        message="Impossible de récupérer ou de créer votre profil. Veuillez vous déconnecter et réessayer."
      />
    )
  } catch (error) {
    console.error("Erreur dans la page des messages:", error)
    return (
      <AuthError
        title="Erreur inattendue"
        message="Une erreur inattendue s'est produite. Veuillez réessayer ultérieurement."
      />
    )
  }
}

export function Loading() {
  return <LoadingSpinner className="h-10 w-10" />
}
