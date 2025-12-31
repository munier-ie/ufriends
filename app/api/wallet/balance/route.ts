import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"

// Arcjet protection via shared helper

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: auth.user.id } })
    if (!wallet) {
      return NextResponse.json({ balance: 0, currency: "NGN", updatedAt: null })
    }

    const balanceNum = Number(wallet.balance ?? 0)
    return NextResponse.json({ balance: balanceNum, currency: wallet.currency, updatedAt: wallet.updatedAt })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch wallet balance", detail: String(err) }, { status: 500 })
  }
}