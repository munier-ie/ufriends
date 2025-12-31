"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { DollarSign, TrendingUp, TrendingDown, Plus } from "lucide-react"
import { authFetch } from "@/lib/client-auth"

interface SoftwareRequest {
  id: string
  userId: string
  serviceType: string
  subType: string
  formData: any
  price: number
  status: string
  submittedAt: string
  cost?: number
}

interface CostEntry {
  requestId: string
  cost: number
  description: string
  addedAt: string
}

export default function FinanceOverviewPage() {
  const [requests, setRequests] = useState<SoftwareRequest[]>([])
  const [costs, setCosts] = useState<CostEntry[]>([])
  const [isAddCostOpen, setIsAddCostOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<SoftwareRequest | null>(null)
  const [costData, setCostData] = useState({
    cost: "",
    description: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const resp = await authFetch("/api/admin/software/requests")
      if (!resp.ok) {
        console.error("Failed to load software requests", await resp.text())
        setRequests([])
        setCosts([])
        return
      }
      const data = await resp.json()
      const rawItems = (data?.items || []) as any[]

      const toUiStatus = (s: string) => {
        switch ((s || "").toUpperCase()) {
          case "COMPLETED":
            return "Completed"
          case "PROCESSING":
            return "In Progress"
          case "FAILED":
            return "Failed"
          default:
            return "Pending"
        }
      }

      const mapped: SoftwareRequest[] = rawItems.map((r) => ({
        id: r.id,
        userId: r.userId,
        serviceType: r.serviceType,
        subType: r.subType,
        formData: r.formJson || {},
        price: Number(r.price || 0),
        status: toUiStatus(r.status),
        submittedAt: r.submittedAt,
        cost: undefined,
      }))

      setRequests(mapped)

      // Flatten cost entries from formJson.costs for analytics
      const allCosts: CostEntry[] = []
      for (const r of rawItems) {
        const form = (r.formJson || {}) as any
        const c = Array.isArray(form?.costs) ? form.costs : []
        for (const entry of c) {
          allCosts.push({
            requestId: String(entry?.requestId || r.id),
            cost: Number(entry?.cost || 0),
            description: String(entry?.description || ""),
            addedAt: String(entry?.addedAt || new Date(r.submittedAt).toISOString()),
          })
        }
      }
      setCosts(allCosts)
    } catch (err) {
      console.error("Error loading finance data", err)
      setRequests([])
      setCosts([])
    }
  }

  const getTotalRevenue = () => {
    return requests.reduce((sum, req) => sum + req.price, 0)
  }

  const getTotalCost = () => {
    return costs.reduce((sum, cost) => sum + cost.cost, 0)
  }

  const getTotalProfit = () => {
    return getTotalRevenue() - getTotalCost()
  }

  const getProfitMargin = () => {
    const revenue = getTotalRevenue()
    if (revenue === 0) return 0
    return ((getTotalProfit() / revenue) * 100).toFixed(1)
  }

  const getMonthlyData = () => {
    const monthlyStats: Record<string, { revenue: number; cost: number; profit: number }> = {}

    requests.forEach((req) => {
      const month = new Date(req.submittedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      if (!monthlyStats[month]) {
        monthlyStats[month] = { revenue: 0, cost: 0, profit: 0 }
      }
      monthlyStats[month].revenue += req.price
    })

    costs.forEach((cost) => {
      const month = new Date(cost.addedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      if (!monthlyStats[month]) {
        monthlyStats[month] = { revenue: 0, cost: 0, profit: 0 }
      }
      monthlyStats[month].cost += cost.cost
    })

    Object.keys(monthlyStats).forEach((month) => {
      monthlyStats[month].profit = monthlyStats[month].revenue - monthlyStats[month].cost
    })

    return Object.entries(monthlyStats).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      cost: data.cost,
      profit: data.profit,
    }))
  }

  const handleAddCost = (request: SoftwareRequest) => {
    setSelectedRequest(request)
    setIsAddCostOpen(true)
  }

  const submitCost = async () => {
    if (!selectedRequest || !costData.cost) return
    try {
      const resp = await authFetch(`/api/admin/software/requests/${selectedRequest.id}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cost: Number.parseFloat(costData.cost), description: costData.description }),
      })
      if (!resp.ok) {
        console.error("Failed to add cost", await resp.text())
        return
      }
      setIsAddCostOpen(false)
      setCostData({ cost: "", description: "" })
      await loadData()
    } catch (err) {
      console.error("Error adding cost", err)
    }
  }

  const getProjectCost = (requestId: string) => {
    const projectCosts = costs.filter((c) => c.requestId === requestId)
    return projectCosts.reduce((sum, c) => sum + c.cost, 0)
  }

  const getProjectProfit = (request: SoftwareRequest) => {
    return request.price - getProjectCost(request.id)
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-600">Profit & Cost Overview</h1>
              <p className="text-muted-foreground">Financial analytics for software development projects</p>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid gap-6 md:grid-cols-4 mb-6">
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">₦{getTotalRevenue().toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">From {requests.length} projects</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">₦{getTotalCost().toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{costs.length} cost entries</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#CCCCFF] bg-gradient-to-br from-[#CCCCFF]/20 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-[#3457D5]">₦{getTotalProfit().toLocaleString()}</div>
                  {getTotalProfit() >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Net profit</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#CCCCFF] bg-gradient-to-br from-[#3457D5]/10 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#3457D5]">{getProfitMargin()}%</div>
                <p className="text-xs text-muted-foreground mt-1">Average margin</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Chart */}
          <Card className="border-2 border-[#CCCCFF] mb-6">
            <CardHeader>
              <CardTitle>Monthly Financial Breakdown</CardTitle>
              <CardDescription>Revenue, cost, and profit trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `₦${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: "#F9F7F3", border: "2px solid #CCCCFF" }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar dataKey="cost" fill="#ef4444" name="Cost" />
                  <Bar dataKey="profit" fill="#3457D5" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project-wise Breakdown */}
          <Card className="border-2 border-[#CCCCFF]">
            <CardHeader>
              <CardTitle>Project-wise Financial Details</CardTitle>
              <CardDescription>Revenue, cost, and profit for each project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Margin</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => {
                      const cost = getProjectCost(request.id)
                      const profit = getProjectProfit(request)
                      const margin = request.price > 0 ? ((profit / request.price) * 100).toFixed(1) : "0"

                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium max-w-xs truncate">
                            {request.formData.projectTitle}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{request.subType}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ₦{request.price.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-semibold text-red-600">₦{cost.toLocaleString()}</TableCell>
                          <TableCell className={`font-bold ${profit >= 0 ? "text-[#3457D5]" : "text-red-600"}`}>
                            ₦{profit.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={Number.parseFloat(margin) >= 50 ? "default" : "secondary"}>{margin}%</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.status === "Completed"
                                  ? "outline"
                                  : request.status === "In Progress"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => handleAddCost(request)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Cost Modal */}
        <Dialog open={isAddCostOpen} onOpenChange={setIsAddCostOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Project Cost</DialogTitle>
              <DialogDescription>Record the cost for this project</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#CCCCFF]/20 p-3">
                  <p className="text-sm font-semibold text-[#3457D5]">{selectedRequest.formData.projectTitle}</p>
                  <p className="text-xs text-muted-foreground">Revenue: ₦{selectedRequest.price.toLocaleString()}</p>
                </div>

                <div>
                  <Label htmlFor="cost">Cost Amount *</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={costData.cost}
                    onChange={(e) => setCostData({ ...costData, cost: e.target.value })}
                    placeholder="Enter cost amount"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={costData.description}
                    onChange={(e) => setCostData({ ...costData, description: e.target.value })}
                    placeholder="e.g., Developer payment, hosting, etc."
                    className="mt-1"
                  />
                </div>

                {costData.cost && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-sm font-semibold text-blue-900">Projected Profit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₦{(selectedRequest.price - Number.parseFloat(costData.cost || "0")).toLocaleString()}
                    </p>
                  </div>
                )}

                <Button onClick={submitCost} className="w-full bg-[#3457D5]">
                  Add Cost Entry
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
