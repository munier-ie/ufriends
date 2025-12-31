import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { z } from "zod"

// Centralized Arcjet protection via shared helper

// GET /api/admin/wallet/summary?top=10
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const topSchema = z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(10)
    const topRaw = Number(searchParams.get("top") ?? NaN)
    const topParsed = topSchema.safeParse(Number.isFinite(topRaw) ? topRaw : undefined)
    const topN = topParsed.success ? topParsed.data : 10

    const wallets = await prisma.wallet.findMany({
      include: { user: { select: { email: true, role: true, createdAt: true, profile: { select: { name: true } } } } },
    })

    const totalUsersWithWallet = wallets.length
    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0)
    const currency = wallets[0]?.currency || "NGN"

    const topWallets = wallets
      .sort((a, b) => Number(b.balance) - Number(a.balance))
      .slice(0, topN)
      .map((w) => ({
        userId: w.userId,
        email: w.user?.email || "",
        name: w.user?.profile?.name || (w.user?.email?.split("@")[0] || "UFriends User"),
        role: w.user?.role || "USER",
        balance: Number(w.balance),
        currency: w.currency,
        joined: w.user?.createdAt?.toISOString?.() || undefined,
      }))

    const recentTxCount = await prisma.transaction.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    })

    return NextResponse.json({
      ok: true,
      summary: {
        totalUsersWithWallet,
        totalBalance,
        currency,
        recentTxCount7d: recentTxCount,
        topWallets,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to compute wallet summary", detail: String(err) }, { status: 500 })
  }
}