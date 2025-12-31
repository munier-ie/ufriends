import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/admin/service/logs/:reference
// Returns transaction details and associated audit logs
export async function GET(req: NextRequest, context: { params: Promise<{ reference: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { reference } = await context.params
    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    const tx = await prisma.transaction.findUnique({ where: { reference } })
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found", reference }, { status: 404 })
    }

    const meta = (tx.meta || {}) as any
    const providerId: string | undefined = meta?.providerId

    let provider: { id: string; name: string; category: string } | null = null
    if (providerId) {
      const p = await prisma.serviceProvider.findUnique({
        where: { id: providerId },
        select: { id: true, name: true, category: true },
      })
      provider = p ? { id: p.id, name: p.name, category: p.category } : null
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { resourceType: "Transaction", resourceId: reference },
      orderBy: { createdAt: "desc" },
      take: 500,
    })

    return NextResponse.json({
      ok: true,
      transaction: {
        id: tx.id,
        userId: tx.userId,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        reference: tx.reference,
        meta,
        createdAt: tx.createdAt,
        provider,
      },
      auditLogs,
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch service logs", detail: String(err) }, { status: 500 })
  }
}