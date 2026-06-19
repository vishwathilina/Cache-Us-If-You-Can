'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'
import { ToastProvider, useToast } from '@/components/Toast'
import UiIcon from '@/components/UiIcon'
import { iconTints, palette } from '@/lib/palette'

interface Biller {
  id: string
  name: string
  category: string
  icon:
    | 'droplet'
    | 'bolt'
    | 'phone'
    | 'broadcast'
    | 'tv'
    | 'shield'
    | 'globe'
    | 'building'
    | 'home'
    | 'flame'
  color: string
}

interface Account {
  id: number
  accountNumber: string
  accountName: string
  balance: number
  accountType: string
}

interface PaymentReceipt {
  transactionId: number
  referenceNumber: string
  type: string
  status: string
  amount: number
  fromAccountNumber: string
  payeeName: string
  customerReference: string
  description: string
  newBalance: number
  timestamp: string
}

const BILLERS: Biller[] = [
  {
    id: 'water',
    name: 'National Water Supply',
    category: 'Utilities',
    icon: 'droplet',
    color: iconTints[0]
  },
  {
    id: 'ceb',
    name: 'Ceylon Electricity Board',
    category: 'Utilities',
    icon: 'bolt',
    color: iconTints[1]
  },
  {
    id: 'dialog',
    name: 'Dialog Axiata',
    category: 'Telecom',
    icon: 'phone',
    color: iconTints[2]
  },
  {
    id: 'mobitel',
    name: 'Mobitel',
    category: 'Telecom',
    icon: 'broadcast',
    color: iconTints[3]
  },
  {
    id: 'slt',
    name: 'Sri Lanka Telecom',
    category: 'Telecom',
    icon: 'phone',
    color: iconTints[4]
  },
  {
    id: 'peo',
    name: 'PEO TV (SLT)',
    category: 'Entertainment',
    icon: 'tv',
    color: iconTints[5]
  },
  {
    id: 'dialog-tv',
    name: 'Dialog TV',
    category: 'Entertainment',
    icon: 'tv',
    color: iconTints[0]
  },
  {
    id: 'insurance',
    name: 'Ceylinco Insurance',
    category: 'Insurance',
    icon: 'shield',
    color: iconTints[1]
  },
  {
    id: 'internet',
    name: 'Sri Lanka Broadband',
    category: 'Internet',
    icon: 'globe',
    color: iconTints[2]
  },
  {
    id: 'taxes',
    name: 'IRD Tax Portal',
    category: 'Government',
    icon: 'building',
    color: iconTints[3]
  },
  {
    id: 'rates',
    name: 'Municipal Rates',
    category: 'Government',
    icon: 'home',
    color: iconTints[4]
  },
  {
    id: 'gas',
    name: 'Litro Gas',
    category: 'Utilities',
    icon: 'flame',
    color: iconTints[5]
  }
]

function PayBillsInner() {
  const { showToast } = useToast()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [fromAccountId, setFromAccountId] = useState('')
  const [selected, setSelected] = useState<Biller | null>(null)
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/v1/accounts')
      .then((r) => r.json())
      .then((data: Account[]) => {
        setAccounts(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data.length > 0) {
          setFromAccountId(String(data[0].id))
        }
      })
      .catch(() => showToast('error', 'Failed to load accounts'))
      .finally(() => setAccountsLoading(false))
  }, [showToast])

  const filtered = BILLERS.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  )

  const categories = [...new Set(BILLERS.map((b) => b.category))]
  const selectedAccount = accounts.find(
    (account) => String(account.id) === fromAccountId
  )
  const fmt = (value: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(value)

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    const numericAmount = Number(amount)

    if (!selected) {
      showToast(
        'error',
        'Select Biller',
        'Please select a biller before paying.'
      )
      return
    }
    if (!selectedAccount) {
      showToast('error', 'No Source Account', 'Please select a source account.')
      return
    }
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      showToast(
        'error',
        'Invalid Amount',
        'Please enter a valid amount greater than 0.'
      )
      return
    }
    if (numericAmount > selectedAccount.balance) {
      showToast(
        'error',
        'Insufficient Funds',
        `Available balance is ${fmt(selectedAccount.balance)}.`
      )
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/bill-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId: selectedAccount.id,
          billerId: selected.id,
          billerName: selected.name,
          customerReference: reference,
          amount: numericAmount
        })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          data?.detail ?? data?.message ?? `Bill payment failed (${res.status})`
        showToast(
          'error',
          res.status === 400 ? 'Insufficient Funds' : 'Payment Failed',
          msg
        )
        return
      }

      setReceipt(data as PaymentReceipt)
      setAccounts((current) =>
        current.map((account) =>
          account.id === selectedAccount.id
            ? { ...account, balance: (data as PaymentReceipt).newBalance }
            : account
        )
      )
      showToast(
        'success',
        'Payment Successful!',
        `Receipt: ${(data as PaymentReceipt).referenceNumber}`
      )
      setAmount('')
      setReference('')
    } catch {
      showToast(
        'error',
        'Payment Failed',
        'Something went wrong. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function resetPayment() {
    setReceipt(null)
    setSelected(null)
    setAmount('')
    setReference('')
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
          {receipt ? (
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div className="card card-lg" style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    background: 'rgba(74, 222, 128, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: 34
                  }}
                >
                  <UiIcon name="check" size={34} />
                </div>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#4ADE80',
                    marginBottom: 8
                  }}
                >
                  Bill Payment Successful
                </h3>
                <p style={{ color: palette.textMuted, marginBottom: 24 }}>
                  Receipt generated and transaction saved.
                </p>

                <div
                  style={{
                    background: 'rgba(18, 58, 99, 0.12)',
                    borderRadius: 14,
                    padding: 20,
                    marginBottom: 24,
                    textAlign: 'left'
                  }}
                >
                  {[
                    ['Receipt No.', receipt.referenceNumber],
                    ['Biller', receipt.payeeName],
                    ['Customer Ref.', receipt.customerReference],
                    ['Amount', fmt(receipt.amount)],
                    [
                      'From Account',
                      `••••${receipt.fromAccountNumber.slice(-4)}`
                    ],
                    ['New Balance', fmt(receipt.newBalance)],
                    ['Date', new Date(receipt.timestamp).toLocaleString()]
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        fontSize: 14,
                        borderBottom: '1px solid rgba(47, 93, 140, 0.25)'
                      }}
                    >
                      <span style={{ color: palette.textMuted, fontWeight: 600 }}>
                        {label}
                      </span>
                      <span
                        style={{
                          color: palette.text,
                          fontWeight: 700,
                          textAlign: 'right'
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary"
                  onClick={resetPayment}
                  style={{ padding: '14px 40px' }}
                >
                  Pay Another Bill
                </button>
              </div>
            </div>
          ) : !selected ? (
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
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: palette.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 12
                      }}
                    >
                      {cat}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 14
                      }}
                    >
                      {items.map((biller) => (
                        <button
                          key={biller.id}
                          onClick={() => setSelected(biller)}
                          className="highlight-tile"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '16px 18px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%'
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
                              color: biller.color,
                              flexShrink: 0
                            }}
                          >
                            <UiIcon name={biller.icon} size={22} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: palette.text,
                                lineHeight: 1.3
                              }}
                            >
                              {biller.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: palette.textMuted,
                                marginTop: 2
                              }}
                            >
                              {biller.category}
                            </div>
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
                  color: palette.textSecondary,
                  fontWeight: 600,
                  fontSize: 14,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 20,
                  padding: 0
                }}
              >
                Back to Billers
              </button>

              <div className="card card-lg">
                {/* Biller info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 28,
                    paddingBottom: 20,
                    borderBottom: '1px solid rgba(47, 93, 140, 0.35)'
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 16,
                      background: `${selected.color}18`,
                      color: selected.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <UiIcon name={selected.icon} size={28} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: palette.text
                      }}
                    >
                      {selected.name}
                    </div>
                    <div style={{ fontSize: 13, color: palette.textMuted }}>
                      {selected.category}
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePay}>
                  <div style={{ marginBottom: 20 }}>
                    <label className="nb-label">
                      Account / Customer Reference
                    </label>
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

                  <div style={{ marginBottom: 20 }}>
                    <label className="nb-label">Pay From Account</label>
                    {accountsLoading ? (
                      <div
                        className="skeleton"
                        style={{ height: 52, borderRadius: 12 }}
                      />
                    ) : (
                      <select
                        className="nb-input nb-select"
                        value={fromAccountId}
                        onChange={(event) =>
                          setFromAccountId(event.target.value)
                        }
                        required
                      >
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.accountName} — ••••
                            {account.accountNumber.slice(-4)} (
                            {fmt(account.balance)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedAccount && (
                    <div
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(236,254,255,0.9), rgba(240,249,255,0.9))',
                        border: '1px solid rgba(47, 93, 140, 0.18)',
                        borderRadius: 14,
                        padding: '14px 18px',
                        marginBottom: 24,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: '#5A7189'
                        }}
                      >
                        Available Balance
                      </span>
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: palette.text
                        }}
                      >
                        {fmt(selectedAccount.balance)}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', padding: 16 }}
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Processing…'
                      : `Pay ${amount ? new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(amount)) : 'Bill'}`}
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
