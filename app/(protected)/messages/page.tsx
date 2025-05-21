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
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()

    // Si le profil n'existe pas, afficher le composant de fallback
    if (!profile) {
      return <ProfileFallback />
    }

    // Récupérer les conversations
    let conversations = []

    try {
      // Récupérer les IDs des conversations auxquelles l'utilisateur participe
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", session.user.id)

      if (participations && participations.length > 0) {
        const conversationIds = participations.map((p) => p.conversation_id)

        // Récupérer les conversations
        const { data: conversationsData } = await supabase
          .from("conversations")
          .select("*")
          .in("id", conversationIds)
          .order("updated_at", { ascending: false })

        if (conversationsData) {
          // Pour chaque conversation, récupérer les participants
          const enhancedConversations = []

          for (const conv of conversationsData) {
            try {
              // Récupérer les IDs des participants
              const { data: participantsData } = await supabase
                .from("conversation_participants")
                .select("profile_id")
                .eq("conversation_id", conv.id)

              if (participantsData) {
                const participantIds = participantsData.map((p) => p.profile_id)

                // Récupérer les profils des participants
                const { data: profilesData } = await supabase
                  .from("profiles")
                  .select("id, username, avatar_url")
                  .in("id", participantIds)

                // Ajouter les profils à la conversation
                const enhancedConv = {
                  ...conv,
                  profiles: profilesData || [],
                }

                enhancedConversations.push(enhancedConv)
              } else {
                enhancedConversations.push({ ...conv, profiles: [] })
              }
            } catch (error) {
              console.error(`Erreur lors de la récupération des participants pour la conversation ${conv.id}:`, error)
              enhancedConversations.push({ ...conv, profiles: [] })
            }
          }

          conversations = enhancedConversations
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des conversations:", error)
      // Continuer avec un tableau vide en cas d'erreur
    }

    return <MessageLayout profile={profile} initialConversations={conversations} userId={session.user.id} />
  } catch (error) {
    console.error("Erreur dans la page des messages:", error)
    return <ProfileFallback />
  }
}

export function Loading() {
  return <LoadingSpinner className="h-10 w-10" />
}
