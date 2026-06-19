import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function GET(req: NextRequest) {
  const { token } = await auth0.getAccessToken()
  const { searchParams } = new URL(req.url)
  const accountNumber = searchParams.get('accountNumber') ?? ''

  const res = await fetch(
    `${BACKEND}/api/v1/accounts/lookup?accountNumber=${encodeURIComponent(accountNumber)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
