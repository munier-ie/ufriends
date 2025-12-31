import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function buildParamsFromSearch(searchParams: URLSearchParams) {
  const known = new Set(["category", "subservice", "variant", "role", "tier", "serviceSlug"]) // exclude aliases from dynamic params
  const params: Record<string, string> = {}
  for (const [k, v] of searchParams.entries()) {
    if (!known.has(k)) params[k] = v
  }
  return params
}

function stableParamsKey(params: Record<string, string>): string {
  const keys = Object.keys(params)
  if (!keys.length) return ""
  keys.sort()
  return keys.map((k) => `${k}=${params[k]}`).join("|")
}

// Normalize params for case-insensitive comparison
function toLowerParams(params: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    out[k] = String(v).toLowerCase()
  }
  return out
}

function stableParamsKeyLower(params: Record<string, string>): string {
  const lower = toLowerParams(params)
  const keys = Object.keys(lower)
  if (!keys.length) return ""
  keys.sort()
  return keys.map((k) => `${k}=${lower[k]}`).join("|")
}

// Public pricing API (catalog-based)
// GET /api/pricing?category=X&subservice=Y&variant=Z&role=user|marketer
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let category = (searchParams.get("category") || "").trim()
    let subservice = (searchParams.get("subservice") || "").trim()
    let variant = (searchParams.get("variant") || "").trim()
    const tier = (searchParams.get("tier") || "").trim().toLowerCase()
    let role = ((searchParams.get("role") || tier || "user").trim().toLowerCase()) as "user" | "marketer"
    const serviceSlug = (searchParams.get("serviceSlug") || "").trim()

    // Allow serviceSlug alias: e.g., bills.cable.dstv.padi => category=bills, subservice=cable, variant=dstv.padi
    if (serviceSlug && (!category || !subservice)) {
      const parts = serviceSlug.split(".").filter(Boolean)
      if (parts.length >= 2) {
        category = parts[0]
        subservice = parts[1]
        variant = parts.slice(2).join(".")
      }
    }
    const dynParams = buildParamsFromSearch(searchParams)
    const paramsKey = stableParamsKey(dynParams)
    const paramsKeyLower = stableParamsKeyLower(dynParams)

    if (!category || !subservice) {
      return NextResponse.json({ error: "category and subservice are required" }, { status: 400 })
    }

    // Fallback hierarchy search order:
    // 1) Exact: category + subservice + variant
    // 2) Variant fallback: category + subservice + ""
    // 3) Subservice fallback: category + "" + "" (category-level)
    // Expand known aliases for subservice to improve match robustness (e.g., CAC pages)
    const expandSubserviceAliases = (cat: string, sub: string): string[] => {
      const c = String(cat || "").trim().toLowerCase()
      const s = String(sub || "").trim().toLowerCase()
      // Only alias within CAC to avoid cross-category noise
      if (c === "cac") {
        const infoAliases = ["info", "certificate", "certification", "retrieval", "retrieval of certification", "retrieval-of-certification"]
        const statusAliases = ["status", "status report", "status-report", "statusreport", "retrieval status", "retrieval-status", "retrieval-status-report"]
        if (infoAliases.includes(s)) return infoAliases
        if (statusAliases.includes(s)) return statusAliases
      }
      // BVN: support common aliases for central risk management
      if (c === "bvn") {
        const centralRiskAliases = ["central-risk", "central risk", "central_risk", "crm", "centralrisk"]
        if (centralRiskAliases.includes(s)) return centralRiskAliases
      }
      return [sub]
    }

    const subAliases = expandSubserviceAliases(category, subservice)
    const variantToUse = variant || ""
    const searchOrder: Array<{ where: { category: string; subservice: string; variant: string } }> = []
    // Build search order for each alias with standard fallbacks
    for (const sub of subAliases) {
      searchOrder.push({ where: { category, subservice: sub, variant: variantToUse } })
      searchOrder.push({ where: { category, subservice: sub, variant: "" } })
    }
    // Category-level fallback (no subservice/variant)
    searchOrder.push({ where: { category, subservice: "", variant: "" } })

    let foundPricing: any = null
    let foundCatalog: any = null

    for (const level of searchOrder) {
      // Load candidates for this level
      const candidates = await prisma.catalogPricing.findMany({
        where: {
          category: { equals: level.where.category, mode: "insensitive" },
          subservice: { equals: level.where.subservice, mode: "insensitive" },
          variant: { equals: level.where.variant, mode: "insensitive" },
        },
        orderBy: { updatedAt: "desc" },
      })

      if (!candidates.length) {
        // Try next fallback level
        continue
      }

      // Exact match by paramsKey (case-insensitive via normalized recompute)
      let pricing = candidates.find((p) => {
        const pParams = ((p.parameters as any) || {}) as Record<string, any>
        const normalized: Record<string, string> = {}
        for (const [k, v] of Object.entries(pParams)) normalized[k] = String(v).toLowerCase()
        const pKeyLower = stableParamsKeyLower(normalized)
        return pKeyLower === paramsKeyLower
      })

      // Best-match fallback: choose the entry whose parameters are a subset and has the highest match count
      if (!pricing) {
        let best: typeof candidates[number] | undefined
        let bestScore = -1
        for (const p of candidates) {
          const paramsObj = ((p.parameters as any) || {}) as Record<string, any>
          const keys = Object.keys(paramsObj)
          if (!keys.length) {
            // Base entry with no parameters: score 0
            if (bestScore < 0) { best = p; bestScore = 0 }
            continue
          }
          // Count matching key=value pairs
          let score = 0
          for (const k of keys) {
            const reqVal = dynParams[k]
            const candVal = paramsObj[k]
            if (reqVal !== undefined && String(reqVal).toLowerCase() === String(candVal).toLowerCase()) {
              score += 1
            } else {
              // Required param mismatch; penalize heavily
              score = -1
              break
            }
          }
          if (score >= 0 && score > bestScore) {
            best = p
            bestScore = score
          }
        }
        pricing = best
      }

      if (pricing) {
        foundPricing = pricing
        // Resolve catalog for the selected level to return metadata
        // Catalog lookup may be case-sensitive; attempt insensitive fallback
        foundCatalog = await prisma.serviceCatalog.findFirst({
          where: {
            category: { equals: level.where.category, mode: "insensitive" },
            subservice: { equals: level.where.subservice, mode: "insensitive" },
            variant: { equals: level.where.variant, mode: "insensitive" },
          },
        }).catch(() => null)
        break
      }
    }

    if (!foundPricing) {
      return NextResponse.json({ ok: true, price: null, detail: "No matching price for given parameters" })
    }

    const selected = role === "marketer" ? Number(foundPricing.marketerPrice) : Number(foundPricing.userPrice)
    return NextResponse.json({
      ok: true,
      catalog: foundCatalog
        ? { id: foundCatalog.id, category: foundCatalog.category, subservice: foundCatalog.subservice, variant: foundCatalog.variant }
        : { id: null, category, subservice, variant: variant || "" },
      pricing: {
        basePrice: Number(foundPricing.basePrice),
        userPrice: Number(foundPricing.userPrice),
        marketerPrice: Number(foundPricing.marketerPrice),
        updatedAt: foundPricing.updatedAt,
      },
      role,
      parameters: foundPricing.parameters ?? null,
      paramsKey: String(foundPricing.paramsKey || ""),
      price: selected,
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch pricing", detail: String(err) }, { status: 500 })
  }
}