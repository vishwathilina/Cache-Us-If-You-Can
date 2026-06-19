import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import { ToastProvider } from '@/components/Toast'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface Transaction {
  id: number
  fromAccountNumber: string | null
  toAccountNumber: string | null
  amount: number
  description: string
  referenceNumber: string
  status: string
  createdAt: string
}

interface PageResult {
  content: Transaction[]
  totalElements: number
}

export default async function SmartSpendPage() {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login')

  const { token } = await auth0.getAccessToken()

  let txPage: PageResult | null = null
  try {
    const res = await fetch(`${API}/api/v1/transactions?size=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.ok) txPage = await res.json()
  } catch { /* empty */ }

  const transactions = (txPage?.content ?? []).filter((t) => t.status === 'SUCCESS')
  const totalSpent = transactions.reduce((s, t) => s + t.amount, 0)

  // Group by month
  const byMonth: Record<string, number> = {}
  for (const t of transactions) {
    const key = new Date(t.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    byMonth[key] = (byMonth[key] ?? 0) + t.amount
  }
  const months = Object.entries(byMonth)
    .sort((a, b) => new Date(`1 ${a[0]}`).getTime() - new Date(`1 ${b[0]}`).getTime())
    .slice(-6)

  const maxMonth = months.reduce((m, [, v]) => Math.max(m, v), 0)

  // Keyword categories
  const categories: Array<{ label: string; keywords: string[]; color: string; emoji: string }> = [
    { label: 'Utilities', keywords: ['water', 'electricity', 'ceb', 'gas', 'utility'], color: '#0ea5e9', emoji: '⚡' },
    { label: 'Telecom', keywords: ['dialog', 'mobitel', 'slt', 'phone', 'telecom'], color: '#8b5cf6', emoji: '📱' },
    { label: 'Transfers', keywords: ['transfer', 'payment', 'loan', 'salary'], color: '#6b21a8', emoji: '💸' },
    { label: 'Other', keywords: [], color: '#9ca3af', emoji: '📦' },
  ]

  const catTotals: Record<string, number> = {}
  for (const t of transactions) {
    const desc = (t.description ?? '').toLowerCase()
    const cat = categories.find((c) => c.keywords.some((k) => desc.includes(k))) ?? categories[categories.length - 1]
    catTotals[cat.label] = (catTotals[cat.label] ?? 0) + t.amount
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n)

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <header className="page-header">
            <div className="page-title">Smart Spend</div>
            <div className="header-actions">
              <div className="avatar-btn">
                <img src={session.user.picture ?? '/avatar.png'} alt="User" />
              </div>
            </div>
          </header>

          <div className="page-body">
            {/* Summary */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
              <div className="stat-card">
                <div className="stat-label">Total Spent</div>
                <div className="stat-value accent">{fmt(totalSpent)}</div>
                <div className="stat-sub">All time</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Transactions</div>
                <div className="stat-value">{transactions.length}</div>
                <div className="stat-sub">Successful</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg. Per Transaction</div>
                <div className="stat-value" style={{ fontSize: 20 }}>
                  {transactions.length > 0 ? fmt(totalSpent / transactions.length) : '—'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">This Month</div>
                <div className="stat-value" style={{ fontSize: 20 }}>
                  {months.length > 0 ? fmt(months[months.length - 1][1]) : '—'}
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
              {/* Monthly spending chart */}
              <div className="card">
                <div className="section-title" style={{ marginBottom: 20 }}>Monthly Spending</div>
                {months.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>No data yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {months.map(([month, val]) => (
                      <div key={month}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: '#374151' }}>{month}</span>
                          <span style={{ fontWeight: 700, color: '#6b21a8' }}>{fmt(val)}</span>
                        </div>
                        <div className="spend-bar">
                          <div
                            className="spend-bar-fill"
                            style={{ width: `${(val / maxMonth) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category breakdown */}
              <div className="card">
                <div className="section-title" style={{ marginBottom: 20 }}>Spending by Category</div>
                {Object.keys(catTotals).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>No data yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {categories.map((cat) => {
                      const val = catTotals[cat.label] ?? 0
                      if (val === 0) return null
                      const pct = Math.round((val / totalSpent) * 100)
                      return (
                        <div key={cat.label}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: `${cat.color}18`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 18,
                              }}
                            >
                              {cat.emoji}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ fontWeight: 600, color: '#374151' }}>{cat.label}</span>
                                <span style={{ fontWeight: 700, color: '#6b21a8' }}>{pct}%</span>
                              </div>
                              <div className="spend-bar" style={{ marginTop: 6 }}>
                                <div
                                  className="spend-bar-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: `linear-gradient(90deg, ${cat.color}, ${cat.color}99)`,
                                  }}
                                />
                              </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap' }}>
                              {fmt(val)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent transactions breakdown */}
            {transactions.length > 0 && (
              <div className="card" style={{ marginTop: 24 }}>
                <div className="section-title" style={{ marginBottom: 16 }}>Recent Spending Activity</div>
                <table className="txn-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>To</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 10).map((t) => (
                      <tr key={t.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </td>
                        <td>{t.description || '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {t.toAccountNumber ? `••••${t.toAccountNumber.slice(-4)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="txn-amount-debit">{fmt(t.amount)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
