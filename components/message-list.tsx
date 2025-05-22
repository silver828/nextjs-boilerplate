"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Database } from "@/lib/database.types"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { messageQueue, type QueuedMessage } from "@/lib/message-queue"
import { useTyping } from "@/hooks/use-typing"
import { usePresence } from "@/hooks/use-presence"
import { Check, CheckCheck } from "lucide-react"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  profiles: Profile
}

interface MessageListProps {
  conversationId: string
  currentUserId: string
}

export default function MessageList({ conversationId, currentUserId }: MessageListProps) {
  const supabase = createClient()

  const [messages, setMessages] = useState<Message[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [pendingMessages, setPendingMessages] = useState<QueuedMessage[]>([])

  const { typingUsers } = useTyping(conversationId, currentUserId)
  const { isOnline, getLastSeen } = usePresence(currentUserId)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Get messages
        const { data: messagesData } = await supabase
          .from("messages")
          .select(`
            *,
            profiles(*)
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (messagesData) {
          setMessages(messagesData as Message[])

          // Create profiles lookup
          const profilesMap: Record<string, Profile> = {}
          messagesData.forEach((message: any) => {
            if (message.profiles) {
              profilesMap[message.profiles.id] = message.profiles
            }
          })

          setProfiles(profilesMap)

          // Mark messages as read
          const unreadMessages = messagesData.filter((msg: any) => !msg.is_read && msg.profile_id !== currentUserId)

          if (unreadMessages.length > 0) {
            await Promise.all(
              unreadMessages.map((msg: any) => supabase.from("messages").update({ is_read: true }).eq("id", msg.id)),
            )
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Get profile for the new message
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", payload.new.profile_id)
            .single()

          if (profileData) {
            setProfiles((prev) => ({
              ...prev,
              [profileData.id]: profileData,
            }))
          }

          const newMessage = {
            ...(payload.new as Message),
            profiles: profileData as Profile,
          }

          setMessages((prev) => [...prev, newMessage])

          // Mark message as read if it's not from current user
          if (payload.new.profile_id !== currentUserId) {
            await supabase.from("messages").update({ is_read: true }).eq("id", payload.new.id)
          }
        },
      )
      .subscribe()

    // Subscribe to message updates (read status)
    const messageUpdatesSubscription = supabase
      .channel(`message-updates:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...(payload.new as any) } : msg)),
          )
        },
      )
      .subscribe()

    // Subscribe to message queue updates
    const unsubscribe = messageQueue.addListener((queue) => {
      const conversationMessages = queue.filter((msg) => msg.conversation_id === conversationId)
      setPendingMessages(conversationMessages)
    })

    return () => {
      supabase.removeChannel(messagesSubscription)
      supabase.removeChannel(messageUpdatesSubscription)
      unsubscribe()
    }
  }, [conversationId, currentUserId, supabase])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, pendingMessages, typingUsers])

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()

    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return format(date, "HH:mm")
    }

    // If within last week, show day and time
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(date, "EEEE HH:mm", { locale: fr })
    }

    // Otherwise show full date and time
    return format(date, "d MMM yyyy HH:mm", { locale: fr })
  }

  const getTypingProfiles = () => {
    return Object.entries(typingUsers)
      .filter(([id, isTyping]) => isTyping && id !== currentUserId)
      .map(([id]) => profiles[id])
      .filter(Boolean)
  }

  const renderTypingIndicator = () => {
    const typingProfiles = getTypingProfiles()

    if (typingProfiles.length === 0) return null

    return (
      <div className="flex items-center mb-4">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={typingProfiles[0]?.avatar_url || undefined} />
          <AvatarFallback>
            {typingProfiles[0]?.full_name?.substring(0, 2) || typingProfiles[0]?.username?.substring(0, 2) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="bg-muted px-4 py-2 rounded-lg rounded-bl-none">
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "600ms" }}></div>
          </div>
        </div>
      </div>
    )
  }

  const renderMessageStatus = (message: Message | QueuedMessage) => {
    // For pending messages
    if ("status" in message) {
      switch (message.status) {
        case "queued":
          return <div className="h-4 w-4"></div>
        case "sending":
          return <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin"></div>
        case "sent":
          return <Check className="h-4 w-4 text-gray-500" />
        case "delivered":
          return <CheckCheck className="h-4 w-4 text-gray-500" />
        case "read":
          return <CheckCheck className="h-4 w-4 text-blue-500" />
        case "failed":
          return <div className="h-4 w-4 text-red-500">!</div>
        default:
          return null
      }
    }

    // For server messages
    if (message.is_read) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />
    } else {
      return <Check className="h-4 w-4 text-gray-500" />
    }
  }

  const renderMessages = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Chargement des messages...</p>
        </div>
      )
    }

    if (messages.length === 0 && pendingMessages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Pas encore de messages</p>
        </div>
      )
    }

    // Combine server messages and pending messages
    const allMessages = [
      ...messages,
      ...pendingMessages.map((pm) => ({
        id: pm.id,
        conversation_id: pm.conversation_id,
        profile_id: currentUserId,
        content: pm.content,
        is_read: false,
        created_at: pm.created_at,
        updated_at: pm.created_at,
        profiles: profiles[currentUserId],
        _isPending: true,
        _status: pm.status,
      })),
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return allMessages.map((message, index) => {
      const isCurrentUser = message.profile_id === currentUserId
      const profile = profiles[message.profile_id]
      const showAvatar = !isCurrentUser && (index === 0 || allMessages[index - 1].profile_id !== message.profile_id)
      const isPending = "_isPending" in message

      return (
        <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}>
          {!isCurrentUser && showAvatar && (
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.full_name?.substring(0, 2) || profile?.username?.substring(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
          )}

          {!isCurrentUser && !showAvatar && <div className="w-8 mr-2" />}

          <div className={`max-w-[70%] ${isCurrentUser ? "order-1" : "order-2"}`}>
            {!isCurrentUser && showAvatar && (
              <p className="text-xs text-muted-foreground mb-1">
                {profile?.full_name || profile?.username || "Inconnu"}
              </p>
            )}

            <div className="flex items-end">
              <div
                className={`
                px-4 py-2 rounded-lg
                ${isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"}
                ${isPending ? "opacity-70" : ""}
              `}
              >
                <p>{message.content}</p>
              </div>

              {isCurrentUser && <div className="ml-2">{renderMessageStatus(message)}</div>}
            </div>

            <p className="text-xs text-muted-foreground mt-1">{formatMessageDate(message.created_at)}</p>
          </div>
        </div>
      )
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {renderMessages()}
      {renderTypingIndicator()}
      <div ref={messagesEndRef} />
    </div>
  )
}
