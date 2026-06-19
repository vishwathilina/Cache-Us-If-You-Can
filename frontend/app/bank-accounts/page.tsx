import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import { ToastProvider } from '@/components/Toast'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface Account {
  id: number
  accountNumber: string
  accountName: string
  accountType: string
  balance: number
  createdAt: string
}

export default async function BankAccountsPage() {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login')

  const { token } = await auth0.getAccessToken()

  let accounts: Account[] = []
  try {
    const res = await fetch(`${API}/api/v1/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.ok) accounts = await res.json()
  } catch { /* empty */ }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(n)

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  const typeColors: Record<string, string> = {
    SAVINGS: 'linear-gradient(135deg, #2d0b4e, #6b21a8)',
    CURRENT: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
    FIXED_DEPOSIT: 'linear-gradient(135deg, #0f4c2a, #16a34a)',
  }

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <header className="page-header">
            <div className="page-title">My Accounts</div>
            <div className="header-actions">
              <div className="avatar-btn">
                <img src={session.user.picture ?? '/avatar.png'} alt="User" />
              </div>
            </div>
          </header>

          <div className="page-body">
            {/* Summary */}
            <div className="grid-3" style={{ marginBottom: 28 }}>
              <div className="stat-card">
                <div className="stat-label">Total Balance</div>
                <div className="stat-value accent">{fmt(totalBalance)}</div>
                <div className="stat-sub">Across {accounts.length} accounts</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Active Accounts</div>
                <div className="stat-value">{accounts.length}</div>
                <div className="stat-sub">All verified</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Account Holder</div>
                <div className="stat-value" style={{ fontSize: 18 }}>
                  {session.user.name?.split(' ')[0]}
                </div>
                <div className="stat-sub">Auth0 Verified</div>
              </div>
            </div>

            {/* Account cards */}
            {accounts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🏦</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
                  No Accounts Found
                </h3>
                <p style={{ color: '#9ca3af' }}>
                  Your accounts will appear here once they're linked to your profile.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div className="section-title">Account Overview</div>
                </div>
                <div className="grid-2">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      style={{
                        borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      }}
                    >
                      {/* Card top */}
                      <div
                        style={{
                          background: typeColors[acc.accountType] ?? typeColors.SAVINGS,
                          padding: '24px 24px 20px',
                          color: 'white',
                          position: 'relative',
                          minHeight: 160,
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: -30,
                            right: -30,
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.06)',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                              {acc.accountType.replace('_', ' ')}
                            </div>
                            <div style={{ fontSize: 17, fontWeight: 700 }}>{acc.accountName}</div>
                          </div>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 12,
                              background: 'rgba(255,255,255,0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 22, height: 22 }}>
                              <rect x="2" y="5" width="20" height="14" rx="3" />
                              <path d="M2 10h20" />
                            </svg>
                          </div>
                        </div>

                        <div style={{ marginTop: 20, fontFamily: 'monospace', fontSize: 15, letterSpacing: 3, color: 'rgba(255,255,255,0.75)' }}>
                          {acc.accountNumber.replace(/(.{4})/g, '$1 ').trim()}
                        </div>

                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Balance</div>
                          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2 }}>{fmt(acc.balance)}</div>
                        </div>
                      </div>

                      {/* Card bottom */}
                      <div
                        style={{
                          background: '#fff',
                          padding: '16px 24px',
                          display: 'flex',
                          gap: 12,
                          borderTop: '1px solid rgba(0,0,0,0.06)',
                        }}
                      >
                        <a
                          href="/bank-transfer"
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            background: 'linear-gradient(135deg,#6b21a8,#7c3aed)',
                            color: '#fff',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 13,
                            textDecoration: 'none',
                            textAlign: 'center',
                          }}
                        >
                          Transfer
                        </a>
                        <a
                          href="/e-statement"
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            background: '#f5f3ff',
                            color: '#6b21a8',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 13,
                            textDecoration: 'none',
                            textAlign: 'center',
                            border: '1px solid rgba(124,58,237,0.2)',
                          }}
                        >
                          Statement
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
