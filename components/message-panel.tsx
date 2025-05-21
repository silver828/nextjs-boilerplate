"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Message } from "@/lib/database.types"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { LoadingSpinner } from "@/components/loading-spinner"

interface MessagePanelProps {
  conversation: any
  currentUserId: string
}

export function MessagePanel({ conversation, currentUserId }: MessagePanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  // Charger les messages et les participants
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversation || !conversation.id) {
        setError("Données de conversation invalides")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Charger les messages
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true })

        if (messagesError) throw messagesError
        setMessages(messagesData || [])

        // Charger les participants
        const { data: participantsData, error: participantsError } = await supabase
          .from("conversation_participants")
          .select("profiles(*)")
          .eq("conversation_id", conversation.id)

        if (participantsError) throw participantsError

        // Adapter en fonction de la structure des données
        let profiles = []
        if (participantsData) {
          profiles = participantsData.map((p) => p.profiles).filter(Boolean)
        }

        setParticipants(profiles)
      } catch (error: any) {
        console.error("Erreur lors du chargement des messages:", error)
        setError(`Impossible de charger les messages: ${error.message}`)
        toast({
          title: "Erreur",
          description: "Impossible de charger les messages.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (conversation) {
      loadMessages()
    }
  }, [conversation, supabase, toast])

  // Écouter les nouveaux messages
  useEffect(() => {
    if (!conversation || !conversation.id) return

    try {
      const messagesChannel = supabase
        .channel(`messages-${conversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversation.id}`,
          },
          (payload) => {
            const newMessage = payload.new as Message
            setMessages((prev) => [...prev, newMessage])
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(messagesChannel)
      }
    } catch (error) {
      console.error("Erreur lors de la configuration du canal de messages:", error)
    }
  }, [conversation, supabase])

  // Faire défiler vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Envoyer un nouveau message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !conversation || !conversation.id) return

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
      })

      if (error) throw error

      // Mettre à jour la date de la conversation
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation.id)

      setNewMessage("")
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message.",
        variant: "destructive",
      })
    }
  }

  // Obtenir le profil d'un participant par ID
  const getParticipantProfile = (userId: string) => {
    return participants.find((p) => p && p.id === userId)
  }

  // Formater la date
  const formatMessageDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      })
    } catch (error) {
      return ""
    }
  }

  // Obtenir le nom de la conversation
  const getConversationName = () => {
    const others = participants.filter((p) => p && p.id !== currentUserId)
    if (others.length === 0) return "Conversation"
    return others.map((p) => p?.username || "Utilisateur").join(", ")
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Sélectionnez une conversation</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* En-tête de la conversation */}
      <div className="p-4 border-b border-gray-800 flex items-center">
        <h2 className="text-lg font-semibold">{getConversationName()}</h2>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner className="h-6 w-6" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-red-400">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400">Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((message) => {
            const isSent = message.sender_id === currentUserId
            const sender = getParticipantProfile(message.sender_id)

            return (
              <div key={message.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                <div className="flex gap-2 max-w-[80%]">
                  {!isSent && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={sender?.avatar_url || ""} />
                      <AvatarFallback>{sender?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  )}

                  <div>
                    <div className={`message-bubble ${isSent ? "sent" : "received"}`}>{message.content}</div>
                    <p className="text-xs text-gray-400 mt-1 px-2">{formatMessageDate(message.created_at)}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className="bg-gray-800/50"
          disabled={loading || !!error}
        />
        <Button type="submit" disabled={!newMessage.trim() || loading || !!error}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Envoyer</span>
        </Button>
      </form>
    </div>
  )
}
