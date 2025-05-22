"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { X, RefreshCw } from "lucide-react"
import UserSearch from "@/components/user-search"

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  onConversationCreated: (conversation: any) => void
  currentUserId: string
}

export default function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
  currentUserId,
}: NewConversationModalProps) {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Charger les utilisateurs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    } else {
      // Réinitialiser les utilisateurs sélectionnés quand le modal se ferme
      setSelectedUsers([])
    }
  }, [isOpen])

  const fetchUsers = async () => {
    setFetchingUsers(true)

    try {
      // Récupérer tous les utilisateurs sauf l'utilisateur actuel
      const { data, error } = await supabase.from("profiles").select("*").neq("id", currentUserId)

      if (error) {
        throw error
      }

      console.log("Utilisateurs trouvés:", data?.length || 0)
      setUsers(data || [])
    } catch (error: any) {
      console.error("Erreur lors du chargement des utilisateurs:", error.message)
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs: " + error.message,
        variant: "destructive",
      })
    } finally {
      setFetchingUsers(false)
    }
  }

  const handleSelectUser = (user: any) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
  }

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un utilisateur",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Créer une nouvelle conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .insert({})
        .select()

      if (conversationError) throw conversationError

      const conversationId = conversationData[0].id

      // Ajouter les participants
      const participants = [
        { conversation_id: conversationId, profile_id: currentUserId },
        ...selectedUsers.map((user) => ({
          conversation_id: conversationId,
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
          profiles!conversation_participants(id, username, email, avatar_url)
        `)
        .eq("id", conversationId)
        .single()

      if (fetchError) throw fetchError

      toast({
        title: "Conversation créée",
        description: "Votre nouvelle conversation a été créée avec succès",
      })

      // Ajouter les autres participants à la conversation
      fullConversation.otherParticipants = selectedUsers

      onConversationCreated(fullConversation)
      onClose()
    } catch (error: any) {
      console.error("Erreur lors de la création de la conversation:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation: " + error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="cyber-panel max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text">Nouvelle conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 border border-neon-blue/30 rounded-md bg-cyber-darker">
              {selectedUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-1 bg-cyber-accent px-2 py-1 rounded-md">
                  <span className="text-sm">{user.username || user.email.split("@")[0]}</span>
                  <button onClick={() => handleRemoveUser(user.id)} className="text-gray-400 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="search-users">Rechercher des utilisateurs</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchUsers}
                disabled={fetchingUsers}
                className="h-8 px-2 text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${fetchingUsers ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>

            <UserSearch
              users={users}
              selectedUsers={selectedUsers}
              onSelectUser={handleSelectUser}
              loading={fetchingUsers}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-neon-blue/30 bg-cyber-darker hover:bg-cyber-dark"
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0 || loading}
            className="cyber-button"
          >
            {loading ? "..." : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
