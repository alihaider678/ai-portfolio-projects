import type { StreamEvent } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function checkHealth(timeoutMs = 4000): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(timeoutMs) })
    return res.ok
  } catch {
    return false
  }
}

export async function createSession(): Promise<string> {
  const res = await fetch(`${API_URL}/session/new`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create session')
  const data = await res.json()
  return data.session_id
}

export async function clearSession(sessionId: string): Promise<void> {
  await fetch(`${API_URL}/session/${sessionId}`, { method: 'DELETE' })
}

export interface UploadResult {
  message: string
  task_id?: string
  async: boolean
}

export async function uploadKnowledgeBase(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_URL}/knowledge-base/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function* streamChat(
  sessionId: string,
  message: string,
  apiKey: string
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${API_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message, api_key: apiKey }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      if (data) {
        try {
          yield JSON.parse(data) as StreamEvent
        } catch {
          // skip malformed chunk
        }
      }
    }
  }
}