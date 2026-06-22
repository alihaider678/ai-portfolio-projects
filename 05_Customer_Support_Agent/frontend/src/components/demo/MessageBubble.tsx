'use client'

import { motion } from 'framer-motion'
import { Bot, User, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Message, Sentiment } from '@/lib/types'

const SENTIMENT_CONFIG: Record<Sentiment, { label: string; className: string }> = {
  positive: { label: 'Positive', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  neutral:  { label: 'Neutral',  className: 'bg-muted text-muted-foreground border-border' },
  negative: { label: 'Negative', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  frustrated: { label: 'Frustrated', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
}

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex items-start gap-2.5', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          isUser
            ? 'bg-primary/20 border border-primary/40'
            : 'bg-muted border border-border'
        )}
      >
        {isUser ? (
          <User className="size-3.5 text-primary" />
        ) : (
          <Bot className="size-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-1.5 max-w-[80%]', isUser && 'items-end')}>
        {/* Escalation card */}
        {message.escalated && message.caseId && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            <AlertTriangle className="size-3 shrink-0" />
            <span>Escalated — Case <span className="font-mono font-semibold">{message.caseId}</span></span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'glass border border-border rounded-tl-sm',
            message.streaming && !isUser && 'cursor-blink'
          )}
        >
          {message.content || (
            <span className="text-muted-foreground text-xs italic">Thinking…</span>
          )}
        </div>

        {/* Sentiment badge (AI only, when done streaming) */}
        {!isUser && message.sentiment && !message.streaming && (
          <Badge
            variant="outline"
            className={cn('text-xs border', SENTIMENT_CONFIG[message.sentiment]?.className)}
          >
            {SENTIMENT_CONFIG[message.sentiment]?.label}
          </Badge>
        )}
      </div>
    </motion.div>
  )
}