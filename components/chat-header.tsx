"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Database } from "@/lib/database.types"
import { MoreVertical, Phone, Video } from "lucide-react"
import { usePresence } from "@/hooks/use-presence"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type Conversation = Database["public"]["Tables"]["conversations"]["Row"] & {
  profiles: Profile[]
}

interface ChatHeaderProps {
  conversation: Conversation
  currentUserId: string
}

export default function ChatHeader({ conversation, currentUserId }: ChatHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const { isOnline, getLastSeen } = usePresence(currentUserId)

  const [loading, setLoading] = useState(false)

  const isGroup = conversation.is_group
  const otherUser = conversation.profiles[0]

  const getConversationName = () => {
    if (isGroup) return conversation.name
    return otherUser?.full_name || otherUser?.username || "Inconnu"
  }

  const getAvatarText = () => {
    if (isGroup) return conversation.name?.substring(0, 2) || "G"
    return otherUser?.full_name?.substring(0, 2) || otherUser?.username?.substring(0, 2) || "U"
  }

  const getStatusText = () => {
    if (isGroup) {
      return `${conversation.profiles.length + 1} membres`
    }

    if (otherUser && isOnline(otherUser.id)) {
      return "En ligne"
    }

    const lastSeen = otherUser && getLastSeen(otherUser.id)
    if (lastSeen) {
      return `Vu(e) ${formatDistanceToNow(new Date(lastSeen), {
        addSuffix: true,
        locale: fr,
      })}`
    }

    return "Hors ligne"
  }

  const handleLeaveConversation = async () => {
    if (loading) return

    setLoading(true)

    try {
      // Delete participant
      await supabase
        .from("participants")
        .delete()
        .eq("conversation_id", conversation.id)
        .eq("profile_id", currentUserId)

      router.push("/conversations")
    } catch (error) {
      console.error("Error leaving conversation:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-16 border-b flex items-center justify-between px-4">
      <div className="flex items-center">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={isGroup ? undefined : otherUser?.avatar_url || undefined} />
          <AvatarFallback>{getAvatarText()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{getConversationName()}</p>
          <p className="text-xs text-muted-foreground">
            {otherUser && isOnline(otherUser.id) && (
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            )}
            {getStatusText()}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Phone className="h-5 w-5" />
          <span className="sr-only">Appeler</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Video className="h-5 w-5" />
          <span className="sr-only">Appel vidéo</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">Plus d'options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLeaveConversation} disabled={loading}>
              {loading ? "Quitter..." : "Quitter la conversation"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
