'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader2, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadKnowledgeBase } from '@/lib/api'
import { cn } from '@/lib/utils'

type State = 'idle' | 'uploading' | 'success' | 'error'

export default function KnowledgeBaseUpload() {
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')
  const [filename, setFilename] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setFilename(file.name)
    setState('uploading')
    setMessage('')
    try {
      const result = await uploadKnowledgeBase(file)
      setMessage(result.message)
      setState('success')
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Upload failed')
      setState('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation()
    setState('idle')
    setFilename('')
    setMessage('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Upload className="size-5 text-primary" />
        <h3 className="text-base font-semibold">Upload Knowledge Base</h3>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => state === 'idle' && inputRef.current?.click()}
        className={cn(
          'relative rounded-xl border-2 border-dashed p-5 transition-all duration-200',
          state === 'idle'
            ? isDragging
              ? 'border-primary/60 bg-primary/8 cursor-copy'
              : 'border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
            : 'border-border cursor-default',
          state === 'success' && 'border-emerald-500/40 bg-emerald-500/5',
          state === 'error'   && 'border-rose-500/40 bg-rose-500/5',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />

        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Drop PDF or TXT here</p>
                <p className="text-xs text-muted-foreground mt-0.5">or click to browse — max 10 MB</p>
              </div>
            </motion.div>
          )}

          {state === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 py-1"
            >
              <Loader2 className="size-5 text-primary animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Uploading…</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{filename}</p>
              </div>
            </motion.div>
          )}

          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3"
            >
              <CheckCircle className="size-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Ingested successfully</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{message}</p>
              </div>
              <button
                onClick={reset}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                title="Upload another file"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3"
            >
              <XCircle className="size-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-rose-500">Upload failed</p>
                <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
              </div>
              <button
                onClick={reset}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                title="Try again"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Supported: <span className="text-foreground font-medium">PDF, TXT</span> · Chunks ingested into ChromaDB via Celery
      </p>
    </div>
  )
}