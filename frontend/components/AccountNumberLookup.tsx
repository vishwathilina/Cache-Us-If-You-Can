'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { palette } from '@/lib/palette'

interface Account {
  id: number
  accountNumber: string
  accountName: string
  accountType: string
  balance: number
  createdAt: string
}

const ACCOUNT_PATTERN = /^ACC-[1-9]{10}$/
const TYPE_COLORS: Record<string, string> = {
  SAVINGS: palette.gradientHero,
  CURRENT: 'linear-gradient(135deg, #0B1F3B, #2F5D8C)',
  FIXED_DEPOSIT: palette.gradientPrimary
}

export default function AccountNumberLookup() {
  const { showToast } = useToast()
  const [accountNumber, setAccountNumber] = useState('')
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fmt = (value: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(value)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const normalized = accountNumber.trim().toUpperCase()
    setAccount(null)

    if (!ACCOUNT_PATTERN.test(normalized)) {
      const message = 'Use format ACC-xxxxxxxxxx with 10 digits from 1 to 9.'
      setError(message)
      showToast('error', 'Invalid Account Number', message)
      return
    }

    setError('')
    setLoading(true)
    try {
      const res = await fetch(
        `/api/v1/accounts/lookup?accountNumber=${encodeURIComponent(normalized)}`
      )
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const message =
          data?.detail ?? data?.message ?? 'No account found for this number.'
        setError(message)
        showToast('error', 'Account Not Found', message)
        return
      }

      setAccount(data as Account)
      setAccountNumber(normalized)
    } catch {
      const message = 'Could not load account details. Please try again.'
      setError(message)
      showToast('error', 'Lookup Failed', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="section-header">
          <div>
            <div className="section-title">Find Account by Number</div>
            <div style={{ fontSize: 13, color: palette.textMuted, marginTop: 4 }}>
              Enter your account number in the format ACC-xxxxxxxxxx.
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
        >
          <input
            className={`nb-input ${error ? 'error' : ''}`}
            value={accountNumber}
            onChange={(event) => {
              setAccountNumber(event.target.value.toUpperCase())
              setError('')
            }}
            placeholder="ACC-1234567891"
            maxLength={14}
            style={{ flex: '1 1 260px' }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ padding: '0 28px' }}
          >
            {loading ? 'Checking...' : 'Show Details'}
          </button>
        </form>

        {error && (
          <p className="error-msg" style={{ marginTop: 10 }}>
            {error}
          </p>
        )}
      </div>

      {account && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div className="section-title">Account Overview</div>
            <div style={{ fontSize: 13, color: palette.textMuted, marginTop: 4 }}>
              Showing the account you entered and claimed.
            </div>
          </div>
          <div className="grid-2">
            <div
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 18px 48px rgba(15,47,61,0.14)'
              }}
            >
              <div
                style={{
                  background:
                    TYPE_COLORS[account.accountType] ?? TYPE_COLORS.SAVINGS,
                  padding: '24px 24px 20px',
                  color: 'white',
                  position: 'relative',
                  minHeight: 160
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
                    background: 'rgba(255,255,255,0.06)'
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: 4
                      }}
                    >
                      {account.accountType.replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>
                      {account.accountName}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      style={{ width: 22, height: 22 }}
                    >
                      <rect x="2" y="5" width="20" height="14" rx="3" />
                      <path d="M2 10h20" />
                    </svg>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    fontFamily: 'monospace',
                    fontSize: 15,
                    letterSpacing: 3,
                    color: 'rgba(255,255,255,0.75)'
                  }}
                >
                  {account.accountNumber.replace(/(.{4})/g, '$1 ').trim()}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: 1
                    }}
                  >
                    Balance
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2 }}>
                    {fmt(account.balance)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(201, 214, 229, 0.35)',
                  backdropFilter: 'blur(12px)',
                  padding: '16px 24px',
                  display: 'flex',
                  gap: 12,
                  borderTop: '1px solid rgba(255, 255, 255, 0.65)'
                }}
              >
                <a
                  href="/bank-transfer"
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: palette.gradientPrimary,
                    color: palette.offWhite,
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                    textAlign: 'center'
                  }}
                >
                  Transfer
                </a>
                <a
                  href="/e-statement"
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'rgba(47, 93, 140, 0.35)',
                    color: palette.periwinkle,
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                    textAlign: 'center',
                    border: '1px solid rgba(47, 93, 140, 0.18)'
                  }}
                >
                  Statement
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
