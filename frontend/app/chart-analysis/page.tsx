import { auth0 } from '@/lib/auth0'
import {
  computeAnalytics,
  fetchUserBankingContext,
  type AccountRow,
  type TransactionRow
} from '@/lib/chatContext'
import ChartAnalysisClient from '@/components/ChartAnalysisClient'
import Sidebar from '@/components/sidebar'
import { ToastProvider } from '@/components/Toast'
import { redirect } from 'next/navigation'

function monthKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric'
  })
}

function buildMonthlySeries(transactions: TransactionRow[]) {
  const debits: Record<string, number> = {}
  const credits: Record<string, number> = {}

  for (const t of transactions) {
    if (t.status !== 'SUCCESS') continue
    const key = monthKey(t.createdAt)
    const amt = Number(t.amount)
    if (t.direction === 'CREDIT') {
      credits[key] = (credits[key] ?? 0) + amt
    } else {
      debits[key] = (debits[key] ?? 0) + amt
    }
  }

  const labels = Array.from(
    new Set([...Object.keys(debits), ...Object.keys(credits)])
  ).sort(
    (a, b) => new Date(`1 ${a}`).getTime() - new Date(`1 ${b}`).getTime()
  )

  return {
    labels: labels.slice(-6),
    debits: labels.slice(-6).map((l) => debits[l] ?? 0),
    credits: labels.slice(-6).map((l) => credits[l] ?? 0)
  }
}

export default async function ChartAnalysisPage() {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login')

  const { token } = await auth0.getAccessToken()
  const ctx = await fetchUserBankingContext(token)

  const accounts: AccountRow[] = ctx.accounts
  const transactions = ctx.transactions
  const analytics = ctx.analytics ?? computeAnalytics(accounts, transactions)

  const monthly = buildMonthlySeries(transactions)
  const categoryEntries = Object.entries(analytics.byCategory).filter(
    ([, v]) => v > 0
  )
  const monthSpendEntries = Object.entries(analytics.byMonth).sort(
    (a, b) =>
      new Date(`1 ${a[0]}`).getTime() - new Date(`1 ${b[0]}`).getTime()
  )

  const userName =
    ctx.profile?.fullName ?? session.user.name ?? session.user.email ?? 'User'

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <header className="page-header">
            <div className="page-title">Chart Analysis</div>
            <div className="header-actions">
              <div className="avatar-btn">
                <img
                  src={session.user.picture ?? '/avatar.png'}
                  alt={userName}
                />
              </div>
            </div>
          </header>

          <div className="page-body">
            <div className="page-intro">
              <h2>Financial analytics</h2>
              <p>
                Visual breakdown of your balances, spending trends, and
                categories — with personalized AI guidance.
              </p>
            </div>

            <ChartAnalysisClient
              userName={userName}
              accounts={accounts}
              analytics={analytics}
              accountLabels={accounts.map((a) => a.accountName)}
              accountBalances={accounts.map((a) => Number(a.balance))}
              monthLabels={monthSpendEntries.slice(-6).map(([m]) => m)}
              monthSpend={monthSpendEntries.slice(-6).map(([, v]) => v)}
              categoryLabels={categoryEntries.map(([l]) => l)}
              categoryValues={categoryEntries.map(([, v]) => v)}
              flowLabels={monthly.labels}
              flowDebits={monthly.debits}
              flowCredits={monthly.credits}
            />
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
