"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionnel : enregistrer l'erreur dans un service d'analyse
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Une erreur est survenue</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">L'application a rencontré un problème inattendu.</p>
            <p className="text-xs opacity-70 mb-4 break-all">{error.message}</p>
          </AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button onClick={() => reset()} className="flex-1">
            Réessayer
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="outline" className="flex-1">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  )
}
