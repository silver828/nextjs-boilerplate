import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ChatHeader from "@/components/chat-header"
import MessageList from "@/components/message-list"
import MessageInput from "@/components/message-input"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type Conversation = Database["public"]["Tables"]["conversations"]["Row"] & {
  profiles: Profile[]
}

interface ConversationPageProps {
  params: {
    conversationId: string
  }
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = params
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    notFound()
  }

  // Check if user is a participant
  const { data: participant } = await supabase
    .from("participants")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("profile_id", session.user.id)
    .single()

  if (!participant) {
    notFound()
  }

  // Get conversation details
  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      *,
      participants!inner(profile_id),
      profiles:participants!inner(profiles(*))
    `)
    .eq("id", conversationId)
    .single()

  if (!conversation) {
    notFound()
  }

  // Filter out current user from profiles
  const otherProfiles = conversation.profiles
    .map((p: any) => p.profiles)
    .filter((p: Profile) => p.id !== session.user.id)

  const conversationData: Conversation = {
    ...conversation,
    profiles: otherProfiles,
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversation={conversationData} currentUserId={session.user.id} />
      <MessageList conversationId={conversationId} currentUserId={session.user.id} />
      <MessageInput conversationId={conversationId} />
    </div>
  )
}
