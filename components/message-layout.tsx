"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { ConversationList } from "@/components/conversation-list"
import { MessagePanel } from "@/components/message-panel"
import { Button } from "@/components/ui/button"
import { PlusCircle, LogOut } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { NewConversationDialog } from "@/components/new-conversation-dialog"
import type { Profile } from "@/lib/database.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MessageLayoutProps {
  profile: Profile
  initialConversations: any[]
  userId: string
}

export function MessageLayout({ profile, initialConversations, userId }: MessageLayoutProps) {
  const [conversations, setConversations] = useState<any[]>(initialConversations || [])
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null)
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      toast({
        title: "Erreur",
        description: "Impossible de vous déconnecter. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  const handleConversationSelect = (conversation: any) => {
    setSelectedConversation(conversation)
  }

  const handleNewConversation = (newConversation: any) => {
    setConversations([newConversation, ...conversations])
    setSelectedConversation(newConversation)
    setIsNewConversationOpen(false)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Sidebar */}
      <div className="w-80 flex flex-col border-r border-gray-800 futuristic-panel">
        {/* User Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={profile.avatar_url || ""} alt={profile.username || ""} />
              <AvatarFallback>
                {profile.username?.charAt(0).toUpperCase() || profile.id.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{profile.username || profile.id}</p>
              <p className="text-xs text-gray-400">En ligne</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Déconnexion</span>
          </Button>
        </div>

        <div className="p-4">
          <Button
            onClick={() => setIsNewConversationOpen(true)}
            className="w-full flex items-center justify-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Nouvelle conversation
          </Button>
        </div>

        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelect={handleConversationSelect}
          currentUserId={userId}
        />
      </div>

      {/* Message Panel */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <MessagePanel conversation={selectedConversation} currentUserId={userId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-white futuristic-glow">Bienvenue sur Merfenger</h3>
              <p className="text-gray-400">Sélectionnez une conversation ou créez-en une nouvelle</p>
              <Button onClick={() => setIsNewConversationOpen(true)}>Nouvelle conversation</Button>
            </div>
          </div>
        )}
      </div>

      <NewConversationDialog
        open={isNewConversationOpen}
        onOpenChange={setIsNewConversationOpen}
        onConversationCreated={handleNewConversation}
        currentUserId={userId}
      />
    </div>
  )
}
