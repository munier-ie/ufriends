import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { monnifyCreateReservedAccount } from "@/lib/monnify"
import { paymentPointCreateVirtualAccount } from "@/lib/paymentpoint"

// Arcjet protection via shared helper

export async function GET(req: NextRequest) {
  try {
    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    // Fetch existing accounts from DB
    const va = await prisma.virtualAccount.findUnique({
      where: { userId: auth.user.id }
    })

    let monnifyAccountNumber = va?.monnifyAccountNumber || va?.accountNumber
    let monnifyBankName = va?.monnifyBankName || va?.bankName || "Moniepoint Microfinance Bank"
    let monnifyAccountName = va?.monnifyAccountName || ""

    let paymentpointAccountNumber = va?.ppAccountNumber
    let paymentpointBankName = va?.ppBankName || "PaymentPoint Partner Bank"
    let paymentpointAccountName = va?.ppAccountName || ""

    // Optional fee display strings (configurable via env)
    const monnifyFeesDisplay =
      process.env.MONNIFY_VA_FEES_DISPLAY || "1.5% Fee (Capped at ₦2,000)"
    const paymentpointFeesDisplay =
      process.env.PAYMENTPOINT_VA_FEES_DISPLAY || "0.5% Fee (Capped at ₦50)"

    // If Monnify account is missing, try to create/fetch it (backwards compatibility)
    if (!monnifyAccountNumber) {
      try {
        const email = auth.user.email || ""
        const displayName = (auth.user as any).name || (email.split("@")[0] || "UFriends User")
        const accountReference = `VA-${auth.user.id}`

        const reserved = await monnifyCreateReservedAccount({
          accountReference,
          accountName: displayName,
          customerName: displayName,
          customerEmail: email,
        })
        monnifyAccountNumber = reserved.accountNumber
        monnifyBankName = reserved.bankName || monnifyBankName
        monnifyAccountName = displayName

        // Persist it
        await prisma.virtualAccount.upsert({
          where: { userId: auth.user.id },
          update: {
            monnifyAccountNumber,
            monnifyBankName,
            monnifyAccountName,
            accountNumber: monnifyAccountNumber,
            bankName: monnifyBankName
          },
          create: {
            userId: auth.user.id,
            monnifyAccountNumber,
            monnifyBankName,
            monnifyAccountName,
            accountNumber: monnifyAccountNumber,
            bankName: monnifyBankName
          },
        })
      } catch { }
    }

    return NextResponse.json({
      monnify: {
        bankName: monnifyBankName,
        accountNumber: monnifyAccountNumber,
        accountName: monnifyAccountName,
        feesDisplay: monnifyFeesDisplay,
      },
      paymentpoint: {
        bankName: paymentpointBankName,
        accountNumber: paymentpointAccountNumber,
        accountName: paymentpointAccountName,
        feesDisplay: paymentpointFeesDisplay,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch virtual accounts", detail: String(err) }, { status: 500 })
  }
}
