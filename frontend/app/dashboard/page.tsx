import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import { ToastProvider } from '@/components/Toast'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function fetchWithToken<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

interface Account {
  id: number
  accountNumber: string
  accountName: string
  accountType: string
  balance: number
  createdAt: string
}

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

export default async function DashboardPage() {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login')

  const { token } = await auth0.getAccessToken()

  const [accounts, txPage] = await Promise.all([
    fetchWithToken<Account[]>('/api/v1/accounts', token ?? ''),
    fetchWithToken<PageResult>('/api/v1/transactions?size=5', token ?? ''),
  ])

  const totalBalance = (accounts ?? []).reduce((s, a) => s + a.balance, 0)
  const user = session.user
  const firstName = user.name?.split(' ')[0] ?? user.email ?? 'there'
  const transactions = txPage?.content ?? []

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 }).format(n)

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />

        <div className="main-content">
          {/* Header */}
          <header className="page-header">
            <div>
              <div className="page-title">Dashboard</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="header-actions">
              <button className="icon-btn" aria-label="Search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              <button className="icon-btn" aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <div className="avatar-btn">
                <img src={user.picture ?? '/avatar.png'} alt={user.name ?? 'User'} />
              </div>
            </div>
          </header>

          <div className="page-body">
            {/* Welcome + stats */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>
                Good {getGreeting()}, {firstName}! 👋
              </h2>
              <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>
                Here's an overview of your financial activity.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-label">Total Balance</div>
                <div className="stat-value accent">{fmt(totalBalance)}</div>
                <div className="stat-sub">Across {(accounts ?? []).length} account{(accounts ?? []).length !== 1 ? 's' : ''}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Accounts</div>
                <div className="stat-value">{(accounts ?? []).length}</div>
                <div className="stat-sub">Active accounts</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Transactions</div>
                <div className="stat-value">{txPage?.totalElements ?? 0}</div>
                <div className="stat-sub">All time</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Security</div>
                <div className="stat-value positive" style={{ fontSize: 18 }}>Protected</div>
                <div className="stat-sub">Auth0 + JWT Verified</div>
              </div>
            </div>

            {/* Accounts + Transactions */}
            <div className="grid-2" style={{ alignItems: 'start' }}>
              {/* Accounts */}
              <div className="card">
                <div className="section-header">
                  <div className="section-title">My Accounts</div>
                  <a href="/bank-accounts" className="view-all-link">View all →</a>
                </div>

                {!accounts || accounts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🏦</div>
                    <div>No accounts found</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                          border: '1px solid rgba(124,58,237,0.1)',
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #6b21a8, #7c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 20, height: 20 }}>
                            <rect x="2" y="5" width="20" height="14" rx="3" />
                            <path d="M2 10h20" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>{acc.accountName}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace', marginTop: 1 }}>
                            ••••{acc.accountNumber.slice(-4)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: '#6b21a8', fontSize: 15 }}>
                            {fmt(acc.balance)}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>
                            {acc.accountType}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="card">
                <div className="section-header">
                  <div className="section-title">Recent Transactions</div>
                  <a href="/e-statement" className="view-all-link">View all →</a>
                </div>

                {transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    <div>No transactions yet</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {transactions.map((txn) => (
                      <div
                        key={txn.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 0',
                          borderBottom: '1px solid rgba(0,0,0,0.05)',
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: txn.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {txn.status === 'SUCCESS' ? '↑' : '✕'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {txn.description ?? 'Transfer'}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(txn.createdAt)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
                            -{fmt(txn.amount)}
                          </div>
                          <span className={`badge badge-${txn.status.toLowerCase()}`}>
                            {txn.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
