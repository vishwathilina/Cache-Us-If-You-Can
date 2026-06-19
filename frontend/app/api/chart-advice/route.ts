import { auth0 } from '@/lib/auth0'
import { formatUserContext, fetchUserBankingContext } from '@/lib/chatContext'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

interface AdviceBody {
  userName?: string
  accounts?: Array<{ name: string; type: string; balance: number }>
  analytics?: {
    totalBalance: number
    totalDebits: number
    totalCredits: number
    spendThisMonth: number
    byMonth: Record<string, number>
    byCategory: Record<string, number>
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Not configured' }, { status: 503 })
  }

  let body: AdviceBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  let token: string | undefined
  try {
    const session = await auth0.getSession()
    if (session) {
      const result = await auth0.getAccessToken()
      token = result.token
    }
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await fetchUserBankingContext(token)
  if (!ctx.authenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userBlock = formatUserContext(ctx)
  const name = body.userName ?? ctx.profile?.fullName ?? 'Customer'

  const prompt = `You are Nova Assist, a financial advisor for Nova Bank customers in Sri Lanka (LKR).

Write personalized advice for ${name} based on their live data below. Structure as 3-4 short paragraphs covering:
1. Overall financial health (balance vs spending)
2. Notable trends in monthly spending or cash flow
3. Category-specific observations (utilities, telecom, transfers, etc.)
4. 2-3 concrete, actionable recommendations (savings, bill timing, transfer habits)

Tone: supportive, clear, professional. No markdown headers or bullet symbols — plain prose only.
Do not invent numbers; use only data provided.

${userBlock}`

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 900,
      temperature: 0.5
    })
  })

  if (!groqRes.ok) {
    return Response.json({ error: 'Assistant unavailable' }, { status: 502 })
  }

  const data = (await groqRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const advice =
    data.choices?.[0]?.message?.content?.trim() ??
    'Review your spending charts and maintain a buffer equal to at least one month of typical debits.'

  return Response.json({ advice })
}
