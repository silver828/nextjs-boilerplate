"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Enregistrer l'erreur
    console.error("Erreur globale de l'application:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black">
          <div className="w-full max-w-md space-y-6 text-center">
            <h1 className="text-3xl font-bold text-white">Oups ! Une erreur est survenue</h1>
            <p className="text-gray-400">
              L'application a rencontré un problème inattendu. Veuillez réessayer ou revenir à l'accueil.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500">
                Code d'erreur: <code>{error.digest}</code>
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button onClick={() => reset()} variant="default">
                Réessayer
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Retour à l'accueil</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
