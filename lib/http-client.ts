type RetryOptions = {
  retries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  timeoutMs?: number
  retryOnStatuses?: number[]
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    promise
      .then((val) => {
        clearTimeout(timer)
        resolve(val)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchJsonWithRetry(input: RequestInfo | URL, init: RequestInit = {}, opts: RetryOptions = {}) {
  const {
    retries = 3,
    baseDelayMs = 300,
    maxDelayMs = 3000,
    timeoutMs = 8000,
    retryOnStatuses = [408, 429, 500, 502, 503, 504],
  } = opts

  let attempt = 0
  let lastError: any
  while (attempt <= retries) {
    try {
      const res = await withTimeout(fetch(input, init), timeoutMs)
      let data: any = null
      try {
        data = await res.json()
      } catch {
        data = null
      }
      if (!res.ok && retryOnStatuses.includes(res.status) && attempt < retries) {
        const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt))
        await sleep(delay)
        attempt++
        continue
      }
      return { res, data }
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt))
        await sleep(delay)
        attempt++
        continue
      }
      throw err
    }
  }
  throw lastError
}

export function buildAuthHeaders(apiKey?: string, extra?: Record<string, string>) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra || {}),
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
    headers['x-api-key'] = apiKey
  }
  return headers
}