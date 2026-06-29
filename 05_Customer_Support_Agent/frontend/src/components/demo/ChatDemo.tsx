'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, RefreshCw, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createSession, clearSession, streamChat, checkHealth } from '@/lib/api'
import ApiKeyInput from './ApiKeyInput'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import type { Message } from '@/lib/types'

export default function ChatDemo() {
  const [apiKey, setApiKey] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'waking' | 'online' | 'offline'>('checking')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  useEffect(() => {
    let cancelled = false
    const probe = async () => {
      const fast = await checkHealth(4000)
      if (cancelled) return
      if (fast) { setServerStatus('online'); return }
      // Render free tier spins down — wake it up with a long-timeout retry
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
      const id = await createSession()
      setSessionId(id)
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: "Hello! I'm your AI support agent. How can I help you today?",
        sentiment: 'neutral',
        escalated: false,
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

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || !apiKey || isStreaming) return

    const userText = input.trim()
    setInput('')

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: userText }
    const aiMsgId = `ai-${Date.now()}`
    const aiMsg: Message = { id: aiMsgId, role: 'ai', content: '', streaming: true }

    setMessages((prev) => [...prev, userMsg])
    setIsThinking(true)
    setIsStreaming(true)

    try {
      let firstToken = true
      let fullContent = ''

      for await (const event of streamChat(sessionId, userText, apiKey)) {
        if (event.type === 'token') {
          if (firstToken) {
            setIsThinking(false)
            setMessages((prev) => [...prev, { ...aiMsg }])
            firstToken = false
          }
          fullContent += event.token
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
          )
        } else if (event.type === 'done') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    content: fullContent,
                    sentiment: event.sentiment,
                    escalated: event.escalated,
                    caseId: event.case_id ?? undefined,
                    streaming: false,
                  }
                : m
            )
          )
        } else if (event.type === 'error') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: `Error: ${event.message}`, streaming: false }
                : m
            )
          )
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      setIsThinking(false)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, content: `Error: ${msg}`, streaming: false } : m
        )
      )
    } finally {
      setIsThinking(false)
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* API Key + server status */}
      <div className="space-y-3">
        <ApiKeyInput value={apiKey} onChange={setApiKey} disabled={!!sessionId} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            {serverStatus === 'checking' && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
            {serverStatus === 'waking'   && <Loader2 className="size-3 animate-spin text-yellow-400" />}
            {serverStatus === 'online'   && <CheckCircle className="size-3 text-emerald-400" />}
            {serverStatus === 'offline'  && <XCircle className="size-3 text-rose-400" />}
            <span className={
              serverStatus === 'online'  ? 'text-emerald-400' :
              serverStatus === 'waking'  ? 'text-yellow-400' :
              serverStatus === 'offline' ? 'text-rose-400' :
              'text-muted-foreground'
            }>
              {serverStatus === 'checking' && 'Checking...'}
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
              Clear session
            </button>
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col glass rounded-xl border border-border overflow-hidden min-h-[420px]">
        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.length === 0 && !sessionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12 gap-3"
              >
                <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Send className="size-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your API key and start a session to chat.
                </p>
                <div className="text-xs text-muted-foreground/70 space-y-1">
                  <p>Try: <em>&quot;What is your refund policy?&quot;</em></p>
                  <p>Escalation: <em>&quot;I am extremely frustrated!&quot;</em></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((msg) => (
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
              disabled={!apiKey.trim() || isInitializing}
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send)"
                className="min-h-[40px] max-h-[120px] resize-none text-sm"
                disabled={isStreaming}
                rows={1}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="shrink-0"
              >
                {isStreaming ? (
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