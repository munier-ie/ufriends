"use client"

// Simple client-side auth utilities for storing JWTs and performing authenticated fetches.

type Tokens = {
  accessToken: string
  refreshToken: string
}

const ACCESS_KEY = "UF_ACCESS_TOKEN"
const REFRESH_KEY = "UF_REFRESH_TOKEN"

export function saveTokens(tokens: Tokens) {
  try {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  } catch {}
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {}
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    const access = data?.tokens?.accessToken as string | undefined
    const refresh = data?.tokens?.refreshToken as string | undefined
    if (!access || !refresh) return false
    saveTokens({ accessToken: access, refreshToken: refresh })
    return true
  } catch {
    return false
  }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {})
  const token = getAccessToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const firstRes = await fetch(input, { ...init, headers })
  if (firstRes.status !== 401) return firstRes

  // Attempt refresh once on 401
  const refreshed = await refreshAccessToken()
  if (!refreshed) {
    // Clear tokens if refresh failed, return original response
    clearTokens()
    return firstRes
  }

  // Retry with new access token
  const retryHeaders = new Headers(init?.headers || {})
  const newToken = getAccessToken()
  if (newToken) retryHeaders.set("Authorization", `Bearer ${newToken}`)
  return fetch(input, { ...init, headers: retryHeaders })
}