export type Sentiment = 'positive' | 'neutral' | 'negative' | 'frustrated'

export interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  sentiment?: Sentiment
  escalated?: boolean
  caseId?: string
  streaming?: boolean
}

export interface StreamTokenEvent {
  type: 'token'
  token: string
}

export interface StreamDoneEvent {
  type: 'done'
  escalated: boolean
  case_id: string | null
  sentiment: Sentiment
}

export interface StreamErrorEvent {
  type: 'error'
  message: string
}

export type StreamEvent = StreamTokenEvent | StreamDoneEvent | StreamErrorEvent

export interface HealthStatus {
  fastapi: boolean
  checking: boolean
}