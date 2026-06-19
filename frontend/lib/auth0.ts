import { Auth0Client } from '@auth0/nextjs-auth0/server'

export const auth0 = new Auth0Client({
  // All configuration is read from environment variables:
  // AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL,
  // AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email',
  },
})
