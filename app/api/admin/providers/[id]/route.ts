import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"

// Arcjet protection via shared helper

// PATCH /api/admin/providers/:id
// Body: partial update { name?, category?, apiBaseUrl?, priority?, isActive?, configJson? }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await ctx.params
    const Schema = z.object({
      name: z.string().trim().min(2).optional(),
      category: z.string().trim().min(1).optional(),
      apiBaseUrl: z.string().url().optional(),
      priority: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
      configJson: z.record(z.any()).optional(),
    })

    const body = await req.json().catch(() => ({}))
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }

    const raw = parsed.data
    const updates = {
      ...(raw.name !== undefined ? { name: sanitizer.parse(raw.name) } : {}),
      ...(raw.category !== undefined ? { category: sanitizer.parse(raw.category) } : {}),
      ...(raw.apiBaseUrl !== undefined ? { apiBaseUrl: sanitizer.parse(raw.apiBaseUrl) } : {}),
      ...(raw.priority !== undefined ? { priority: raw.priority } : {}),
      ...(raw.isActive !== undefined ? { isActive: raw.isActive } : {}),
      ...(raw.configJson !== undefined ? { configJson: raw.configJson } : {}),
    }
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const existing = await prisma.serviceProvider.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Provider not found" }, { status: 404 })

    const updated = await prisma.serviceProvider.update({
      where: { id },
      data: {
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.category !== undefined ? { category: updates.category } : {}),
        ...(updates.apiBaseUrl !== undefined ? { apiBaseUrl: updates.apiBaseUrl } : {}),
        ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
        ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
        ...(updates.configJson !== undefined ? { configJson: updates.configJson } : {}),
        updatedAt: new Date(),
      },
      include: { apiKeys: { select: { id: true, keyName: true } } },
    })

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "ADMIN_PROVIDER_UPDATE",
        resourceType: "Provider",
        resourceId: id,
        diffJson: updates,
      },
    })

    const item = {
      id: updated.id,
      name: updated.name,
      category: updated.category,
      isActive: updated.isActive,
      priority: updated.priority,
      apiBaseUrl: updated.apiBaseUrl,
      configJson: updated.configJson,
      apiKeys: updated.apiKeys,
      updatedAt: updated.updatedAt,
    }

    return NextResponse.json({ ok: true, provider: item })
  } catch (err) {
    return NextResponse.json({ error: "Failed to update provider", detail: String(err) }, { status: 500 })
  }
}

// DELETE /api/admin/providers/:id
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await ctx.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const existing = await prisma.serviceProvider.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Provider not found" }, { status: 404 })

    await prisma.serviceProvider.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "ADMIN_PROVIDER_DELETE",
        resourceType: "Provider",
        resourceId: id,
        diffJson: { name: existing.name, category: existing.category },
      },
    })

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete provider", detail: String(err) }, { status: 500 })
  }
}