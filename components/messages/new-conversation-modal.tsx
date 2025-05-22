"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, Loader2, RefreshCw, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

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
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Charger tous les utilisateurs quand le modal s'ouvre
  useEffect(() => {
    const loadAllUsers = async () => {
      if (!isOpen) return

      setFetchingUsers(true)

      try {
        // Récupérer tous les utilisateurs sauf l'utilisateur actuel
        const { data, error } = await supabase.from("profiles").select("*").neq("id", currentUserId)

        if (error) {
          throw error
        }

        console.log("Utilisateurs trouvés:", data?.length || 0)
        setAllUsers(data || [])
        setFilteredUsers(data || [])
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

    loadAllUsers()
  }, [isOpen, currentUserId, supabase, toast])

  // Filtrer les utilisateurs lorsque le terme de recherche change
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(allUsers)
    } else {
      const lowercaseSearch = searchTerm.toLowerCase()
      const filtered = allUsers.filter(
        (user) =>
          (user.username && user.username.toLowerCase().includes(lowercaseSearch)) ||
          (user.email && user.email.toLowerCase().includes(lowercaseSearch)),
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, allUsers])

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

  const refreshUsers = async () => {
    setFetchingUsers(true)

    try {
      const { data, error } = await supabase.from("profiles").select("*").neq("id", currentUserId)

      if (error) throw error

      setAllUsers(data || [])
      setFilteredUsers(
        searchTerm.trim() === ""
          ? data || []
          : (data || []).filter(
              (user) =>
                (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())),
            ),
      )

      toast({
        title: "Utilisateurs actualisés",
        description: `${data?.length || 0} utilisateurs trouvés`,
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les utilisateurs: " + error.message,
        variant: "destructive",
      })
    } finally {
      setFetchingUsers(false)
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
                onClick={refreshUsers}
                disabled={fetchingUsers}
                className="h-8 px-2 text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${fetchingUsers ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search-users"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="cyber-input pl-8"
              />
            </div>

            <div className="border border-neon-blue/30 rounded-md bg-cyber-darker max-h-[200px] overflow-y-auto">
              {fetchingUsers ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-neon-blue" />
                  <p className="text-sm mt-2">Chargement des utilisateurs...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-sm">
                  {allUsers.length === 0
                    ? "Aucun utilisateur disponible. Créez un autre compte pour démarrer une conversation."
                    : "Aucun utilisateur trouvé pour cette recherche"}
                </div>
              ) : (
                <div className="divide-y divide-neon-blue/10">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="flex items-center space-x-3 p-3 hover:bg-cyber-accent cursor-pointer"
                    >
                      <div className="flex-shrink-0">
                        {selectedUsers.some((u) => u.id === user.id) ? (
                          <div className="h-5 w-5 rounded-full bg-neon-blue flex items-center justify-center">
                            <Check className="h-3 w-3 text-black" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-gray-500" />
                        )}
                      </div>

                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="bg-cyber-accent text-white text-xs">
                          {(user.username || user.email)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.username || user.email.split("@")[0]}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-400">
            <p>Utilisateurs disponibles: {allUsers.length}</p>
            <p>Résultats de recherche: {filteredUsers.length}</p>
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
