import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email',
  },
  async onCallback(error, ctx, session) {
    if (error) {
      return new NextResponse(error.message, { status: 500 })
    }

    if (session?.tokenSet.accessToken) {
      try {
        await fetch(`${BACKEND}/api/v1/users/me`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.tokenSet.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: session.user.email,
            fullName: session.user.name,
            picture: session.user.picture,
          }),
        })
      } catch (syncError) {
        console.error('Failed to sync Auth0 user profile', syncError)
      }
    }

    return NextResponse.redirect(new URL(ctx.returnTo || '/dashboard', ctx.appBaseUrl))
  },
})
