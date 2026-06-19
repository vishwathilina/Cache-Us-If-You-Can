'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSessionInfo {
  authenticated: boolean
  name: string | null
  accountCount: number
  totalBalance: number | null
}

const GUEST_WELCOME: Message = {
  role: 'assistant',
  content:
    "Hi! I'm Nova Assist. Sign in to analyze your accounts and spending, or ask me how Nova Bank works — I can read the codebase too."
}

function welcomeMessage(info: ChatSessionInfo | null): Message {
  if (!info?.authenticated) return GUEST_WELCOME

  const name = info.name?.split(' ')[0] ?? 'there'
  const balance =
    info.totalBalance != null
      ? ` Your total balance is LKR ${info.totalBalance.toLocaleString('en-LK')}.`
      : ''

  return {
    role: 'assistant',
    content: `Hi ${name}! I'm connected to your ${info.accountCount} account${info.accountCount === 1 ? '' : 's'}.${balance} Ask me to analyze spending, explain transfers, or walk through any feature.`
  }
}

function statusLabel(info: ChatSessionInfo | null, loading: boolean): string {
  if (loading) return 'Typing…'
  if (!info?.authenticated) return 'Online · Sign in for your data'
  return `Connected · ${info.accountCount} account${info.accountCount === 1 ? '' : 's'} · Code aware`
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<ChatSessionInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([GUEST_WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (!open || bootstrapped.current) return
    bootstrapped.current = true

    fetch('/api/chat')
      .then((r) => (r.ok ? r.json() : null))
      .then((info: ChatSessionInfo | null) => {
        if (info) {
          setSessionInfo(info)
          setMessages([welcomeMessage(info)])
        }
      })
      .catch(() => {})
  }, [open])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    }
  }, [open, messages])

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    const assistantIdx = next.length
    setMessages([...next, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next })
      })

      if (!res.ok || !res.body) {
        throw new Error('Request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reply = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const copy = [...prev]
          copy[assistantIdx] = { role: 'assistant', content: reply }
          return copy
        })
      }

      if (!reply.trim()) {
        throw new Error('Empty response')
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev]
        copy[assistantIdx] = {
          role: 'assistant',
          content:
            "Sorry, I couldn't reach the assistant right now. Please try again in a moment."
        }
        return copy
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Nova Assist chat">
          <div className="chat-panel-header">
            <div className="chat-panel-title">
              <span className="chat-panel-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3a7 7 0 0 0-7 7v3l-2 2v2h18v-2l-2-2v-3a7 7 0 0 0-7-7z" />
                  <path d="M9 10h.01M12 10h.01M15 10h.01" />
                </svg>
              </span>
              <div>
                <div className="chat-panel-name">Nova Assist</div>
                <div className="chat-panel-status">
                  {statusLabel(sessionInfo, loading)}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="chat-panel-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="chat-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`chat-bubble chat-bubble-${m.role}`}
              >
                {m.content || (loading && i === messages.length - 1 ? '…' : '')}
              </div>
            ))}
          </div>

          <form className="chat-input-row" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              className="chat-input"
              placeholder={
                sessionInfo?.authenticated
                  ? 'Analyze my spending, explain a transfer…'
                  : 'Ask about Nova Bank features…'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={500}
            />
            <button
              type="submit"
              className="chat-send"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m22 2-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chat-launcher"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Nova Assist' : 'Open Nova Assist'}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3a7 7 0 0 0-7 7v3l-2 2v2h18v-2l-2-2v-3a7 7 0 0 0-7-7z" />
          <path d="M9 10h.01M12 10h.01M15 10h.01" />
        </svg>
        <span>Assist</span>
      </button>
    </>
  )
}
