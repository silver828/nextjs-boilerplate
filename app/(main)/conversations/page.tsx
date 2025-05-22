import { MessageCircle } from "lucide-react"

export default function ConversationsPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
        <p className="text-muted-foreground">Select a conversation or start a new one</p>
      </div>
    </div>
  )
}
