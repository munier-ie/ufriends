"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/client-auth"

type CatalogItem = { id: number; category: string; subservice: string; variant: string }

type Summary = { totalRevenue: number; totalCost: number; totalProfit: number; count: number }

export default function AdminFinancePage() {
  const { toast } = useToast()
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [category, setCategory] = useState("")
  const [subservice, setSubservice] = useState("")
  const [start, setStart] = useState<string>("")
  const [end, setEnd] = useState<string>("")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    authFetch("/api/service-catalog")
      .then(async (res) => setCatalog(await res.json()))
      .catch((err) => toast({ title: "Error", description: String(err), variant: "destructive" }))
  }, [toast])

  const categoryOptions = useMemo(() => Array.from(new Set(catalog.map(c => c.category))), [catalog])
  const subserviceOptions = useMemo(() => Array.from(new Set(catalog.filter(c => c.category === category).map(c => c.subservice))), [catalog, category])

  useEffect(() => { setSubservice("") }, [category])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (start) params.set("start", start)
      if (end) params.set("end", end)
      if (category) params.set("category", category)
      if (subservice) params.set("subservice", subservice)
      const res = await authFetch(`/api/admin/finance/summary?${params.toString()}`)
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load summary")
      setSummary(data.summary)
    } catch (err) {
      toast({ title: "Load failed", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSummary() }, [])

  const currency = (n?: number) => `₦${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Finance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" className="mt-2" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" className="mt-2" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v === "__ALL__" ? "" : v)}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">All</SelectItem>
                  {categoryOptions.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subservice</Label>
              <Select value={subservice} onValueChange={(v) => setSubservice(v === "__ALL__" ? "" : v)} disabled={!category}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="All subservices" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">All</SelectItem>
                  {subserviceOptions.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchSummary} disabled={loading}>{loading ? "Loading..." : "Apply Filters"}</Button>
          </div>

          {summary && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Total Revenue</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{currency(summary.totalRevenue)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Total Cost</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{currency(summary.totalCost)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Total Profit</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currency(summary.totalProfit)}</div>
                  <Badge className="mt-2" variant={summary.totalProfit >= 0 ? "default" : "destructive"}>{summary.totalProfit >= 0 ? "Profit" : "Loss"}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Transactions</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{summary.count}</div></CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}