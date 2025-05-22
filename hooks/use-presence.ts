"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface PresenceState {
  online: boolean
  lastSeen: string | null
}

export function usePresence(userId: string | null) {
  const [presenceState, setPresenceState] = useState<Record<string, PresenceState>>({})
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    // Set up presence channel
    const channel = supabase.channel("presence")

    // Update our own presence
    const updatePresence = () => {
      channel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
      })
    }

    // Join the channel
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()

        // Convert to our format
        const newState: Record<string, PresenceState> = {}

        Object.entries(state).forEach(([key, value]) => {
          if (value && value.length > 0) {
            const presenceData = value[0] as any
            newState[key] = {
              online: true,
              lastSeen: presenceData.online_at,
            }
          }
        })

        setPresenceState(newState)
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (newPresences && newPresences.length > 0) {
          setPresenceState((prev) => {
            const newState = { ...prev }
            const presenceData = newPresences[0] as any

            newState[key] = {
              online: true,
              lastSeen: presenceData.online_at,
            }

            return newState
          })
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setPresenceState((prev) => {
          const newState = { ...prev }

          if (newState[key]) {
            newState[key] = {
              ...newState[key],
              online: false,
            }
          }

          return newState
        })
      })
      .subscribe()

    // Update presence when window focus changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updatePresence()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Initial presence update
    updatePresence()

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const isOnline = (id: string) => {
    return presenceState[id]?.online || false
  }

  const getLastSeen = (id: string) => {
    return presenceState[id]?.lastSeen || null
  }

  return { isOnline, getLastSeen, presenceState }
}
