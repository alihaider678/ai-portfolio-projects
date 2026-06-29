const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function checkHealth(timeoutMs = 4000): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(timeoutMs) })
    return res.ok
  } catch {
    return false
  }
}

export interface SessionData {
  session_id: string
  welcome_message: string
  disclaimer: string
}

export async function createSession(): Promise<SessionData> {
  const res = await fetch(`${API_URL}/session/new`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function clearSession(sessionId: string): Promise<void> {
  await fetch(`${API_URL}/session/${sessionId}`, { method: 'DELETE' })
}

export interface ChatResponse {
  type: 'question' | 'triage'
  message: string
  triage_level: 'emergency' | 'urgent' | 'routine' | null
  probable_conditions: string[]
  recommendations: string[]
  turn_count: number
  collected_symptoms: Record<string, unknown>
}

export async function sendMessage(
  sessionId: string,
  message: string,
  apiKey: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message, api_key: apiKey }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}