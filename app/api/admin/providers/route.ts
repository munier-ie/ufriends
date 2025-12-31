import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { z } from "zod"

// Arcjet protection via shared helper

// GET /api/admin/providers
// Returns providers grouped by category
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const category = (searchParams.get("category") || "").trim()
    const name = (searchParams.get("name") || searchParams.get("search") || "").trim()
    const isActiveParam = (searchParams.get("isActive") || "").trim().toLowerCase()
    const flatParam = (searchParams.get("flat") || "").trim().toLowerCase()
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)))

    // If filters provided or flat=true, return a paginated flat list
    const doFlat = !!(category || name || ["true", "1", "yes"].includes(flatParam))
    if (doFlat) {
      const where: any = {}
      if (category) where.category = category
      if (name) where.name = { contains: name, mode: "insensitive" as const }
      if (["true", "false"].includes(isActiveParam)) {
        where.isActive = isActiveParam === "true"
      }

      const [items, total] = await Promise.all([
        prisma.serviceProvider.findMany({
          where,
          include: { apiKeys: { select: { id: true, keyName: true } } },
          orderBy: [
            { isActive: "desc" },
            { priority: "desc" },
            { name: "asc" },
          ],
          take: pageSize,
          skip: (page - 1) * pageSize,
        }),
        prisma.serviceProvider.count({ where }),
      ])

      const providers = items.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        isActive: p.isActive,
        priority: p.priority,
        apiBaseUrl: p.apiBaseUrl,
        configJson: p.configJson,
        apiKeys: p.apiKeys,
        updatedAt: p.updatedAt,
      }))

      return NextResponse.json({ ok: true, page, pageSize, total, providers })
    }

    // Default: grouped response (backward compatible)
    const providers = await prisma.serviceProvider.findMany({
      include: {
        apiKeys: {
          select: { id: true, keyName: true }
        }
      },
      orderBy: [
        { category: "asc" },
        { isActive: "desc" },
        { priority: "desc" },
        { name: "asc" }
      ]
    })

    const grouped: Record<string, any[]> = {}
    for (const p of providers) {
      const item = {
        id: p.id,
        name: p.name,
        category: p.category,
        isActive: p.isActive,
        priority: p.priority,
        apiBaseUrl: p.apiBaseUrl,
        configJson: p.configJson,
        apiKeys: p.apiKeys,
        updatedAt: p.updatedAt,
      }
      grouped[p.category] = grouped[p.category] || []
      grouped[p.category].push(item)
    }

    return NextResponse.json({ ok: true, providersByCategory: grouped })
  } catch (err) {
    return NextResponse.json({ error: "Failed to list providers", detail: String(err) }, { status: 500 })
  }
}

// POST /api/admin/providers
// Body: { name: string, category: string, apiBaseUrl?: string, priority?: number, isActive?: boolean, configJson?: object }
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const Schema = z.object({
      name: z.string().trim().min(2),
      category: z.string().trim().min(1),
      apiBaseUrl: z.string().url().optional(),
      priority: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
      configJson: z.record(z.any()).optional(),
    })
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }

    const { name, category, apiBaseUrl, priority = 0, isActive = false, configJson } = parsed.data

    // Create provider (name is unique per schema)
    const created = await prisma.serviceProvider.create({
      data: {
        name,
        category,
        apiBaseUrl: apiBaseUrl,
        priority,
        isActive,
        configJson: configJson ?? undefined,
      },
      include: {
        apiKeys: { select: { id: true, keyName: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "ADMIN_PROVIDER_CREATE",
        resourceType: "Provider",
        resourceId: created.id,
        diffJson: { name, category, apiBaseUrl: apiBaseUrl || null, priority, isActive },
      },
    })

    const item = {
      id: created.id,
      name: created.name,
      category: created.category,
      isActive: created.isActive,
      priority: created.priority,
      apiBaseUrl: created.apiBaseUrl,
      configJson: created.configJson,
      apiKeys: created.apiKeys,
      updatedAt: created.updatedAt,
    }

    return NextResponse.json({ ok: true, provider: item })
  } catch (err) {
    // Handle unique name violation or other Prisma errors
    return NextResponse.json({ error: "Failed to create provider", detail: String(err) }, { status: 500 })
  }
}