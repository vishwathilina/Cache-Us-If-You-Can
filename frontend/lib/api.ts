import { auth0 } from './auth0'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function getAccessToken(): Promise<string> {
  const result = await auth0.getAccessToken()
  if (!result?.token) throw new Error('No access token available')
  return result.token
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    const message = body?.detail ?? body?.message ?? `HTTP ${res.status}`
    throw new ApiError(res.status, message, body)
  }

  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, data: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
}
