'use client'

import { useState } from 'react'
import Sidebar from '@/components/sidebar'
import { ToastProvider, useToast } from '@/components/Toast'

interface Biller {
  id: string
  name: string
  category: string
  emoji: string
  color: string
}

const BILLERS: Biller[] = [
  { id: 'water', name: 'National Water Supply', category: 'Utilities', emoji: '💧', color: '#0ea5e9' },
  { id: 'ceb', name: 'Ceylon Electricity Board', category: 'Utilities', emoji: '⚡', color: '#f59e0b' },
  { id: 'dialog', name: 'Dialog Axiata', category: 'Telecom', emoji: '📱', color: '#ef4444' },
  { id: 'mobitel', name: 'Mobitel', category: 'Telecom', emoji: '📡', color: '#22c55e' },
  { id: 'slt', name: 'Sri Lanka Telecom', category: 'Telecom', emoji: '☎️', color: '#3b82f6' },
  { id: 'peo', name: 'PEO TV (SLT)', category: 'Entertainment', emoji: '📺', color: '#8b5cf6' },
  { id: 'dialog-tv', name: 'Dialog TV', category: 'Entertainment', emoji: '🎬', color: '#ec4899' },
  { id: 'insurance', name: 'Ceylinco Insurance', category: 'Insurance', emoji: '🛡️', color: '#14b8a6' },
  { id: 'internet', name: 'Sri Lanka Broadband', category: 'Internet', emoji: '🌐', color: '#6366f1' },
  { id: 'taxes', name: 'IRD Tax Portal', category: 'Government', emoji: '🏛️', color: '#78716c' },
  { id: 'rates', name: 'Municipal Rates', category: 'Government', emoji: '🏘️', color: '#84cc16' },
  { id: 'gas', name: 'Litro Gas', category: 'Utilities', emoji: '🔥', color: '#f97316' },
]

function PayBillsInner() {
  const { showToast } = useToast()
  const [selected, setSelected] = useState<Biller | null>(null)
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = BILLERS.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase()),
  )

  const categories = [...new Set(BILLERS.map((b) => b.category))]

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid amount greater than 0.')
      return
    }
    setSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 1200))
      showToast('success', 'Payment Successful!', `Paid ${new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(amount))} to ${selected?.name}`)
      setSelected(null)
      setAmount('')
      setReference('')
    } catch {
      showToast('error', 'Payment Failed', 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div className="page-title">Pay Bills</div>
          <div className="header-actions">
            <div className="avatar-btn">
              <img src="/avatar.png" alt="User" />
            </div>
          </div>
        </header>

        <div className="page-body">
          {!selected ? (
            <>
              {/* Search */}
              <div style={{ marginBottom: 24, maxWidth: 400 }}>
                <input
                  className="nb-input"
                  placeholder="Search billers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Categories */}
              {categories.map((cat) => {
                const items = filtered.filter((b) => b.category === cat)
                if (items.length === 0) return null
                return (
                  <div key={cat} style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                      {cat}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                      {items.map((biller) => (
                        <button
                          key={biller.id}
                          onClick={() => setSelected(biller)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '16px 18px',
                            background: '#fff',
                            border: '1px solid rgba(0,0,0,0.07)',
                            borderRadius: 16,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
                            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              background: `${biller.color}18`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 22,
                              flexShrink: 0,
                            }}
                          >
                            {biller.emoji}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 }}>{biller.name}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{biller.category}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <button
                onClick={() => setSelected(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#6b21a8',
                  fontWeight: 600,
                  fontSize: 14,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 20,
                  padding: 0,
                }}
              >
                ← Back to Billers
              </button>

              <div className="card card-lg">
                {/* Biller info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 16,
                      background: `${selected.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                    }}
                  >
                    {selected.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>{selected.name}</div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>{selected.category}</div>
                  </div>
                </div>

                <form onSubmit={handlePay}>
                  <div style={{ marginBottom: 20 }}>
                    <label className="nb-label">Account / Customer Reference</label>
                    <input
                      className="nb-input"
                      placeholder="e.g. Account no., NIC, or reference ID"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 28 }}>
                    <label className="nb-label">Amount (LKR)</label>
                    <input
                      className="nb-input"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', padding: 16 }}
                    disabled={submitting}
                  >
                    {submitting ? 'Processing…' : `Pay ${amount ? new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(amount)) : 'Bill'}`}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PayBillsPage() {
  return (
    <ToastProvider>
      <PayBillsInner />
    </ToastProvider>
  )
}
