import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"

const CatalogSchema = z.object({
  category: z.string().trim().min(1),
  subservice: z.string().trim().min(1),
  variant: z.string().trim().optional(),
  description: z.string().trim().optional(),
})

export async function POST(req: Request) {
  const auth = await requireAuth(req, { roles: ["ADMIN"] })
  if (!auth.ok) return auth.response

  const sec = await protect(req)
  if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let data
  try {
    const json = await req.json()
    const parsed = CatalogSchema.parse(json)
    data = {
      category: sanitizer.parse(parsed.category),
      subservice: sanitizer.parse(parsed.subservice),
      variant: sanitizer.parse(parsed.variant ?? ""),
      description: parsed.description ? sanitizer.parse(parsed.description) : undefined,
    }
  } catch (e: any) {
    return NextResponse.json({ error: "Invalid payload", details: e?.message }, { status: 400 })
  }

  // Prevent duplicates (composite unique)
  const existing = await prisma.serviceCatalog.findFirst({
    where: {
      category: data.category,
      subservice: data.subservice,
      variant: data.variant,
    },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ error: "Duplicate entry" }, { status: 409 })
  }

  const created = await prisma.serviceCatalog.create({ data })
  return NextResponse.json(created, { status: 201 })
}