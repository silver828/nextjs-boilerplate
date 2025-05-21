import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MessagesLayout from "@/components/messages/messages-layout"

export default async function MessagesPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Récupérer le profil de l'utilisateur
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (!profile) {
    // Si le profil n'existe pas, le créer
    await supabase.from("profiles").insert({
      id: session.user.id,
      email: session.user.email,
    })
  }

  // Récupérer les conversations de l'utilisateur
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", session.user.id)

  const conversationIds = participations?.map((p) => p.conversation_id) || []

  let conversations = []

  if (conversationIds.length > 0) {
    const { data } = await supabase
      .from("conversations")
      .select(`
        *,
        conversation_participants!inner(profile_id),
        profiles!conversation_participants(id, username, email, avatar_url)
      `)
      .in("id", conversationIds)
      .order("updated_at", { ascending: false })

    conversations = data || []
  }

  return <MessagesLayout userId={session.user.id} initialConversations={conversations} />
}
