import { redirect } from 'next/navigation'
import { ToastProvider } from '@/components/Toast'
import UiIcon from '@/components/UiIcon'
import { auth0 } from '@/lib/auth0'
import { palette } from '@/lib/palette'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function adminFetch<T>(path: string, token: string): Promise<T | null> {
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

interface AdminStats {
  totalUsers: number
  totalAccounts: number
  totalTransactions: number
  totalBalance: number
  successfulTransactions: number
  failedTransactions: number
}

interface AdminUser {
  id: number
  email: string
  fullName: string
  auth0Sub: string
  accountCount: number
  totalBalance: number
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
}

export default async function AdminDashboardPage() {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login')

  const { token } = await auth0.getAccessToken()

  // Check admin status from OUR database (is_admin column), not Auth0 roles.
  // This works on Auth0 free tier — no paid RBAC needed.
  const profile = await adminFetch<{ isAdmin: boolean }>(
    '/api/v1/users/me',
    token ?? ''
  )
  if (!profile?.isAdmin) redirect('/dashboard')

  const [stats, users, txPage] = await Promise.all([
    adminFetch<AdminStats>('/api/v1/admin/stats', token ?? ''),
    adminFetch<AdminUser[]>('/api/v1/admin/users', token ?? ''),
    adminFetch<PageResult>('/api/v1/admin/transactions?size=10', token ?? '')
  ])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(n)
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

  const successRate =
    stats && stats.totalTransactions > 0
      ? Math.round(
          (stats.successfulTransactions / stats.totalTransactions) * 100
        )
      : 0

  return (
    <ToastProvider>
      <div
        style={{
          minHeight: '100vh',
          background: palette.offWhite,
          color: palette.text,
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        {/* Admin top bar */}
        <header
          style={{
            background: palette.gradientHero,
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                color: palette.periwinkle,
                border: `1px solid ${palette.border}`
              }}
            >
              ADMIN
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#F2F5F8' }}>
              Nova Bank Control Panel
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#F2F5F8' }}>
                {session.user.name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                {session.user.email}
              </div>
            </div>
            <img
              src={session.user.picture ?? '/avatar.png'}
              alt="Admin"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: `2px solid ${palette.navy600}`
              }}
            />
            <a
              href="/dashboard"
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: '#F2F5F8',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              ← User View
            </a>
            <a
              href="/auth/logout"
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                textDecoration: 'none'
              }}
            >
              Sign Out
            </a>
          </div>
        </header>

        <div style={{ padding: '32px' }}>
          {/* KPI Stats */}
          <div style={{ marginBottom: 8 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: palette.textMuted,
                marginBottom: 16,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}
            >
              Platform Overview
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 32
            }}
          >
            {[
              {
                label: 'Total Users',
                value: stats?.totalUsers ?? '—',
                icon: <UiIcon name="shield" size={24} />,
                color: palette.periwinkle
              },
              {
                label: 'Total Accounts',
                value: stats?.totalAccounts ?? '—',
                icon: <UiIcon name="account" size={24} />,
                color: palette.offWhite
              },
              {
                label: 'Total Transactions',
                value: stats?.totalTransactions ?? '—',
                icon: <UiIcon name="transfer" size={24} />,
                color: palette.navy600
              },
              {
                label: 'Platform Balance',
                value: stats ? fmt(stats.totalBalance) : '—',
                icon: <UiIcon name="chart" size={24} />,
                color: palette.green,
                wide: true
              },
              {
                label: 'Success Rate',
                value: `${successRate}%`,
                icon: <UiIcon name="check" size={24} />,
                color: palette.green
              },
              {
                label: 'Failed Txns',
                value: stats?.failedTransactions ?? '—',
                icon: <UiIcon name="x" size={24} />,
                color: palette.red
              }
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div
                  style={{
                    display: 'inline-flex',
                    color: s.color,
                    marginBottom: 8
                  }}
                >
                  {s.icon}
                </div>
                <div className="stat-label">{s.label}</div>
                <div
                  className="stat-value"
                  style={{ color: s.color, fontSize: 26, marginTop: 4 }}
                >
                  {String(s.value)}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              alignItems: 'start'
            }}
          >
            {/* Users table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                className="section-header"
                style={{
                  padding: '16px 20px',
                  marginBottom: 0,
                  borderBottom: '1px solid rgba(47, 93, 140, 0.12)'
                }}
              >
                <span className="section-title">Registered Users</span>
                <span style={{ fontSize: 12, color: palette.textMuted }}>
                  {users?.length ?? 0} total
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {!users || users.length === 0 ? (
                  <div
                    style={{
                      padding: '32px',
                      textAlign: 'center',
                      color: palette.textMuted
                    }}
                  >
                    No users yet
                  </div>
                ) : (
                  <table className="txn-table">
                    <thead>
                      <tr>
                        {['Name', 'Email', 'Accounts', 'Balance', 'Joined'].map(
                          (h) => (
                            <th key={h}>{h}</th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>{u.fullName ?? '—'}</td>
                          <td style={{ fontSize: 12, color: palette.textMuted }}>
                            {u.email}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-pending">
                              {u.accountCount}
                            </span>
                          </td>
                          <td
                            style={{
                              color: palette.green,
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {fmt(u.totalBalance)}
                          </td>
                          <td style={{ fontSize: 12, color: palette.textMuted }}>
                            {fmtDate(u.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Recent transactions */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                className="section-header"
                style={{
                  padding: '16px 20px',
                  marginBottom: 0,
                  borderBottom: '1px solid rgba(47, 93, 140, 0.12)'
                }}
              >
                <span className="section-title">Recent Transactions</span>
                <span style={{ fontSize: 12, color: palette.textMuted }}>
                  All users
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {!txPage || txPage.content.length === 0 ? (
                  <div
                    style={{
                      padding: '32px',
                      textAlign: 'center',
                      color: palette.textMuted
                    }}
                  >
                    No transactions yet
                  </div>
                ) : (
                  <table className="txn-table">
                    <thead>
                      <tr>
                        {['Ref', 'From', 'To', 'Amount', 'Status'].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {txPage.content.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: 11,
                                background: 'rgba(201, 214, 229, 0.45)',
                                padding: '2px 6px',
                                borderRadius: 4,
                                color: palette.textSecondary
                              }}
                            >
                              {t.referenceNumber}
                            </span>
                          </td>
                          <td
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 12,
                              color: palette.textMuted
                            }}
                          >
                            {t.fromAccountNumber
                              ? `••••${t.fromAccountNumber.slice(-4)}`
                              : '—'}
                          </td>
                          <td
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 12,
                              color: palette.textMuted
                            }}
                          >
                            {t.toAccountNumber
                              ? `••••${t.toAccountNumber.slice(-4)}`
                              : '—'}
                          </td>
                          <td
                            style={{
                              fontWeight: 700,
                              color: palette.yellow,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {fmt(t.amount)}
                          </td>
                          <td>
                            <span
                              className={`badge ${t.status === 'SUCCESS' ? 'badge-success' : 'badge-failed'}`}
                            >
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
      </div>
    </ToastProvider>
  )
}
