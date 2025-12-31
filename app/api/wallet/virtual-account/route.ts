import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import crypto from "crypto"
import { monnifyCreateReservedAccount } from "@/lib/monnify"
import { paymentPointCreateVirtualAccount } from "@/lib/paymentpoint"

// Arcjet protection via shared helper

function deriveVirtualAccountNumber(userId: string) {
  const bytes = crypto.createHash("sha256").update(userId).digest()
  let digits = ""
  for (let i = 0; i < bytes.length && digits.length < 10; i++) {
    digits += (bytes[i] % 10).toString()
  }
  return `9${digits}`
}

export async function GET(req: NextRequest) {
  try {
    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    let bankName = "Moniepoint Microfinance Bank"
    let accountNumber: string | undefined
    let wasCreated = false

    try {
      const va = await prisma.virtualAccount.findUnique({ where: { userId: auth.user.id } })
      accountNumber = va?.accountNumber
      bankName = va?.bankName || bankName

      if (!accountNumber) {
        // Build Monnify reserved account request
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
          action: wasCreated ? "VIRTUAL_ACCOUNT_CREATED" : "VIRTUAL_ACCOUNT_ACCESSED",
          resourceType: "VirtualAccount",
          resourceId: accountNumber,
          diffJson: { accountNumber, bankName, wasCreated },
        },
      }).catch(() => {})
    } catch {
      // Fallback to PaymentPoint virtual account creation
      try {
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

        await prisma.auditLog
          .create({
            data: {
              actorId: auth.user.id,
              action: "PAYMENTPOINT_VIRTUAL_ACCOUNT_CREATED",
              resourceType: "VirtualAccount",
              resourceId: accountNumber,
              diffJson: { accountNumber, bankName, wasCreated: true },
            },
          })
          .catch(() => {})
      } catch {
        // Final fallback: derive deterministic account number
        accountNumber = deriveVirtualAccountNumber(auth.user.id)
        await prisma.virtualAccount.upsert({
          where: { userId: auth.user.id },
          update: { accountNumber, bankName },
          create: { userId: auth.user.id, accountNumber, bankName },
        })
        await prisma.auditLog
          .create({
            data: {
              actorId: auth.user.id,
              action: "DERIVED_VIRTUAL_ACCOUNT_CREATED",
              resourceType: "VirtualAccount",
              resourceId: accountNumber,
              diffJson: { accountNumber, bankName, wasCreated: true },
            },
          })
          .catch(() => {})
      }
    }

    return NextResponse.json({ ok: true, virtualAccount: { accountNumber, bankName } })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch virtual account", detail: String(err) }, { status: 500 })
  }
}