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

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)))
    const direction = searchParams.get("direction")
    const status = searchParams.get("status")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const where: any = { userId: auth.user.id }

    if (direction === "credit") {
      where.type = { endsWith: "CREDIT" }
    } else if (direction === "debit") {
      where.type = { endsWith: "DEBIT" }
    }

    if (status && ["PENDING", "SUCCESS", "FAILED"].includes(status)) {
      where.status = status
    }

    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
      }
    }

    const list = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    })

    return NextResponse.json({ page, pageSize, transactions: list })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch transactions", detail: String(err) }, { status: 500 })
  }
}