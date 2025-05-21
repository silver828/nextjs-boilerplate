import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import LoginForm from "@/components/auth/login-form"

export default async function LoginPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/messages")
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
