import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { z } from "zod"

const keyFor = (serviceId: string, subServiceId: string) => `manual_only:${serviceId}:${subServiceId}`

// GET /api/admin/services/manual
// Returns all manual-only toggles for sub-services
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rows = await prisma.systemSettings.findMany({
      where: { key: { startsWith: "manual_only:" } },
      select: { key: true, valueJson: true },
    })

    const toggles: Record<string, boolean> = {}
    for (const r of rows) {
      toggles[r.key] = Boolean((r.valueJson as any)?.enabled ?? (r.valueJson as any) ?? false)
    }

    return NextResponse.json({ ok: true, toggles })
  } catch (err) {
    return NextResponse.json({ error: "Failed to read manual-only toggles", detail: String(err) }, { status: 500 })
  }
}

// POST /api/admin/services/manual
// Body: { serviceId: string, subServiceId: string, manualOnly: boolean }
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const Schema = z.object({
      serviceId: z.string().min(1),
      subServiceId: z.string().min(1),
      manualOnly: z.boolean(),
    })
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }
    const { serviceId, subServiceId, manualOnly } = parsed.data

    const key = keyFor(serviceId, subServiceId)
    await prisma.systemSettings.upsert({
      where: { key },
      update: { valueJson: { enabled: manualOnly } },
      create: { key, valueJson: { enabled: manualOnly } },
    })

    return NextResponse.json({ ok: true, key, enabled: manualOnly })
  } catch (err) {
    return NextResponse.json({ error: "Failed to set manual-only toggle", detail: String(err) }, { status: 500 })
  }
}