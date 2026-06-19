import { auth0 } from '@/lib/auth0'
import { NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function GET() {
  const { token } = await auth0.getAccessToken()
  const res = await fetch(`${BACKEND}/api/v1/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
