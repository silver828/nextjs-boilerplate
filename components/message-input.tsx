"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send, Smile } from "lucide-react"
import { messageQueue } from "@/lib/message-queue"
import { useTyping } from "@/hooks/use-typing"

interface MessageInputProps {
  conversationId: string
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { typingUsers, setTyping } = useTyping(conversationId, userId)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }

    getUser()
  }, [supabase.auth])

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return

    setLoading(true)

    try {
      // Add message to queue (which will handle sending)
      await messageQueue.addMessage(conversationId, message.trim())

      // Clear typing indicator
      setTyping(false)

      // Clear input
      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setMessage(newValue)

    // Send typing indicator if user is typing
    if (newValue.length > 0) {
      setTyping(true)
    } else {
      setTyping(false)
    }
  }

  return (
    <div className="border-t p-4">
      <div className="flex items-end gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>
        <Textarea
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="min-h-10 flex-1 resize-none"
          rows={1}
        />
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Smile className="h-5 w-5" />
          <span className="sr-only">Add emoji</span>
        </Button>
        <Button onClick={handleSendMessage} disabled={!message.trim() || loading} size="icon" className="h-8 w-8">
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  )
}
