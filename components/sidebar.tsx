"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, LogOut, Plus, Search, User } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/database.types"
import { cn } from "@/lib/utils"
import NewConversationDialog from "./new-conversation-dialog"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type Conversation = Database["public"]["Tables"]["conversations"]["Row"] & {
  profiles: Profile[]
  last_message: {
    content: string
    created_at: string
    profile_id: string
  } | null
}

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [user, setUser] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false)

  useEffect(() => {
    const fetchUserAndConversations = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Get user profile
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profile) {
          setUser(profile)
        }

        // Get conversations
        const { data: participantData } = await supabase
          .from("participants")
          .select("conversation_id")
          .eq("profile_id", user.id)

        if (participantData && participantData.length > 0) {
          const conversationIds = participantData.map((p) => p.conversation_id)

          const { data: conversationsData } = await supabase
            .from("conversations")
            .select(`
              *,
              participants!inner(profile_id),
              profiles:participants!inner(profiles(*))
            `)
            .in("id", conversationIds)
            .order("last_message_at", { ascending: false })

          if (conversationsData) {
            // Get last message for each conversation
            const conversationsWithLastMessage = await Promise.all(
              conversationsData.map(async (conversation) => {
                const { data: lastMessageData } = await supabase
                  .from("messages")
                  .select("content, created_at, profile_id")
                  .eq("conversation_id", conversation.id)
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .single()

                return {
                  ...conversation,
                  last_message: lastMessageData || null,
                  // Filter out current user from profiles
                  profiles: conversation.profiles.map((p: any) => p.profiles).filter((p: Profile) => p.id !== user.id),
                }
              }),
            )

            setConversations(conversationsWithLastMessage)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndConversations()

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUserAndConversations()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesSubscription)
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const filteredConversations = conversations.filter((conversation) => {
    if (!searchQuery) return true

    // For group chats, search in the name
    if (conversation.is_group && conversation.name) {
      return conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
    }

    // For direct messages, search in the other user's name or username
    return conversation.profiles.some(
      (profile) =>
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.username.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  })

  const getConversationName = (conversation: Conversation) => {
    if (conversation.is_group) return conversation.name
    return conversation.profiles[0]?.full_name || conversation.profiles[0]?.username || "Unknown"
  }

  const getAvatarText = (conversation: Conversation) => {
    if (conversation.is_group) return conversation.name?.substring(0, 2) || "G"
    return (
      conversation.profiles[0]?.full_name?.substring(0, 2) || conversation.profiles[0]?.username?.substring(0, 2) || "U"
    )
  }

  return (
    <div className="w-80 border-r flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <MessageCircle className="h-6 w-6 text-green-600" />
          <span className="ml-2 font-bold">Silvenger</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/profile")} className="h-8 w-8">
            <User className="h-5 w-5" />
            <span className="sr-only">Profile</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>

      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-3 border-b">
        <Button className="w-full" onClick={() => setIsNewConversationOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground">Start a new conversation to begin messaging</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                className={cn(
                  "flex items-center p-3 hover:bg-muted/50 transition-colors",
                  pathname === `/conversations/${conversation.id}` && "bg-muted",
                )}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={conversation.profiles[0]?.avatar_url || undefined} />
                  <AvatarFallback>{getAvatarText(conversation)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{getConversationName(conversation)}</p>
                    {conversation.last_message && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.last_message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.last_message ? (
                      conversation.last_message.profile_id === user?.id ? (
                        <span>You: {conversation.last_message.content}</span>
                      ) : (
                        conversation.last_message.content
                      )
                    ) : (
                      "No messages yet"
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <NewConversationDialog
        isOpen={isNewConversationOpen}
        onClose={() => setIsNewConversationOpen(false)}
        currentUserId={user?.id || ""}
      />
    </div>
  )
}
