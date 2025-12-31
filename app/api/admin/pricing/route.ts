import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { z } from "zod"
import { Prisma } from "@prisma/client"

function stableParamsKey(params?: Record<string, unknown>): string {
  if (!params || typeof params !== "object" || Array.isArray(params)) return ""
  const entries = Object.entries(params).filter(([k, v]) => v !== undefined && v !== null)
  if (!entries.length) return ""
  entries.sort(([a], [b]) => a.localeCompare(b))
  return entries.map(([k, v]) => `${k}=${String(v)}`).join("|")
}

// GET /api/admin/pricing?serviceSlug=...&includeHistory=true
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const serviceSlug = searchParams.get("serviceSlug") || undefined
    const includeHistory = (searchParams.get("includeHistory") || "false").toLowerCase() === "true"

    if (serviceSlug) {
      const service = await prisma.service.findUnique({ where: { slug: serviceSlug } })
      if (!service) {
        return NextResponse.json({ error: "Service not found", serviceSlug }, { status: 404 })
      }

      if (includeHistory) {
        const prices = await prisma.servicePricing.findMany({
          where: { serviceId: service.id },
          orderBy: { effectiveAt: "desc" },
        })
        return NextResponse.json({ ok: true, service, prices })
      }

      const latest = await prisma.servicePricing.findFirst({
        where: { serviceId: service.id },
        orderBy: { effectiveAt: "desc" },
      })
      return NextResponse.json({ ok: true, service, price: latest || null })
    }

    // Return latest price per active service
    const services = await prisma.service.findMany({ where: { active: true } })
    const results: Array<{ service: { id: string; name: string; slug: string }; price: any | null }> = []
    for (const s of services) {
      const latest = await prisma.servicePricing.findFirst({
        where: { serviceId: s.id },
        orderBy: { effectiveAt: "desc" },
      })
      results.push({ service: { id: s.id, name: s.name, slug: s.slug }, price: latest || null })
    }

    return NextResponse.json({ ok: true, prices: results })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch pricing", detail: String(err) }, { status: 500 })
  }
}

// POST /api/admin/pricing
// Body: { category: string, subservice: string, variant?: string, basePrice: number, userPrice: number, marketerPrice: number, parameters?: Record<string, unknown> }
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const schema = z.object({
      category: z.string().min(1).max(100).transform((s) => s.trim()),
      subservice: z.string().min(1).max(100).transform((s) => s.trim()),
      variant: z.string().max(100).optional().transform((s) => (s ?? "").trim()),
      basePrice: z.number().nonnegative(),
      userPrice: z.number().nonnegative(),
      marketerPrice: z.number().nonnegative(),
      parameters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    })

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", detail: parsed.error.flatten() }, { status: 400 })
    }

    const { category, subservice, variant, basePrice, userPrice, marketerPrice, parameters } = parsed.data
    const paramsKey = stableParamsKey(parameters)

    // Ensure the catalog entry exists (auto-create if missing)
    let catalog = await prisma.serviceCatalog.findUnique({
      where: { category_subservice_variant_unique: { category, subservice, variant: variant || "" } },
    })
    if (!catalog) {
      catalog = await prisma.serviceCatalog.create({
        data: {
          category,
          subservice,
          variant: variant || "",
          description: `Auto-created by admin pricing on ${new Date().toISOString()}`,
        },
      })
    }

    const pricing = await prisma.catalogPricing.upsert({
      where: { catalog_pricing_category_subservice_variant_paramsKey_unique: { category, subservice, variant: variant || "", paramsKey } },
      update: { basePrice: basePrice, userPrice: userPrice, marketerPrice: marketerPrice, updatedBy: auth.user.id, parameters: parameters as Prisma.InputJsonValue, paramsKey },
      create: { category, subservice, variant: variant || "", basePrice, userPrice, marketerPrice, updatedBy: auth.user.id, parameters: parameters as Prisma.InputJsonValue, paramsKey },
    })

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "ADMIN_CATALOG_PRICE_UPSERT",
        resourceType: "ServiceCatalog",
        resourceId: String(catalog?.id ?? "unknown"),
        diffJson: { category, subservice, variant: variant || "", basePrice, userPrice, marketerPrice, parameters: parameters || null, paramsKey },
      },
    })

    return NextResponse.json({ ok: true, pricing })
  } catch (err) {
    return NextResponse.json({ error: "Failed to update pricing", detail: String(err) }, { status: 500 })
  }
}