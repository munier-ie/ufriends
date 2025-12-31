import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyPaymentPointSignature, getPPReference, getPPStatus, getPPAmount } from "@/lib/paymentpoint"

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYMENTPOINT_WEBHOOK_SECRET || process.env.PAYMENTPOINT_KEY || ""
    const raw = await req.text()
    const signature = req.headers.get("x-paymentpoint-signature") || req.headers.get("paymentpoint-signature") || req.headers.get("x-signature")

    if (!secret || !verifyPaymentPointSignature(raw, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const body = JSON.parse(raw)
    const reference = getPPReference(body)
    const status = (getPPStatus(body) || "").toUpperCase()
    const amount = getPPAmount(body)

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({ where: { reference } })
    if (!payment) {
      return NextResponse.json({ ok: true })
    }

    if (status === "SUCCESS") {
      if (payment.status !== "SUCCESS") {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "SUCCESS", webhookPayload: body },
          }),
          prisma.wallet.upsert({
            where: { userId: payment.userId },
            update: { balance: { increment: amount } },
            create: { userId: payment.userId, balance: amount, currency: "NGN" },
          }),
          prisma.transaction.update({
            where: { reference },
            data: { status: "SUCCESS", meta: { provider: "PaymentPoint" } },
          }),
          prisma.auditLog.create({
            data: {
              actorId: payment.userId,
              action: "WALLET_FUND_SUCCESS",
              resourceType: "Payment",
              resourceId: payment.id,
              diffJson: { amount, reference, provider: "PaymentPoint" },
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
              diffJson: { amount, reference, provider: "PaymentPoint" },
            },
          }),
        ])
      }
    } else {
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