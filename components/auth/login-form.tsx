"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      router.push("/messages")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cyber-panel">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold neon-text">MARSENGER</h1>
        <p className="text-neon-blue mt-1">by camille juin</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="cyber-input"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link href="/reset-password" className="text-xs text-neon-blue hover:underline">
              Oublié?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="cyber-input"
          />
        </div>

        <Button type="submit" className="cyber-button w-full" disabled={loading}>
          {loading ? "..." : "Connexion"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/signup" className="text-neon-blue hover:underline text-sm">
          Créer un compte
        </Link>
      </div>
    </div>
  )
}
