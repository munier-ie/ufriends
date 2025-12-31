import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { processWalletRefund, isTransactionRefundable, hasRefundBeenProcessed } from "@/lib/wallet-refund"
import { z } from "zod"

// POST /api/admin/service/refund/[reference]
// Body: { reason?: string }
export async function POST(req: NextRequest, context: { params: Promise<{ reference: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { reference } = await context.params
    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 })
    }

    const body = await req.json()
    const RefundSchema = z.object({
      reason: z.string().trim().min(1).max(200).optional().default("Admin-initiated refund for failed transaction"),
    })
    const parsed = RefundSchema.safeParse({
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }
    const { reason } = parsed.data

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { user: { select: { id: true, email: true } } }
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Validate transaction is eligible for refund
    if (transaction.type !== "SERVICE_PURCHASE") {
      return NextResponse.json({ 
        error: "Only service purchase transactions can be refunded" 
      }, { status: 400 })
    }

    if (transaction.status !== "FAILED") {
      return NextResponse.json({ 
        error: `Cannot refund transaction with status: ${transaction.status}. Only FAILED transactions can be refunded.` 
      }, { status: 400 })
    }

    // Check if refund already processed
    const alreadyRefunded = await hasRefundBeenProcessed(reference)
    if (alreadyRefunded) {
      return NextResponse.json({ 
        error: "Refund has already been processed for this transaction" 
      }, { status: 400 })
    }

    // Process the refund
    const refundResult = await processWalletRefund({
      userId: transaction.userId,
      amount: Number(transaction.amount),
      originalReference: reference,
      reason,
      actorId: auth.user.id
    })

    if (!refundResult.ok) {
      return NextResponse.json({ 
        error: "Refund processing failed", 
        detail: refundResult.error 
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      refund: {
        reference: refundResult.reference,
        originalReference: reference,
        amount: Number(transaction.amount),
        userId: transaction.userId,
        userEmail: transaction.user?.email,
        newWalletBalance: refundResult.newBalance,
        reason,
        processedBy: auth.user.email,
        processedAt: new Date().toISOString(),
      }
    })

  } catch (err) {
    console.error("Admin refund error:", err)
    return NextResponse.json({ 
      error: "Failed to process refund", 
      detail: String(err) 
    }, { status: 500 })
  }
}