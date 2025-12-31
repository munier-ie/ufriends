import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/admin/finance/summary?start=YYYY-MM-DD&end=YYYY-MM-DD&category=&subservice=
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const startStr = searchParams.get("start") || ""
    const endStr = searchParams.get("end") || ""
    const category = (searchParams.get("category") || "").trim() || undefined
    const subservice = (searchParams.get("subservice") || "").trim() || undefined

    const end = endStr ? new Date(endStr) : new Date()
    const start = startStr ? new Date(startStr) : new Date(new Date(end).setMonth(end.getMonth() - 1))

    const where: any = {
      status: "SUCCESS",
      type: "SERVICE_PURCHASE",
      createdAt: { gte: start, lte: end },
    }
    if (category) where.category = category
    if (subservice) where.subservice = subservice

    const txs = await prisma.transaction.findMany({
      where,
      // Only select fields that exist in the Transaction model
      select: { amountPaid: true, basePrice: true, amount: true },
      orderBy: { createdAt: "asc" },
      take: 10000,
    })

    let totalRevenue = 0
    let totalCost = 0
    let totalProfit = 0
    for (const t of txs) {
      // Support legacy transactions where only `amount` exists
      const revenue = t.amountPaid != null ? Number(t.amountPaid) : Number(t.amount ?? 0)
      const cost = Number(t.basePrice ?? 0)
      const profit = revenue - cost

      totalRevenue += revenue
      totalCost += cost
      totalProfit += profit
    }

    return NextResponse.json({ ok: true, summary: { totalRevenue, totalCost, totalProfit, count: txs.length }, range: { start, end }, filter: { category, subservice } })
  } catch (err) {
    return NextResponse.json({ error: "Failed to compute finance summary", detail: String(err) }, { status: 500 })
  }
}