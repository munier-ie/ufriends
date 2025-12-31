"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { authFetch } from "@/lib/client-auth"

type Role = "user" | "marketer"

export interface DynamicPricingResult {
  price: number | null
  isLoading: boolean
  error: string | null
  reference?: string
  submitService: (formData: Record<string, any>) => Promise<{
    ok: boolean
    reference?: string
    message?: string
    data?: any
    error?: string
  }>
}

function detectRoleFromUser(user: any): Role {
  try {
    const roleStr = String(user?.role || "").toLowerCase()
    const roles: string[] = Array.isArray(user?.roles) ? user.roles.map((r: any) => String(r).toLowerCase()) : []
    const isMarketer = roleStr.includes("marketer") || roles.includes("marketer") || user?.isMarketer === true
    return isMarketer ? "marketer" : "user"
  } catch {
    return "user"
  }
}

async function detectRoleFallback(): Promise<Role> {
  try {
    const res = await fetch("/api/me")
    if (!res.ok) return "user"
    const data = await res.json().catch(() => null)
    return detectRoleFromUser(data?.user || data)
  } catch {
    return "user"
  }
}

function mapVerificationAction(category: string, subservice: string): string | null {
  const c = category.trim().toLowerCase()
  const s = subservice.trim().toLowerCase()
  if (c === "nin") {
    if (s === "slip") return "nin.slip"
    if (s === "printout") return "nin.printout"
    if (s === "advanced" || s === "verification") return "nin.advanced"
  }
  if (c === "bvn") {
    if (s === "printout") return "bvn.printout"
    if (s === "retrieval" || s === "retrieval_phone") return "bvn.retrieval_phone"
    if (s === "advanced" || s === "verification") return "bvn.advanced"
  }
  if (c === "cac") {
    if (s === "info") return "cac.info"
    if (s === "status") return "cac.status"
  }
  if (c === "passport") {
    if (s === "verify" || s === "verification" || s === "basic") return "passport.verify"
  }
  if (c === "phone") {
    // Use advanced route for richer details
    if (s === "advanced" || s === "verification" || s === "basic") return "phone.verify_advanced"
  }
  if (c === "driver-license" || c === "drivers_license") {
    if (s === "basic" || s === "verification") return "drivers_license.verify"
  }
  if (c === "voters-card" || c === "voters") {
    if (s === "basic" || s === "full" || s === "verification") return "voters.verify"
  }
  if (c === "plate-number" || c === "plate") {
    if (s === "basic" || s === "verification") return "plate.verify"
  }
  if (c === "tin") {
    if (s === "basic" || s === "certificate" || s === "verification") return "tin.verify"
  }
  // Extend with other verification categories as needed
  return null
}

export function useDynamicPricing(
  category: string,
  subservice: string,
  variant: string,
  params?: Record<string, string | number | boolean>,
  user?: any,
): DynamicPricingResult {
  const [role, setRole] = useState<Role>(() => detectRoleFromUser(user))
  const [price, setPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | undefined>(undefined)

  const normalized = useMemo(() => ({
    category: String(category || "").trim(),
    subservice: String(subservice || "").trim(),
    variant: String(variant || "").trim(),
  }), [category, subservice, variant])

  // Stable key for params to avoid effect loops caused by object identity changes
  const paramsKey = useMemo(() => {
    if (!params || typeof params !== "object") return ""
    const entries = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
    if (!entries.length) return ""
    entries.sort(([a], [b]) => a.localeCompare(b))
    return entries.map(([k, v]) => `${k}=${String(v)}`).join("|")
  }, [params])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Resolve role if not determinable from provided user
        const r = user ? detectRoleFromUser(user) : await detectRoleFallback()
        if (!cancelled) setRole(r)

        // Fetch dynamic price
        const qpEntries: Array<[string, string]> = [
          ["category", normalized.category],
          ["subservice", normalized.subservice],
          ["variant", normalized.variant],
          ["role", r],
        ]
        if (params && typeof params === "object") {
          const dyn = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
          dyn.sort(([a], [b]) => a.localeCompare(b))
          for (const [k, v] of dyn) qpEntries.push([k, String(v)])
        }
        const qs = new URLSearchParams(qpEntries)
        const res = await fetch(`/api/pricing?${qs.toString()}`, { cache: "no-store" })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(String(data?.error || "Failed to load pricing"))
        }
        const p = data?.price
        setPrice(typeof p === "number" ? p : null)
      } catch (err: any) {
        setError(err?.message || "Failed to fetch pricing")
        setPrice(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [normalized.category, normalized.subservice, normalized.variant, paramsKey, user])

  const submitService = useCallback(async (formData: Record<string, any>) => {
    try {
      const body = {
        amount: Number(formData.amount),
        idempotencyKey: typeof formData.idempotencyKey === "string" ? formData.idempotencyKey : undefined,
        params: { ...(formData || {}) },
        subServiceId: normalized.variant || undefined,
        action: mapVerificationAction(normalized.category, normalized.subservice) || undefined,
        pin: formData.pin,
      }
      const res = await authFetch(`/api/service/${encodeURIComponent(normalized.category)}/${encodeURIComponent(normalized.subservice)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        return { ok: false, error: String(data?.error || `Service failed (${res.status})`), message: String(data?.message || "Failed"), data }
      }
      setReference(String(data?.reference || ""))
      return { ok: true, reference: String(data?.reference || ""), message: String(data?.message || ""), data }
    } catch (err: any) {
      return { ok: false, error: String(err?.message || err) }
    }
  }, [normalized.category, normalized.subservice, normalized.variant])

  return { price, isLoading, error, reference, submitService }
}

export default useDynamicPricing