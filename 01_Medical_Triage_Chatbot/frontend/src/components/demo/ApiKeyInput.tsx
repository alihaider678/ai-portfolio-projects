'use client'

import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export default function ApiKeyInput({ value, onChange, disabled }: Props) {
  const [show, setShow] = useState(false)

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-input/50 focus-within:ring-2 focus-within:ring-ring transition-all">
      <KeyRound className="size-3.5 text-muted-foreground shrink-0" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="sk-proj-… (your OpenAI API key)"
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  )
}