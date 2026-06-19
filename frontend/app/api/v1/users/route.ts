import { auth0 } from '@/lib/auth0'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

/** POST /api/v1/users → syncs Auth0 profile into our DB on first login */
export async function POST() {
  const { token } = await auth0.getAccessToken()
  const res = await fetch(`${BACKEND}/api/v1/users/me`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

/** GET /api/v1/users → returns current user profile including isAdmin flag */
export async function GET(_req: NextRequest) {
  const { token } = await auth0.getAccessToken()
  const res = await fetch(`${BACKEND}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
