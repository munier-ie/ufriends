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

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({ where: { reference } })
    if (!payment) {
      // Unknown reference; ignore gracefully to avoid leaking information
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
            data: { status: "SUCCESS", meta: { provider: "Monnify" } },
          }),
          prisma.auditLog.create({
            data: {
              actorId: payment.userId,
              action: "WALLET_FUND_SUCCESS",
              resourceType: "Payment",
              resourceId: payment.id,
              diffJson: { amount, reference },
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