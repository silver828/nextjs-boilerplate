"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, User } from "lucide-react"
import type { Profile } from "@/lib/database.types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProfileEditor } from "@/components/profile-editor"

interface UserHeaderProps {
  profile: Profile
  onSignOut: () => void
  onProfileUpdated: (profile: Profile) => void
}

export function UserHeader({ profile, onSignOut, onProfileUpdated }: UserHeaderProps) {
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false)

  return (
    <>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={profile.avatar_url || ""} alt={profile.username || ""} />
            <AvatarFallback>
              {profile.username?.charAt(0).toUpperCase() || profile.id.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{profile.username || profile.id}</p>
            <p className="text-xs text-gray-400">En ligne</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Paramètres</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="futuristic-panel">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsProfileEditorOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>Modifier le profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileEditor
        open={isProfileEditorOpen}
        onOpenChange={setIsProfileEditorOpen}
        profile={profile}
        onProfileUpdated={onProfileUpdated}
      />
    </>
  )
}
