"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileText, Calendar } from "lucide-react"
import { RevenueOverTimeChart } from "@/components/admin/charts/revenue-over-time-chart"
import { TopServicesByRevenueChart } from "@/components/admin/charts/top-services-by-revenue-chart"
import { UserGrowthChart } from "@/components/admin/charts/user-growth-chart"
import { authFetch } from "@/lib/client-auth"

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-01-01`
  })
  const [dateTo, setDateTo] = useState(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0,
    totalRequests: 0,
    profitMargin: 0,
    activeUsers: 0,
  })
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; profit: number }[]>([])
  const [topServices, setTopServices] = useState<{ service: string; requests: number; revenue: number; profit?: number }[]>([])
  const [topUsers, setTopUsers] = useState<{ name: string; email: string; requests: number; spent: number; profit?: number }[]>([])
  const [userGrowth, setUserGrowth] = useState<{ month: string; users: number }[]>([])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`/api/admin/reports/metrics?from=${dateFrom}&to=${dateTo}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        setSummaryStats(data?.summary || { totalRevenue: 0, totalRequests: 0, profitMargin: 0, activeUsers: 0 })
        setRevenueData(Array.isArray(data?.revenueOverTime) ? data.revenueOverTime : [])
        setTopServices(Array.isArray(data?.topServices) ? data.topServices : [])
        setTopUsers(Array.isArray(data?.topUsers) ? data.topUsers : [])
        setUserGrowth(Array.isArray(data?.userGrowth) ? data.userGrowth : [])
      }
    } catch (err) {
      console.error("Failed to fetch admin metrics", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo])

  const handleExportCSV = () => {
    const url = `/api/admin/reports/export?format=csv&from=${dateFrom}&to=${dateTo}`
    window.open(url, "_blank")
  }

  const handleExportPDF = () => {
    const url = `/api/admin/reports/export?format=pdf&from=${dateFrom}&to=${dateTo}`
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights and data analysis</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
          <CardDescription>Select the date range for your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date-from">From</Label>
              <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">To</Label>
              <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{summaryStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+8.3% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Profit Margin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.profitMargin}%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15.7% from last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueOverTimeChart data={revenueData} />
        <TopServicesByRevenueChart data={topServices.map((s) => ({ service: s.service, revenue: s.revenue }))} />
      </div>

      <UserGrowthChart data={userGrowth} />

      {/* Top Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Services by Revenue</CardTitle>
          <CardDescription>Best performing services in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Service</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Requests</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Revenue</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Profit</th>
                </tr>
              </thead>
              <tbody>
                {topServices.map((service, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 text-sm">{service.service}</td>
                    <td className="py-3 text-right text-sm">{service.requests.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm">₦{service.revenue.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm text-green-600">₦{(service.profit || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Users by Spending</CardTitle>
          <CardDescription>Most valuable customers in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">User</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Requests</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Spent</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Profit</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((user, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 text-sm font-medium">{user.name}</td>
                    <td className="py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-3 text-right text-sm">{user.requests}</td>
                    <td className="py-3 text-right text-sm">₦{user.spent.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm text-green-600">₦{(user.profit || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
