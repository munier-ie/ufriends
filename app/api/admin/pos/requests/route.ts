import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/admin/pos/requests - list all POS requests with optional filters
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const providerFilter = searchParams.get("provider") || undefined
    const statusFilter = searchParams.get("status") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10)

    const all = await prisma.posRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, profile: { select: { name: true, phone: true } } } },
        assignedAgent: { select: { id: true, location: true } },
      },
    })

    let filtered = all.map((r) => {
      const info = (r.businessInfo || {}) as any
      const uiStatus =
        r.status === "PENDING"
          ? "Pending"
          : r.status === "PROCESSING"
            ? "Approved"
            : r.status === "COMPLETED"
              ? "Completed"
              : r.status === "FAILED"
                ? "Rejected"
                : String(r.status)
      return {
        id: r.id,
        provider: info.provider || "Unknown",
        status: uiStatus,
        createdAt: r.createdAt,
        userEmail: r.user?.email || "",
        userName: r.user?.profile?.name || "",
        userPhone: r.user?.profile?.phone || "",
        assignedAgentId: r.assignedAgentId || null,
        assignedAgentLocation: r.assignedAgent?.location || null,
        formData: info.formData || {},
        documents: info.documents || {},
        adminNotes: info.adminNotes || null,
        evidenceUrl: info.evidenceUrl || null,
      }
    })

    if (providerFilter) filtered = filtered.filter((r) => r.provider === providerFilter)
    if (statusFilter) filtered = filtered.filter((r) => r.status === statusFilter)

    const total = filtered.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageItems = filtered.slice(start, end)

    return NextResponse.json({ ok: true, total, page, pageSize, requests: pageItems })
  } catch (err) {
    return NextResponse.json({ error: "Failed to list POS requests", detail: String(err) }, { status: 500 })
  }
}