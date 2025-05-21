"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      toast({
        title: "Email envoyé",
        description: "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe",
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de l'email",
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
        <p className="text-gray-400 mt-2">Réinitialisation du mot de passe</p>
      </div>

      {success ? (
        <div className="text-center space-y-4">
          <p className="text-gray-200">
            Un email de réinitialisation a été envoyé à <span className="font-semibold">{email}</span>.
          </p>
          <p className="text-gray-400 text-sm">
            Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
          </p>
          <Link href="/login">
            <Button className="cyber-button mt-4">Retour à la connexion</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="cyber-input"
            />
          </div>

          <Button type="submit" className="cyber-button w-full" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
          </Button>

          <div className="text-center mt-4">
            <Link href="/login" className="text-neon-blue hover:underline text-sm">
              Retour à la connexion
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
