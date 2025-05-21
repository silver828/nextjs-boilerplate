import { Loader2 } from "lucide-react"

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <Loader2 className={`animate-spin ${className}`} />
      <p className="mt-2 text-sm text-gray-400">Chargement...</p>
    </div>
  )
}
