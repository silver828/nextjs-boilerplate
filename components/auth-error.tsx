import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

interface AuthErrorProps {
  title: string
  message: string
}

export function AuthError({ title, message }: AuthErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button asChild className="mt-4">
        <Link href="/">Retour à l'accueil</Link>
      </Button>
    </div>
  )
}
