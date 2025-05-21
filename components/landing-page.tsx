import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 neon-text animate-pulse-neon">MARSENGER</h1>
        <p className="text-xl md:text-2xl mb-12 text-neon-blue">by camille juin</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button className="cyber-button w-full sm:w-auto">Connexion</Button>
          </Link>
          <Link href="/signup">
            <Button className="cyber-button w-full sm:w-auto bg-neon-blue/20 hover:bg-neon-blue/30 border-neon-blue">
              Inscription
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
