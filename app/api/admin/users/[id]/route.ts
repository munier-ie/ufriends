import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"

// Centralized Arcjet protection via shared helper

// PATCH /api/admin/users/[id] - update role (Next.js 15+: params is a Promise)
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const role = body?.role as "user" | "agent" | "admin" | undefined

    if (!id || !role) {
      return NextResponse.json({ error: "Missing id or role" }, { status: 400 })
    }

    const prismaRole = role === "admin" ? "ADMIN" : role === "agent" ? "MARKETER" : "USER"

    const updated = await prisma.user.update({ where: { id }, data: { role: prismaRole as any } })

    await prisma.auditLog
      .create({
        data: {
          actorId: auth.user.id,
          action: "USER_ROLE_UPDATE",
          resourceType: "User",
          resourceId: id,
          diffJson: { from: updated.role, to: prismaRole },
        },
      })
      .catch(() => {})

    return NextResponse.json({ ok: true, user: { id, role } })
  } catch (err) {
    return NextResponse.json({ error: "Failed to update role", detail: String(err) }, { status: 500 })
  }
}