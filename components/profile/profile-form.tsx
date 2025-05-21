"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileFormProps {
  profile: any
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [username, setUsername] = useState(profile?.username || "")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
        })
        .eq("id", profile.id)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="bg-cyber-accent text-white text-xl">
            {(profile?.username || profile?.email)[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div>
          <h2 className="text-xl font-semibold text-gray-200">{profile?.username || profile?.email.split("@")[0]}</h2>
          <p className="text-sm text-gray-400">{profile?.email}</p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="cyber-input"
          />
        </div>

        <div className="flex justify-between">
          <Link href="/messages">
            <Button type="button" variant="outline" className="border-neon-blue/30 bg-cyber-darker hover:bg-cyber-dark">
              Retour
            </Button>
          </Link>

          <Button type="submit" className="cyber-button" disabled={loading}>
            {loading ? "..." : "Mettre à jour"}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-neon-blue">marsenger by camille juin</p>
      </div>
    </div>
  )
}
