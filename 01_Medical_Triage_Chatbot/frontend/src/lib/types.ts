export type MessageRole = 'user' | 'ai'

export type TriageLevel = 'emergency' | 'urgent' | 'routine'

export type ServerStatus = 'checking' | 'waking' | 'online' | 'offline'

export interface Message {
  id: string
  role: MessageRole
  content: string
  isTriage?: boolean
  triageLevel?: TriageLevel
  probableConditions?: string[]
  recommendations?: string[]
}