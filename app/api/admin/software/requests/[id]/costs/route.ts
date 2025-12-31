import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/admin/software/requests/:id/costs
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await ctx.params
    const request = await prisma.softwareRequest.findUnique({ where: { id } })
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const form = (request.formJson || {}) as any
    const costs = Array.isArray(form.costs) ? form.costs : []
    const total = costs.reduce((sum: number, c: any) => sum + Number(c?.cost || 0), 0)

    return NextResponse.json({ ok: true, items: costs, total })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

// POST /api/admin/software/requests/:id/costs
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await ctx.params
    const body = await req.json()
    const cost = Number(body?.cost)
    const description = String(body?.description || "")

    if (!(cost > 0)) {
      return NextResponse.json({ error: "Invalid cost" }, { status: 400 })
    }

    const existing = await prisma.softwareRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const form = (existing.formJson || {}) as any
    const costs = Array.isArray(form.costs) ? form.costs : []
    const entry = { requestId: id, cost, description, addedAt: new Date().toISOString() }
    const updatedForm = { ...form, costs: [...costs, entry] }

    const updated = await prisma.softwareRequest.update({
      where: { id },
      data: { formJson: updatedForm },
    })

    const { sendNotification } = await import("@/lib/notifications")
    await sendNotification({
      userId: updated.userId,
      type: "SOFTWARE_COST_UPDATE",
      title: "Software Project Cost Update",
      body: `A new cost entry of ₦${cost.toLocaleString()} (${description}) has been added to your project: ${updated.subType}.`,
      email: {
        subject: "Software Project Cost Update - UFriends",
        html: `<h3>Project Cost Update</h3><p>An admin has added a new cost entry to your software project <strong>${updated.subType}</strong>.</p><p><strong>Amount:</strong> ₦${cost.toLocaleString()}</p><p><strong>Description:</strong> ${description}</p><p>Please log in to your dashboard to view the updated project total.</p>`
      }
    })

    return NextResponse.json({ ok: true, item: entry, request: updated })

  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}