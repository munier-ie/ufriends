import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/service/status/[reference]
export async function GET(req: NextRequest, ctx: { params: Promise<{ reference: string }> }) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { reference } = await ctx.params
    const ref = decodeURIComponent(reference)

    const tx = await prisma.transaction.findUnique({ where: { reference: ref } })
    if (!tx || tx.userId !== auth.user.id) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Optionally include wallet snapshot
    const wallet = await prisma.wallet.findUnique({ where: { userId: auth.user.id } })

    return NextResponse.json({
      ok: true,
      reference: ref,
      status: tx.status,
      type: tx.type,
      amount: tx.amount,
      meta: tx.meta,
      wallet: wallet ? { balance: wallet.balance, currency: wallet.currency } : null,
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch status", detail: String(err) }, { status: 500 })
  }
}