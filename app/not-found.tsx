import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-4xl font-bold text-white futuristic-glow">404</h1>
        <h2 className="text-2xl font-semibold text-white">Page non trouvée</h2>
        <p className="text-gray-400">La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <Button asChild>
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  )
}
