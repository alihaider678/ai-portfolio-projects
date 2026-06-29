'use client'

import { motion } from 'framer-motion'
import { Activity, User } from 'lucide-react'
import type { Message } from '@/lib/types'
import TriageResultCard from './TriageResultCard'

interface Props { message: Message }

export default function MessageBubble({ message }: Props) {
  const isAI = message.role === 'ai'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-2.5 ${isAI ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
          isAI
            ? 'bg-primary/15 border border-primary/25'
            : 'bg-muted border border-border'
        }`}
      >
        {isAI ? (
          <Activity className="size-3.5 text-primary" />
        ) : (
          <User className="size-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isAI ? '' : 'flex flex-col items-end'}`}>
        {message.isTriage && message.triageLevel ? (
          <TriageResultCard
            level={message.triageLevel}
            conditions={message.probableConditions ?? []}
            recommendations={message.recommendations ?? []}
          />
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isAI
                ? 'bg-card border border-border text-foreground rounded-tl-sm'
                : 'bg-primary text-primary-foreground rounded-tr-sm'
            }`}
          >
            {message.content}
          </div>
        )}
      </div>
    </motion.div>
  )
}