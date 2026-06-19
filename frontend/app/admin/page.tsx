import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import { ToastProvider } from '@/components/Toast'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function adminFetch<T>(path: string, token: string): Promise<T | null> {
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

interface PageResult { content: Transaction[] }

export default async function AdminDashboardPage() {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login')

  const { token } = await auth0.getAccessToken()

  // Check admin status from OUR database (is_admin column), not Auth0 roles.
  // This works on Auth0 free tier — no paid RBAC needed.
  const profile = await adminFetch<{ isAdmin: boolean }>('/api/v1/users/me', token ?? '')
  if (!profile?.isAdmin) redirect('/dashboard')

  const [stats, users, txPage] = await Promise.all([
    adminFetch<AdminStats>('/api/v1/admin/stats', token ?? ''),
    adminFetch<AdminUser[]>('/api/v1/admin/users', token ?? ''),
    adminFetch<PageResult>('/api/v1/admin/transactions?size=10', token ?? ''),
  ])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n)
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const successRate =
    stats && stats.totalTransactions > 0
      ? Math.round((stats.successfulTransactions / stats.totalTransactions) * 100)
      : 0

  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        {/* Admin top bar */}
        <header
          style={{
            background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
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
                color: '#fca5a5',
                border: '1px solid rgba(252,165,165,0.3)',
              }}
            >
              ADMIN
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Nova Bank Control Panel</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{session.user.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{session.user.email}</div>
            </div>
            <img
              src={session.user.picture ?? '/avatar.png'}
              alt="Admin"
              style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(252,165,165,0.5)' }}
            />
            <a
              href="/dashboard"
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: '#fff',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ← User View
            </a>
            <a href="/auth/logout" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              Sign Out
            </a>
          </div>
        </header>

        <div style={{ padding: '32px' }}>
          {/* KPI Stats */}
          <div style={{ marginBottom: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              Platform Overview
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: '👤', color: '#6366f1' },
              { label: 'Total Accounts', value: stats?.totalAccounts ?? '—', icon: '🏦', color: '#0ea5e9' },
              { label: 'Total Transactions', value: stats?.totalTransactions ?? '—', icon: '↕', color: '#8b5cf6' },
              { label: 'Platform Balance', value: stats ? fmt(stats.totalBalance) : '—', icon: '💰', color: '#22c55e', wide: true },
              { label: 'Success Rate', value: `${successRate}%`, icon: '✓', color: '#22c55e' },
              { label: 'Failed Txns', value: stats?.failedTransactions ?? '—', icon: '✕', color: '#ef4444' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: '#1a1a2e',
                  borderRadius: 16,
                  padding: '20px 24px',
                  border: `1px solid ${s.color}22`,
                  boxShadow: `0 4px 24px ${s.color}11`,
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 4, lineHeight: 1 }}>
                  {String(s.value)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            {/* Users table */}
            <div
              style={{
                background: '#1a1a2e',
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 15 }}>Registered Users</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{users?.length ?? 0} total</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {!users || users.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No users yet</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Name', 'Email', 'Accounts', 'Balance', 'Joined'].map((h) => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#e2e8f0' }}>{u.fullName ?? '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>{u.email}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ background: '#1e293b', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                              {u.accountCount}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#22c55e', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {fmt(u.totalBalance)}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{fmtDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Recent transactions */}
            <div
              style={{
                background: '#1a1a2e',
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 15 }}>Recent Transactions</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>All users</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {!txPage || txPage.content.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No transactions yet</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Ref', 'From', 'To', 'Amount', 'Status'].map((h) => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {txPage.content.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#0f172a', padding: '2px 6px', borderRadius: 4, color: '#94a3b8' }}>
                              {t.referenceNumber}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
                            {t.fromAccountNumber ? `••••${t.fromAccountNumber.slice(-4)}` : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
                            {t.toAccountNumber ? `••••${t.toAccountNumber.slice(-4)}` : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f59e0b', whiteSpace: 'nowrap' }}>
                            {fmt(t.amount)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: t.status === 'SUCCESS' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                color: t.status === 'SUCCESS' ? '#22c55e' : '#ef4444',
                              }}
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
