"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { ConversationList } from "@/components/conversation-list"
import { MessagePanel } from "@/components/message-panel"
import { UserHeader } from "@/components/user-header"
import { NewConversationDialog } from "@/components/new-conversation-dialog"
import type { Profile } from "@/lib/database.types"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"

interface MessageLayoutProps {
  profile: Profile
  initialConversations: any[]
  userId: string
}

export function MessageLayout({ profile, initialConversations, userId }: MessageLayoutProps) {
  const [userProfile, setUserProfile] = useState<Profile>(profile)
  const [conversations, setConversations] = useState<any[]>(initialConversations || [])
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null)
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  const [hasProfile, setHasProfile] = useState(!!(profile && userId))

  useEffect(() => {
    setHasProfile(!!(profile && userId))
  }, [profile, userId])

  useEffect(() => {
    if (hasProfile) {
      try {
        // Écouter les changements dans les conversations
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
      } catch (error) {
        console.error("Erreur lors de la configuration du canal de conversations:", error)
      }
    }
  }, [supabase, router, hasProfile])

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

  const handleProfileUpdated = (updatedProfile: Profile) => {
    setUserProfile(updatedProfile)
  }

  if (!hasProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erreur: Données de profil manquantes</p>
          <Button onClick={() => window.location.reload()}>Actualiser</Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <LoadingSpinner className="h-10 w-10" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Sidebar */}
      <div className="w-80 flex flex-col border-r border-gray-800 futuristic-panel">
        <UserHeader profile={userProfile} onSignOut={handleSignOut} onProfileUpdated={handleProfileUpdated} />

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
