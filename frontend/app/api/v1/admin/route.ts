import { auth0 } from '@/lib/auth0'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

/**
 * Proxy for all admin endpoints: /api/v1/admin/stats, /users, /transactions
 * The ?endpoint= query param selects the backend path.
 * The Bearer token is attached automatically from the Auth0 session.
 */
export async function GET(req: NextRequest) {
  const { token } = await auth0.getAccessToken()
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint') ?? 'stats'
  const rest = new URLSearchParams(searchParams)
  rest.delete('endpoint')
  const qs = rest.toString()

  const res = await fetch(
    `${BACKEND}/api/v1/admin/${endpoint}${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
