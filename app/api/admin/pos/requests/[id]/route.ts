import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// PATCH /api/admin/pos/requests/:id - update status/metadata
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const { status, assignedAgentId, evidenceUrl, adminNotes } = body as {
      status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
      assignedAgentId?: string | null
      evidenceUrl?: string | null
      adminNotes?: string | null
    }

    const existing = await prisma.posRequest.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const info = (existing.businessInfo || {}) as any
    const newInfo = {
      ...info,
      ...(evidenceUrl !== undefined ? { evidenceUrl } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
    }

    const updated = await prisma.posRequest.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(assignedAgentId !== undefined ? { assignedAgentId: assignedAgentId || null } : {}),
        businessInfo: newInfo,
      },
    })

    if (status) {
      const { sendNotification } = await import("@/lib/notifications")
      const provider = (updated.businessInfo as any)?.provider || "POS"
      await sendNotification({
        userId: updated.userId,
        type: `POS_${status}`,
        title: `POS Request Update: ${status}`,
        body: `Your POS request (${provider}) is now ${status.toLowerCase()}.${adminNotes ? ` Note: ${adminNotes}` : ""}`,
        email: {
          subject: `POS Request Update - UFriends`,
          html: `<h3>POS Request Update</h3><p>Your POS request for <strong>${provider}</strong> has been updated to <strong>${status}</strong>.</p>${adminNotes ? `<p><strong>Admin Note:</strong> ${adminNotes}</p>` : ""}`
        }
      })
    }

    return NextResponse.json({ ok: true, id: updated.id })

  } catch (err) {
    return NextResponse.json({ error: "Failed to update POS request", detail: String(err) }, { status: 500 })
  }
}

// DELETE /api/admin/pos/requests/:id - delete a request
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await ctx.params
    await prisma.posRequest.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete POS request", detail: String(err) }, { status: 500 })
  }
}