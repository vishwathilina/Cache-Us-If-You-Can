import fs from 'fs'
import path from 'path'

const MAX_CODE_CHARS = 14_000

function repoRoot(): string {
  const cwd = process.cwd()
  if (fs.existsSync(path.join(cwd, 'docs'))) return cwd
  const parent = path.join(cwd, '..')
  if (fs.existsSync(path.join(parent, 'docs'))) return parent
  return cwd
}

function readExcerpt(relativePath: string, maxLines = 120): string {
  const full = path.join(repoRoot(), relativePath)
  if (!fs.existsSync(full)) return `[${relativePath} not found]`
  const lines = fs.readFileSync(full, 'utf8').split('\n').slice(0, maxLines)
  return lines.join('\n')
}

let cachedCodebase: string | null = null

/** Cached codebase + architecture context for the assistant. */
export function getCodebaseContext(): string {
  if (cachedCodebase) return cachedCodebase

  const sections = [
    '=== docs/report.md (excerpt) ===',
    readExcerpt('docs/report.md', 180),
    '\n=== docs/diagram-context.md (excerpt) ===',
    readExcerpt('docs/diagram-context.md', 200),
    '\n=== TransferService.java ===',
    readExcerpt(
      'backend/src/main/java/com/novabank/service/TransferService.java',
      100
    ),
    '\n=== BillPaymentService.java ===',
    readExcerpt(
      'backend/src/main/java/com/novabank/service/BillPaymentService.java',
      80
    ),
    '\n=== AccountService.java (ownership) ===',
    readExcerpt(
      'backend/src/main/java/com/novabank/service/AccountService.java',
      80
    ),
    '\n=== SecurityConfig.java ===',
    readExcerpt(
      'backend/src/main/java/com/novabank/config/SecurityConfig.java',
      95
    ),
    '\n=== smart-spend/page.tsx (analytics) ===',
    readExcerpt('frontend/app/smart-spend/page.tsx', 120),
    '\n=== ChatAssistant + API routes ===',
    readExcerpt('frontend/app/api/chat/route.ts', 80),
    readExcerpt('frontend/components/ChatAssistant.tsx', 80)
  ]

  cachedCodebase = sections.join('\n').slice(0, MAX_CODE_CHARS)
  return cachedCodebase
}

export interface UserProfile {
  id?: number
  email?: string
  fullName?: string
  isAdmin?: boolean
}

export interface AccountRow {
  id: number
  accountNumber: string
  accountName: string
  accountType: string
  balance: number
}

export interface TransactionRow {
  id: number
  fromAccountNumber: string | null
  toAccountNumber: string | null
  amount: number
  description: string
  referenceNumber: string
  status: string
  direction: string | null
  createdAt: string
}

export interface UserBankingContext {
  authenticated: boolean
  profile: UserProfile | null
  accounts: AccountRow[]
  transactions: TransactionRow[]
  analytics: SpendingAnalytics | null
}

export interface SpendingAnalytics {
  totalBalance: number
  totalDebits: number
  totalCredits: number
  spendThisMonth: number
  successfulDebitCount: number
  byMonth: Record<string, number>
  byCategory: Record<string, number>
}

const CATEGORY_RULES: Array<{ label: string; keywords: string[] }> = [
  { label: 'Utilities', keywords: ['water', 'electricity', 'ceb', 'gas', 'utility'] },
  { label: 'Telecom', keywords: ['dialog', 'mobitel', 'slt', 'phone', 'telecom'] },
  {
    label: 'Transfers',
    keywords: ['transfer', 'payment', 'loan', 'salary']
  },
  { label: 'Other', keywords: [] }
]

function maskAccountNumber(num: string | null): string {
  if (!num) return '—'
  if (num.length <= 4) return num
  return `••••${num.slice(-4)}`
}

function categorize(description: string): string {
  const lower = description.toLowerCase()
  for (const cat of CATEGORY_RULES) {
    if (cat.keywords.some((k) => lower.includes(k))) return cat.label
  }
  return 'Other'
}

export function computeAnalytics(
  accounts: AccountRow[],
  transactions: TransactionRow[]
): SpendingAnalytics {
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0)

  const debits = transactions.filter(
    (t) => t.status === 'SUCCESS' && t.direction !== 'CREDIT'
  )
  const credits = transactions.filter(
    (t) => t.status === 'SUCCESS' && t.direction === 'CREDIT'
  )

  const now = new Date()
  const monthKey = now.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric'
  })

  const byMonth: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  let spendThisMonth = 0

  for (const t of debits) {
    const amt = Number(t.amount)
    const m = new Date(t.createdAt).toLocaleDateString('en-GB', {
      month: 'short',
      year: 'numeric'
    })
    byMonth[m] = (byMonth[m] ?? 0) + amt
    if (m === monthKey) spendThisMonth += amt

    const cat = categorize(t.description ?? '')
    byCategory[cat] = (byCategory[cat] ?? 0) + amt
  }

  return {
    totalBalance,
    totalDebits: debits.reduce((s, t) => s + Number(t.amount), 0),
    totalCredits: credits.reduce((s, t) => s + Number(t.amount), 0),
    spendThisMonth,
    successfulDebitCount: debits.length,
    byMonth,
    byCategory
  }
}

export function formatUserContext(ctx: UserBankingContext): string {
  if (!ctx.authenticated) {
    return 'USER STATUS: Not signed in. No account data available. Answer using codebase knowledge and general Nova Bank guidance only.'
  }

  const name = ctx.profile?.fullName ?? ctx.profile?.email ?? 'User'
  const lines: string[] = [
    `USER STATUS: Signed in as ${name}${ctx.profile?.isAdmin ? ' (admin)' : ''}.`,
    `ACCOUNTS (${ctx.accounts.length}):`
  ]

  if (ctx.accounts.length === 0) {
    lines.push('- No accounts linked yet. User can claim one via My Accounts (ACC-xxxxxxxxxx).')
  } else {
    for (const a of ctx.accounts) {
      lines.push(
        `- ${a.accountName} (${a.accountType}): balance LKR ${Number(a.balance).toLocaleString('en-LK')} · ${maskAccountNumber(a.accountNumber)} · id=${a.id}`
      )
    }
  }

  lines.push(`RECENT TRANSACTIONS (last ${ctx.transactions.length}):`)
  if (ctx.transactions.length === 0) {
    lines.push('- None recorded yet.')
  } else {
    for (const t of ctx.transactions.slice(0, 25)) {
      lines.push(
        `- ${t.createdAt.slice(0, 10)} | ${t.direction ?? 'DEBIT'} | LKR ${Number(t.amount).toLocaleString('en-LK')} | ${t.status} | ${t.description} | ref ${t.referenceNumber} | from ${maskAccountNumber(t.fromAccountNumber)} → ${maskAccountNumber(t.toAccountNumber)}`
      )
    }
  }

  if (ctx.analytics) {
    const a = ctx.analytics
    lines.push('SPENDING ANALYTICS (computed from user transactions):')
    lines.push(`- Total balance across accounts: LKR ${a.totalBalance.toLocaleString('en-LK')}`)
    lines.push(`- Total debits (successful): LKR ${a.totalDebits.toLocaleString('en-LK')}`)
    lines.push(`- Total credits (successful): LKR ${a.totalCredits.toLocaleString('en-LK')}`)
    lines.push(`- Spend this month: LKR ${a.spendThisMonth.toLocaleString('en-LK')}`)
    lines.push(`- Debit transaction count: ${a.successfulDebitCount}`)
    lines.push(
      `- By month: ${Object.entries(a.byMonth)
        .map(([m, v]) => `${m}=LKR ${v.toLocaleString('en-LK')}`)
        .join(', ') || 'none'}`
    )
    lines.push(
      `- By category: ${Object.entries(a.byCategory)
        .map(([c, v]) => `${c}=LKR ${v.toLocaleString('en-LK')}`)
        .join(', ') || 'none'}`
    )
  }

  return lines.join('\n')
}

const BACKEND = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function fetchUserBankingContext(
  token: string | undefined
): Promise<UserBankingContext> {
  if (!token) {
    return {
      authenticated: false,
      profile: null,
      accounts: [],
      transactions: [],
      analytics: null
    }
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  }

  try {
    const [profileRes, accountsRes, txRes] = await Promise.all([
      fetch(`${BACKEND()}/api/v1/users/me`, { headers, cache: 'no-store' }),
      fetch(`${BACKEND()}/api/v1/accounts`, { headers, cache: 'no-store' }),
      fetch(
        `${BACKEND()}/api/v1/transactions?size=50&sort=createdAt,desc`,
        { headers, cache: 'no-store' }
      )
    ])

    const profile = profileRes.ok
      ? ((await profileRes.json()) as UserProfile)
      : null
    const accounts = accountsRes.ok
      ? ((await accountsRes.json()) as AccountRow[])
      : []
    const txPage = txRes.ok
      ? ((await txRes.json()) as { content?: TransactionRow[] })
      : { content: [] }
    const transactions = txPage.content ?? []

    const analytics =
      accounts.length > 0 || transactions.length > 0
        ? computeAnalytics(accounts, transactions)
        : null

    return {
      authenticated: true,
      profile,
      accounts,
      transactions,
      analytics
    }
  } catch {
    return {
      authenticated: false,
      profile: null,
      accounts: [],
      transactions: [],
      analytics: null
    }
  }
}

export function buildSystemPrompt(
  userContextBlock: string,
  codebaseBlock: string
): string {
  return `You are Nova Assist, the AI assistant for Nova Bank.

You have TWO knowledge sources injected below — use both when answering:
1. LIVE USER DATA — real account balances, transactions, and spending analytics for the signed-in user.
2. CODEBASE — architecture, services, security model, and Smart Spend logic from the Nova Bank source code.

When the user asks about their finances, analyze the LIVE USER DATA. Quote exact LKR amounts and trends.
When they ask how something works technically, explain using the CODEBASE.
You may combine both (e.g. "your Smart Spend page groups debits like this… and your Utilities spend is LKR X").

Guidelines:
- Be concise, friendly, and professional.
- Never ask for passwords, PINs, or Auth0 secrets.
- Account numbers in context are partially masked; refer to them by last 4 digits or account name.
- Currency is LKR unless stated otherwise.
- If not signed in, explain they need to log in for personalized analysis.
- Do not invent data not present in the context blocks.

--- LIVE USER DATA ---
${userContextBlock}

--- CODEBASE & ARCHITECTURE ---
${codebaseBlock}`
}
