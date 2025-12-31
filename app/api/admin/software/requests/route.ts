import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/admin/software/requests
// Returns paginated list of software requests for admin
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = (searchParams.get("status") || "").trim().toUpperCase()
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)))

    const where: any = {}
    if (["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(status)) {
      where.status = status
    }

    const [items, total] = await Promise.all([
      prisma.softwareRequest.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { assignment: true, deliveryFiles: true, user: { select: { id: true, email: true, profile: true } } },
      }),
      prisma.softwareRequest.count({ where }),
    ])

    return NextResponse.json({ ok: true, items, total, page, pageSize })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}