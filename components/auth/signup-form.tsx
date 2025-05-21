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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("Début de l'inscription pour:", email)

      // Inscription avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        console.error("Erreur d'authentification:", authError)
        throw authError
      }

      console.log("Inscription réussie:", authData)

      if (authData.user) {
        console.log("Création du profil pour l'utilisateur:", authData.user.id)

        // Création du profil utilisateur
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email,
          username,
        })

        if (profileError) {
          console.error("Erreur lors de la création du profil:", profileError)

          // Si le profil existe déjà, essayons de le mettre à jour
          if (profileError.code === "23505") {
            // Code pour violation de contrainte unique
            console.log("Le profil existe déjà, tentative de mise à jour")
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ username })
              .eq("id", authData.user.id)

            if (updateError) {
              console.error("Erreur lors de la mise à jour du profil:", updateError)
              throw updateError
            }
          } else {
            throw profileError
          }
        }

        // Vérifier que le profil a bien été créé
        const { data: checkProfile, error: checkError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single()

        if (checkError) {
          console.error("Erreur lors de la vérification du profil:", checkError)
        } else {
          console.log("Profil vérifié avec succès:", checkProfile)
        }

        toast({
          title: "Inscription réussie",
          description: "Votre compte a été créé avec succès",
        })

        router.push("/messages")
        router.refresh()
      }
    } catch (error: any) {
      console.error("Erreur complète:", error)
      setError(error.message || "Une erreur est survenue lors de l'inscription")
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
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

      {error && (
        <div className="p-3 mb-4 bg-red-900/30 border border-red-500/50 rounded-md text-sm text-red-300">{error}</div>
      )}

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
