"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface MessageThreadProps {
  conversation: any
  currentUserId: string
}

export default function MessageThread({ conversation, currentUserId }: MessageThreadProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Récupérer les messages et les participants
  useEffect(() => {
    const fetchMessagesAndParticipants = async () => {
      // Récupérer les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*, profiles(id, username, email, avatar_url)")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })

      if (messagesError) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les messages",
          variant: "destructive",
        })
        return
      }

      setMessages(messagesData || [])

      // Récupérer les participants
      const { data: participantsData, error: participantsError } = await supabase
        .from("conversation_participants")
        .select("profiles(id, username, email, avatar_url)")
        .eq("conversation_id", conversation.id)

      if (participantsError) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les participants",
          variant: "destructive",
        })
        return
      }

      setParticipants(participantsData?.map((p) => p.profiles) || [])

      // Marquer tous les messages comme lus
      await supabase.from("message_status").upsert(
        messagesData
          ?.filter((msg) => msg.sender_id !== currentUserId)
          .map((msg) => ({
            message_id: msg.id,
            profile_id: currentUserId,
            is_read: true,
          })) || [],
        { onConflict: "message_id,profile_id" },
      )
    }

    if (conversation) {
      fetchMessagesAndParticipants()
    }
  }, [conversation, currentUserId, supabase, toast])

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (!conversation) return

    const messagesChannel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          // Récupérer les détails du message avec les informations du profil
          const { data } = await supabase
            .from("messages")
            .select("*, profiles(id, username, email, avatar_url)")
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data])

            // Si le message est d'un autre utilisateur, le marquer comme lu
            if (data.sender_id !== currentUserId) {
              await supabase.from("message_status").upsert(
                {
                  message_id: data.id,
                  profile_id: currentUserId,
                  is_read: true,
                },
                { onConflict: "message_id,profile_id" },
              )
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [conversation, currentUserId, supabase])

  // Faire défiler vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    setLoading(true)

    try {
      // Envoyer le message
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: newMessage.trim(),
        })
        .select()

      if (error) throw error

      // Mettre à jour la date de la conversation
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation.id)

      setNewMessage("")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Obtenir le nom d'un participant
  const getParticipantName = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId)
    return participant?.username || participant?.email?.split("@")[0] || "Utilisateur"
  }

  // Obtenir l'initiale pour l'avatar
  const getAvatarInitial = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId)
    return participant ? (participant.username || participant.email)[0].toUpperCase() : "U"
  }

  // Formater la date du message
  const formatMessageTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm", { locale: fr })
    } catch (error) {
      return ""
    }
  }

  // Formater la date pour les séparateurs de jour
  const formatMessageDate = (dateString: string) => {
    try {
      const messageDate = new Date(dateString)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (messageDate.toDateString() === today.toDateString()) {
        return "Aujourd'hui"
      } else if (messageDate.toDateString() === yesterday.toDateString()) {
        return "Hier"
      } else {
        return format(messageDate, "EEEE d MMMM yyyy", { locale: fr })
      }
    } catch (error) {
      return ""
    }
  }

  // Grouper les messages par jour
  const groupMessagesByDate = () => {
    const groups: { [key: string]: any[] } = {}

    messages.forEach((message) => {
      const date = new Date(message.created_at).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }))
  }

  return (
    <div className="flex flex-col h-full">
      {/* En-tête de la conversation */}
      <div className="border-b border-neon-blue/20 p-3 bg-cyber-dark">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={conversation.otherParticipants?.[0]?.avatar_url || ""} />
            <AvatarFallback className="bg-cyber-accent text-white">
              {conversation.otherParticipants?.[0]
                ? (conversation.otherParticipants[0].username ||
                    conversation.otherParticipants[0].email)[0].toUpperCase()
                : "C"}
            </AvatarFallback>
          </Avatar>

          <h2 className="text-lg font-semibold text-gray-200">
            {conversation.otherParticipants?.map((p: any) => p.username || p.email.split("@")[0]).join(", ") ||
              "Nouvelle conversation"}
          </h2>
        </div>
      </div>

      {/* Corps des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {groupMessagesByDate().map((group) => (
          <div key={group.date} className="space-y-4">
            <div className="flex justify-center">
              <div className="px-3 py-1 rounded-full bg-cyber-accent text-xs text-gray-300">
                {formatMessageDate(group.messages[0].created_at)}
              </div>
            </div>

            {group.messages.map((message: any, index: number) => {
              const isCurrentUser = message.sender_id === currentUserId
              const showAvatar = index === 0 || group.messages[index - 1].sender_id !== message.sender_id

              return (
                <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} items-end space-x-2 max-w-[80%]`}
                  >
                    {!isCurrentUser && showAvatar && (
                      <Avatar className="flex-shrink-0 h-8 w-8">
                        <AvatarImage src={message.profiles?.avatar_url || ""} />
                        <AvatarFallback className="text-xs bg-cyber-accent text-white">
                          {getAvatarInitial(message.sender_id)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`space-y-1 ${isCurrentUser ? "mr-2" : "ml-2"}`}>
                      {!isCurrentUser && showAvatar && (
                        <p className="text-xs text-gray-400">{getParticipantName(message.sender_id)}</p>
                      )}

                      <div
                        className={`p-3 rounded-lg ${
                          isCurrentUser
                            ? "bg-neon-blue/20 text-white border border-neon-blue/30"
                            : "bg-cyber-light text-gray-200"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>

                      <p className="text-xs text-gray-400 text-right">{formatMessageTime(message.created_at)}</p>
                    </div>

                    {isCurrentUser && showAvatar && (
                      <Avatar className="flex-shrink-0 h-8 w-8">
                        <AvatarImage src={message.profiles?.avatar_url || ""} />
                        <AvatarFallback className="text-xs bg-cyber-accent text-white">
                          {getAvatarInitial(message.sender_id)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Formulaire d'envoi de message */}
      <div className="border-t border-neon-blue/20 p-3 bg-cyber-dark">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="cyber-input min-h-[50px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
          />
          <Button type="submit" className="cyber-button" disabled={loading || !newMessage.trim()}>
            Envoyer
          </Button>
        </form>
      </div>
    </div>
  )
}
