'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'
import { ToastProvider, useToast } from '@/components/Toast'
import UiIcon from '@/components/UiIcon'
import { palette } from '@/lib/palette'

interface Account {
  id: number
  accountNumber: string
  accountName: string
  balance: number
  accountType: string
}

interface TransferResult {
  transactionId: number
  referenceNumber: string
  amount: number
  fromAccountNumber: string
  toAccountNumber: string
  newBalance: number
  timestamp: string
}

function BankTransferInner() {
  const { showToast } = useToast()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountNumber, setToAccountNumber] = useState('')
  const [toAccountName, setToAccountName] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [step, setStep] = useState<'form' | 'confirm' | 'success' | 'failed'>(
    'form'
  )
  const [result, setResult] = useState<TransferResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/v1/accounts')
      .then((r) => r.json())
      .then((data: Account[]) => {
        setAccounts(Array.isArray(data) ? data : [])
        if (data.length > 0) setFromAccountId(String(data[0].id))
      })
      .catch(() => showToast('error', 'Failed to load accounts'))
      .finally(() => setLoading(false))
  }, [showToast])

  const selectedAccount = accounts.find((a) => String(a.id) === fromAccountId)

  function validate() {
    const e: Record<string, string> = {}
    if (!fromAccountId) e.fromAccountId = 'Select a source account'
    if (!toAccountNumber.trim())
      e.toAccountNumber = 'Destination account number is required'
    if (!toAccountName.trim()) e.toAccountName = 'Account name is required'
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      e.amount = 'Enter a valid positive amount'
    if (selectedAccount && Number(amount) > selectedAccount.balance)
      e.amount = `Amount exceeds available balance (${fmt(selectedAccount.balance)})`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) setStep('confirm')
  }

  async function handleTransfer() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId: Number(fromAccountId),
          toAccountNumber,
          amount: Number(amount),
          description: description || undefined
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg =
          err?.detail ?? err?.message ?? `Transfer failed (${res.status})`
        showToast(
          'error',
          res.status === 400 ? 'Insufficient Funds' : 'Transfer Failed',
          msg
        )
        setStep('failed')
        return
      }

      const data: TransferResult = await res.json()
      setResult(data)
      setAccounts((current) =>
        current.map((account) =>
          account.id === Number(fromAccountId)
            ? { ...account, balance: data.newBalance }
            : account
        )
      )
      setStep('success')
      showToast(
        'success',
        'Transfer Successful!',
        `Reference: ${data.referenceNumber}`
      )
    } catch {
      showToast(
        'error',
        'Network Error',
        'Please check your connection and try again.'
      )
      setStep('failed')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep('form')
    setAmount('')
    setToAccountNumber('')
    setToAccountName('')
    setDescription('')
    setErrors({})
    setResult(null)
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(n)

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div className="page-title">Bank Transfer</div>
          <div className="header-actions">
            <div className="avatar-btn">
              <img src="/avatar.png" alt="User" />
            </div>
          </div>
        </header>

        <div className="page-body">
          {/* Step indicator */}
          {step === 'form' || step === 'confirm' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 24,
                justifyContent: 'center'
              }}
            >
              {(['Details', 'Confirm', 'Complete'] as const).map((label, i) => {
                const current = step === 'form' ? 0 : step === 'confirm' ? 1 : 2
                return (
                  <div
                    key={label}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background:
                            i <= current
                              ? 'linear-gradient(135deg,#123A63,#2F5D8C)'
                              : '#e5e7eb',
                          color:
                            i <= current
                              ? palette.textOnBlue
                              : 'rgba(201, 214, 229, 0.55)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        {i < current ? (
                          <UiIcon name="check" size={14} />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            i <= current
                              ? palette.text
                              : palette.textMuted
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        style={{
                          width: 40,
                          height: 2,
                          background: i < current ? '#2F5D8C' : '#e5e7eb',
                          borderRadius: 1
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ) : null}

          <div
            className="card card-lg"
            style={{ maxWidth: 720, margin: '0 auto' }}
          >
            {step === 'form' && (
              <form onSubmit={handleConfirm}>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: palette.text,
                    marginBottom: 24
                  }}
                >
                  Transfer Details
                </h3>

                {loading ? (
                  <div
                    className="skeleton"
                    style={{ height: 52, borderRadius: 12, marginBottom: 16 }}
                  />
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    <label className="nb-label">From Account</label>
                    <select
                      className="nb-input nb-select"
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountName} — ••••{a.accountNumber.slice(-4)} (
                          {fmt(a.balance)})
                        </option>
                      ))}
                    </select>
                    {errors.fromAccountId && (
                      <p className="error-msg">{errors.fromAccountId}</p>
                    )}
                  </div>
                )}

                {selectedAccount && (
                  <div
                    style={{
                      background: 'rgba(18, 58, 99, 0.10)',
                      border: '1px solid rgba(47, 93, 140, 0.18)',
                      borderRadius: 14,
                      padding: '14px 18px',
                      marginBottom: 20,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: palette.textMuted
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

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    marginBottom: 20
                  }}
                >
                  <div>
                    <label className="nb-label">Destination Account No.</label>
                    <input
                      className={`nb-input ${errors.toAccountNumber ? 'error' : ''}`}
                      placeholder="e.g. NB-002-00200001"
                      value={toAccountNumber}
                      onChange={(e) => setToAccountNumber(e.target.value)}
                    />
                    {errors.toAccountNumber && (
                      <p className="error-msg">{errors.toAccountNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="nb-label">Account Holder Name</label>
                    <input
                      className={`nb-input ${errors.toAccountName ? 'error' : ''}`}
                      placeholder="Recipient name"
                      value={toAccountName}
                      onChange={(e) => setToAccountName(e.target.value)}
                    />
                    {errors.toAccountName && (
                      <p className="error-msg">{errors.toAccountName}</p>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="nb-label">Amount (LKR)</label>
                  <input
                    className={`nb-input ${errors.amount ? 'error' : ''}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {errors.amount && (
                    <p className="error-msg">{errors.amount}</p>
                  )}
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label className="nb-label">Description (optional)</label>
                  <textarea
                    className="nb-input nb-textarea"
                    placeholder="What's this transfer for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '14px 40px' }}
                  >
                    Review Transfer →
                  </button>
                </div>
              </form>
            )}

            {step === 'confirm' && (
              <div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: palette.text,
                    marginBottom: 24,
                    textAlign: 'center'
                  }}
                >
                  Confirm Transfer
                </h3>

                <div
                  style={{
                    background: 'rgba(18, 58, 99, 0.12)',
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 24
                  }}
                >
                  {[
                    [
                      'From',
                      `${selectedAccount?.accountName} (••••${selectedAccount?.accountNumber.slice(-4)})`
                    ],
                    ['To Account', toAccountNumber],
                    ['Beneficiary', toAccountName],
                    [
                      'Amount',
                      new Intl.NumberFormat('en-LK', {
                        style: 'currency',
                        currency: 'LKR'
                      }).format(Number(amount))
                    ],
                    ['Description', description || '—']
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(47, 93, 140, 0.35)',
                        fontSize: 14
                      }}
                    >
                      <span style={{ color: palette.textMuted, fontWeight: 600 }}>
                        {label}
                      </span>
                      <span
                        style={{
                          color: palette.text,
                          fontWeight: 700,
                          textAlign: 'right',
                          maxWidth: '55%',
                          wordBreak: 'break-all'
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    background:
                      'linear-gradient(135deg,rgba(239,68,68,0.06),rgba(239,68,68,0.03))',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontSize: 13,
                    color: '#F87171',
                    marginBottom: 24,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center'
                  }}
                >
                  <UiIcon name="warning" size={18} />
                  <span>
                    Transfers are irreversible. Please verify recipient details
                    before confirming.
                  </span>
                </div>

                <div
                  style={{ display: 'flex', gap: 12, justifyContent: 'center' }}
                >
                  <button
                    className="btn-secondary"
                    onClick={() => setStep('form')}
                    disabled={submitting}
                  >
                    ← Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleTransfer}
                    disabled={submitting}
                    style={{ padding: '14px 40px' }}
                  >
                    {submitting ? 'Processing…' : 'Confirm Transfer'}
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && result && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(74, 222, 128, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    fontSize: 36
                  }}
                >
                  <UiIcon name="check" size={38} />
                </div>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#4ADE80',
                    marginBottom: 8
                  }}
                >
                  Transfer Successful!
                </h3>
                <p style={{ color: palette.textMuted, marginBottom: 24 }}>
                  Your funds have been transferred securely.
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
                    ['Reference', result.referenceNumber],
                    [
                      'Amount',
                      new Intl.NumberFormat('en-LK', {
                        style: 'currency',
                        currency: 'LKR'
                      }).format(result.amount)
                    ],
                    ['To', result.toAccountNumber],
                    [
                      'New Balance',
                      new Intl.NumberFormat('en-LK', {
                        style: 'currency',
                        currency: 'LKR'
                      }).format(result.newBalance)
                    ],
                    ['Date', new Date(result.timestamp).toLocaleString()]
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
                      <span style={{ color: palette.text, fontWeight: 700 }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary"
                  onClick={reset}
                  style={{ padding: '14px 40px' }}
                >
                  New Transfer
                </button>
              </div>
            )}

            {step === 'failed' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(248, 113, 113, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    fontSize: 36,
                    color: '#F87171'
                  }}
                >
                  <UiIcon name="x" size={38} />
                </div>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#F87171',
                    marginBottom: 8
                  }}
                >
                  Transfer Failed
                </h3>
                <p style={{ color: palette.textMuted, marginBottom: 24 }}>
                  Please check the error notification and try again.
                </p>
                <button className="btn-secondary" onClick={reset}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BankTransferPage() {
  return (
    <ToastProvider>
      <BankTransferInner />
    </ToastProvider>
  )
}
