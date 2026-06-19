import { redirect } from 'next/navigation'
import PrintButton from '@/components/PrintButton'
import Sidebar from '@/components/sidebar'
import { ToastProvider } from '@/components/Toast'
import UiIcon from '@/components/UiIcon'
import { auth0 } from '@/lib/auth0'
import { palette } from '@/lib/palette'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface Transaction {
  id: number
  fromAccountNumber: string | null
  toAccountNumber: string | null
  amount: number
  description: string
  referenceNumber: string
  status: string
  direction: 'DEBIT' | 'CREDIT' | null
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
    const res = await fetch(
      `${API}/api/v1/transactions?size=50&sort=createdAt,desc`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }
    )
    if (res.ok) txPage = await res.json()
  } catch {
    /* empty */
  }

  const transactions = txPage?.content ?? []
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(n)
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })

  const totalDebit = transactions
    .filter((t) => t.direction !== 'CREDIT')
    .reduce((s, t) => s + t.amount, 0)
  const totalCredit = transactions
    .filter((t) => t.direction === 'CREDIT')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <header className="page-header">
            <div className="page-title">E-Statement</div>
            <div className="header-actions">
              <PrintButton />
            </div>
          </header>

          <div className="page-body">
            {/* Statement header */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg,#123A63,#2F5D8C)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src="/loginlogo.png"
                      alt="Nova Bank"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: palette.text
                      }}
                    >
                      NOVA BANK
                    </div>
                    <div style={{ fontSize: 12, color: palette.textMuted }}>
                      Official Account Statement
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: palette.textMuted }}>
                    Statement Generated
                  </div>
                  <div style={{ fontWeight: 700, color: palette.text }}>
                    {new Date().toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 4 }}>
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
                <div className="stat-label">Total Debits</div>
                <div className="stat-value accent">{fmt(totalDebit)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Credits</div>
                <div className="stat-value" style={{ fontSize: 16 }}>
                  {fmt(totalCredit)}
                </div>
              </div>
            </div>

            {/* Transactions table */}
            <div className="card" style={{ overflowX: 'auto' }}>
              <div className="section-header">
                <div className="section-title">Transaction History</div>
                <span style={{ fontSize: 12, color: palette.textMuted }}>
                  Showing {transactions.length} of {txPage?.totalElements ?? 0}{' '}
                  transactions
                </span>
              </div>

              {transactions.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 0',
                    color: palette.textMuted
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      color: palette.textMuted,
                      marginBottom: 12
                    }}
                  >
                    <UiIcon name="statement" size={40} />
                  </div>
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
                    {transactions.map((t) => {
                      const isCredit = t.direction === 'CREDIT'
                      return (
                        <tr key={t.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {fmtDate(t.createdAt)}
                            </div>
                            <div style={{ fontSize: 11, color: palette.textMuted }}>
                              {fmtTime(t.createdAt)}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: 12,
                                background: '#f3f4f6',
                                padding: '2px 6px',
                                borderRadius: 4
                              }}
                            >
                              {t.referenceNumber}
                            </span>
                          </td>
                          <td>{t.description || '—'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                            {t.fromAccountNumber
                              ? `••••${t.fromAccountNumber.slice(-4)}`
                              : '—'}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                            {t.toAccountNumber
                              ? `••••${t.toAccountNumber.slice(-4)}`
                              : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span
                              className={
                                isCredit
                                  ? 'txn-amount-credit'
                                  : 'txn-amount-debit'
                              }
                            >
                              {isCredit ? '+' : '-'}
                              {fmt(t.amount)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge badge-${t.status.toLowerCase()}`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
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
