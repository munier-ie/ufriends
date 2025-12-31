"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"
import { authFetch } from "@/lib/client-auth"

type CatalogItem = {
  id: number
  category: string
  subservice: string
  variant: string
}

type PricingInfo = {
  basePrice: number
  userPrice: number
  marketerPrice: number
}

export default function AdminPricingPage() {
  const { toast } = useToast()
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [category, setCategory] = useState("")
  const [subservice, setSubservice] = useState("")
  const [variant, setVariant] = useState("")

  const [pricing, setPricing] = useState<PricingInfo | null>(null)
  const [form, setForm] = useState<PricingInfo>({ basePrice: 0, userPrice: 0, marketerPrice: 0 })

  // Dynamic parameter builder state
  const [paramOptions, setParamOptions] = useState<Record<string, string[]>>({})
  const [params, setParams] = useState<Record<string, string | number>>({})
  const [paramRows, setParamRows] = useState<Array<{ key: string; value: string }>>([])
  const [newParamKey, setNewParamKey] = useState("")
  const [newParamValue, setNewParamValue] = useState("")

  // Known parameter options per service to assist admins even if DB has no entries yet
  const KNOWN_PARAM_OPTIONS: Record<string, Record<string, string[]>> = {
    // Airtime services
    "airtime.vtu": { network: ["mtn", "airtel", "glo", "9mobile"] },
    "airtime.airtime-2-cash": { network: ["mtn", "airtel", "glo", "9mobile"] },
    "airtime.share-n-sell": { network: ["mtn", "airtel", "glo", "9mobile"] },
    // Data services
    "data.sme": {
      network: ["mtn", "airtel", "glo", "9mobile"],
      size: ["500mb", "1gb", "2gb", "3gb", "4gb", "5gb", "10gb"],
    },
    "data.gift": {
      network: ["mtn", "airtel", "glo", "9mobile"],
      size: ["500mb", "1gb", "2gb", "3gb", "4gb", "5gb", "10gb"],
    },
    // Corporate data plans
    "data.corporate": {
      network: ["mtn", "airtel", "glo", "9mobile"],
      size: ["1gb", "2gb", "3gb", "4gb", "5gb", "10gb", "25gb", "50gb"],
    },
    // BVN retrieval
    "bvn.retrieval": { method: ["phone", "bank"] },
    // Verification services with slip type variants (kept here for potential param usage)
    "voters-card.basic": { slipType: ["basic", "full"] },
    "voters-card.full": { slipType: ["basic", "full"] },
    "tin.basic": { slipType: ["basic", "certificate"] },
    "tin.certificate": { slipType: ["basic", "certificate"] },
    // NIN services
    "nin.slip": { slipType: ["standard", "premium", "regular"] },
    "nin.advanced": { slipType: ["basic", "standard", "regular", "premium"] },
    // CAC services
    // Certificate retrieval (info) and Status report vary by company type
    "cac.info": { companyType: ["RC", "BN", "IT"] },
    "cac.status": { companyType: ["RC", "BN", "IT"] },
    // Synonyms used in catalog: Retrieval (certificate) and Status Report
    "cac.retrieval": { companyType: ["RC", "BN", "IT"] },
    "cac.status report": { companyType: ["RC", "BN", "IT"] },
    "cac.status-report": { companyType: ["RC", "BN", "IT"] },
    // Electricity bills (provider is typically selected as variant)
    "bills.electricity": { serviceProvider: ["ikeja", "eko", "abuja", "ibadan", "enugu", "portharcourt", "jos", "kano"] },
    // Education services (variant equals serviceType, but provide hints for params)
    "education.waec": { serviceType: ["waec-pin", "gce-registration-pin"] },
    "education.neco": { serviceType: ["neco-pin", "gce-registration-pin"] },
    "education.nabteb": { serviceType: ["nabteb-pin", "gce-registration-pin"] },
    // NBAIS uses per-variant pricing; expose common variant slugs for clarity
    "education.nbais": { serviceType: ["nbais-pin", "gce-registration-pin"] },
    // JAMB uses variant-specific pricing; list common request slugs
    "education.jamb": { serviceType: [
      "profile-code",
      "print-admission-letter",
      "original-result",
      "olevel-upload",
      "check-admission-status",
      "acceptance"
    ] },
    "education.nysc": { requestType: ["verification", "reprint", "call-up-letter", "certificate-retrieval"] },
  }

  const normalizedKey = (cat: string, sub: string, v: string) => {
    const c = (cat || "").trim().toLowerCase()
    const s = (sub || "").trim().toLowerCase()
    const vi = (v || "").trim().toLowerCase()
    return vi ? `${c}.${s}.${vi}` : `${c}.${s}`
  }

  // Load service catalog
  useEffect(() => {
    let active = true
    setLoading(true)
    authFetch("/api/service-catalog")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load catalog")
        const items = (await res.json()) as CatalogItem[]
        if (active) setCatalog(items)
      })
      .catch((err) => {
        toast({ title: "Error", description: String(err), variant: "destructive" })
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [toast])

  // Derived dropdown options
  const categoryOptions = useMemo(() => Array.from(new Set(catalog.map((c) => c.category))), [catalog])
  // Include fallback categories/subservices so admins can price Data services even if not seeded in ServiceCatalog yet
  const FALLBACK_CATEGORIES = ["data"]
  const FALLBACK_SUBSERVICES: Record<string, string[]> = {
    data: ["sme", "corporate", "gift"],
  }

  const mergedCategoryOptions = useMemo(() => {
    const fromCatalog = Array.from(new Set(catalog.map((c) => c.category)))
    const merged = Array.from(new Set([...fromCatalog, ...FALLBACK_CATEGORIES]))
    return merged
  }, [catalog])

  const subserviceOptions = useMemo(() => {
    const fromCatalog = Array.from(new Set(catalog.filter((c) => c.category === category).map((c) => c.subservice)))
    const fallbacks = FALLBACK_SUBSERVICES[category] || []
    const merged = Array.from(new Set([...fromCatalog, ...fallbacks]))
    return merged
  }, [catalog, category])
  const variantOptions = useMemo(
    () =>
      Array.from(
        new Set(
          catalog
            .filter((c) => c.category === category && c.subservice === subservice)
            .map((c) => (c.variant && c.variant.trim() ? c.variant.trim() : "__NONE__"))
        )
      ),
    [catalog, category, subservice]
  )

  // Reset dependent selects
  useEffect(() => {
    setSubservice("")
    setVariant("")
    setPricing(null)
    setParamOptions({})
    setParams({})
    setParamRows([])
  }, [category])
  useEffect(() => {
    setVariant("")
    setPricing(null)
    setParamOptions({})
    setParams({})
    setParamRows([])
  }, [subservice])

  // Load existing pricing when selection changes
  // Fetch parameter options and pricing when selection changes
  useEffect(() => {
    const canFetch = category && subservice
    if (!canFetch) return
    const v = variant || ""

    // Merge known parameter options for the current service selection
    const keyWithVariant = normalizedKey(category, subservice, v)
    const keyNoVariant = normalizedKey(category, subservice, "")
    const knownFromVariant = KNOWN_PARAM_OPTIONS[keyWithVariant] || {}
    const knownFromBase = KNOWN_PARAM_OPTIONS[keyNoVariant] || {}
    const mergedKnown: Record<string, string[]> = {}
    for (const [k, arr] of Object.entries({ ...knownFromBase, ...knownFromVariant })) {
      const uniq = Array.from(new Set((arr || []).map((x) => String(x).toLowerCase())))
      mergedKnown[k] = uniq
    }

    // Fetch discovered parameter options
    authFetch(`/api/pricing/parameters?category=${encodeURIComponent(category)}&subservice=${encodeURIComponent(subservice)}&variant=${encodeURIComponent(v)}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok || data.error) return
        const options: Record<string, string[]> = data.options || {}
        // Merge known + discovered options
        const merged: Record<string, string[]> = {}
        const allKeys = new Set<string>([
          ...Object.keys(mergedKnown),
          ...Object.keys(options || {}),
        ])
        for (const k of allKeys.values()) {
          const vals = [
            ...(mergedKnown[k] || []),
            ...((options && options[k]) || []),
          ]
          const uniq = Array.from(new Set(vals.map((x) => String(x).toLowerCase()))).sort()
          if (uniq.length) merged[k] = uniq
        }
        setParamOptions(merged)
        // Initialize rows if empty using merged keys
        if (!paramRows.length) {
          const initialRows = Object.keys(merged).map((k) => ({ key: k, value: "" }))
          setParamRows(initialRows)
        }
      })
      .catch(() => {})

    // Build query with params
    const qp = new URLSearchParams({
      category,
      subservice,
      variant: v,
      role: "user",
    })
    // include current params
    Object.entries(params).forEach(([k, val]) => qp.append(k, String(val)))

    authFetch(`/api/pricing?${qp.toString()}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok || data.error) {
          setPricing(null)
          setForm({ basePrice: 0, userPrice: 0, marketerPrice: 0 })
          return
        }
        const info: PricingInfo = {
          basePrice: Number(data.pricing?.basePrice ?? 0),
          userPrice: Number(data.pricing?.userPrice ?? 0),
          marketerPrice: Number(data.pricing?.marketerPrice ?? 0),
        }
        setPricing(info)
        setForm(info)
      })
      .catch(() => {
        setPricing(null)
        setForm({ basePrice: 0, userPrice: 0, marketerPrice: 0 })
      })
  }, [category, subservice, variant, params, paramRows.length])

  const userMargin = useMemo(() => {
    if (!form.basePrice) return 0
    return Number((((form.userPrice - form.basePrice) / form.basePrice) * 100).toFixed(2))
  }, [form])
  const marketerMargin = useMemo(() => {
    if (!form.basePrice) return 0
    return Number((((form.marketerPrice - form.basePrice) / form.basePrice) * 100).toFixed(2))
  }, [form])

  const handleSave = async () => {
    if (!category || !subservice) {
      toast({ title: "Select a catalog entry", description: "Choose category, subservice, and variant.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await authFetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subservice,
          variant: variant || "",
          basePrice: Number(form.basePrice),
          userPrice: Number(form.userPrice),
          marketerPrice: Number(form.marketerPrice),
          parameters: Object.fromEntries(
            paramRows
              .map((r) => [r.key.trim(), r.value])
              .filter(([k, v]) => !!k && v !== undefined && String(v).length > 0)
          ),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to save pricing")
      }
      toast({ title: "Pricing saved", description: "Catalog pricing updated successfully." })
      setPricing({ ...form })
    } catch (err) {
      toast({ title: "Save failed", description: String(err), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Pricing & Profit Manager</CardTitle>
          <Button variant="outline" size="sm" onClick={() => {
            // reload catalog
            setLoading(true)
            authFetch("/api/service-catalog")
              .then(async (res) => setCatalog(await res.json()))
              .finally(() => setLoading(false))
          }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reload
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {mergedCategoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subservice</Label>
              <Select value={subservice} onValueChange={(v) => setSubservice(v)} disabled={!category}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select subservice" />
                </SelectTrigger>
                <SelectContent>
                  {subserviceOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Variant</Label>
              <Select value={variant} onValueChange={(v) => setVariant(v === "__NONE__" ? "" : v)} disabled={!subservice}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Optional variant" />
                </SelectTrigger>
                <SelectContent>
                  {variantOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt === "__NONE__" ? "—" : opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dynamic Parameter Builder */}
          <div className="space-y-3">
            <Label>Parameters</Label>
            <div className="space-y-2">
              {paramRows.map((row, idx) => {
                const options = row.key && paramOptions[row.key] ? paramOptions[row.key] : []
                return (
                  <div key={`${row.key}-${idx}`} className="grid gap-2 md:grid-cols-3 items-center">
                    <Input
                      placeholder="Parameter name (e.g., network)"
                      value={row.key}
                      onChange={(e) => {
                        const next = [...paramRows]
                        next[idx] = { ...row, key: e.target.value }
                        setParamRows(next)
                      }}
                    />
                    {options && options.length > 0 ? (
                      <Select
                        value={row.value}
                        onValueChange={(v) => {
                          const next = [...paramRows]
                          next[idx] = { ...row, value: v }
                          setParamRows(next)
                          setParams((p) => ({ ...p, [row.key]: v }))
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Value (e.g., MTN)"
                        value={row.value}
                        onChange={(e) => {
                          const v = e.target.value
                          const next = [...paramRows]
                          next[idx] = { ...row, value: v }
                          setParamRows(next)
                          if (row.key) setParams((p) => ({ ...p, [row.key]: v }))
                        }}
                      />
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const next = [...paramRows]
                        const removed = next.splice(idx, 1)
                        setParamRows(next)
                        setParams((p) => {
                          const copy = { ...p }
                          if (removed[0]?.key) delete (copy as any)[removed[0].key]
                          return copy
                        })
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )
              })}
              <div className="grid gap-2 md:grid-cols-3 items-center">
                <Input placeholder="New parameter name" value={newParamKey} onChange={(e) => setNewParamKey(e.target.value)} />
                <Input placeholder="New parameter value" value={newParamValue} onChange={(e) => setNewParamValue(e.target.value)} />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const k = newParamKey.trim()
                    const v = newParamValue
                    if (!k) return
                    setParamRows((rows) => [...rows, { key: k, value: v }])
                    setParams((p) => ({ ...p, [k]: v }))
                    setNewParamKey("")
                    setNewParamValue("")
                  }}
                  disabled={!newParamKey.trim()}
                >
                  Add Parameter
                </Button>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><Badge variant="secondary">Base</Badge></TableCell>
                <TableCell>
                  <Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} />
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge>User</Badge></TableCell>
                <TableCell>
                  <Input type="number" value={form.userPrice} onChange={(e) => setForm({ ...form, userPrice: Number(e.target.value) })} />
                </TableCell>
                <TableCell className={userMargin >= 0 ? "text-green-600" : "text-red-600"}>{userMargin}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge>Marketer</Badge></TableCell>
                <TableCell>
                  <Input type="number" value={form.marketerPrice} onChange={(e) => setForm({ ...form, marketerPrice: Number(e.target.value) })} />
                </TableCell>
                <TableCell className={marketerMargin >= 0 ? "text-green-600" : "text-red-600"}>{marketerMargin}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving || !category || !subservice}>
              {saving ? "Saving..." : "Save Pricing"}
            </Button>
            {pricing && (
              <span className="text-sm text-muted-foreground self-center">Last saved: Base ₦{pricing.basePrice} • User ₦{pricing.userPrice} • Marketer ₦{pricing.marketerPrice}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}