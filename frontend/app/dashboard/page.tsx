import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import { ToastProvider } from '@/components/Toast'
import UiIcon from '@/components/UiIcon'
import { auth0 } from '@/lib/auth0'
import { palette } from '@/lib/palette'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function fetchWithToken<T>(
  path: string,
  token: string
): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
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
  direction: 'DEBIT' | 'CREDIT' | null
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
    fetchWithToken<PageResult>('/api/v1/transactions?size=5', token ?? '')
  ])

  const totalBalance = (accounts ?? []).reduce((s, a) => s + a.balance, 0)
  const user = session.user
  const firstName = user.name?.split(' ')[0] ?? user.email ?? 'there'
  const transactions = txPage?.content ?? []

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 2
    }).format(n)

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />

        <div className="main-content">
          {/* Header */}
          <header className="page-header">
            <div>
              <div className="page-title">Dashboard</div>
              <div style={{ fontSize: 13, color: palette.textMuted, marginTop: 2 }}>
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div className="header-actions">
              <button className="icon-btn" aria-label="Search">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ width: 18, height: 18 }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              <button className="icon-btn" aria-label="Notifications">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ width: 18, height: 18 }}
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <div className="avatar-btn">
                <img
                  src={user.picture ?? '/avatar.png'}
                  alt={user.name ?? 'User'}
                />
              </div>
            </div>
          </header>

          <div className="page-body">
            {/* Welcome + stats */}
            <div className="page-intro">
              <h2>Good {getGreeting()}, {firstName}</h2>
              <p>Here's an overview of your financial activity.</p>
            </div>

            {/* Stats row */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-label">Total Balance</div>
                <div className="stat-value accent">{fmt(totalBalance)}</div>
                <div className="stat-sub">
                  Across {(accounts ?? []).length} account
                  {(accounts ?? []).length !== 1 ? 's' : ''}
                </div>
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
                <div className="stat-value positive" style={{ fontSize: 18 }}>
                  Protected
                </div>
                <div className="stat-sub">Auth0 + JWT Verified</div>
              </div>
            </div>

            {/* Accounts + Transactions */}
            <div className="grid-2" style={{ alignItems: 'start' }}>
              {/* Accounts */}
              <div className="card">
                <div className="section-header">
                  <div className="section-title">My Accounts</div>
                  <a href="/bank-accounts" className="view-all-link">
                    View all →
                  </a>
                </div>

                {!accounts || accounts.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '32px 0',
                      color: palette.textMuted
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        color: palette.textMuted,
                        marginBottom: 8
                      }}
                    >
                      <UiIcon name="account" size={32} />
                    </div>
                    <div>No accounts found</div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: 'rgba(18, 58, 99, 0.10)',
                          border: '1px solid rgba(47, 93, 140, 0.18)',
                          gap: 14
                        }}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background:
                              'linear-gradient(135deg, #123A63, #2F5D8C)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            style={{ width: 20, height: 20 }}
                          >
                            <rect x="2" y="5" width="20" height="14" rx="3" />
                            <path d="M2 10h20" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: palette.text,
                              fontSize: 14
                            }}
                          >
                            {acc.accountName}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: palette.textMuted,
                              fontFamily: 'monospace',
                              marginTop: 1
                            }}
                          >
                            ••••{acc.accountNumber.slice(-4)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontWeight: 800,
                              color: palette.textMuted,
                              fontSize: 15
                            }}
                          >
                            {fmt(acc.balance)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: palette.textMuted,
                              textTransform: 'uppercase'
                            }}
                          >
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
                  <a href="/e-statement" className="view-all-link">
                    View all →
                  </a>
                </div>

                {transactions.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '32px 0',
                      color: palette.textMuted
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        color: palette.textMuted,
                        marginBottom: 8
                      }}
                    >
                      <UiIcon name="statement" size={32} />
                    </div>
                    <div>No transactions yet</div>
                  </div>
                ) : (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                  >
                    {transactions.map((txn) => {
                      const isCredit = txn.direction === 'CREDIT'
                      return (
                        <div
                          key={txn.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 0',
                            borderBottom: '1px solid rgba(47, 93, 140, 0.25)'
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: isCredit ? '#dcfce7' : '#fee2e2',
                              color: isCredit ? '#15803d' : '#b91c1c',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <UiIcon
                              name={isCredit ? 'arrowUp' : 'arrowDown'}
                              size={18}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: palette.text,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {txn.description ?? 'Transfer'}
                            </div>
                            <div style={{ fontSize: 11, color: palette.textMuted }}>
                              {fmtDate(txn.createdAt)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              className={
                                isCredit
                                  ? 'txn-amount-credit'
                                  : 'txn-amount-debit'
                              }
                              style={{ fontSize: 14 }}
                            >
                              {isCredit ? '+' : '-'}
                              {fmt(txn.amount)}
                            </div>
                            <span
                              className={`badge badge-${txn.status.toLowerCase()}`}
                            >
                              {txn.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
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
