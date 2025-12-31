import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { UFRIENDS_SERVICES } from "@/lib/services-config"

// GET /api/wallet/spend-metrics?months=6
// Returns monthly spending (successful service purchases) and spending by category for the user
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const months = Math.min(24, Math.max(1, Number(searchParams.get("months") || 6)))

    const now = new Date()
    const since = new Date(now)
    since.setMonth(since.getMonth() - months + 1)

    const txs = await prisma.transaction.findMany({
      where: {
        userId: auth.user.id,
        createdAt: { gte: since, lte: now },
        type: "SERVICE_PURCHASE",
        status: "SUCCESS",
      },
      select: { amount: true, createdAt: true, meta: true },
      orderBy: { createdAt: "asc" },
      take: 5000,
    })

    const monthKey = (d: Date) => d.toLocaleString("en-US", { month: "short" })

    // Initialize months with zeros to keep chart continuity
    const monthlyOrder: string[] = []
    const cursor = new Date(since)
    for (let i = 0; i < months; i++) {
      monthlyOrder.push(monthKey(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    }

    const monthlyMap: Record<string, number> = {}
    for (const m of monthlyOrder) monthlyMap[m] = 0

    const categoryMap: Record<string, number> = {}

    // Resolve a canonical category label from transaction meta
    const canonicalCategoryName = (id: string | undefined): string | undefined => {
      if (!id) return undefined
      const norm = id.toLowerCase()
      const svc = UFRIENDS_SERVICES.find(s => s.id === norm)
      if (svc) return svc.name
      // Common synonyms/aliases
      if (norm === "bill") return "Bills"
      if (norm === "agency-banking") return "Agency Banking"
      return undefined
    }

    const resolveCategoryFromMeta = (meta: any): string => {
      const sid: string | undefined = meta?.serviceId
      const subId: string | undefined = meta?.subServiceId
      const action: string | undefined = meta?.action

      // Prefer explicit serviceId
      const byServiceId = canonicalCategoryName(sid)
      if (byServiceId) return byServiceId

      // Infer from subServiceId if present
      if (subId) {
        const parent = UFRIENDS_SERVICES.find(s => s.subServices?.some(ss => ss.id === String(subId).toLowerCase()))
        if (parent) return parent.name
      }

      // Infer from action for common flows
      if (action) {
        const act = String(action).toLowerCase()
        // Try match action to a subService id in config
        const parentViaAction = UFRIENDS_SERVICES.find(s => s.subServices?.some(ss => ss.id === act))
        if (parentViaAction) return parentViaAction.name

        // Fallback heuristics
        if (act === "vtu" || act === "airtime-2-cash" || act === "share-n-sell") return "Airtime"
        if (act === "bundle" || act === "sme" || act === "corporate" || act === "gift") return "Data"
        if (act === "electricity" || act === "water" || act === "internet") return "Bills"
        if (act === "android-license" || act === "modification" || act === "retrieval" || act === "central-risk" || act === "printout") return "BVN Services"
        if (act === "validation" || act === "verification") return "NIN Services"
        if (act === "registration" || act === "status-report" || act === "certification") return "CAC Registration"
        if (act === "jamb" || act === "nysc") return "Education"
        if (act === "pos" || act === "marketer") return "Agency Banking"
        if (act === "identity" || act === "document") return "Verification"
        if (act === "online") return "Training"
        if (act === "web" || act === "mobile") return "Software Development"
      }

      // Final fallback
      return "Others"
    }

    for (const tx of txs) {
      const amt = Number(tx.amount || 0)
      const m = monthKey(tx.createdAt)
      monthlyMap[m] = (monthlyMap[m] || 0) + amt

      const meta = (tx.meta || {}) as any
      const cat = resolveCategoryFromMeta(meta)
      categoryMap[cat] = (categoryMap[cat] || 0) + amt
    }

    const monthly = monthlyOrder.map((m) => ({ month: m, amount: monthlyMap[m] || 0 }))
    const byCategory = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    return NextResponse.json({ ok: true, monthly, byCategory })
  } catch (err) {
    return NextResponse.json({ error: "Failed to compute spend metrics", detail: String(err) }, { status: 500 })
  }
}