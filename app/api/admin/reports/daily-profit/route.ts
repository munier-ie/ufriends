import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/admin/reports/daily-profit?days=30
// Aggregates successful transactions into daily buckets and calculates profit using real costs
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const daysParam = searchParams.get("days") || "30"
    const days = Math.max(1, Math.min(365, parseInt(daysParam, 10) || 30))

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const txs = await prisma.transaction.findMany({
      where: { status: "SUCCESS", createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    })

    const DEFAULT_MARGIN = 0.15 // fallback margin when cost is not available

    const buckets: Record<string, { date: string; revenue: number; profit: number; requests: number }> = {}

    let totalRevenue = 0
    let totalProfit = 0
    let totalRequests = 0

    for (const tx of txs) {
      const d = tx.createdAt
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)
      const label = key // YYYY-MM-DD
      buckets[key] = buckets[key] || { date: label, revenue: 0, profit: 0, requests: 0 }
      
      const amount = Number(tx.amount)
      const meta = tx.meta as any || {}
      
      // Calculate profit using real cost if available, otherwise use default margin
      let cost = 0
      let profit = 0
      
      if (meta.providerCost) {
        // Use provider cost if available
        cost = Number(meta.providerCost)
        profit = amount - cost
      } else if (meta.cost) {
        // Use cost if available
        cost = Number(meta.cost)
        profit = amount - cost
      } else {
        // Fallback to default margin
        profit = amount * DEFAULT_MARGIN
      }
      
      buckets[key].revenue += amount
      buckets[key].profit += profit
      buckets[key].requests += 1
      
      totalRevenue += amount
      totalProfit += profit
      totalRequests += 1
    }

    // Round profit values to 2 decimal places
    for (const k of Object.keys(buckets)) {
      buckets[k].profit = Number(buckets[k].profit.toFixed(2))
    }

    const daily = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date))
    
    // Calculate actual margin percentage
    const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return NextResponse.json({
      ok: true,
      days,
      summary: {
        totalRevenue,
        totalRequests,
        profit: Number(totalProfit.toFixed(2)),
        marginPercent: Number(marginPercent.toFixed(2)),
      },
      daily,
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to compute daily profit", detail: String(err) }, { status: 500 })
  }
}