'use client'

import { useState } from 'react'
import { Eye, EyeOff, Key } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ApiKeyInputProps {
  value: string
  onChange: (key: string) => void
  disabled?: boolean
}

export default function ApiKeyInput({ value, onChange, disabled }: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Key className="size-3 text-primary" />
        Your OpenAI API Key
        <span className="text-primary">*</span>
      </label>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          placeholder="sk-proj-..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="pr-9 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        Your key is used directly — never stored on our servers (BYOK).
      </p>
    </div>
  )
}