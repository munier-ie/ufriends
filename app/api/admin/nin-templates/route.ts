import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { z } from "zod"

// GET /api/admin/nin-templates?type=digital&activeOnly=true&page=1&pageSize=20
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || undefined
    const activeOnly = (searchParams.get("activeOnly") || "false").toLowerCase() === "true"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)))

    const where: any = {}
    if (type && type !== "all") where.type = type
    if (activeOnly) where.isActive = true

    const [items, total] = await Promise.all([
      prisma.ninTemplate.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.ninTemplate.count({ where }),
    ])

    return NextResponse.json({ ok: true, page, pageSize, total, templates: items })
  } catch (err) {
    return NextResponse.json({ error: "Failed to list NIN templates", detail: String(err) }, { status: 500 })
  }
}

// POST /api/admin/nin-templates
// Body: { name, type, templateContent, placeholders?: string[], isActive?: boolean }
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
      type: z.enum(["digital", "physical", "nims"]),
      templateContent: z.string().trim().min(20),
      placeholders: z.array(z.string().trim().min(1)).optional(),
      isActive: z.boolean().optional(),
    })

    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }

    const { name, type, templateContent } = parsed.data
    const isActive = parsed.data.isActive ?? true
    let placeholders = parsed.data.placeholders
    if (!placeholders || placeholders.length === 0) {
      const matches = Array.from(templateContent.matchAll(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g)).map((m) => `{{${m[1]}}}`)
      placeholders = [...new Set(matches)]
    }

    const created = await prisma.ninTemplate.create({
      data: {
        name,
        type,
        templateContent,
        placeholders,
        isActive,
        createdBy: auth.user.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "ADMIN_NIN_TEMPLATE_CREATE",
        resourceType: "NinTemplate",
        resourceId: created.id,
        diffJson: { name, type, isActive },
      },
    })

    return NextResponse.json({ ok: true, template: created })
  } catch (err) {
    return NextResponse.json({ error: "Failed to create NIN template", detail: String(err) }, { status: 500 })
  }
}