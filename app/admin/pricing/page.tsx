"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, Search, Edit, ArrowUp, Filter } from "lucide-react"
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

type CatalogPricingEntry = {
  id: number
  category: string
  subservice: string
  variant: string
  basePrice: number
  userPrice: number
  marketerPrice: number
  parameters: any
  updatedAt: string
}

export default function AdminPricingPage() {
  const { toast } = useToast()

  // Form State
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

  // List View State
  const [allPrices, setAllPrices] = useState<CatalogPricingEntry[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

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
    "cac.info": { companyType: ["RC", "BN", "IT"] },
    "cac.status": { companyType: ["RC", "BN", "IT"] },
    "cac.retrieval": { companyType: ["RC", "BN", "IT"] },
    "cac.status report": { companyType: ["RC", "BN", "IT"] },
    "cac.status-report": { companyType: ["RC", "BN", "IT"] },
    // Electricity bills (provider is typically selected as variant)
    "bills.electricity": { serviceProvider: ["ikeja", "eko", "abuja", "ibadan", "enugu", "portharcourt", "jos", "kano"] },
    // Education services (variant equals serviceType, but provide hints for params)
    "education.waec": { serviceType: ["waec-pin", "gce-registration-pin"] },
    "education.neco": { serviceType: ["neco-pin", "gce-registration-pin"] },
    "education.nabteb": { serviceType: ["nabteb-pin", "gce-registration-pin"] },
    "education.nbais": { serviceType: ["nbais-pin", "gce-registration-pin"] },
    "education.jamb": {
      serviceType: [
        "profile-code",
        "print-admission-letter",
        "original-result",
        "olevel-upload",
        "check-admission-status",
        "acceptance"
      ]
    },
    "education.nysc": { requestType: ["verification", "reprint", "call-up-letter", "certificate-retrieval"] },
  }

  const normalizedKey = (cat: string, sub: string, v: string) => {
    const c = (cat || "").trim().toLowerCase()
    const s = (sub || "").trim().toLowerCase()
    const vi = (v || "").trim().toLowerCase()
    return vi ? `${c}.${s}.${vi}` : `${c}.${s}`
  }

  // Load service catalog and all prices
  useEffect(() => {
    loadCatalog()
    loadAllPrices()
  }, [])

  const loadCatalog = () => {
    setLoading(true)
    authFetch("/api/service-catalog")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load catalog")
        const items = (await res.json()) as CatalogItem[]
        setCatalog(items)
      })
      .catch((err) => {
        toast({ title: "Error", description: String(err), variant: "destructive" })
      })
      .finally(() => setLoading(false))
  }

  const loadAllPrices = () => {
    setLoadingList(true)
    authFetch("/api/admin/pricing?type=catalog")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        if (data.prices) setAllPrices(data.prices)
      })
      .finally(() => setLoadingList(false))
  }

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

  // Values for filter dropdown
  const filterCategoryOptions = useMemo(() => {
    const cats = new Set(allPrices.map(p => p.category))
    return Array.from(cats).sort()
  }, [allPrices])

  // Reset dependent selects - MOVED TO onValueChange handlers to avoid race conditions with handleEdit
  // useEffect(() => {
  //   setSubservice("")
  //   setVariant("")
  //   setPricing(null)
  //   setParamOptions({})
  //   setParams({})
  //   setParamRows([])
  // }, [category])
  // useEffect(() => {
  //   setVariant("")
  //   setPricing(null)
  //   setParamOptions({})
  //   setParams({})
  //   setParamRows([])
  // }, [subservice])

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
        // Initialize rows if empty using merged keys - ONLY if not already editing existing params
        // Check if we just loaded existing params from DB? Handled in next block
      })
      .catch(() => { })

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
          // If simply switching valid selections and no price exists, we might want to reset form
          // But if we just clicked "Edit" and set Form state, we don't want to reset it if the fetch returns 404/error temporarily
          // However, typically "Edit" implies the record exists, so fetch should return data.
          // If we manually change selection to something new, we want form to clear.
          // Distinguishing "Manual Change" vs "Programmatic Edit" is tricky without a flag.
          // But since handleEdit sets state, and then this effect runs...
          // If this fetch returns different data, it overwrites handleEdit's form state.
          // This is desired behavior: "Latest from DB should win".

          if (!saving) {
            // Default behavior for new selection: clear form
            // But for Edit, we manually set form. 
            // If fetch fails (maybe params mismatch yet), we might clear user input? Use caution.
            // For now, let's only clear if we are NOT in the middle of a save.
            // And maybe check if form is "dirty"?
            setPricing(null)
            // setForm({ basePrice: 0, userPrice: 0, marketerPrice: 0 }) 
          }
          return
        }
        const info: PricingInfo = {
          basePrice: Number(data.pricing?.basePrice ?? 0),
          userPrice: Number(data.pricing?.userPrice ?? 0),
          marketerPrice: Number(data.pricing?.marketerPrice ?? 0),
        }
        setPricing(info)
        // Only update form if we aren't "dirty" or if we want to confirm latest from DB
        setForm(info)
      })
      .catch(() => {
        setPricing(null)
        // setForm({ basePrice: 0, userPrice: 0, marketerPrice: 0 })
      })
  }, [category, subservice, variant, params /* , paramRows.length - excluded to prevent loops */])

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
      loadAllPrices() // Refresh list
    } catch (err) {
      toast({ title: "Save failed", description: String(err), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (entry: CatalogPricingEntry) => {
    // 1. Set form data first so it's ready
    setForm({
      basePrice: Number(entry.basePrice),
      userPrice: Number(entry.userPrice),
      marketerPrice: Number(entry.marketerPrice)
    })

    // 2. Set params
    const pRows = Object.entries(entry.parameters || {}).map(([k, v]) => ({ key: k, value: String(v) }))
    setParamRows(pRows)
    setParams(entry.parameters || {})

    // 3. Set selection state - triggering the View useEffect
    // Since we removed the "resetting" useEffects, these can be set safely without race conditions clearing them
    setCategory(entry.category)
    setSubservice(entry.subservice)
    setVariant(entry.variant || "")

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Filtered List
  const filteredPrices = useMemo(() => {
    return allPrices.filter(p => {
      const matchSearch = searchTerm === "" ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subservice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(p.parameters).toLowerCase().includes(searchTerm.toLowerCase())

      const matchCat = filterCategory === "all" || p.category === filterCategory

      return matchSearch && matchCat
    })
  }, [allPrices, searchTerm, filterCategory])

  return (
    <div className="space-y-8">
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
          <div>
            <CardTitle className="text-xl">Pricing Editor</CardTitle>
            <CardDescription>Edit or create new pricing rules</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            loadCatalog()
            loadAllPrices()
          }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reload
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => {
                setCategory(v)
                // Manual reset when user changes category actively
                setSubservice("")
                setVariant("")
                setPricing(null)
                setParamOptions({})
                setParams({})
                setParamRows([])
              }}>
                <SelectTrigger className="mt-2 text-base">
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
              <Select value={subservice} onValueChange={(v) => {
                setSubservice(v)
                // Manual reset when user changes subservice actively
                setVariant("")
                setPricing(null)
                // Keep params potentially? No, usually distinct.
                setParams({})
                setParamRows([])

              }}>
                <SelectTrigger className="mt-2 text-base">
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
              <Select value={variant} onValueChange={(v) => setVariant(v === "__NONE__" ? "" : v)}>
                <SelectTrigger className="mt-2 text-base">
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
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
            <Label className="text-sm font-semibold text-slate-700">Service Parameters</Label>
            <div className="space-y-2">
              {paramRows.map((row, idx) => {
                const options = row.key && paramOptions[row.key] ? paramOptions[row.key] : []
                return (
                  <div key={`${row.key}-${idx}`} className="grid gap-2 md:grid-cols-3 items-center">
                    <Input
                      placeholder="Name (e.g. network)"
                      value={row.key}
                      onChange={(e) => {
                        const next = [...paramRows]
                        next[idx] = { ...row, key: e.target.value }
                        setParamRows(next)
                      }}
                      className="bg-white"
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
                        <SelectTrigger className="bg-white">
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
                        placeholder="Value"
                        value={row.value}
                        onChange={(e) => {
                          const v = e.target.value
                          const next = [...paramRows]
                          next[idx] = { ...row, value: v }
                          setParamRows(next)
                          if (row.key) setParams((p) => ({ ...p, [row.key]: v }))
                        }}
                        className="bg-white"
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
              <div className="grid gap-2 md:grid-cols-3 items-center mt-2">
                <Input placeholder="New parameter" value={newParamKey} onChange={(e) => setNewParamKey(e.target.value)} className="bg-white" />
                <Input placeholder="Value" value={newParamValue} onChange={(e) => setNewParamValue(e.target.value)} className="bg-white" />
                <Button
                  variant="secondary"
                  size="sm"
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
                  Add
                </Button>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Price Type</TableHead>
                <TableHead>Amount (₦)</TableHead>
                <TableHead>Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><Badge variant="secondary" className="px-3 py-1">Base Price</Badge></TableCell>
                <TableCell>
                  <Input type="number" className="max-w-[150px]" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} />
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge className="px-3 py-1 bg-blue-500">User Price</Badge></TableCell>
                <TableCell>
                  <Input type="number" className="max-w-[150px]" value={form.userPrice} onChange={(e) => setForm({ ...form, userPrice: Number(e.target.value) })} />
                </TableCell>
                <TableCell className={`font-semibold ${userMargin >= 0 ? "text-green-600" : "text-red-600"}`}>{userMargin}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge className="px-3 py-1 bg-purple-500">Marketer Price</Badge></TableCell>
                <TableCell>
                  <Input type="number" className="max-w-[150px]" value={form.marketerPrice} onChange={(e) => setForm({ ...form, marketerPrice: Number(e.target.value) })} />
                </TableCell>
                <TableCell className={`font-semibold ${marketerMargin >= 0 ? "text-green-600" : "text-red-600"}`}>{marketerMargin}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving || !category || !subservice} className="w-full md:w-auto">
              {saving ? "Saving..." : "Save Pricing Configuration"}
            </Button>
            {pricing && (
              <span className="text-sm text-muted-foreground self-center">
                Existing: Base ₦{pricing.basePrice} • User ₦{pricing.userPrice} • Marketer ₦{pricing.marketerPrice}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Overview Table */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Pricing Overview</CardTitle>
              <CardDescription>View and manage all service prices</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 opacity-50" />
                    <SelectValue placeholder="Filter Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {filterCategoryOptions.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Subservice</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Params</TableHead>
                  <TableHead>Base (₦)</TableHead>
                  <TableHead>User (₦)</TableHead>
                  <TableHead>Marketer (₦)</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingList ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading pricing data...
                    </TableCell>
                  </TableRow>
                ) : filteredPrices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No pricing entries found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrices.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/10">
                      <TableCell className="font-medium capitalize">{p.category}</TableCell>
                      <TableCell className="capitalize">{p.subservice}</TableCell>
                      <TableCell>{p.variant || <span className="text-muted-foreground italic">Default</span>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {p.parameters && Object.keys(p.parameters).length > 0
                          ? JSON.stringify(p.parameters).replace(/["{}]/g, '').replace(/:/g, '=')
                          : "—"}
                      </TableCell>
                      <TableCell>{p.basePrice.toLocaleString()}</TableCell>
                      <TableCell>{p.userPrice.toLocaleString()}</TableCell>
                      <TableCell>{p.marketerPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Scroll to top button (optional UX) */}
      <div className="fixed bottom-8 right-8">
        <Button
          className="rounded-full shadow-lg h-12 w-12"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          variant="secondary"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}