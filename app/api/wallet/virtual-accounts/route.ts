import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { monnifyCreateReservedAccount } from "@/lib/monnify"
import { paymentPointCreateVirtualAccount } from "@/lib/paymentpoint"

// Arcjet protection via shared helper

export async function GET(req: NextRequest) {
  try {
    // Rate limit / shield via shared helper
    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    // Common display name/email for account naming
    const email = auth.user.email || ""
    const displayName = (auth.user as any).name || (email.split("@")[0] || "UFriends User")

    // Optional fee display strings (configurable via env)
    const monnifyFeesDisplay =
      process.env.MONNIFY_VA_FEES_DISPLAY || "Provider fees apply; BVN/NIN required to generate."
    const paymentpointFeesDisplay =
      process.env.PAYMENTPOINT_VA_FEES_DISPLAY || "Provider fees apply; see PaymentPoint docs for details."

    // Build Monnify reserved account
    let monnifyAccountNumber: string | undefined
    let monnifyBankName = "Moniepoint Microfinance Bank"
    try {
      const accountReference = `VA-${auth.user.id}`
      const customerEmail = email
      const accountName = displayName
      const customerName = accountName

      const reserved = await monnifyCreateReservedAccount({
        accountReference,
        accountName,
        customerName,
        customerEmail,
      })
      monnifyAccountNumber = reserved.accountNumber
      monnifyBankName = reserved.bankName || monnifyBankName
    } catch {}

    // Build PaymentPoint virtual account (may fail open depending on provider status)
    let paymentpointAccountNumber: string | undefined
    let paymentpointBankName = "PaymentPoint Partner Bank"
    try {
      const created = await paymentPointCreateVirtualAccount({ email, name: displayName })
      paymentpointAccountNumber = created.accountNumber
      paymentpointBankName = created.bankName || paymentpointBankName
    } catch {}

    return NextResponse.json({
      monnify: {
        bankName: monnifyBankName,
        accountNumber: monnifyAccountNumber,
        feesDisplay: monnifyFeesDisplay,
      },
      paymentpoint: {
        bankName: paymentpointBankName,
        accountNumber: paymentpointAccountNumber,
        feesDisplay: paymentpointFeesDisplay,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch virtual accounts", detail: String(err) }, { status: 500 })
  }
}