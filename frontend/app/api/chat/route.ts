import { auth0 } from '@/lib/auth0'
import {
  buildSystemPrompt,
  fetchUserBankingContext,
  formatUserContext,
  getCodebaseContext
} from '@/lib/chatContext'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function GET() {
  let token: string | undefined
  try {
    const session = await auth0.getSession()
    if (session) {
      const result = await auth0.getAccessToken()
      token = result.token
    }
  } catch {
    /* unauthenticated */
  }

  const ctx = await fetchUserBankingContext(token)

  return Response.json({
    authenticated: ctx.authenticated,
    name: ctx.profile?.fullName ?? ctx.profile?.email ?? null,
    accountCount: ctx.accounts.length,
    transactionCount: ctx.transactions.length,
    totalBalance: ctx.analytics?.totalBalance ?? null
  })
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'Chat assistant is not configured.' },
      { status: 503 }
    )
  }

  let body: { messages?: ChatMessage[] }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const messages = body.messages?.filter(
    (m) =>
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0
  )

  if (!messages?.length) {
    return Response.json({ error: 'No messages provided.' }, { status: 400 })
  }

  let token: string | undefined
  try {
    const session = await auth0.getSession()
    if (session) {
      const result = await auth0.getAccessToken()
      token = result.token
    }
  } catch {
    /* guest mode */
  }

  const [userCtx, codebaseCtx] = await Promise.all([
    fetchUserBankingContext(token),
    Promise.resolve(getCodebaseContext())
  ])

  const systemPrompt = buildSystemPrompt(
    formatUserContext(userCtx),
    codebaseCtx
  )

  const recent = messages.slice(-12)

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...recent],
      stream: true,
      max_tokens: 1200,
      temperature: 0.45
    })
  })

  if (!groqRes.ok || !groqRes.body) {
    return Response.json(
      { error: 'Assistant is temporarily unavailable.' },
      { status: 502 }
    )
  }

  const reader = groqRes.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ') || line.includes('[DONE]')) continue
            try {
              const json = JSON.parse(line.slice(6)) as {
                choices?: Array<{ delta?: { content?: string } }>
              }
              const chunk = json.choices?.[0]?.delta?.content
              if (chunk) controller.enqueue(encoder.encode(chunk))
            } catch {
              /* skip malformed SSE chunks */
            }
          }
        }
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  })
}
