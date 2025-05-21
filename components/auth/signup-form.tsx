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

export default function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Inscription avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // Création du profil utilisateur
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email,
          username,
        })

        if (profileError) {
          throw profileError
        }

        router.push("/messages")
        router.refresh()
      }
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

      <form onSubmit={handleSignup} className="space-y-4">
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
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="cyber-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="cyber-input"
          />
        </div>

        <Button
          type="submit"
          className="cyber-button w-full bg-neon-blue/20 hover:bg-neon-blue/30 border-neon-blue"
          disabled={loading}
        >
          {loading ? "..." : "Inscription"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-neon-blue hover:underline text-sm">
          Déjà un compte?
        </Link>
      </div>
    </div>
  )
}
