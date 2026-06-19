'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import UiIcon from '@/components/UiIcon'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, type, title, message }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    },
    []
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span style={{ display: 'inline-flex', paddingTop: 1 }}>
              <UiIcon
                name={
                  t.type === 'success'
                    ? 'check'
                    : t.type === 'error'
                      ? 'x'
                      : 'statement'
                }
                size={18}
              />
            </span>
            <div>
              <div style={{ fontWeight: 700 }}>{t.title}</div>
              {t.message && (
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                  {t.message}
                </div>
              )}
            </div>
            <button
              onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                opacity: 0.75,
                cursor: 'pointer',
                fontSize: 16,
                padding: '0 4px',
                display: 'inline-flex'
              }}
            >
              <UiIcon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
