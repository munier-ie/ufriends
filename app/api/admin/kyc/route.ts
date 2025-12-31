import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"

// Centralized Arcjet protection via shared helper

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") as ("PENDING" | "APPROVED" | "REJECTED" | null)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const where: any = {}
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status
    }
    if (from || to) {
      where.submittedAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
      }
    }

    const list = await prisma.kycRequest.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: { documents: true, user: true },
      take: 200,
    })

    const result = list.map((k: any) => ({
      id: k.id,
      userId: k.userId,
      type: k.type,
      status: k.status,
      submittedAt: k.submittedAt,
      reviewedAt: k.reviewedAt,
      user: { id: k.user.id, email: k.user.email },
      documents: (k.documents || []).map((d: any) => ({ id: d.id, type: d.type, fileUrl: d.fileUrl })),
    }))

    return NextResponse.json({ items: result })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch KYC requests", detail: String(err) }, { status: 500 })
  }
}