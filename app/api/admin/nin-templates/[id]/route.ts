import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { z } from "zod"

// GET /api/admin/nin-templates/:id
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const tpl = await prisma.ninTemplate.findUnique({ where: { id } })
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    return NextResponse.json({ ok: true, template: tpl })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch template", detail: String(err) }, { status: 500 })
  }
}

// PATCH /api/admin/nin-templates/:id
// Body: partial { name, type, templateContent, placeholders, isActive }
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const Schema = z.object({
      name: z.string().trim().min(2).optional(),
      type: z.enum(["digital", "physical", "nims"]).optional(),
      templateContent: z.string().trim().min(20).optional(),
      placeholders: z.array(z.string().trim().min(1)).optional(),
      isActive: z.boolean().optional(),
    })

    const raw = await req.json().catch(() => ({}))
    const parsed = Schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }

    const existing = await prisma.ninTemplate.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    let placeholders = parsed.data.placeholders
    if (!placeholders && parsed.data.templateContent) {
      const matches = Array.from(parsed.data.templateContent.matchAll(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g)).map((m) => `{{${m[1]}}}`)
      placeholders = [...new Set(matches)]
    }

    const updated = await prisma.ninTemplate.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
        ...(parsed.data.templateContent !== undefined ? { templateContent: parsed.data.templateContent } : {}),
        ...(placeholders !== undefined ? { placeholders } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
        updatedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "ADMIN_NIN_TEMPLATE_UPDATE",
        resourceType: "NinTemplate",
        resourceId: id,
        diffJson: parsed.data,
      },
    })

    return NextResponse.json({ ok: true, template: updated })
  } catch (err) {
    return NextResponse.json({ error: "Failed to update template", detail: String(err) }, { status: 500 })
  }
}

// DELETE /api/admin/nin-templates/:id
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const existing = await prisma.ninTemplate.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    await prisma.ninTemplate.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "ADMIN_NIN_TEMPLATE_DELETE",
        resourceType: "NinTemplate",
        resourceId: id,
        diffJson: { id },
      },
    })

    return NextResponse.json({ ok: true, deleted: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete template", detail: String(err) }, { status: 500 })
  }
}
