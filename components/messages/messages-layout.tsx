"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import ConversationsList from "./conversations-list"
import MessageThread from "./message-thread"
import Header from "./header"
import NewConversationModal from "./new-conversation-modal"

interface MessagesLayoutProps {
  userId: string
  initialConversations: any[]
}

export default function MessagesLayout({ userId, initialConversations }: MessagesLayoutProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Écouter les changements en temps réel sur les conversations
    const conversationsChannel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationsChannel)
    }
  }, [supabase, router])

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation)
  }

  const handleNewConversation = (newConversation: any) => {
    setConversations([newConversation, ...conversations])
    setSelectedConversation(newConversation)
    setIsNewConversationModalOpen(false)
  }

  return (
    <div className="flex flex-col h-screen">
      <Header onNewConversation={() => setIsNewConversationModalOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-80 border-r border-neon-blue/20 overflow-y-auto">
          <ConversationsList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            currentUserId={userId}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {selectedConversation ? (
            <MessageThread conversation={selectedConversation} currentUserId={userId} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold neon-text mb-2">Bienvenue sur Marsenger</h3>
                <p className="text-gray-400 mb-4">Sélectionnez une conversation ou commencez-en une nouvelle</p>
                <button onClick={() => setIsNewConversationModalOpen(true)} className="cyber-button">
                  Nouvelle conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onConversationCreated={handleNewConversation}
        currentUserId={userId}
      />
    </div>
  )
}
