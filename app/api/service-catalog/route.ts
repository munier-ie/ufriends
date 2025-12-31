import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"

// GET /api/service-catalog?category=...
export async function GET(req: Request) {
  // Rate limit and basic shielding
  const sec = await protect(req)
  if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Parse filter
  const url = new URL(req.url)
  const categoryParam = url.searchParams.get("category")
  let where: any = {}
  if (categoryParam) {
    const safe = sanitizer.parse(z.string().trim().min(1).parse(categoryParam))
    where.category = safe
  }

  const items = await prisma.serviceCatalog.findMany({
    where,
    orderBy: [{ category: "asc" }, { subservice: "asc" }, { variant: "asc" }],
  })
  return NextResponse.json(items)
}