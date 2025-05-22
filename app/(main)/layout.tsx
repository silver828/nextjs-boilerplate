import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/sidebar"
import ServiceWorkerRegistration from "@/components/service-worker-registration"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth?mode=sign-in")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (!profile) {
    // Create profile if it doesn't exist
    const { error } = await supabase.from("profiles").insert({
      id: session.user.id,
      username: session.user.email?.split("@")[0] || "user",
      full_name: session.user.user_metadata.full_name,
    })

    if (error) {
      console.error("Error creating profile:", error)
    }
  }

  return (
    <div className="flex h-screen">
      <ServiceWorkerRegistration />
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
