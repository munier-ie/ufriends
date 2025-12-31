"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, FileText, TrendingUp } from "lucide-react"
import { RecentActivityTable } from "@/components/admin/recent-activity-table"
import { authFetch } from "@/lib/client-auth"
import { RevenueOverTimeChart } from "@/components/admin/charts/revenue-over-time-chart"
import { TopServicesByRevenueChart } from "@/components/admin/charts/top-services-by-revenue-chart"
import { UserGrowthChart } from "@/components/admin/charts/user-growth-chart"

export default function AdminDashboard() {
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0,
    totalRequests: 0,
    profitMargin: 0,
    activeUsers: 0,
  })
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; profit: number }[]>([])
  const [topServices, setTopServices] = useState<{ service: string; requests: number; revenue: number; profit?: number }[]>([])
  const [userGrowth, setUserGrowth] = useState<{ month: string; users: number }[]>([])

  // default to last 90 days window
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const res = await authFetch(`/api/admin/reports/metrics?from=${dateFrom}&to=${dateTo}&limit=5`)
        if (res.ok) {
          const data = await res.json()
          setSummaryStats(data?.summary || { totalRevenue: 0, totalRequests: 0, profitMargin: 0, activeUsers: 0 })
          setRevenueData(Array.isArray(data?.revenueOverTime) ? data.revenueOverTime : [])
          setTopServices(Array.isArray(data?.topServices) ? data.topServices : [])
          setUserGrowth(Array.isArray(data?.userGrowth) ? data.userGrowth : [])
        }
      } catch (err) {
        console.error("Failed to fetch admin metrics", err)
      }
    }
    loadMetrics()
  }, [dateFrom, dateTo])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your services today.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Recent activity across all services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summaryStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Aggregated over the selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.profitMargin}%</div>
            <p className="text-xs text-muted-foreground">Gross margin for the period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Users active in the period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueOverTimeChart data={revenueData} />
        <TopServicesByRevenueChart data={topServices.map((s) => ({ service: s.service, revenue: s.revenue }))} />
      </div>

      <UserGrowthChart data={userGrowth} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivityTable />
        </CardContent>
      </Card>
    </div>
  )
}
