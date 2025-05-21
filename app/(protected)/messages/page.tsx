import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MessageLayout } from "@/components/message-layout"
import { LoadingSpinner } from "@/components/loading-spinner"

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

    // Récupérer le profil de l'utilisateur de manière simplifiée
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()

    // Si le profil n'existe pas, créer un profil par défaut
    if (!profile) {
      // Utiliser un objet simple au lieu d'une requête d'insertion qui pourrait échouer
      const defaultProfile = {
        id: session.user.id,
        username: session.user.email,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
        status: "online",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return <MessageLayout profile={defaultProfile} initialConversations={[]} userId={session.user.id} />
    }

    // Récupérer les conversations de manière simplifiée
    let conversations = []

    try {
      // Utiliser une requête plus simple pour éviter les erreurs de jointure
      const { data: conversationsData } = await supabase
        .from("conversations")
        .select(`
          *,
          conversation_participants!inner(profile_id, conversation_id),
          profiles!conversation_participants(id, username, avatar_url)
        `)
        .eq("conversation_participants.profile_id", session.user.id)
        .order("updated_at", { ascending: false })

      conversations = conversationsData || []
    } catch (error) {
      console.error("Erreur lors de la récupération des conversations:", error)
      // Continuer avec un tableau vide en cas d'erreur
    }

    return <MessageLayout profile={profile} initialConversations={conversations} userId={session.user.id} />
  } catch (error) {
    console.error("Erreur dans la page des messages:", error)
    // Rediriger vers la page d'accueil en cas d'erreur
    redirect("/")
  }
}

export function Loading() {
  return <LoadingSpinner className="h-10 w-10" />
}
