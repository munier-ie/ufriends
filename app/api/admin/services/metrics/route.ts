import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/admin/services/metrics
// Aggregates transaction metrics by service and subService for recent windows
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const rows = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: since24h },
        type: "SERVICE_PURCHASE",
      },
      select: {
        amount: true,
        status: true,
        meta: true,
        createdAt: true,
      },
    })

    const byService: Record<string, any> = {}

    for (const tx of rows) {
      const meta = (tx.meta || {}) as any
      const serviceId: string = meta.serviceId || "unknown"
      const subServiceId: string = meta.subServiceId || "unknown"
      const providerId: string = meta.providerId || "unknown"

      if (!byService[serviceId]) {
        byService[serviceId] = {
          total: 0,
          success: 0,
          failed: 0,
          amountSum: 0,
          bySubService: {},
          byProvider: {},
        }
      }

      const svc = byService[serviceId]
      svc.total += 1
      if (tx.status === "SUCCESS") svc.success += 1
      if (tx.status === "FAILED") svc.failed += 1
      svc.amountSum += Number(tx.amount || 0)

      // subService breakdown
      if (!svc.bySubService[subServiceId]) {
        svc.bySubService[subServiceId] = { total: 0, success: 0, failed: 0 }
      }
      const sub = svc.bySubService[subServiceId]
      sub.total += 1
      if (tx.status === "SUCCESS") sub.success += 1
      if (tx.status === "FAILED") sub.failed += 1

      // provider breakdown
      if (!svc.byProvider[providerId]) {
        svc.byProvider[providerId] = { total: 0, success: 0, failed: 0 }
      }
      const prov = svc.byProvider[providerId]
      prov.total += 1
      if (tx.status === "SUCCESS") prov.success += 1
      if (tx.status === "FAILED") prov.failed += 1
    }

    // compute successRate for convenience
    for (const svc of Object.values(byService)) {
      ;(svc as any).successRate = (svc.total > 0) ? Math.round((svc.success / svc.total) * 100) : 0
    }

    return NextResponse.json({ ok: true, window: "24h", byService })
  } catch (err) {
    return NextResponse.json({ error: "Failed to compute metrics", detail: String(err) }, { status: 500 })
  }
}