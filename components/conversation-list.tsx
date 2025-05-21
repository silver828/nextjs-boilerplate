"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface ConversationListProps {
  conversations: any[]
  selectedConversation: any | null
  onSelect: (conversation: any) => void
  currentUserId: string
}

export function ConversationList({
  conversations = [],
  selectedConversation,
  onSelect,
  currentUserId,
}: ConversationListProps) {
  // Fonction pour obtenir les autres participants d'une conversation
  const getOtherParticipants = (conversation: any) => {
    if (!conversation || !conversation.profiles) return []

    // Adapter en fonction de la structure des données
    let profiles = []
    if (Array.isArray(conversation.profiles)) {
      profiles = conversation.profiles
    } else if (conversation.profiles.profiles && Array.isArray(conversation.profiles.profiles)) {
      profiles = conversation.profiles.profiles
    }

    return profiles.filter((profile: any) => profile && profile.id !== currentUserId)
  }

  // Fonction pour obtenir le nom de la conversation
  const getConversationName = (conversation: any) => {
    if (!conversation) return "Conversation"
    const others = getOtherParticipants(conversation)
    if (others.length === 0) return "Conversation"
    return others.map((profile: any) => profile?.username || "Utilisateur").join(", ")
  }

  // Fonction pour obtenir l'avatar de la conversation
  const getConversationAvatar = (conversation: any) => {
    if (!conversation) return null
    const others = getOtherParticipants(conversation)
    if (others.length === 0) return null
    return others[0]?.avatar_url
  }

  // Fonction pour obtenir les initiales de la conversation
  const getConversationInitials = (conversation: any) => {
    const name = getConversationName(conversation)
    return name.charAt(0).toUpperCase()
  }

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      })
    } catch (error) {
      console.error("Erreur de formatage de date:", error)
      return ""
    }
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {!conversations || conversations.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-400">Aucune conversation</p>
        </div>
      ) : (
        <ul>
          {conversations.map((conversation) => (
            <li key={conversation?.id || Math.random().toString()}>
              <button
                className={cn(
                  "w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800/30 transition-colors rounded-lg mx-2",
                  selectedConversation?.id === conversation?.id && "bg-gray-800/50",
                )}
                onClick={() => conversation && onSelect(conversation)}
              >
                <Avatar>
                  <AvatarImage src={getConversationAvatar(conversation) || "/placeholder.svg?height=40&width=40"} />
                  <AvatarFallback>{getConversationInitials(conversation)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left truncate">
                  <p className="font-medium text-sm truncate">{getConversationName(conversation)}</p>
                  <p className="text-xs text-gray-400 truncate">{formatDate(conversation?.updated_at)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
