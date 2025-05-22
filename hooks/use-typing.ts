"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export function useTyping(conversationId: string, userId: string | null) {
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
  const supabase = createClient()
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!userId || !conversationId) return

    // Set up typing channel
    const channel = supabase.channel(`typing:${conversationId}`)

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const { user_id, is_typing } = payload.payload as { user_id: string; is_typing: boolean }

        if (user_id !== userId) {
          setTypingUsers((prev) => ({
            ...prev,
            [user_id]: is_typing,
          }))

          // Clear typing indicator after 3 seconds of inactivity
          if (is_typing) {
            setTimeout(() => {
              setTypingUsers((prev) => ({
                ...prev,
                [user_id]: false,
              }))
            }, 3000)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, userId, supabase])

  const setTyping = async (isTyping: boolean) => {
    if (!userId || !conversationId) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    // Send typing indicator
    await supabase.channel(`typing:${conversationId}`).send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: userId,
        is_typing: isTyping,
      },
    })

    // Set timeout to clear typing indicator
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        supabase.channel(`typing:${conversationId}`).send({
          type: "broadcast",
          event: "typing",
          payload: {
            user_id: userId,
            is_typing: false,
          },
        })
      }, 3000)
    }
  }

  return { typingUsers, setTyping }
}
