'use client'

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { useEffect, useState } from 'react'
import type { AccountRow, SpendingAnalytics } from '@/lib/chatContext'
import { palette } from '@/lib/palette'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend
)

const CHART_COLORS = [
  palette.navy800,
  palette.navy600,
  palette.navy900,
  '#5A7189',
  palette.periwinkle,
  '#1B7F4E'
]

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: palette.text, font: { size: 12, weight: 600 as const } }
    }
  }
}

interface Props {
  userName: string
  accounts: AccountRow[]
  analytics: SpendingAnalytics
  accountLabels: string[]
  accountBalances: number[]
  monthLabels: string[]
  monthSpend: number[]
  categoryLabels: string[]
  categoryValues: number[]
  flowLabels: string[]
  flowDebits: number[]
  flowCredits: number[]
}

export default function ChartAnalysisClient({
  userName,
  accounts,
  analytics,
  accountLabels,
  accountBalances,
  monthLabels,
  monthSpend,
  categoryLabels,
  categoryValues,
  flowLabels,
  flowDebits,
  flowCredits
}: Props) {
  const [advice, setAdvice] = useState('')
  const [adviceLoading, setAdviceLoading] = useState(true)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(n)

  useEffect(() => {
    let cancelled = false
    setAdviceLoading(true)

    fetch('/api/chart-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName,
        accounts: accounts.map((a) => ({
          name: a.accountName,
          type: a.accountType,
          balance: Number(a.balance)
        })),
        analytics
      })
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { advice?: string }) => {
        if (!cancelled) setAdvice(data.advice ?? '')
      })
      .catch(() => {
        if (!cancelled) {
          setAdvice(
            'Unable to generate AI advice right now. Review your charts above and consider keeping bill payments under 40% of monthly inflows.'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setAdviceLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userName, accounts, analytics])

  const balanceChart = {
    labels: accountLabels.length ? accountLabels : ['No accounts'],
    datasets: [
      {
        data: accountBalances.length ? accountBalances : [1],
        backgroundColor: CHART_COLORS,
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  }

  const spendChart = {
    labels: monthLabels.length ? monthLabels : ['No data'],
    datasets: [
      {
        label: 'Spending (LKR)',
        data: monthSpend.length ? monthSpend : [0],
        backgroundColor: `${palette.navy600}cc`,
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  }

  const categoryChart = {
    labels: categoryLabels.length ? categoryLabels : ['No spending'],
    datasets: [
      {
        data: categoryValues.length ? categoryValues : [1],
        backgroundColor: CHART_COLORS,
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  }

  const flowChart = {
    labels: flowLabels.length ? flowLabels : ['No data'],
    datasets: [
      {
        label: 'Debits',
        data: flowDebits,
        borderColor: palette.navy800,
        backgroundColor: `${palette.navy800}22`,
        fill: true,
        tension: 0.35
      },
      {
        label: 'Credits',
        data: flowCredits,
        borderColor: palette.green,
        backgroundColor: `${palette.green}22`,
        fill: true,
        tension: 0.35
      }
    ]
  }

  return (
    <>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Balance</div>
          <div className="stat-value accent">{fmt(analytics.totalBalance)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">{fmt(analytics.totalDebits)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{fmt(analytics.spendThisMonth)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Accounts</div>
          <div className="stat-value">{accounts.length}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24, alignItems: 'stretch' }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>
            Balance by Account
          </div>
          <div style={{ height: 280 }}>
            <Doughnut
              data={balanceChart}
              options={{
                ...chartDefaults,
                plugins: {
                  ...chartDefaults.plugins,
                  legend: { position: 'bottom' as const }
                }
              }}
            />
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>
            Spending by Category
          </div>
          <div style={{ height: 280 }}>
            <Doughnut
              data={categoryChart}
              options={{
                ...chartDefaults,
                plugins: {
                  ...chartDefaults.plugins,
                  legend: { position: 'bottom' as const }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24, alignItems: 'stretch' }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>
            Monthly Spending
          </div>
          <div style={{ height: 280 }}>
            <Bar
              data={spendChart}
              options={{
                ...chartDefaults,
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: palette.textMuted }
                  },
                  y: {
                    grid: { color: 'rgba(47,93,140,0.12)' },
                    ticks: { color: palette.textMuted }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>
            Cash Flow (Debits vs Credits)
          </div>
          <div style={{ height: 280 }}>
            <Line
              data={flowChart}
              options={{
                ...chartDefaults,
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: palette.textMuted }
                  },
                  y: {
                    grid: { color: 'rgba(47,93,140,0.12)' },
                    ticks: { color: palette.textMuted }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Nova Assist — Personal Advice</div>
            <p
              style={{
                fontSize: 13,
                color: palette.textMuted,
                marginTop: 4,
                marginBottom: 0
              }}
            >
              AI analysis tailored to your accounts and spending patterns
            </p>
          </div>
          {adviceLoading && (
            <span
              style={{
                fontSize: 12,
                color: palette.textSecondary,
                fontWeight: 600
              }}
            >
              Analyzing…
            </span>
          )}
        </div>
        <textarea
          className="chart-advice-box"
          readOnly
          value={
            adviceLoading
              ? 'Reviewing your balances, monthly trends, and category breakdown to prepare personalized guidance…'
              : advice
          }
          rows={8}
          aria-label="AI financial advice"
        />
      </div>
    </>
  )
}
