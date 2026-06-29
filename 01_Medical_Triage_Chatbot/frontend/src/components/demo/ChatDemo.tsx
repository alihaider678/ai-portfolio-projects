'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, RefreshCw, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import ApiKeyInput from './ApiKeyInput'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { checkHealth, createSession, clearSession, sendMessage } from '@/lib/api'
import type { Message, ServerStatus } from '@/lib/types'

export default function ChatDemo() {
  const [apiKey, setApiKey] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Two-phase health check handles Render free-tier cold start
  useEffect(() => {
    let cancelled = false
    const probe = async () => {
      const fast = await checkHealth(4000)
      if (cancelled) return
      if (fast) { setServerStatus('online'); return }
      setServerStatus('waking')
      const slow = await checkHealth(65000)
      if (!cancelled) setServerStatus(slow ? 'online' : 'offline')
    }
    probe()
    return () => { cancelled = true }
  }, [])

  const startSession = async () => {
    if (!apiKey.trim()) return
    setIsInitializing(true)
    try {
      const data = await createSession()
      setSessionId(data.session_id)
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: data.welcome_message,
      }])
    } catch {
      alert('Failed to connect to backend. Make sure the FastAPI server is running.')
    } finally {
      setIsInitializing(false)
    }
  }

  const resetSession = async () => {
    if (sessionId) await clearSession(sessionId)
    setSessionId(null)
    setMessages([])
  }

  const handleSend = async () => {
    if (!input.trim() || !sessionId || !apiKey || isThinking) return

    const userText = input.trim()
    setInput('')

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: userText }
    setMessages(prev => [...prev, userMsg])
    setIsThinking(true)

    try {
      const response = await sendMessage(sessionId, userText, apiKey)

      if (response.type === 'triage' && response.triage_level) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content: response.message,
            isTriage: true,
            triageLevel: response.triage_level!,
            probableConditions: response.probable_conditions,
            recommendations: response.recommendations,
          },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          { id: `ai-${Date.now()}`, role: 'ai', content: response.message },
        ])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed'
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'ai', content: `⚠️ Error: ${msg}` },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* API key + server status */}
      <div className="space-y-2.5">
        <ApiKeyInput value={apiKey} onChange={setApiKey} disabled={!!sessionId} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            {serverStatus === 'checking' && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
            {serverStatus === 'waking'   && <Loader2 className="size-3 animate-spin text-amber-400" />}
            {serverStatus === 'online'   && <CheckCircle className="size-3 text-emerald-400" />}
            {serverStatus === 'offline'  && <XCircle className="size-3 text-rose-400" />}
            <span className={
              serverStatus === 'online'  ? 'text-emerald-400' :
              serverStatus === 'waking'  ? 'text-amber-400'   :
              serverStatus === 'offline' ? 'text-rose-400'    :
              'text-muted-foreground'
            }>
              {serverStatus === 'checking' && 'Checking server…'}
              {serverStatus === 'waking'   && 'Waking up server… (~30s on free tier)'}
              {serverStatus === 'online'   && 'Backend online'}
              {serverStatus === 'offline'  && 'Backend offline — try refreshing'}
            </span>
          </div>

          {sessionId && (
            <button
              onClick={resetSession}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-400 transition-colors"
            >
              <Trash2 className="size-3" />
              New session
            </button>
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col glass rounded-2xl border border-border overflow-hidden min-h-[460px]">
        {/* Messages area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.length === 0 && !sessionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-16 gap-4"
              >
                <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Send className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Start a triage session</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Enter your OpenAI API key above, then start a session to describe your symptoms.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground/70 space-y-1 mt-2">
                  <p>Try: <em>&quot;I have severe chest pain&quot;</em></p>
                  <p>Or: <em>&quot;I have a high fever for 3 days&quot;</em></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isThinking && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border p-3 flex gap-2">
          {!sessionId ? (
            <Button
              className="w-full gap-2"
              onClick={startSession}
              disabled={!apiKey.trim() || isInitializing || serverStatus !== 'online'}
            >
              {isInitializing ? (
                <><Loader2 className="size-4 animate-spin" /> Starting…</>
              ) : (
                <><RefreshCw className="size-4" /> Start Session</>
              )}
            </Button>
          ) : (
            <>
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your symptom… (Enter to send)"
                className="min-h-[40px] max-h-[120px] resize-none text-sm"
                disabled={isThinking}
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="shrink-0"
              >
                {isThinking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}