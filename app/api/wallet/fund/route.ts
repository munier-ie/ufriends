import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import crypto from "crypto"
import { monnifyCreateReservedAccount, monnifyInitTransaction } from "@/lib/monnify"
import { paymentPointCreateVirtualAccount } from "@/lib/paymentpoint"
import { z } from "zod"

// Arcjet protection via shared helper

function deriveVirtualAccountNumber(userId: string) {
  const bytes = crypto.createHash("sha256").update(userId).digest()
  let digits = ""
  for (let i = 0; i < bytes.length && digits.length < 10; i++) {
    digits += (bytes[i] % 10).toString()
  }
  return `9${digits}`
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const FundSchema = z.object({
      provider: z.enum(["paymentpoint", "bank-transfer"]),
      amount: z.number().positive(),
    })
    const parsed = FundSchema.safeParse({
      provider: String(body?.provider || "").toLowerCase(),
      amount: Number(body?.amount ?? 0),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }
    const { provider, amount } = parsed.data

    const reference = `FUND-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const gateway = provider === "bank-transfer" ? "Monnify" : "PaymentPoint"

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: auth.user.id,
          type: "WALLET_CREDIT",
          amount,
          status: "PENDING",
          reference,
          meta: { provider },
        },
      }),
      prisma.payment.create({
        data: {
          userId: auth.user.id,
          gateway,
          amount,
          status: "INIT",
          reference,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "WALLET_FUND_INIT",
          resourceType: "Payment",
          resourceId: reference,
          diffJson: { amount, provider },
        },
      }),
    ])

    if (provider === "paymentpoint") {
      let accountNumber: string | undefined
      let bankName = "PaymentPoint Partner Bank"
      let wasCreated = false
      try {
        const va = await prisma.virtualAccount.findUnique({ where: { userId: auth.user.id } })
        accountNumber = va?.accountNumber
        bankName = va?.bankName || bankName
        if (!accountNumber) {
          const userInfo = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: { email: true, profile: { select: { name: true } } },
          })
          const accountName = userInfo?.profile?.name || (userInfo?.email?.split("@")[0] || "UFriends User")
          const customerEmail = userInfo?.email || ""

          const created = await paymentPointCreateVirtualAccount({ email: customerEmail, name: accountName })
          accountNumber = created.accountNumber
          bankName = created.bankName || bankName

          await prisma.virtualAccount.upsert({
            where: { userId: auth.user.id },
            update: { accountNumber, bankName },
            create: { userId: auth.user.id, accountNumber, bankName },
          })
          wasCreated = true
        }

        await prisma.auditLog
          .create({
            data: {
              actorId: auth.user.id,
              action: wasCreated
                ? "PAYMENTPOINT_VIRTUAL_ACCOUNT_CREATED_FOR_FUNDING"
                : "PAYMENTPOINT_VIRTUAL_ACCOUNT_ACCESSED_FOR_FUNDING",
              resourceType: "VirtualAccount",
              resourceId: accountNumber,
              diffJson: { accountNumber, bankName, wasCreated, fundingReference: reference },
            },
          })
          .catch(() => {})
      } catch {
        // Fallback: derive deterministic account number
        accountNumber = deriveVirtualAccountNumber(auth.user.id)
      }

      const instructions = `Transfer ₦${amount.toLocaleString()} to your PaymentPoint virtual account ${accountNumber} at ${bankName}. Reference: ${reference}. Wallet credits after confirmation.`
      return NextResponse.json({
        ok: true,
        provider: "PaymentPoint",
        reference,
        instructions,
        virtualAccount: { accountNumber, bankName },
      })
    }

    if (provider === "bank-transfer") {
      // Fetch or derive virtual account details
      let accountNumber: string | undefined
      let bankName = "Moniepoint Microfinance Bank"
      let wasCreated = false
      try {
        const va = await prisma.virtualAccount.findUnique({ where: { userId: auth.user.id } })
        accountNumber = va?.accountNumber
        bankName = va?.bankName || bankName
        if (!accountNumber) {
          // Create Monnify reserved account for bank transfer
          const userInfo = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: { email: true, profile: { select: { name: true } } },
          })
          const accountName = userInfo?.profile?.name || (userInfo?.email?.split("@")[0] || "UFriends User")
          const customerName = accountName
          const customerEmail = userInfo?.email || ""
          const accountReference = `VA-${auth.user.id}`

          const reserved = await monnifyCreateReservedAccount({
            accountReference,
            accountName,
            customerName,
            customerEmail,
          })
          accountNumber = reserved.accountNumber
          bankName = reserved.bankName || bankName

          await prisma.virtualAccount.upsert({
            where: { userId: auth.user.id },
            update: { accountNumber, bankName },
            create: { userId: auth.user.id, accountNumber, bankName },
          })
          wasCreated = true
        }

        await prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: wasCreated ? "VIRTUAL_ACCOUNT_CREATED_FOR_FUNDING" : "VIRTUAL_ACCOUNT_ACCESSED_FOR_FUNDING",
            resourceType: "VirtualAccount",
            resourceId: accountNumber,
            diffJson: { accountNumber, bankName, wasCreated, fundingReference: reference },
          },
        })
      } catch {}

      // Prepare Monnify transaction init input
      const userInfo = await prisma.user.findUnique({
        where: { id: auth.user.id },
        select: { email: true, profile: { select: { name: true } } },
      })
      const customerName = userInfo?.profile?.name || (userInfo?.email?.split("@")[0] || "UFriends User")
      const customerEmail = userInfo?.email || ""
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5070"}/dashboard/wallet`

      const init = await monnifyInitTransaction({
        amount,
        customerName,
        customerEmail,
        redirectUrl,
        paymentReference: reference,
      })
      return NextResponse.json({ ok: true, provider: "Monnify", reference, payment: init })
    }

    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: "Funding initiation failed", detail: String(err) }, { status: 500 })
  }
}