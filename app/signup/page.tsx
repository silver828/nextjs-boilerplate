import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import SignupForm from "@/components/auth/signup-form"

export default async function SignupPage() {
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
        <SignupForm />
      </div>
    </div>
  )
}
