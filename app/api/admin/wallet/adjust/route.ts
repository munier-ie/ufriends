import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { z } from "zod"

// Centralized Arcjet protection via shared helper

// POST /api/admin/wallet/adjust
// Body: { userId: string, amount: number, reason?: string }
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const AdjustSchema = z.object({
      userId: z.string().min(1),
      amount: z.number().refine((n) => Number.isFinite(n) && n !== 0, {
        message: "amount must be a non-zero number",
      }),
      reason: z.string().trim().min(1).max(200).optional().default("Admin adjustment"),
    })
    const parsed = AdjustSchema.safeParse({
      userId: String(body?.userId || ""),
      amount: Number(body?.amount ?? 0),
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }
    const { userId, amount, reason } = parsed.data

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, currency: "NGN" },
    })

    const currentBalance = Number(wallet.balance)
    const nextBalance = currentBalance + amount
    if (nextBalance < 0) {
      return NextResponse.json({ error: "Debit exceeds current balance" }, { status: 400 })
    }

    const reference = `ADJ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const type = amount > 0 ? "WALLET_CREDIT" : "WALLET_DEBIT"

    await prisma.$transaction([
      prisma.wallet.update({ where: { userId }, data: { balance: nextBalance } }),
      prisma.transaction.create({
        data: {
          userId,
          type,
          amount: Math.abs(amount),
          status: "SUCCESS",
          reference,
          meta: { reason, byAdminId: auth.user.id },
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "ADMIN_WALLET_ADJUSTMENT",
          resourceType: "Wallet",
          resourceId: userId,
          diffJson: { from: currentBalance, to: nextBalance, delta: amount, reason },
        },
      }),
    ])

    return NextResponse.json({ ok: true, userId, reference, balance: nextBalance })
  } catch (err) {
    return NextResponse.json({ error: "Adjustment failed", detail: String(err) }, { status: 500 })
  }
}