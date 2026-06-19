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
  totalPages: number
}

export default async function EStatementPage() {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login')

  const { token } = await auth0.getAccessToken()

  let txPage: PageResult | null = null
  try {
    const res = await fetch(`${API}/api/v1/transactions?size=50&sort=createdAt,desc`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.ok) txPage = await res.json()
  } catch { /* empty */ }

  const transactions = txPage?.content ?? []
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(n)
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const totalDebit = transactions.reduce((s, t) => s + t.amount, 0)

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <header className="page-header">
            <div className="page-title">E-Statement</div>
            <div className="header-actions">
              <button
                onClick={() => window.print()}
                className="btn-secondary"
                style={{ padding: '8px 18px', fontSize: 13 }}
              >
                🖨 Print Statement
              </button>
            </div>
          </header>

          <div className="page-body">
            {/* Statement header */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg,#2d0b4e,#6b21a8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img src="/loginlogo.png" alt="Nova Bank" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>NOVA BANK</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Official Account Statement</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>Statement Generated</div>
                  <div style={{ fontWeight: 700, color: '#1a1a2e' }}>
                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    {session.user.name ?? session.user.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value">{txPage?.totalElements ?? 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Transferred</div>
                <div className="stat-value accent">{fmt(totalDebit)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Last Transaction</div>
                <div className="stat-value" style={{ fontSize: 16 }}>
                  {transactions.length > 0 ? fmtDate(transactions[0].createdAt) : '—'}
                </div>
              </div>
            </div>

            {/* Transactions table */}
            <div className="card" style={{ overflowX: 'auto' }}>
              <div className="section-header">
                <div className="section-title">Transaction History</div>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  Showing {transactions.length} of {txPage?.totalElements ?? 0} transactions
                </span>
              </div>

              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div>No transactions found</div>
                </div>
              ) : (
                <table className="txn-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Reference</th>
                      <th>Description</th>
                      <th>From</th>
                      <th>To</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{fmtDate(t.createdAt)}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{fmtTime(t.createdAt)}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                            {t.referenceNumber}
                          </span>
                        </td>
                        <td>{t.description || '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                          {t.fromAccountNumber ? `••••${t.fromAccountNumber.slice(-4)}` : '—'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                          {t.toAccountNumber ? `••••${t.toAccountNumber.slice(-4)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="txn-amount-debit">{fmt(t.amount)}</span>
                        </td>
                        <td>
                          <span className={`badge badge-${t.status.toLowerCase()}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
