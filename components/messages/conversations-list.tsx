"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface ConversationsListProps {
  conversations: any[]
  selectedConversation: any
  onSelectConversation: (conversation: any) => void
  currentUserId: string
}

export default function ConversationsList({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUserId,
}: ConversationsListProps) {
  const [conversationsWithLastMessage, setConversationsWithLastMessage] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchLastMessages = async () => {
      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conversation) => {
          // Récupérer le dernier message de chaque conversation
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("*, profiles(username)")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          // Récupérer les autres participants de la conversation
          const otherParticipants = conversation.profiles.filter((profile: any) => profile.id !== currentUserId)

          return {
            ...conversation,
            lastMessage: lastMessage || null,
            otherParticipants,
          }
        }),
      )

      setConversationsWithLastMessage(conversationsWithMessages)
    }

    if (conversations.length > 0) {
      fetchLastMessages()
    } else {
      setConversationsWithLastMessage([])
    }
  }, [conversations, currentUserId, supabase])

  // Fonction pour obtenir le nom de la conversation
  const getConversationName = (conversation: any) => {
    if (!conversation.otherParticipants || conversation.otherParticipants.length === 0) {
      return "Nouvelle conversation"
    }

    return conversation.otherParticipants
      .map((participant: any) => participant.username || participant.email.split("@")[0])
      .join(", ")
  }

  // Fonction pour obtenir l'initiale pour l'avatar
  const getAvatarInitial = (conversation: any) => {
    if (!conversation.otherParticipants || conversation.otherParticipants.length === 0) {
      return "C"
    }

    const participant = conversation.otherParticipants[0]
    return (participant.username || participant.email)[0].toUpperCase()
  }

  // Fonction pour formater la date du dernier message
  const formatMessageDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      })
    } catch (error) {
      return ""
    }
  }

  return (
    <div className="py-2">
      <h2 className="px-4 py-2 text-lg font-semibold text-gray-300">Conversations</h2>

      {conversationsWithLastMessage.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-gray-400">Aucune conversation</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {conversationsWithLastMessage.map((conversation) => (
            <li key={conversation.id}>
              <button
                onClick={() => onSelectConversation(conversation)}
                className={`w-full px-4 py-3 flex items-start space-x-3 hover:bg-cyber-light transition-colors duration-200 ${
                  selectedConversation?.id === conversation.id ? "bg-cyber-light border-l-2 border-neon-blue" : ""
                }`}
              >
                <Avatar className="flex-shrink-0">
                  <AvatarImage src={conversation.otherParticipants?.[0]?.avatar_url || ""} />
                  <AvatarFallback className="bg-cyber-accent text-white">
                    {getAvatarInitial(conversation)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium truncate text-gray-200">{getConversationName(conversation)}</h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {formatMessageDate(conversation.lastMessage.created_at)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs truncate text-gray-400">
                    {conversation.lastMessage ? (
                      <>
                        <span className="font-medium">
                          {conversation.lastMessage.sender_id === currentUserId
                            ? "Vous"
                            : conversation.lastMessage.profiles.username}
                          :
                        </span>{" "}
                        {conversation.lastMessage.content}
                      </>
                    ) : (
                      "Aucun message"
                    )}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
