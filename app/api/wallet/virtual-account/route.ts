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
    let accountName: string | undefined
    let wasCreated = false

    const va = await prisma.virtualAccount.findUnique({ where: { userId: auth.user.id } })

    // Priority: Monnify, then PaymentPoint, then Legacy
    accountNumber = va?.monnifyAccountNumber || va?.ppAccountNumber || va?.accountNumber
    bankName = (va?.monnifyAccountNumber ? va?.monnifyBankName : (va?.ppAccountNumber ? va?.ppBankName : (va?.bankName || bankName))) || bankName
    accountName = (va?.monnifyAccountNumber ? va?.monnifyAccountName : (va?.ppAccountNumber ? va?.ppAccountName : "")) || ""

    if (!accountNumber) {
      try {
        // Build Monnify reserved account request
        const userInfo = await prisma.user.findUnique({
          where: { id: auth.user.id },
          select: { email: true, profile: { select: { name: true } } },
        })
        const dispName = userInfo?.profile?.name || (userInfo?.email?.split("@")[0] || "UFriends User")
        const accountReference = `VA-${auth.user.id}`

        const reserved = await monnifyCreateReservedAccount({
          accountReference,
          accountName: dispName,
          customerName: dispName,
          customerEmail: userInfo?.email || "",
        })
        accountNumber = reserved.accountNumber
        bankName = reserved.bankName || bankName
        accountName = dispName

        await prisma.virtualAccount.upsert({
          where: { userId: auth.user.id },
          update: {
            monnifyAccountNumber: accountNumber,
            monnifyBankName: bankName,
            monnifyAccountName: accountName,
            accountNumber,
            bankName
          },
          create: {
            userId: auth.user.id,
            monnifyAccountNumber: accountNumber,
            monnifyBankName: bankName,
            monnifyAccountName: accountName,
            accountNumber,
            bankName
          },
        })
        wasCreated = true

        await prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "VIRTUAL_ACCOUNT_CREATED",
            resourceType: "VirtualAccount",
            resourceId: accountNumber,
            diffJson: { accountNumber, bankName, wasCreated: true },
          },
        }).catch(() => { })
      } catch {
        // Fallback to deriving deterministic account number
        accountNumber = deriveVirtualAccountNumber(auth.user.id)
        bankName = "UFriends Virtual Bank"
        accountName = auth.user.email?.split("@")[0] || "User"

        await prisma.virtualAccount.upsert({
          where: { userId: auth.user.id },
          update: { accountNumber, bankName },
          create: { userId: auth.user.id, accountNumber, bankName },
        })
        await prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "DERIVED_VIRTUAL_ACCOUNT_CREATED",
            resourceType: "VirtualAccount",
            resourceId: accountNumber,
            diffJson: { accountNumber, bankName, wasCreated: true },
          },
        }).catch(() => { })
      }
    }

    return NextResponse.json({
      ok: true,
      virtualAccount: {
        accountNumber,
        bankName,
        accountName: accountName || ""
      }
    })
  } catch (err) {
    console.error("GET virtual-account error:", err)
    return NextResponse.json({
      error: "Failed to fetch virtual account",
      detail: String(err),
      location: "api/wallet/virtual-account"
    }, { status: 500 })
  }
}
