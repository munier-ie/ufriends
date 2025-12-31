import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyPaymentPointSignature, getPPReference, getPPStatus, getPPAmount } from "@/lib/paymentpoint"

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYMENTPOINT_SECRET_KEY ||
      process.env.PAYMENTPOINT_WEBHOOK_SECRET ||
      process.env.PAYMENTPOINT_API_SECRET ||
      process.env.PAYMENTPOINT_KEY || ""
    const raw = await req.text()
    const signature = req.headers.get("x-paymentpoint-signature") ||
      req.headers.get("paymentpoint-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("signature")

    if (!secret || !verifyPaymentPointSignature(raw, signature, secret)) {
      console.error("PaymentPoint Webhook: Invalid signature or missing secret. Using secret prefix:", secret.slice(0, 4))
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const body = JSON.parse(raw)
    const reference = getPPReference(body)
    const status = (getPPStatus(body) || "").toUpperCase()
    const amount = getPPAmount(body)

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    let payment = await prisma.payment.findUnique({ where: { reference } })

    // If no payment record found, it might be a direct transfer to a reserved account
    if (!payment) {
      console.log(`PaymentPoint Webhook: Processing potential direct transfer for ref ${reference}`)

      // Robust account number extraction
      const data = body?.data || body
      const vaAccountNum = data?.accountNumber ||
        data?.destinationAccountNumber ||
        data?.beneficiaryAccountNumber ||
        data?.bankAccount?.accountNumber ||
        (Array.isArray(data?.bankAccounts) ? data.bankAccounts[0]?.accountNumber : null) ||
        body?.account_number

      const va = await prisma.virtualAccount.findFirst({
        where: {
          OR: [
            { ppAccountReference: reference },
            { ppAccountNumber: String(vaAccountNum || "NEVER_MATCH") }
          ]
        }
      })

      if (va) {
        // Idempotent creation of payment and transaction
        payment = await prisma.payment.upsert({
          where: { reference },
          update: { webhookPayload: body },
          create: {
            userId: va.userId,
            amount: amount,
            reference: reference,
            provider: "PaymentPoint",
            status: "INIT", // Fixed: must be INIT, SUCCESS, or FAILED
            type: "WALLET_FUND",
            webhookPayload: body
          }
        })

        await prisma.transaction.upsert({
          where: { reference },
          update: { meta: { provider: "PaymentPoint", isDirectTransfer: true } },
          create: {
            userId: va.userId,
            amount: amount,
            reference: reference,
            type: "WALLET_FUND_CREDIT",
            status: "PENDING",
            description: "Direct Bank Transfer (PaymentPoint)",
            meta: { provider: "PaymentPoint", isDirectTransfer: true }
          }
        }).catch(() => { })
      }
    }

    if (!payment) {
      console.warn(`PaymentPoint Webhook: No user or payment found for reference ${reference}. Body: ${raw}`)
      return NextResponse.json({ ok: true })
    }

    const userId = payment.userId

    if (status === "SUCCESS" || status === "COMPLETED" || status === "TRUE") {
      if (payment.status !== "SUCCESS") {
        // Calculate fee: 0.5% capped at 50 NGN
        const fee = Math.min(amount * 0.005, 50)
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
            data: { status: "SUCCESS", meta: { provider: "PaymentPoint", grossAmount: amount, fee, netAmount: creditAmount } },
          }),
          prisma.auditLog.create({
            data: {
              actorId: payment.userId,
              action: "WALLET_FUND_SUCCESS",
              resourceType: "Payment",
              resourceId: payment.id,
              diffJson: { amount: creditAmount, grossAmount: amount, fee, reference, provider: "PaymentPoint" },
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