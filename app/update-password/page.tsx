import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import UpdatePasswordForm from "@/components/auth/update-password-form"

export default async function UpdatePasswordPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <UpdatePasswordForm />
      </div>
    </div>
  )
}
