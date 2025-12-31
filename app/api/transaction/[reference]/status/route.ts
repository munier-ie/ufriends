import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { z } from "zod"
import { Prisma } from "@prisma/client"

// Safely merge existing JSON meta with a patch object
function mergeMeta(base: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const isObject = (val: unknown): val is Record<string, unknown> => !!val && typeof val === "object" && !Array.isArray(val)
  const obj = isObject(base) ? base : {}
  return { ...obj, ...patch }
}

// POST /api/transaction/:reference/status
// Body: { status: "success" | "failed", message?: string, code?: string }
export async function POST(req: NextRequest, ctx: { params: Promise<{ reference: string }> }) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { reference } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const schema = z.object({ status: z.enum(["success", "failed"]), message: z.string().optional(), code: z.string().optional() })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }
    const { status, message, code } = parsed.data

    const tx = await prisma.transaction.findUnique({ where: { reference } })
    if (!tx || tx.userId !== auth.user.id) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const preDebited = Boolean((tx.meta as any)?.preDebited)

    if (status === "success") {
      const amountPaid = Number(tx.amountPaid ?? tx.amount ?? 0)
      const basePrice = Number(tx.basePrice ?? 0)
      const profit = amountPaid - basePrice

      await prisma.$transaction([
        prisma.transaction.update({ where: { reference }, data: { status: "SUCCESS" } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_TX_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { profit, amountPaid, basePrice },
          },
        }),
      ])
      return NextResponse.json({ ok: true, reference, status: "SUCCESS", profit })
    }

    // failed path
    if (preDebited) {
      const refundAmount = Number(tx.amountPaid ?? tx.amount ?? 0)
      await prisma.$transaction([
        prisma.transaction.update({ where: { reference }, data: { status: "FAILED", meta: mergeMeta(tx.meta, { error: message, code }) as Prisma.InputJsonValue } }),
        prisma.wallet.update({ where: { userId: tx.userId }, data: { balance: { increment: refundAmount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_TX_FAILED_REFUNDED",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { refundAmount, message, code },
          },
        }),
      ])
      return NextResponse.json({ ok: true, reference, status: "FAILED", refunded: true })
    }

    await prisma.$transaction([
      prisma.transaction.update({ where: { reference }, data: { status: "FAILED", meta: mergeMeta(tx.meta, { error: message, code }) as Prisma.InputJsonValue } }),
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "SERVICE_TX_FAILED",
          resourceType: "Transaction",
          resourceId: reference,
          diffJson: { message, code },
        },
      }),
    ])
    return NextResponse.json({ ok: true, reference, status: "FAILED", refunded: false })
  } catch (err) {
    return NextResponse.json({ error: "Failed to update transaction status", detail: String(err) }, { status: 500 })
  }
}