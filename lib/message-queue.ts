"use client"

import { v4 as uuidv4 } from "uuid"
import { createClient } from "@/lib/supabase/client"

export interface QueuedMessage {
  id: string
  conversation_id: string
  content: string
  created_at: string
  status: "queued" | "sending" | "sent" | "delivered" | "read" | "failed"
  retry_count: number
}

class MessageQueueService {
  private queue: QueuedMessage[] = []
  private isProcessing = false
  private supabase = createClient()
  private storageKey = "silvenger_message_queue"
  private listeners: ((queue: QueuedMessage[]) => void)[] = []
  private isOnline = true

  constructor() {
    if (typeof window !== "undefined") {
      // Load queue from localStorage
      this.loadQueue()

      // Set up online/offline listeners
      window.addEventListener("online", this.handleOnline)
      window.addEventListener("offline", this.handleOffline)

      // Check connection status initially
      this.isOnline = navigator.onLine

      // Process queue periodically
      setInterval(() => {
        if (this.isOnline && this.queue.length > 0 && !this.isProcessing) {
          this.processQueue()
        }
      }, 3000)
    }
  }

  private handleOnline = () => {
    this.isOnline = true
    if (this.queue.length > 0) {
      this.processQueue()
    }
  }

  private handleOffline = () => {
    this.isOnline = false
  }

  private loadQueue() {
    try {
      const savedQueue = localStorage.getItem(this.storageKey)
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue)
        this.notifyListeners()
      }
    } catch (error) {
      console.error("Error loading message queue:", error)
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue))
    } catch (error) {
      console.error("Error saving message queue:", error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.queue]))
  }

  public addListener(listener: (queue: QueuedMessage[]) => void) {
    this.listeners.push(listener)
    listener([...this.queue])
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  public async addMessage(conversationId: string, content: string): Promise<string> {
    const messageId = uuidv4()
    const message: QueuedMessage = {
      id: messageId,
      conversation_id: conversationId,
      content,
      created_at: new Date().toISOString(),
      status: "queued",
      retry_count: 0,
    }

    this.queue.push(message)
    this.saveQueue()
    this.notifyListeners()

    if (this.isOnline && !this.isProcessing) {
      this.processQueue()
    }

    return messageId
  }

  public getMessageStatus(messageId: string): string | null {
    const message = this.queue.find((m) => m.id === messageId)
    return message ? message.status : null
  }

  public getQueuedMessages(): QueuedMessage[] {
    return [...this.queue]
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !this.isOnline) return

    this.isProcessing = true

    try {
      const message = this.queue[0]

      // Update status to sending
      message.status = "sending"
      this.saveQueue()
      this.notifyListeners()

      // Get current user
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Send message to server
      const { error } = await this.supabase.from("messages").insert({
        id: message.id,
        conversation_id: message.conversation_id,
        profile_id: user.id,
        content: message.content,
        created_at: message.created_at,
        is_read: false,
      })

      if (error) {
        throw error
      }

      // Message sent successfully
      message.status = "sent"
      this.queue.shift()
      this.saveQueue()
      this.notifyListeners()
    } catch (error) {
      console.error("Error sending message:", error)

      // Update message status to failed if max retries reached
      const message = this.queue[0]
      message.retry_count += 1

      if (message.retry_count >= 5) {
        message.status = "failed"
        this.queue.shift()
      }

      this.saveQueue()
      this.notifyListeners()
    } finally {
      this.isProcessing = false

      // Process next message if there are more in the queue
      if (this.queue.length > 0 && this.isOnline) {
        setTimeout(() => this.processQueue(), 1000)
      }
    }
  }

  public updateMessageStatus(messageId: string, status: "delivered" | "read") {
    // This would be called when we receive delivery/read receipts
    const message = this.queue.find((m) => m.id === messageId)
    if (message) {
      message.status = status
      this.saveQueue()
      this.notifyListeners()
    }
  }
}

// Singleton instance
export const messageQueue = new MessageQueueService()
