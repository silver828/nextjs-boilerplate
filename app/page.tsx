import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import AuthForm from "@/components/auth-form"
import { Logo } from "@/components/logo"

export default async function Home() {
  const supabase = getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si l'utilisateur est déjà connecté, rediriger vers la messagerie
  if (session) {
    redirect("/messages")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Logo className="h-20 w-20" />
          <h1 className="text-4xl font-bold tracking-tight text-white futuristic-glow">Merfenger</h1>
          <p className="text-sm text-gray-400">merfenger by camille juin</p>
        </div>

        <div className="futuristic-panel rounded-2xl p-6">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
