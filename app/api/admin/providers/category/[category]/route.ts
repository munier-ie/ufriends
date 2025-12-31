import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { z } from "zod"

// Arcjet protection via shared helper

// PATCH /api/admin/providers/:category
// Body: { activeProviderId: string, priorities?: Record<string, number> }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ category: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const p = await ctx.params
    const category = decodeURIComponent(p.category)
    const body = await req.json()
    const Schema = z.object({
      activeProviderId: z.string().min(1),
      priorities: z.record(z.string().min(1), z.number().int().min(0)).optional(),
    })
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }
    const { activeProviderId, priorities } = parsed.data

    const providers = await prisma.serviceProvider.findMany({ where: { category } })
    if (providers.length === 0) return NextResponse.json({ error: "Category not found" }, { status: 404 })

    const prevActive = providers.find((p) => p.isActive)?.id || null
    const ids = providers.map((p) => p.id)
    if (!ids.includes(activeProviderId)) {
      return NextResponse.json({ error: "activeProviderId not in category" }, { status: 400 })
    }

    const tx = [] as any[]
    for (const p of providers) {
      const makeActive = p.id === activeProviderId
      tx.push(
        prisma.serviceProvider.update({
          where: { id: p.id },
          data: {
            isActive: makeActive,
            ...(priorities && priorities[p.id] !== undefined ? { priority: priorities[p.id] } : {}),
            updatedAt: new Date(),
          },
        })
      )
    }

    await prisma.$transaction([
      ...tx,
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "ADMIN_PROVIDER_SWITCH",
          resourceType: "ProviderCategory",
          resourceId: category,
          diffJson: { activeFrom: prevActive, activeTo: activeProviderId, priorities: priorities || null },
        },
      }),
    ])

    const updated = await prisma.serviceProvider.findMany({
      where: { category },
      include: { apiKeys: { select: { id: true, keyName: true } } },
      orderBy: [
        { isActive: "desc" },
        { priority: "desc" },
        { name: "asc" },
      ],
    })

    return NextResponse.json({ ok: true, category, providers: updated })
  } catch (err) {
    return NextResponse.json({ error: "Failed to update provider category", detail: String(err) }, { status: 500 })
  }
}