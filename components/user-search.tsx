"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, Search, Loader2 } from "lucide-react"

interface UserSearchProps {
  users: any[]
  selectedUsers: any[]
  onSelectUser: (user: any) => void
  loading?: boolean
}

export default function UserSearch({ users, selectedUsers, onSelectUser, loading = false }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<any[]>(users)

  // Mettre à jour les utilisateurs filtrés lorsque les utilisateurs ou le terme de recherche changent
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const lowercaseSearch = searchTerm.toLowerCase()
      const filtered = users.filter(
        (user) =>
          (user.username && user.username.toLowerCase().includes(lowercaseSearch)) ||
          (user.email && user.email.toLowerCase().includes(lowercaseSearch)),
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="cyber-input pl-8"
        />
      </div>

      <div className="border border-neon-blue/30 rounded-md bg-cyber-darker max-h-[200px] overflow-y-auto">
        {loading ? (
          <div className="py-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-neon-blue" />
            <p className="text-sm mt-2">Chargement des utilisateurs...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-6 text-center text-sm">
            {users.length === 0 ? "Aucun utilisateur disponible" : "Aucun utilisateur trouvé pour cette recherche"}
          </div>
        ) : (
          <div className="divide-y divide-neon-blue/10">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => onSelectUser(user)}
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

      <div className="text-xs text-gray-400">
        <p>
          Résultats: {filteredUsers.length} sur {users.length} utilisateurs
        </p>
      </div>
    </div>
  )
}
