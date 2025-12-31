import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/db"
import { processWalletRefund } from "@/lib/wallet-refund"
import { z } from "zod"

// POST /api/service/webhook/[reference]
// Body: { status: "SUCCESS" | "FAILED", providerReference?: string, message?: string, code?: string }
// This endpoint handles delayed provider responses for service transactions
export async function POST(req: NextRequest, context: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await context.params
    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 })
    }
    // Optional HMAC signature verification. If SERVICE_WEBHOOK_SECRET is set,
    // require header 'x-service-signature' (or 'x-signature') to match HMAC-SHA256 over the raw body.
    let body: any
    const secret = process.env.SERVICE_WEBHOOK_SECRET || ""
    if (secret) {
      const raw = await req.text()
      const signature = req.headers.get("x-service-signature") || req.headers.get("x-signature") || ""
      const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex")
      if (!signature || signature !== expected) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
      }
      try {
        body = JSON.parse(raw)
      } catch (e) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
      }
    } else {
      body = await req.json()
    }
    const WebhookSchema = z.object({
      status: z.enum(["SUCCESS", "FAILED"]),
      providerReference: z.string().optional(),
      message: z.string().optional(),
      code: z.string().optional(),
    })
    const parsed = WebhookSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid webhook payload", detail: parsed.error.flatten() }, { status: 400 })
    }
    const { status, providerReference, message, code } = parsed.data

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { user: { select: { id: true, email: true } } }
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Only process if transaction is in PENDING or QUEUED status
    if (!["PENDING", "QUEUED"].includes(transaction.status)) {
      return NextResponse.json({ 
        error: `Transaction already processed with status: ${transaction.status}` 
      }, { status: 400 })
    }

    if (status === "SUCCESS") {
      // Success: mark transaction and debit wallet atomically
      await prisma.$transaction([
        prisma.transaction.update({ 
          where: { reference }, 
          data: { 
            status: "SUCCESS", 
            meta: { 
              ...transaction.meta as any, 
              providerRef: providerReference,
              webhookProcessedAt: new Date().toISOString()
            } 
          } 
        }),
        prisma.wallet.update({ 
          where: { userId: transaction.userId }, 
          data: { balance: { decrement: Number(transaction.amount) } } 
        }),
        prisma.auditLog.create({
          data: {
            actorId: "WEBHOOK",
            action: "SERVICE_WEBHOOK_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { 
              reference,
              amount: Number(transaction.amount), 
              providerRef: providerReference,
              userEmail: transaction.user?.email
            },
          },
        }),
      ])

      return NextResponse.json({ 
        ok: true, 
        reference, 
        status: "SUCCESS",
        walletDebited: true,
        providerRef: providerReference
      })

    } else if (status === "FAILED") {
      // Failure: mark transaction as failed
      await prisma.$transaction([
        prisma.transaction.update({ 
          where: { reference }, 
          data: { 
            status: "FAILED", 
            meta: { 
              ...transaction.meta as any, 
              error: message, 
              code,
              webhookProcessedAt: new Date().toISOString()
            } 
          } 
        }),
        prisma.auditLog.create({
          data: {
            actorId: "WEBHOOK",
            action: "SERVICE_WEBHOOK_FAILED",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { 
              reference,
              amount: Number(transaction.amount), 
              reason: message, 
              code,
              userEmail: transaction.user?.email
            },
          },
        }),
      ])

      // Check if wallet was pre-debited (for future use cases)
      // In current implementation, wallet is only debited on success
      // But this webhook can handle pre-debit scenarios in the future
      const wasPreDebited = (transaction.meta as any)?.preDebited === true
      
      if (wasPreDebited) {
        // Process automatic refund
        const refundResult = await processWalletRefund({
          userId: transaction.userId,
          amount: Number(transaction.amount),
          originalReference: reference,
          reason: `Automatic refund for failed transaction: ${message || 'Provider failure'}`,
          actorId: "SYSTEM"
        })

        return NextResponse.json({ 
          ok: true, 
          reference, 
          status: "FAILED",
          refundProcessed: refundResult.ok,
          refundReference: refundResult.reference,
          error: message,
          code
        })
      }

      return NextResponse.json({ 
        ok: true, 
        reference, 
        status: "FAILED",
        refundProcessed: false,
        error: message,
        code
      })
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 })

  } catch (err) {
    console.error("Service webhook error:", err)
    return NextResponse.json({ 
      error: "Webhook processing failed", 
      detail: String(err) 
    }, { status: 500 })
  }
}