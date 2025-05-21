"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Menu } from "lucide-react"

interface HeaderProps {
  onNewConversation: () => void
}

export default function Header({ onNewConversation }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="border-b border-neon-blue/20 bg-cyber-dark">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/messages" className="text-2xl font-bold neon-text">
            MARSENGER
          </Link>
          <span className="text-xs text-neon-blue ml-2">by camille juin</span>
        </div>

        <div className="flex items-center space-x-3">
          <Button onClick={onNewConversation} size="icon" className="cyber-button w-9 h-9 p-0">
            <Plus size={18} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-neon-blue/30 bg-cyber-accent hover:bg-cyber-light w-9 h-9 p-0"
              >
                <Menu size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-cyber-dark border border-neon-blue/30">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-neon-blue/20" />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer text-red-400 hover:text-red-300"
              >
                {isLoggingOut ? "..." : "Déconnexion"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
