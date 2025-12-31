import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"

// Arcjet protection via shared helper

// GET /api/admin/audit-logs?action=...
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action") || undefined
    const take = Number(searchParams.get("take") || 100)
    const where: any = action ? { action } : {}

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(take, 500),
    })

    return NextResponse.json({ ok: true, logs })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch audit logs", detail: String(err) }, { status: 500 })
  }
}