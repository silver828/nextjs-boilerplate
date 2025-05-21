import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MessageLayout } from "@/components/message-layout"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ProfileFallback } from "@/components/profile-fallback"

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

    // Si le profil n'existe pas, essayer de le créer
    if (!profile && !profileError) {
      try {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: session.user.id,
            username: session.user.email,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
            status: "online",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        // Si le profil a été créé avec succès, l'utiliser
        if (newProfile) {
          // Récupérer les conversations (vide pour un nouveau profil)
          return <MessageLayout profile={newProfile} initialConversations={[]} userId={session.user.id} />
        }
      } catch (error) {
        console.error("Erreur lors de la création du profil:", error)
        return <ProfileFallback />
      }
    }

    // Si le profil existe, l'utiliser
    if (profile) {
      // Récupérer les conversations
      let conversations = []

      try {
        // Utiliser une requête plus simple pour éviter les erreurs de jointure
        const { data: participations } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("profile_id", session.user.id)

        if (participations && participations.length > 0) {
          const conversationIds = participations.map((p) => p.conversation_id)

          const { data: conversationsData } = await supabase
            .from("conversations")
            .select("*")
            .in("id", conversationIds)
            .order("updated_at", { ascending: false })

          if (conversationsData) {
            // Pour chaque conversation, récupérer les participants
            for (const conv of conversationsData) {
              const { data: participants } = await supabase
                .from("conversation_participants")
                .select("profile_id")
                .eq("conversation_id", conv.id)

              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, username, avatar_url")
                .in("id", participants ? participants.map((p) => p.profile_id) : [])

              conv.profiles = profiles || []
            }

            conversations = conversationsData
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des conversations:", error)
        // Continuer avec un tableau vide en cas d'erreur
      }

      return <MessageLayout profile={profile} initialConversations={conversations} userId={session.user.id} />
    }

    // Si nous arrivons ici, c'est qu'il y a eu un problème avec le profil
    return <ProfileFallback />
  } catch (error) {
    console.error("Erreur dans la page des messages:", error)
    return <ProfileFallback />
  }
}

export function Loading() {
  return <LoadingSpinner className="h-10 w-10" />
}
