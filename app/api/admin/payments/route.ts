import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/admin/payments?q=&status=&method=&take=&skip=
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim().toLowerCase()
    const statusFilter = searchParams.get("status") || undefined
    const methodFilter = searchParams.get("method") || undefined
    const take = Number(searchParams.get("take") || 50)
    const skip = Number(searchParams.get("skip") || 0)

    const where: any = {}
    if (statusFilter) {
      // Map UI statuses to payment statuses
      const map: Record<string, string> = { completed: "SUCCESS", pending: "INIT", failed: "FAILED" }
      where.status = map[statusFilter] || statusFilter
    }
    if (methodFilter) {
      // Map UI methods to gateway
      const gw = methodFilter.toLowerCase()
      if (gw === "card" || gw === "bank transfer" || gw === "wallet") {
        // Both Monnify and PaymentPoint are bank transfer funding flows
        // Keep filter broad; if specific gateway provided, match exact
      }
    }

    // Fetch payments with user details
    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 200),
      skip: Math.max(skip, 0),
      include: {
        user: { select: { email: true, profile: { select: { name: true } } } },
      },
    })

    // Basic search filter applied in memory (name/email/reference)
    const filtered = q
      ? payments.filter((p) => {
          const name = p.user?.profile?.name || ""
          const email = p.user?.email || ""
          const ref = p.reference || ""
          return (
            name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || ref.toLowerCase().includes(q)
          )
        })
      : payments

    // Map to UI Payment shape
    const mapStatus = (s: string): "completed" | "pending" | "failed" => {
      if (s === "SUCCESS") return "completed"
      if (s === "FAILED") return "failed"
      return "pending"
    }

    const uiPayments = filtered.map((p) => ({
      id: p.id,
      user: p.user?.profile?.name || "Unknown User",
      email: p.user?.email || "",
      amount: Number(p.amount || 0),
      method: p.gateway === "Monnify" || p.gateway === "PaymentPoint" ? "Bank Transfer" : p.gateway || "Other",
      status: mapStatus(p.status as any),
      reference: p.reference,
      date: new Date(p.createdAt).toLocaleString(),
      service: "Wallet Funding",
    }))

    // Summary totals by status
    let totalPayments = 0
    let pendingPayments = 0
    let completedPayments = 0
    let failedPayments = 0
    for (const p of payments) {
      const amt = Number(p.amount || 0)
      totalPayments += amt
      if (p.status === "SUCCESS") completedPayments += amt
      else if (p.status === "FAILED") failedPayments += amt
      else pendingPayments += amt
    }

    return NextResponse.json({
      ok: true,
      payments: uiPayments,
      summary: { totalPayments, pendingPayments, completedPayments, failedPayments },
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch payments", detail: String(err) }, { status: 500 })
  }
}