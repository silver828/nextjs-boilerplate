"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, Loader2 } from "lucide-react"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Charger les utilisateurs quand le modal s'ouvre
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return

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
        console.error("Erreur lors de la récupération des utilisateurs:", error.message)
        toast({
          title: "Erreur",
          description: "Impossible de charger les utilisateurs",
          variant: "destructive",
        })
      } finally {
        setFetchingUsers(false)
      }
    }

    fetchUsers()
  }, [isOpen, currentUserId, supabase, toast])

  // Rechercher des utilisateurs quand le terme de recherche change
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm || searchTerm.length < 2) return

      setFetchingUsers(true)
      try {
        // Rechercher par nom d'utilisateur ou email
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .neq("id", currentUserId)
          .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .order("username", { ascending: true })

        if (error) {
          throw error
        }

        console.log("Résultats de recherche:", data?.length || 0)
        setUsers(data || [])
      } catch (error: any) {
        console.error("Erreur lors de la recherche:", error.message)
      } finally {
        setFetchingUsers(false)
      }
    }

    if (searchTerm.length >= 2) {
      searchUsers()
    }
  }, [searchTerm, currentUserId, supabase])

  // Filtrer les utilisateurs en fonction du terme de recherche
  const filteredUsers = users.filter((user) => !selectedUsers.some((selectedUser) => selectedUser.id === user.id))

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
      console.error("Erreur lors de la création de la conversation:", error.message)
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
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
            <Label htmlFor="search-users">Rechercher des utilisateurs</Label>
            <Command className="border border-neon-blue/30 rounded-md bg-cyber-darker">
              <CommandInput
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="cyber-input"
              />
              <CommandList className="max-h-[200px] overflow-y-auto">
                {fetchingUsers ? (
                  <div className="py-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-neon-blue" />
                    <p className="text-sm mt-2">Chargement des utilisateurs...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <CommandEmpty className="py-6 text-center text-sm">
                    {searchTerm.length > 0
                      ? "Aucun utilisateur trouvé"
                      : "Commencez à taper pour rechercher des utilisateurs"}
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleSelectUser(user)}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-cyber-accent"
                      >
                        <div
                          className={`flex-shrink-0 ${
                            selectedUsers.some((u) => u.id === user.id) ? "text-neon-blue" : "text-transparent"
                          }`}
                        >
                          <Check size={16} />
                        </div>

                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback className="bg-cyber-accent text-white text-xs">
                            {(user.username || user.email)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.username || user.email.split("@")[0]}</span>
                          <span className="text-xs text-gray-400">{user.email}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
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
