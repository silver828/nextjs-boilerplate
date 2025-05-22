"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Database } from "@/lib/database.types"
import { Search } from "lucide-react"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface NewConversationDialogProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
}

export default function NewConversationDialog({ isOpen, onClose, currentUserId }: NewConversationDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery) return

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId)
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) {
        console.error("Error fetching users:", error)
        return
      }

      setUsers(data || [])
    }

    fetchUsers()
  }, [searchQuery, currentUserId, supabase])

  const handleSelectUser = (user: Profile) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return

    setLoading(true)

    try {
      // Check if direct conversation already exists
      if (!isGroup && selectedUsers.length === 1) {
        const { data: existingConversations } = await supabase
          .from("participants")
          .select("conversation_id")
          .eq("profile_id", currentUserId)

        if (existingConversations && existingConversations.length > 0) {
          const conversationIds = existingConversations.map((p) => p.conversation_id)

          const { data: otherParticipants } = await supabase
            .from("participants")
            .select("conversation_id, profile_id")
            .in("conversation_id", conversationIds)
            .eq("profile_id", selectedUsers[0].id)

          if (otherParticipants && otherParticipants.length > 0) {
            // Get conversations that are not groups
            const { data: nonGroupConversations } = await supabase
              .from("conversations")
              .select("id, is_group")
              .in(
                "id",
                otherParticipants.map((p) => p.conversation_id),
              )
              .eq("is_group", false)

            if (nonGroupConversations && nonGroupConversations.length > 0) {
              // Direct conversation already exists
              router.push(`/conversations/${nonGroupConversations[0].id}`)
              onClose()
              return
            }
          }
        }
      }

      // Create new conversation
      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          name: isGroup ? groupName : null,
          is_group: isGroup,
        })
        .select()
        .single()

      if (conversationError || !conversation) {
        throw conversationError || new Error("Failed to create conversation")
      }

      // Add current user as participant
      const { error: currentUserError } = await supabase.from("participants").insert({
        conversation_id: conversation.id,
        profile_id: currentUserId,
        is_admin: true,
      })

      if (currentUserError) {
        throw currentUserError
      }

      // Add selected users as participants
      const participantsToInsert = selectedUsers.map((user) => ({
        conversation_id: conversation.id,
        profile_id: user.id,
        is_admin: false,
      }))

      const { error: participantsError } = await supabase.from("participants").insert(participantsToInsert)

      if (participantsError) {
        throw participantsError
      }

      router.push(`/conversations/${conversation.id}`)
      onClose()
    } catch (error) {
      console.error("Error creating conversation:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSearchQuery("")
    setUsers([])
    setSelectedUsers([])
    setIsGroup(false)
    setGroupName("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="isGroup" checked={isGroup} onCheckedChange={(checked) => setIsGroup(checked as boolean)} />
            <Label htmlFor="isGroup">Create group chat</Label>
          </div>

          {isGroup && (
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Add Participants</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or username"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Users</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center bg-muted rounded-full px-3 py-1">
                    <span className="text-sm">{user.full_name || user.username}</span>
                    <button
                      className="ml-2 text-muted-foreground hover:text-foreground"
                      onClick={() => handleSelectUser(user)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && users.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <Label>Search Results</Label>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => handleSelectUser(user)}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.full_name?.substring(0, 2) || user.username.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.full_name || user.username}</p>
                      {user.full_name && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                    </div>
                    {selectedUsers.some((u) => u.id === user.id) && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-primary"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && users.length === 0 && <p className="text-sm text-muted-foreground">No users found</p>}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0 || (isGroup && !groupName) || loading}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
