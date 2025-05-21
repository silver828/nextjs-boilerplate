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
import { Check, Loader2, Search, X } from "lucide-react"

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConversationCreated: (conversation: any) => void
  currentUserId: string
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onConversationCreated,
  currentUserId,
}: NewConversationDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  // Rechercher des utilisateurs
  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setSearching(true)
    setSearchResults([])

    try {
      // Recherche simple par nom d'utilisateur
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId)
        .ilike("username", `%${searchTerm}%`)
        .limit(5)

      if (error) throw error

      setSearchResults(data || [])
    } catch (error: any) {
      console.error("Erreur de recherche:", error)
      toast({
        title: "Erreur",
        description: "Impossible de rechercher des utilisateurs.",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  // Sélectionner un utilisateur
  const handleSelectUser = (user: any) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  // Créer une nouvelle conversation
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un utilisateur.",
        variant: "destructive",
      })
      return
    }

    setCreating(true)

    try {
      // Créer une nouvelle conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single()

      if (conversationError) throw conversationError

      // Ajouter les participants
      const participants = [
        { conversation_id: conversationData.id, profile_id: currentUserId },
        ...selectedUsers.map((user) => ({
          conversation_id: conversationData.id,
          profile_id: user.id,
        })),
      ]

      const { error: participantsError } = await supabase.from("conversation_participants").insert(participants)

      if (participantsError) throw participantsError

      // Récupérer la conversation complète
      const { data: fullConversation, error: fetchError } = await supabase
        .from("conversations")
        .select(`
          *,
          conversation_participants!inner(profile_id),
          profiles!conversation_participants(id, username, avatar_url)
        `)
        .eq("id", conversationData.id)
        .single()

      if (fetchError) throw fetchError

      onConversationCreated(fullConversation)

      toast({
        title: "Conversation créée",
        description: "Votre nouvelle conversation a été créée avec succès.",
      })

      // Réinitialiser le formulaire
      setSearchTerm("")
      setSearchResults([])
      setSelectedUsers([])
    } catch (error: any) {
      console.error("Erreur lors de la création de la conversation:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md futuristic-panel">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>Recherchez des utilisateurs pour démarrer une conversation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recherche d'utilisateurs */}
          <div className="flex items-center gap-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="search" className="sr-only">
                Rechercher des utilisateurs
              </Label>
              <Input
                id="search"
                placeholder="Rechercher par nom d'utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-gray-800/50"
              />
            </div>
            <Button type="button" onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Utilisateurs sélectionnés */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Utilisateurs sélectionnés</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-1 bg-primary/20 text-primary-foreground px-2 py-1 rounded-full"
                  >
                    <span className="text-xs">{user.username || user.id}</span>
                    <button
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="text-primary-foreground/70 hover:text-primary-foreground"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Retirer</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Résultats de recherche</Label>
              <div className="space-y-1">
                {searchResults.map((user) => {
                  const isSelected = selectedUsers.some((u) => u.id === user.id)

                  return (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-800/30 rounded-lg transition-colors"
                      onClick={() => handleSelectUser(user)}
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>
                          {user.username?.charAt(0).toUpperCase() || user.id.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-left">{user.username || user.id}</span>
                      {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {searchTerm && searchResults.length === 0 && !searching && (
            <p className="text-sm text-gray-400 text-center">Aucun utilisateur trouvé.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreateConversation} disabled={creating || selectedUsers.length === 0}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer la conversation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
