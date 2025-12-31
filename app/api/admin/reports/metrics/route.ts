import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/admin/reports/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=5
// Aggregates revenue, top services, top users, and active users over time
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const fromStr = searchParams.get("from") || undefined
    const toStr = searchParams.get("to") || undefined
    const topLimit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 5)))

    const now = new Date()
    const defaultFrom = new Date(now)
    defaultFrom.setMonth(defaultFrom.getMonth() - 6)
    const from = fromStr ? new Date(fromStr) : defaultFrom
    const to = toStr ? new Date(`${toStr}T23:59:59.999Z`) : now

    const txs = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        type: "SERVICE_PURCHASE",
      },
      select: { amount: true, status: true, userId: true, createdAt: true, meta: true },
      orderBy: { createdAt: "asc" },
      take: 10000,
    })

    // Revenue/profit over time (monthly buckets)
    const monthKey = (d: Date) => {
      const y = d.getFullYear()
      const m = d.getMonth()
      const label = d.toLocaleString("en-US", { month: "short" }) + " " + y
      return { key: `${y}-${m}`, label }
    }

    const revenueBuckets: Record<string, { month: string; revenue: number; profit: number }> = {}
    const ASSUMED_MARGIN = 0.15 // Profit assumed until cost tracking is implemented

    let totalRevenue = 0
    let totalRequests = 0
    const activeUsersSet = new Set<string>()

    const svcAgg: Record<string, { service: string; revenue: number; requests: number }> = {}
    const userAgg: Record<string, { userId: string; revenue: number; requests: number }> = {}
    const monthlyActiveUsers: Record<string, Set<string>> = {}

    for (const tx of txs) {
      totalRequests += 1
      const mk = monthKey(tx.createdAt)
      monthlyActiveUsers[mk.key] = monthlyActiveUsers[mk.key] || new Set<string>()
      monthlyActiveUsers[mk.key].add(tx.userId)
      activeUsersSet.add(tx.userId)

      // Aggregate services by meta.serviceId/subServiceId
      const meta = (tx.meta || {}) as any
      const serviceId: string = meta?.serviceId || "unknown"
      const subServiceId: string = meta?.subServiceId || meta?.action || ""
      const label = subServiceId ? `${serviceId}:${subServiceId}` : serviceId
      const pretty = subServiceId ? `${serviceId} • ${subServiceId}` : serviceId
      svcAgg[label] = svcAgg[label] || { service: pretty, revenue: 0, requests: 0 }
      svcAgg[label].requests += 1

      // User aggregates
      userAgg[tx.userId] = userAgg[tx.userId] || { userId: tx.userId, revenue: 0, requests: 0 }
      userAgg[tx.userId].requests += 1

      if (tx.status === "SUCCESS") {
        const amt = Number(tx.amount || 0)
        totalRevenue += amt
        svcAgg[label].revenue += amt
        userAgg[tx.userId].revenue += amt

        revenueBuckets[mk.key] = revenueBuckets[mk.key] || { month: mk.label, revenue: 0, profit: 0 }
        revenueBuckets[mk.key].revenue += amt
        revenueBuckets[mk.key].profit += amt * ASSUMED_MARGIN
      }
    }

    const revenueOverTime = Object.values(revenueBuckets).sort((a, b) => a.month.localeCompare(b.month))

    const topServices = Object.values(svcAgg)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, topLimit)

    const topUserIds = Object.keys(userAgg)
      .sort((a, b) => userAgg[b].revenue - userAgg[a].revenue)
      .slice(0, topLimit)

    const users = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, email: true, profile: { select: { name: true } } },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))
    const topUsers = topUserIds.map((uid) => {
      const u = userMap.get(uid)
      return {
        name: u?.profile?.name || "Unknown",
        email: u?.email || "",
        requests: userAgg[uid].requests,
        spent: userAgg[uid].revenue,
        profit: userAgg[uid].revenue * ASSUMED_MARGIN,
      }
    })

    // Monthly active users
    const userGrowth = Object.entries(monthlyActiveUsers)
      .map(([key, set]) => {
        const [y, m] = key.split("-")
        const d = new Date(Number(y), Number(m), 1)
        return { month: d.toLocaleString("en-US", { month: "short" }) + " " + d.getFullYear(), users: set.size }
      })
      .sort((a, b) => a.month.localeCompare(b.month))

    const profitMargin = totalRevenue > 0 ? (ASSUMED_MARGIN * 100) : 0
    const summary = {
      totalRevenue,
      totalRequests,
      profitMargin: Number(profitMargin.toFixed(2)),
      activeUsers: activeUsersSet.size,
    }

    return NextResponse.json({
      ok: true,
      summary,
      revenueOverTime,
      topServices,
      topUsers,
      userGrowth,
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to compute metrics", detail: String(err) }, { status: 500 })
  }
}