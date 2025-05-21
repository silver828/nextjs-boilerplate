"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Camera } from "lucide-react"
import type { Profile } from "@/lib/database.types"

interface ProfileEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
  onProfileUpdated: (profile: Profile) => void
}

export function ProfileEditor({ open, onOpenChange, profile, onProfileUpdated }: ProfileEditorProps) {
  const [username, setUsername] = useState(profile.username || "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom d'utilisateur ne peut pas être vide.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Profil mis à jour",
        description: "Votre profil a été mis à jour avec succès.",
      })

      onProfileUpdated(data)
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour du profil.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = () => {
    // Générer un nouvel avatar aléatoire basé sur le nom d'utilisateur
    const seed = username || Math.random().toString(36).substring(2, 8)
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`
    setAvatarUrl(newAvatarUrl)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md futuristic-panel">
        <DialogHeader>
          <DialogTitle>Modifier votre profil</DialogTitle>
          <DialogDescription>Personnalisez votre nom d'utilisateur et votre avatar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} />
                <AvatarFallback>{username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full"
                onClick={handleAvatarChange}
              >
                <Camera className="h-4 w-4" />
                <span className="sr-only">Changer d'avatar</span>
              </Button>
            </div>
            <p className="text-xs text-gray-400">Cliquez sur l'icône pour générer un nouvel avatar aléatoire</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre nom d'utilisateur"
              className="bg-gray-800/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
