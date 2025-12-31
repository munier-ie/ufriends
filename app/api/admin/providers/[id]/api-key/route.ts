import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"

// Arcjet protection via shared helper

// POST /api/admin/providers/:id/api-key
// Body: { keyName: string, keyValue: string }
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const p = await ctx.params
    const providerId = decodeURIComponent(p.id)
    const body = await req.json()
    const Schema = z.object({
      keyName: z.string().trim().min(1).max(100),
      keyValue: z.string().trim().min(1),
    })
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }
    const { keyName: rawKeyName, keyValue } = parsed.data
    const keyName = sanitizer.parse(rawKeyName)

    const provider = await prisma.serviceProvider.findUnique({ where: { id: providerId }, select: { id: true } })
    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 })

    const existing = await prisma.providerApiKey.findFirst({ where: { providerId, keyName } })

    const tx = [] as any[]
    if (existing) {
      tx.push(
        prisma.providerApiKey.update({ where: { id: existing.id }, data: { keyValue } })
      )
    } else {
      tx.push(
        prisma.providerApiKey.create({ data: { providerId, keyName, keyValue } })
      )
    }

    tx.push(
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "ADMIN_PROVIDER_APIKEY_SET",
          resourceType: "Provider",
          resourceId: providerId,
          diffJson: { keyName, updated: !!existing },
        },
      })
    )

    await prisma.$transaction(tx)

    return NextResponse.json({ ok: true, providerId, keyName })
  } catch (err) {
    return NextResponse.json({ error: "Failed to set API key", detail: String(err) }, { status: 500 })
  }
}

// DELETE /api/admin/providers/:id/api-key?keyId=...
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const p = await ctx.params
    const providerId = decodeURIComponent(p.id)
    const keyId = req.nextUrl.searchParams.get("keyId")
    if (!keyId) return NextResponse.json({ error: "keyId is required" }, { status: 400 })

    const key = await prisma.providerApiKey.findUnique({ where: { id: keyId }, select: { id: true, providerId: true, keyName: true } })
    if (!key || key.providerId !== providerId) {
      return NextResponse.json({ error: "API key not found for provider" }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.providerApiKey.delete({ where: { id: keyId } }),
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "ADMIN_PROVIDER_APIKEY_DELETE",
          resourceType: "Provider",
          resourceId: providerId,
          diffJson: { keyId, keyName: key.keyName },
        },
      }),
    ])

    return NextResponse.json({ ok: true, providerId, keyId })
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete API key", detail: String(err) }, { status: 500 })
  }
}