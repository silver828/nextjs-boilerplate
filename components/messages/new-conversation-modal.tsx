"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, Loader2, RefreshCw } from "lucide-react"

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
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Fonction pour récupérer les utilisateurs
  const fetchUsers = async () => {
    if (!isOpen) return

    setFetchingUsers(true)
    setError(null)
    setDebugInfo(null)

    try {
      console.log("Récupération des utilisateurs, utilisateur actuel:", currentUserId)

      // Vérifier d'abord si l'utilisateur actuel existe
      const { data: currentUser, error: currentUserError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUserId)
        .single()

      if (currentUserError) {
        console.error("Erreur lors de la récupération de l'utilisateur actuel:", currentUserError)
        setError("Erreur lors de la récupération de l'utilisateur actuel: " + currentUserError.message)

        // Si l'utilisateur actuel n'existe pas, essayons de le créer
        if (currentUserError.code === "PGRST116") {
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser && authUser.user) {
            const { error: insertError } = await supabase.from("profiles").insert({
              id: currentUserId,
              email: authUser.user.email,
              username: authUser.user.email?.split("@")[0] || "user",
            })

            if (insertError) {
              console.error("Erreur lors de la création du profil:", insertError)
            } else {
              console.log("Profil créé avec succès pour l'utilisateur actuel")
            }
          }
        }
      } else {
        console.log("Utilisateur actuel trouvé:", currentUser)
      }

      // Récupérer tous les utilisateurs
      const { data: allUsers, error: allUsersError } = await supabase.from("profiles").select("*")

      if (allUsersError) {
        console.error("Erreur lors de la récupération de tous les utilisateurs:", allUsersError)
        setError("Erreur lors de la récupération de tous les utilisateurs: " + allUsersError.message)
        setDebugInfo({
          error: allUsersError,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        })
      } else {
        console.log("Tous les utilisateurs trouvés:", allUsers)
        setDebugInfo({
          totalUsers: allUsers?.length || 0,
          users: allUsers?.map((u) => ({ id: u.id, email: u.email, username: u.username })),
        })
      }

      // Récupérer tous les utilisateurs sauf l'utilisateur actuel
      const { data, error: usersError } = await supabase.from("profiles").select("*").neq("id", currentUserId)

      if (usersError) {
        console.error("Erreur lors de la récupération des utilisateurs:", usersError)
        setError("Erreur lors de la récupération des utilisateurs: " + usersError.message)
      } else {
        console.log("Utilisateurs trouvés (sauf actuel):", data?.length || 0)
        setUsers(data || [])
      }
    } catch (error: any) {
      console.error("Exception lors de la récupération des utilisateurs:", error)
      setError("Exception lors de la récupération des utilisateurs: " + error.message)
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs: " + error.message,
        variant: "destructive",
      })
    } finally {
      setFetchingUsers(false)
    }
  }

  // Charger les utilisateurs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  // Filtrer les utilisateurs en fonction du terme de recherche
  const filteredUsers = searchTerm
    ? users.filter(
        (user) =>
          (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    : users

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
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-md text-sm text-red-300">
              <p className="font-semibold mb-1">Erreur:</p>
              <p>{error}</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={fetchUsers}>
                <RefreshCw className="h-3 w-3 mr-1" /> Réessayer
              </Button>
            </div>
          )}

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
                    {users.length === 0
                      ? "Aucun utilisateur disponible. Créez un autre compte pour démarrer une conversation."
                      : "Aucun utilisateur trouvé pour cette recherche"}
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

          <div className="text-xs text-gray-400">
            <p>Utilisateurs disponibles: {users.length}</p>
            <p>Utilisateur actuel ID: {currentUserId.substring(0, 8)}...</p>
            {debugInfo && (
              <details className="mt-2">
                <summary className="cursor-pointer">Informations de débogage</summary>
                <pre className="mt-1 p-2 bg-cyber-darker rounded-md overflow-auto text-[10px] max-h-[100px]">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
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
