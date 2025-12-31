import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"

const CatalogUpdateSchema = z.object({
  category: z.string().trim().min(1),
  subservice: z.string().trim().min(1),
  variant: z.string().trim().optional(),
  description: z.string().trim().optional(),
})

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, { roles: ["ADMIN"] })
  if (!auth.ok) return auth.response

  const sec = await protect(req)
  if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let data
  try {
    const json = await req.json()
    const parsed = CatalogUpdateSchema.parse(json)
    data = {
      category: sanitizer.parse(parsed.category),
      subservice: sanitizer.parse(parsed.subservice),
      variant: sanitizer.parse(parsed.variant ?? ""),
      description: parsed.description ? sanitizer.parse(parsed.description) : undefined,
    }
  } catch (e: any) {
    return NextResponse.json({ error: "Invalid payload", details: e?.message }, { status: 400 })
  }

  // Ensure no duplicate with another id
  const duplicate = await prisma.serviceCatalog.findFirst({
    where: {
      category: data.category,
      subservice: data.subservice,
      variant: data.variant,
      NOT: { id },
    },
    select: { id: true },
  })
  if (duplicate) {
    return NextResponse.json({ error: "Duplicate entry" }, { status: 409 })
  }

  const updated = await prisma.serviceCatalog.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, { roles: ["ADMIN"] })
  if (!auth.ok) return auth.response

  const sec = await protect(req)
  if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  await prisma.serviceCatalog.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}