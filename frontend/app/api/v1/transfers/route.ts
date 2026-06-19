import { auth0 } from '@/lib/auth0'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function POST(req: NextRequest) {
  const { token } = await auth0.getAccessToken()
  const body = await req.json()

  const res = await fetch(`${BACKEND}/api/v1/transfers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
