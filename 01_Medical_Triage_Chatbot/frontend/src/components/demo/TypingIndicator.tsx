import { Activity } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="size-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
        <Activity className="size-3.5 text-primary" />
      </div>
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-card border border-border">
        <span className="size-1.5 rounded-full bg-primary dot-1" />
        <span className="size-1.5 rounded-full bg-primary dot-2" />
        <span className="size-1.5 rounded-full bg-primary dot-3" />
      </div>
    </div>
  )
}