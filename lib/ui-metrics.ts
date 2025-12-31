type MetricEntry = {
  path: string
  ok: boolean
  status: number
  durationMs: number
  timestamp: number
}

const KEY = "ufriends_ui_metrics"

export function recordUIMetric(entry: MetricEntry) {
  try {
    const arr: MetricEntry[] = JSON.parse(localStorage.getItem(KEY) || "[]")
    arr.push(entry)
    // Keep last 500 entries to avoid uncontrolled growth
    const trimmed = arr.slice(Math.max(0, arr.length - 500))
    localStorage.setItem(KEY, JSON.stringify(trimmed))
  } catch {}
}

export function getUIMetrics() {
  try {
    const arr: MetricEntry[] = JSON.parse(localStorage.getItem(KEY) || "[]")
    return arr
  } catch {
    return []
  }
}

export async function timedAuthFetch(path: string, init: RequestInit = {}) {
  const start = performance.now()
  const res = await (await import("./client-auth")).authFetch(path, init)
  const durationMs = performance.now() - start
  recordUIMetric({ path, ok: res.ok, status: res.status, durationMs, timestamp: Date.now() })
  return res
}