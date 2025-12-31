import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"

// GET /api/pricing/parameters?category=X&subservice=Y&variant=Z
// Returns discovered parameter keys and distinct values from pricing entries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = (searchParams.get("category") || "").trim()
    const subservice = (searchParams.get("subservice") || "").trim()
    const variant = (searchParams.get("variant") || "").trim()

    if (!category || !subservice) {
      return NextResponse.json({ error: "category and subservice are required" }, { status: 400 })
    }

    // Expand CAC subservice aliases to aggregate parameter options across differently named entries
    const expandSubserviceAliases = (cat: string, sub: string): string[] => {
      const c = String(cat || "").trim().toLowerCase()
      const s = String(sub || "").trim().toLowerCase()
      if (c === "cac") {
        const infoAliases = ["info", "certificate", "certification", "retrieval", "retrieval of certification", "retrieval-of-certification"]
        const statusAliases = ["status", "status report", "status-report", "statusreport", "retrieval status", "retrieval-status", "retrieval-status-report"]
        if (infoAliases.includes(s)) return infoAliases
        if (statusAliases.includes(s)) return statusAliases
      }
      return [sub]
    }

    const aliases = expandSubserviceAliases(category, subservice)
    const variantToUse = variant || ""
    const rows = await prisma.catalogPricing.findMany({
      where: {
        category: { equals: category, mode: Prisma.QueryMode.insensitive },
        OR: aliases.map((sub) => ({
          subservice: { equals: sub, mode: Prisma.QueryMode.insensitive },
          variant: { equals: variantToUse, mode: Prisma.QueryMode.insensitive },
        })).concat(
          aliases.map((sub) => ({
            subservice: { equals: sub, mode: Prisma.QueryMode.insensitive },
            variant: { equals: "", mode: Prisma.QueryMode.insensitive },
          }))
        ),
      },
      select: { parameters: true },
    })

    const options: Record<string, Set<string>> = {}
    for (const r of rows) {
      const params = (r.parameters as any) || {}
      if (!params || typeof params !== "object" || Array.isArray(params)) continue
      for (const [k, v] of Object.entries(params)) {
        if (!(k in options)) options[k] = new Set<string>()
        options[k].add(String(v).toLowerCase())
      }
    }

    const normalizedOptions: Record<string, string[]> = {}
    for (const [k, set] of Object.entries(options)) {
      normalizedOptions[k] = Array.from(set.values()).sort()
    }

    return NextResponse.json({ ok: true, category, subservice, variant: variant || "", options: normalizedOptions })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch parameter options", detail: String(err) }, { status: 500 })
  }
}