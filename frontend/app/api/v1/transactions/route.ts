import { auth0 } from '@/lib/auth0'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function GET(req: NextRequest) {
  const { token } = await auth0.getAccessToken()
  const { searchParams } = new URL(req.url)
  const qs = searchParams.toString()

  const res = await fetch(`${BACKEND}/api/v1/transactions${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
