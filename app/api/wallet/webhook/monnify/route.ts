import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyMonnifySignature, getWebhookReference, getWebhookStatus, getWebhookAmount } from "@/lib/monnify"

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.MONNIFY_WEBHOOK_SECRET || ""
    const raw = await req.text()
    const signature = req.headers.get("x-monnify-signature") || req.headers.get("monnify-signature") || req.headers.get("x-signature")

    if (!secret || !verifyMonnifySignature(raw, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const body = JSON.parse(raw)
    const reference = getWebhookReference(body)
    const status = (getWebhookStatus(body) || "").toUpperCase()
    const amount = getWebhookAmount(body)

    // Log to Database
    await prisma.auditLog.create({
      data: {
        action: "MONNIFY_WEBHOOK_RECEIVED",
        resourceType: "Webhook",
        resourceId: reference,
        diffJson: body
      }
    }).catch(() => { })

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    let payment = await prisma.payment.findUnique({ where: { reference } })

    if (!payment) {
      // Monnify direct transfers usually have the accountReference in the body
      console.log(`Monnify Webhook: Processing potential direct transfer for ref ${reference}`)
      const accountNumber = body?.destAccountNumber || body?.accountNumber || body?.product?.accountNumber
      const va = await prisma.virtualAccount.findFirst({
        where: {
          OR: [
            { monnifyAccountReference: reference },
            { monnifyAccountNumber: String(accountNumber || "NEVER_MATCH") }
          ]
        }
      })

      if (va) {
        payment = await prisma.payment.upsert({
          where: { reference },
          update: { webhookPayload: body },
          create: {
            userId: va.userId,
            amount: amount,
            reference: reference,
            status: "INIT", // Fixed enum
            gateway: "Monnify",
            webhookPayload: body
          }
        })

        await prisma.transaction.upsert({
          where: { reference },
          update: { meta: { provider: "Monnify", isDirectTransfer: true } },
          create: {
            userId: va.userId,
            amount: amount,
            reference: reference,
            type: "WALLET_FUND_CREDIT",
            status: "PENDING",
            description: "Direct Bank Transfer (Monnify)",
            meta: { provider: "Monnify", isDirectTransfer: true }
          }
        }).catch(() => { })
      }
    }

    if (!payment) {
      console.warn(`Monnify Webhook: No user or payment found for reference ${reference}. Body: ${raw}`)
      return NextResponse.json({ ok: true })
    }

    const userId = payment.userId

    if (status === "SUCCESS" || status === "PAID") {
      if (payment.status !== "SUCCESS") {
        // Calculate fee: 1.5% capped at 2000 NGN
        const fee = Math.min(amount * 0.015, 2000)
        const creditAmount = amount - fee

        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "SUCCESS", webhookPayload: body },
          }),
          prisma.wallet.upsert({
            where: { userId: payment.userId },
            update: { balance: { increment: creditAmount } },
            create: { userId: payment.userId, balance: creditAmount, currency: "NGN" },
          }),
          prisma.transaction.update({
            where: { reference },
            data: { status: "SUCCESS", meta: { provider: "Monnify", grossAmount: amount, fee, netAmount: creditAmount } },
          }),
          prisma.auditLog.create({
            data: {
              actorId: payment.userId,
              action: "WALLET_FUND_SUCCESS",
              resourceType: "Payment",
              resourceId: payment.id,
              diffJson: { amount: creditAmount, grossAmount: amount, fee, reference },
            },
          }),
        ])
      }
    } else if (status === "FAILED") {
      if (payment.status !== "FAILED") {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED", webhookPayload: body },
          }),
          prisma.transaction.update({ where: { reference }, data: { status: "FAILED" } }),
          prisma.auditLog.create({
            data: {
              actorId: payment.userId,
              action: "WALLET_FUND_FAILED",
              resourceType: "Payment",
              resourceId: payment.id,
              diffJson: { amount, reference },
            },
          }),
        ])
      }
    } else {
      // Non-final status; just attach payload for visibility
      await prisma.payment.update({
        where: { id: payment.id },
        data: { webhookPayload: body },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Webhook processing failed", detail: String(err) }, { status: 500 })
  }
}